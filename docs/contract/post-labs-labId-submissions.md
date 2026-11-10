# LeeTKOB submissions API — contract, version 1

CSC13114 · PA#2 · **frozen 10 Nov 2026**

This file is the specification of `POST /v1/labs/{labId}/submissions`. The
tests in `test/contract/` check the implementation against it. If the code and
this file disagree, the code is wrong. If this file is wrong, change it in a
separate pull request that says why, and add a line to the changelog at the
end. Never change it quietly.

## 1. Conventions

- Every endpoint in this contract lives under `/v1`. The PA#2 brief writes the
  endpoint as `POST /labs/{labId}/submissions`; in this API its full path is
  `POST /v1/labs/{labId}/submissions`. There is no unversioned path.
- Requests and responses are JSON, UTF-8.
- Ids are positive integers. Timestamps are ISO 8601 strings in UTC with
  milliseconds, e.g. `2026-11-10T03:15:00.000Z`.
- Paths are matched exactly. `/v1/labs/7/submissions/` (trailing slash) is a
  different path and does not exist. A query string is ignored.
- Clients ignore response fields they do not know. The server ignores request
  fields it does not know.
- Size limits are measured in bytes of the UTF-8 encoding: 1 KiB = 1,024 bytes.

## 2. Errors

Every `/v1` response with a 4xx or 5xx status, including a request for a `/v1`
path that does not exist, is a **problem details** object (RFC 9457) with
`Content-Type: application/problem+json`:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://leetkob.example/problems/validation",
  "title": "Invalid request",
  "status": 400,
  "detail": "1 field is invalid",
  "errors": [
    { "pointer": "/sourceCode", "detail": "must not be empty or only whitespace" }
  ]
}
```

| Member   | Rule                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`   | `https://leetkob.example/problems/` followed by a slug from the table below. No other values                                                                                                                 |
| `title`  | the title from the table below                                                                                                                                                                               |
| `status` | a number, equal to the HTTP status of the response                                                                                                                                                           |
| `detail` | one sentence about **this** occurrence. Never a stack trace, an SQL message, a table name, a file path, a token or submitted source code                                                                     |
| `errors` | only on `validation`: one entry **per problem found** (not just the first), each `{ "pointer", "detail" }` where `pointer` is a JSON Pointer into the request body, such as `/sourceCode`, or `""` for the whole body |

| Slug                        | Status | Title                    | When                                                                                                                         |
| --------------------------- | ------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `invalid-json`              | 400    | Malformed JSON           | the body is not valid JSON (an empty body included)                                                                          |
| `validation`                | 400    | Invalid request          | the body is valid JSON but breaks a rule in §5.3                                                                             |
| `idempotency-key-missing`   | 400    | Idempotency-Key required | no `Idempotency-Key` header, or one that is empty, only whitespace, or longer than 255 characters                            |
| `unauthorized`              | 401    | Authentication required  | no `Authorization` header, a scheme other than `Bearer`, or a token that is unknown or expired                               |
| `forbidden`                 | 403    | Forbidden                | the caller is not a student, or is a student not enrolled in the class that owns the lab                                     |
| `not-found`                 | 404    | Not found                | no such `/v1` path, or no lab with that id (also when `labId` is not a positive integer)                                     |
| `method-not-allowed`        | 405    | Method not allowed       | the path exists but the method is not `POST`                                                                                 |
| `idempotency-key-in-flight` | 409    | Request in progress      | the first request with this key has not finished yet                                                                         |
| `payload-too-large`         | 413    | Payload too large        | the request body is larger than 128 KiB (131,072 bytes)                                                                      |
| `unsupported-media-type`    | 415    | Unsupported media type   | the `Content-Type` header is missing or its media type is not `application/json`                                             |
| `idempotency-key-reused`    | 422    | Idempotency-Key reused   | the key was already used by this student with a different request (§6)                                                       |
| `internal`                  | 500    | Internal error           | anything else. `detail` is the fixed sentence `An unexpected error occurred.`                                                |

Extra headers on some errors:

- `401` carries `WWW-Authenticate: Bearer`.
- `405` carries `Allow: POST`.

Clients decide what to do from `type`, never from `title` or `detail`.

## 3. Authentication and ownership

**Users.** Every user has a positive integer id and exactly one role:
`student`, `ta` or `admin`.

**Who may call.** Only a user with the role `student`. Users with the role `ta`
or `admin` get `403 forbidden`. A TA cannot submit on behalf of a student.

**Ownership rule.** Every lab belongs to exactly one class. A student may
submit to a lab only if the student is enrolled in the class that owns that
lab. Anyone else gets `403 forbidden`, including a student enrolled in a
different class.

**Token.** The client sends `Authorization: Bearer <token>`. Tokens are issued
by the LeeTKOB account service, which is outside this contract. In PA#2 the
server is started with a fixed set of tokens. The token alone identifies the
caller. The server **never** reads a student id from the body, a header or the
query; a `studentId` field in the body is an unknown field and is ignored.

**401 vs 403.** `401 unauthorized` means "we do not know who you are": send a
valid token. `403 forbidden` means "we know who you are and you may not do
this": a new token for the same user will not help.

**Lab existence.** An authenticated student who names a lab that does not
exist gets `404`; one who names a lab of another class gets `403`. This shows
an authenticated student which lab ids exist. That is accepted, because lab
ids are not secret. An unauthenticated caller learns nothing: they get `401`
whether or not the lab exists.

## 4. Resources

**Submission**

```json
{
  "id": 31,
  "labId": 7,
  "studentId": 1024,
  "status": "queued",
  "submittedAt": "2026-11-10T03:15:00.000Z"
}
```

| Field         | Meaning                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| `id`          | positive integer, assigned by the server, unique across all submissions             |
| `labId`       | the `labId` from the request path                                                   |
| `studentId`   | the id of the student who owns the token, never a value from the request            |
| `status`      | always `"queued"` in version 1. Later statuses will be added as additive changes    |
| `submittedAt` | the server time at which the submission was created                                 |

The submitted source code is **never** returned in any response.

## 5. Endpoint: `POST /v1/labs/{labId}/submissions`

A student uploads the source code of one attempt at a lab. The submission is
created in the `queued` state. Grading is outside this contract.

A student may submit many attempts to the same lab; each new request with a new
`Idempotency-Key` creates a new submission. Version 1 sets no limit on the
number of attempts and no rate limit.

### 5.1 Path parameter

| Parameter | Rule                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `labId`   | a positive integer written in decimal, without sign or leading zeros, at most 9,007,199,254,740,991. Anything else is treated as a lab that does not exist: `404 not-found` |

### 5.2 Request headers

| Header            | Rule                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Authorization`   | `Bearer <token>`, required (§3)                                                                                                                                     |
| `Content-Type`    | required, media type `application/json`. A `charset=utf-8` parameter is allowed. Media types are compared case-insensitively                                       |
| `Idempotency-Key` | required, a string of 1 to 255 characters chosen by the client, one per submission it intends to create (a UUID is a good choice). It is compared exactly, not trimmed |

### 5.3 Request body

```json
{ "sourceCode": "#include <iostream>\nint main() { return 0; }\n" }
```

| Field        | Rule                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| `sourceCode` | required. A string of at most 64 KiB (65,536 bytes) that is not only whitespace |

- A body that is valid JSON but not an object (an array, a string, a number,
  `true`, `false` or `null`) is a `validation` error with pointer `""`.
- A missing `sourceCode`, a `sourceCode` that is not a string, and a
  `sourceCode` that is empty, only whitespace or longer than 64 KiB are
  `validation` errors with pointer `/sourceCode`.
- Unknown fields, such as `studentId`, `labId` or `status`, are ignored.
- Because the body has one field in version 1, a `validation` error always has
  exactly one `errors` entry. Clients must still read `errors` as a list: a
  later version may add fields (§8).

### 5.4 Check order

The server checks, **in this order**, and stops at the first step that fails.
A request that fails a step gets the error of that step even if a later step
would also fail.

1. **Route.** The path is not `/v1/labs/{labId}/submissions` and no other
   `/v1` endpoint matches: `404 not-found`. The path matches but the method is
   not `POST`: `405 method-not-allowed`. (`labId` is not checked yet.)
2. **Authentication.** A missing or invalid `Authorization` header, or an
   unknown or expired token: `401 unauthorized`.
3. **Role.** The caller is not a `student`: `403 forbidden`.
4. **Content type.** `Content-Type` is missing or not `application/json`:
   `415 unsupported-media-type`.
5. **Idempotency key.** `Idempotency-Key` is missing, empty, only whitespace
   or longer than 255 characters: `400 idempotency-key-missing`.
6. **Size.** The body is larger than 128 KiB: `413 payload-too-large`.
7. **JSON.** The body is not valid JSON: `400 invalid-json`.
8. **Lab.** No lab has this `labId` (or `labId` breaks §5.1): `404 not-found`.
9. **Ownership.** The student is not enrolled in the class that owns the lab:
   `403 forbidden`.
10. **Idempotency.** The key was used before by this student (§6): replay the
    stored `201`, or `409 idempotency-key-in-flight`, or
    `422 idempotency-key-reused`.
11. **Validation.** The body breaks a rule in §5.3: `400 validation`, listing
    **every** problem found.
12. **Create.** The submission is created: **`201 Created`** with the
    Submission (§4) as the body and `Content-Type: application/json`.

The response has **no `Location` header**, because this contract has no
endpoint to read a single submission. Adding one later is an additive change
(§8).

Why this order: authentication and role come first so that an unknown caller or
a TA learns nothing about labs. Headers are checked before the body is read.
Lab and ownership come before validation, so a student of another class cannot
probe the rules of a lab they do not belong to. Idempotency comes before
validation, so a retry gets the same answer as the first request.

### 5.5 Responses

| Status | Body                     | When                                                   |
| ------ | ------------------------ | ------------------------------------------------------ |
| `201`  | Submission               | created (step 12), or a replay of a stored `201` (§6)  |
| `400`  | problem details          | `idempotency-key-missing`, `invalid-json`, `validation` |
| `401`  | problem details          | `unauthorized`                                         |
| `403`  | problem details          | `forbidden`                                            |
| `404`  | problem details          | `not-found`                                            |
| `405`  | problem details          | `method-not-allowed`                                   |
| `409`  | problem details          | `idempotency-key-in-flight`                            |
| `413`  | problem details          | `payload-too-large`                                    |
| `415`  | problem details          | `unsupported-media-type`                               |
| `422`  | problem details          | `idempotency-key-reused`                               |
| `500`  | problem details          | `internal`                                             |

No other status codes are returned.

## 6. Idempotency

A client that does not get an answer, because of a timeout or a dropped
connection, sends the same request again with the same key. That retry must
not create a second submission.

- **Scope.** A key belongs to one student: the pair (student, key). Two
  students who happen to use the same key do not affect each other.
- **Same request.** Two requests are *the same* when they have the same
  `labId` and their bodies are equal as JSON values. Key order and whitespace
  do not matter; any other difference does, including a different `labId`.
- **Different keys** always mean different submissions, even when the bodies
  are identical. The key, not the body, tells a retry from a new attempt.
- **Stored with the submission.** When step 12 succeeds, the server stores the
  key, a fingerprint of the request and the response, **atomically with the
  submission**: either both exist or neither does.
- **Replay.** Same key, same request: the **stored** response, i.e. status
  `201` and the identical body, plus the header **`Idempotent-Replayed: true`**.
  No new submission is created. The first, original response does not carry
  that header.
- **Reused.** Same key, different request: `422 idempotency-key-reused`.
  Nothing is created.
- **In flight.** Same key while the first request is still being processed:
  `409 idempotency-key-in-flight`. Nothing is created. The client waits and
  retries with the same key, and then gets the replay.
- **Only a `201` is stored.** A request that ends in any 4xx or 5xx stores
  nothing, so the client may fix the request and send it again with the same
  key.
- **Lifetime.** A stored key is kept for at least 24 hours.
- Steps 1 to 9 of §5.4 run before the idempotency check on every request,
  replays included. A replay is only returned to a caller who would be allowed
  to make the original request now.

## 7. Paging

Not applicable. This endpoint creates one resource and returns it; it does not
return a list.

## 8. What happens when it changes

- **Within `/v1`, only additive changes**: a new optional request field, a new
  response field, a new `status` value, a new endpoint (such as
  `GET /v1/submissions/{id}`), a new response header or a new problem type.
  Clients must already ignore fields they do not know (§1).
- **Anything else is a breaking change** and goes to `/v2`: renaming or removing
  a field, changing a type, tightening a rule (e.g. a lower size limit),
  changing a status code or a problem type, or changing the check order.
  `/v1` keeps running next to `/v2` and announces its end with the
  `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) headers at least 30 days
  before it is removed.
- **How this file changes.** Every change, additive or breaking, is a separate
  pull request that edits this file and adds a line to the changelog below,
  with the reason. The contract is never edited to match the code or to make a
  test pass; if the code disagrees with this file, the code is fixed.

## 9. Examples

Placeholders: `$TOKEN` is a student token and `$BASE` is the server address,
e.g. `http://127.0.0.1:3000`.

**Create a submission**

```bash
curl -i -X POST "$BASE/v1/labs/7/submissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 5b1c0f7e-9a7d-4c1e-8f53-2f6a1d0c9b11" \
  -d '{"sourceCode":"#include <iostream>\nint main() { return 0; }\n"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":31,"labId":7,"studentId":1024,"status":"queued","submittedAt":"2026-11-10T03:15:00.000Z"}
```

The same request with `fetch`:

```js
const res = await fetch(`${base}/v1/labs/7/submissions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(), // keep it for retries
  },
  body: JSON.stringify({ sourceCode }),
});
if (res.status === 201) {
  const submission = await res.json();
} else {
  const problem = await res.json(); // application/problem+json
  // decide from problem.type
}
```

**Retry after a timeout** (same key, same body)

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Idempotent-Replayed: true

{"id":31,"labId":7,"studentId":1024,"status":"queued","submittedAt":"2026-11-10T03:15:00.000Z"}
```

**Validation error** (body `{ "sourceCode": "   " }`)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://leetkob.example/problems/validation",
  "title": "Invalid request",
  "status": 400,
  "detail": "1 field is invalid",
  "errors": [
    { "pointer": "/sourceCode", "detail": "must not be empty or only whitespace" }
  ]
}
```

**No token**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
WWW-Authenticate: Bearer

{
  "type": "https://leetkob.example/problems/unauthorized",
  "title": "Authentication required",
  "status": 401,
  "detail": "A valid bearer token is required."
}
```

**Student of another class**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json

{
  "type": "https://leetkob.example/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "You are not enrolled in the class that owns this lab."
}
```

**Lab does not exist** (`POST /v1/labs/999/submissions`)

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://leetkob.example/problems/not-found",
  "title": "Not found",
  "status": 404,
  "detail": "Lab 999 does not exist."
}
```

**Retry while the first request is still running**

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://leetkob.example/problems/idempotency-key-in-flight",
  "title": "Request in progress",
  "status": 409,
  "detail": "A request with this Idempotency-Key is still being processed. Retry later."
}
```

**Same key, different source code**

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://leetkob.example/problems/idempotency-key-reused",
  "title": "Idempotency-Key reused",
  "status": 422,
  "detail": "This Idempotency-Key was already used with a different request."
}
```

The `detail` sentences above are examples. Only `type`, `title`, `status` and,
for `validation`, the `pointer` of each `errors` entry are part of the
contract. The one exception is `internal`, whose `detail` is fixed (§2).

## 10. Security and privacy

- Submitted source code is never written to logs and never returned in a
  response, problem details included.
- Student identity comes only from the token (§3). Logs identify a request by
  submission id and status, not by student name or email.
- The request body is limited to 128 KiB (§5.4 step 6), and the server stops
  reading a body that grows past the limit.
- No API key, model key or other secret appears in a request, a response or a
  problem `detail`. This endpoint makes no model call.
- Error responses never reveal stack traces, SQL, table names or file paths
  (§2).

## Changelog

| Date       | Change                    | Why                    |
| ---------- | ------------------------- | ---------------------- |
| 2026-11-10 | Version 1, frozen | First version for PA#2 |
