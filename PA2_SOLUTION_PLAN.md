# PA#2 — NỘI DUNG PHẢI LÀM & GIẢI PHÁP

**Môn:** CSC13114 — Advanced Web Application Development  
**Checkpoint:** PA#2 — Harness and quality gate (LeeTKOB)  
**Hạn:** Thứ Tư, 11/11/2026, 22:00 — bài nhóm, 100 điểm, 4% môn học  
**Nguồn chân lý:** hai file PDF trong `PA02/`:
- `LeeTKOB — class project brief.pdf` (gọi tắt: **Brief**)
- `PA#2 rubric — Harness and quality gate.pdf` (gọi tắt: **Rubric**)

> Đây là bản **mô tả nội dung và giải pháp**, không phải bản nộp. Tại thời điểm viết, nhóm **chưa triển khai** mã nguồn, CI, contract hay test nào.

---

## 1. Phân tích problem

### 1.1. Sản phẩm LeeTKOB là gì

Theo Brief §2–3, người dùng là một **TA đang chạy lab C++ nhập môn**. Đêm trước khi công bố điểm lab Sorting, TA có khoảng **80 bài đã Accepted** và phải đọc từng bài để kiểm tra sinh viên có thật sự implement merge sort hay không. Một bài Accepted vẫn có thể vi phạm luật: gọi `std::sort`, hoặc dùng bubble sort khi đề yêu cầu merge sort. Đọc tay mất **2–3 phút/bài**, tức **3–4 giờ/tuần**. Khi sinh viên khiếu nại, TA phải đọc lại code để bảo vệ quyết định.

Tính năng LLM của LeeTKOB là **constraint review trước khi công bố điểm**, không phải chatbot:

1. Input: đề lab, các constraint TA khai báo (text + mức trừ TA chọn), code Accepted đã **strip comment và identity**.
2. **Hard rules chạy trước**: kiểm tra syntax-aware, ví dụ `std::sort` thật sự (phân biệt với hàm sinh viên tự đặt tên `sort`). Nếu hard rule quyết định constraint thì **không gọi model** cho constraint đó.
3. Model chỉ xử lý constraint **semantic**: thuật toán có đúng không, có đệ quy không, có mảng phụ giấu không. Model trả `pass / violation / unsure` kèm **code lines chứng minh**. Model **không quyết định mức trừ** — TA đã đặt.
4. Guardrails: output validate theo schema; mỗi evidence line phải khớp **chính xác** code đã nộp, nếu không → `unsure`; timeout → `unsure`; có **cost cap mỗi lab**.
5. Human gate: mọi `violation`, mọi `unsure`, và **10% ngẫu nhiên của `pass`** vào review queue. Chỉ TA review xong và bấm **Publish** mới công bố điểm. Đây là bước khó hoàn tác.
6. Lý do sai đắt: một khoản trừ sai (ví dụ 3/10, lab worth 30% môn) có thể đẩy sinh viên dưới điểm qua môn/học bổng; nếu một constraint bị đọc sai hệ thống, **80 sinh viên mất điểm cùng lúc** và tới 80 appeals. Trước publish, sửa verdict gần như miễn phí; sau publish phải mở lại điểm, xử lý appeals, mất uy tín.

**Ngưỡng chất lượng của Brief §3:**

| Metric | Threshold |
|---|---|
| Wrongful deductions on compliant solutions | **0** |
| Violations caught (verdict `violation` + đúng evidence line) | **≥ 90%** |
| `unsure` among all verdicts | **≤ 20%** |

Các mục này là **bối cảnh sản phẩm** để hiểu vì sao PA#2 cần một quality gate nghiêm. PA#2 **chưa** làm LLM, hard rules, sandbox, review queue, publish hay eval — những phần đó thuộc PA#3–PA#5 (Brief §7).

### 1.2. PA#2 thực sự yêu cầu gì

Brief §7 mô tả PA#2 ngắn gọn:

> “Convention file, lint, tests, and CI that really blocks a merge. Plus the contract of one LeeTKOB endpoint (`docs/contract/<endpoint>.md`) and contract tests that run in CI.”

Rubric mở rộng thành 7 tiêu chí, 100 điểm. Có thể chia thành 3 khối:

| Khối | Tiêu chí | Điểm | Câu hỏi kiểm tra thực chất |
|---|---|---:|---|
| **Harness** | #1 rules, #2 permissions/secrets, #3 commands, #7 AI-LOG | 40 | Assistant có luật rõ, không rò secret, mọi check chạy bằng một lệnh, và có bằng chứng con người thật sự lái assistant không? |
| **Gate** | #4 CI + branch protection | 20 | Check có **thật sự chặn merge** hay chỉ chạy cho đẹp? |
| **Contract** | #5 contract, #6 contract tests | 40 | Một người lạ có viết được client từ file contract không? Test có bắt được code vi phạm contract không? |

**Điểm mấu chốt:** Rubric nói “What we mark is what the repository shows: whether the gate bites, and whether the contract is specific enough that a stranger could build a client from it.” Vì vậy mọi tuyên bố phải có **bằng chứng trong repo**: commit, PR, CI run, ảnh protection, test output. Không có điểm cho việc “nhóm nói đã làm”.

### 1.3. Ràng buộc và rủi ro của bài

- **Thời gian:** từ 06/11 đến 11/11, khoảng 5 ngày làm việc; phải dành buffer cho tag/zip/nộp.
- **Nhân lực:** 3 người; mỗi người vẫn phải học các môn khác. Khối lượng phải đều, không ai ôm 40 điểm một mình.
- **Bằng chứng:** cần PR đỏ→xanh, deliberate contract break, CI run cho tag, ảnh branch protection. Những thứ này **không thể tạo sau khi nộp**; phải làm đúng thứ tự.
- **Bảo mật:** repo public; không được có secret trong **toàn bộ git history**, kể cả commit đã xóa.
- **Chất lượng contract:** 25 điểm, là tiêu chí lớn nhất; một file sơ sài sẽ mất nhiều điểm hơn việc thiếu một test.
- **Tính trung thực:** self-assessment bị so với điểm thật; overclaim bị trừ. AI-LOG và rules file phải có sự cố thật, không bịa.
- **Rủi ro kỹ thuật:** Windows local vs Linux CI (IA03 từng gặp lỗi path); test dùng port cố định dễ flaky; idempotency concurrency dễ race. Giải pháp: in-memory repo, port 0, test deterministic, không dependency runtime.

### 1.4. Scope PA#2 — làm gì và không làm gì

**Làm:**

- Một repo public, có rules file, permissions, `.env.example`, README.
- 4 lệnh kiểm tra: lint, format check, type check, tests.
- GitHub Actions chạy đúng 4 lệnh; `main` protected; required check.
- **Một** endpoint LeeTKOB: contract đầy đủ + implementation tối thiểu + contract tests.
- Bằng chứng gate biết “cắn”: PR đỏ→xanh, deliberate contract break, tag CI.
- `PA2.md`, `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md`, tag `pa2`, zip.

**Không làm (theo Brief §4 và §7):**

- LLM feature, prompt, model call thật, eval dev set, guardrail schema (PA#3–PA#4).
- Sandbox/Judge0, compile/run C++, queue, hard rules (PA#3).
- Review queue UI, publish, appeals (PA#3–PA#5).
- Load test 80 submissions, public deployment, logs/metrics/traces, incident post-mortem (PA#5).
- Nhiều endpoint; database production; migration phức tạp.
- Plagiarism/AI-code detection, contest ranking, online IDE, vector DB/RAG (Brief §4 nói rõ **Out**).

**Kết luận scope:** PA#2 là **walking skeleton + quality gate**, không phải bản thu nhỏ của toàn bộ LeeTKOB. Endpoint implementation chỉ cần đủ để contract tests có ý nghĩa; các phần khác để PA#3.

---

## 2. Phân tích rubric — làm gì để lấy điểm cao

### 2.1. Bảng chiến lược theo tiêu chí

| # | Tiêu chí | Band cao nhất cần gì | Lỗi thường gặp | Cách làm của nhóm | Điểm mục tiêu |
|---|---|---|---|---|---:|
| 1 | Rules file (15) | Ngắn, đủ 4 phần **stack / commands / conventions / never**; never list sản phẩm-specific; ≥ 2 dòng truy vết được tới sự cố thật qua commit/AI-LOG | File dài dán template; câu generic “write clean code”; không có story | Rules ≤ 1 trang; 2 dòng never có link commit/AI-LOG; review bởi 2 người | 13–15 |
| 2 | Permissions & secrets (10) | 3 tầng **allowed / ask first / never**; `.env.example` đủ biến không giá trị; không secret trong history; API key có spending cap; README nói rõ | Chỉ có `.env` ignored; quyền implicit; key lỡ commit rồi xóa | 3 tầng trong rules; `.env.example` đối chiếu `process.env.*`; scan full history; cap ghi README | 9–10 |
| 3 | One command per check (10) | Lint, format check, type check (nếu có), tests mỗi thứ **một lệnh**; local = CI; clone sạch theo README xanh | CI chạy lệnh khác README; chỉ có test; typecheck bị bỏ qua | 4 npm scripts; CI gọi đúng 4 script; fresh-clone test | 9–10 |
| 4 | CI blocks merge (20) | `main` protected; các check required; link PR đỏ bị chặn + commit làm xanh; không push thẳng main sau protection | CI chỉ chạy trên main; check không required; dùng admin bypass | Bật protection sớm; PR đỏ→xanh có ảnh; tag CI | 17–20 |
| 5 | Contract endpoint (25) | Ai gọi (role + ownership); request/response + field rules; **mọi** lỗi RFC 9457 kèm status; paging nếu list; idempotency nếu create/publish; what happens when it changes; người lạ viết được client | Chỉ list endpoint + ví dụ body; auth ghi “authenticated”; thiếu idempotency; error model sơ sài | Contract đủ 10 section; error table đầy đủ; review độc lập “stranger test” | 21–25 |
| 6 | Contract tests bite (15) | Từng error type; ownership rule; paging/idempotency; chạy required CI; **một deliberate break** làm CI đỏ | Test chỉ check status; không chạy CI; sửa test cùng commit với code để pass | Test matrix; test từ contract; break chỉ sửa code; giữ PR đỏ | 13–15 |
| 7 | AI-LOG (5) | Tool nào, phần nào; Changed/Rejected thật; ví dụ CI step không thể fail và cách phát hiện | List tool; Changed/Rejected rỗng/generic | Log mỗi lượt; ≥ 2 sự cố thật; commit link | 5 |
| | **Tổng** | | | | **90–100** |

### 2.2. Thứ tự ưu tiên khi thiếu thời gian

1. **Contract (25) + contract tests (15) = 40 điểm.** Đây là phần khó nhất và là trọng tâm của checkpoint. Không được cắt.
2. **CI blocks merge (20).** Nếu không có protection/required checks, mất gần nửa điểm gate. Bật sớm.
3. **Rules + permissions + commands (35).** Tương đối nhanh, làm song song.
4. **AI-LOG (5).** Rẻ nhưng phải ghi realtime; không để cuối.
5. **PA2.md/self-assessment/zip** là điều kiện nộp, không phải điểm tiêu chí nhưng thiếu là mất điểm/không hợp lệ.

### 2.3. Các “bẫy” của rubric

- **“At least two lines can be traced to something that actually went wrong”**: không phải cứ viết “never commit secrets” là được. Phải có commit/AI-LOG kể câu chuyện thật: assistant đề xuất gì, sai thế nào, phát hiện ra sao. Nếu không có sự cố tự nhiên, chạy **gate self-test** (deliberate probe) và ghi trung thực; đừng bịa.
- **“Nothing has been pushed straight to main since protection was turned on”**: nếu push thẳng một lần sau protection, band 17–20 có thể mất. Mọi thứ sau protection phải qua PR, kể cả sửa README.
- **“Tests were edited in the same commit as the code to make them pass”**: band 0–2. Tách commit/PR; test chỉ sửa khi contract đổi và có PR riêng.
- **“CI that cannot fail”**: `|| true`, `continue-on-error`, `--passWithNoTests`, test bị skip đều bị coi là không có gate. Phải chứng minh bằng PR đỏ thật.
- **“Contract tests that bite”**: nếu chỉ test status code, band 3–7. Phải assert body shape, headers, ownership, idempotency, số bản ghi.
- **“A stranger could write a client from this file alone”**: không được viện “xem code”. Contract phải tự đủ: auth, path, body, response, error, idempotency, versioning.
- **Self-assessment honesty**: claim 100 khi evidence yếu sẽ bị trừ. Mục tiêu thực tế 90–95; chỉ claim điểm có evidence.

---

## 3. Chọn endpoint nào?

Rubric §5 gợi ý 4 endpoint. Bảng so sánh:

| Endpoint | Ưu điểm | Nhược điểm | Idempotency/paging | State cần implement | Kết luận |
|---|---|---|---|---|---|
| `POST /labs/{labId}/submissions` | Đúng trọng tâm “retried upload must not create two submissions”; ownership rõ; không paging; state tối thiểu; dễ test replay/reused/in-flight | Cần idempotency store + auth/enrollment | Idempotency (bắt buộc) | Lab, enrollment, submission, idempotency | **Chọn** |
| `GET /labs/{labId}/review-queue` | Read-only; không cần idempotency; paging là trọng tâm | Cursor paging dễ sai; cần seed review items; ít “high-stakes” hơn | Paging (bắt buộc) | Lab, review item, cursor | Dự phòng nếu implementation submissions quá tải |
| `POST /labs/{labId}/publish` | High-stakes, idempotent, phải refuse khi review pending | State machine phức tạp; cần review items + publish record | Idempotency + conflict | Lab, review item, publish | Không chọn vì thời gian |
| `POST /submissions/{id}/appeals` | Ownership rõ (student own submission), sau publish | Cần submission + publish state + appeal; ít thời gian | Idempotency (create) | Submission, appeal, publish | Không chọn |

**Quyết định:** `POST /v1/labs/{labId}/submissions`.

> Rubric ghi ví dụ `POST /labs/{labId}/submissions` (không prefix). Nhóm dùng `/v1` để đồng bộ với `CONTRACT.md` của IA#3 và có chỗ cho change policy. Contract phải ghi rõ base path `/v1`; nếu muốn bám literal rubric thì bỏ `/v1` nhưng vẫn giữ section “what happens when it changes”. Không được mơ hồ cả hai.

**Lý do:**

1. Rubric nêu đúng ví dụ này và đúng câu “A retried upload must not create two submissions” — idempotency là phần được chấm rõ nhất.
2. Không có paging, nên chỉ cần làm tốt một cơ chế phức tạp (idempotency) thay vì hai (idempotency + cursor).
3. Ownership rõ: student phải enrolled trong class sở hữu lab; dễ test “another user's data”.
4. Implementation tối thiểu: chỉ cần lab/enrollment/submission/idempotency; không cần review item, publish, appeal.
5. Thể hiện được bảo mật: 401 vs 403, không nhận `studentId` từ body, không leak lab tồn tại.

**Dự phòng:** nếu đến hết 07/11 mà endpoint submissions còn > 4 giờ mới xong, đổi sang `GET /v1/labs/{labId}/review-queue` (paging) — nhưng phải chốt ngay, không đổi sau 08/11.

---

## 4. Giải pháp kiến trúc

### 4.1. Stack đề xuất

| Thành phần | Chọn | Lý do |
|---|---|---|
| Runtime | **Node.js 24 LTS**, ESM | Ổn định, có sẵn `node:test`; cả nhóm đã quen Node từ IA02/IA03 |
| Ngôn ngữ | **JavaScript + JSDoc**, `tsc --noEmit` với `checkJs` | Không cần build step; vẫn có type check thật để đủ tiêu chí #3; fresh clone đơn giản |
| HTTP | `node:http` + router nhỏ | Không dependency runtime; dễ kiểm soát lỗi RFC 9457; đủ cho một endpoint |
| Test | `node:test` + `node:assert/strict` + `fetch` | Có sẵn; black-box HTTP; không cần framework |
| Lint | ESLint flat config | Một lệnh `npm run lint`; bắt lỗi thật |
| Format | Prettier `--check` | Một lệnh `npm run format:check`; check cả docs/YAML |
| Type check | `tsc --noEmit` + `@types/node` | Type check cho JS qua JSDoc; không phát sinh build |
| Storage PA2 | **In-memory repository** | Đủ cho contract tests; deterministic; không cần DB/network; PA3 thay bằng SQLite |
| CI | GitHub Actions, một job `ci` | Đơn giản, dễ required check; chạy đúng 4 lệnh |
| Auth PA2 | Bearer token seed sẵn | Không cần login endpoint; test dễ; contract ghi rõ token issuance out of scope |

**Vì sao không dùng TypeScript/Express/Postgres ngay?**

- TypeScript + `tsx`/Vitest thêm build/test toolchain, dễ lỗi fresh clone; PA2 không cần.
- Express thêm dependency runtime; `node:http` đủ cho một endpoint và giúp kiểm soát problem details.
- Postgres/SQLite thêm migration/khởi tạo; in-memory đủ để chứng minh contract. PA3 sẽ thêm DB thật khi có submission queue.

**Ghi chú trung thực:** in-memory là giới hạn có chủ đích của PA2. README và AI-LOG phải ghi: “PA2 dùng in-memory repository; PA3 sẽ thay bằng SQLite/DB bền vững.” Không được nói repo đã production-ready.

### 4.2. Cấu trúc repo dự kiến

```text
.
├─ .github/workflows/ci.yml
├─ docs/
│  ├─ contract/
│  │  └─ post-labs-labId-submissions.md
│  ├─ evidence/
│  │  ├─ branch-protection.png
│  │  └─ secret-scan.txt
│  └─ permissions.md            # nếu tách khỏi rules file
├─ src/
│  ├─ app.js                    # createApp({ repo, clock, idGenerator })
│  ├─ server.js                 # start HTTP server
│  ├─ auth.js                   # bearer token -> user
│  ├─ http/problem.js           # RFC 9457 helper
│  ├─ domain/submissions.js     # validate + create + idempotency
│  └─ repo/memory.js            # maps + seed fixtures
├─ test/
│  ├─ contract/
│  │  ├─ helpers.js
│  │  ├─ submissions.success-errors.test.js
│  │  ├─ submissions.auth-ownership.test.js
│  │  └─ submissions.idempotency.test.js
│  └─ unit/                     # optional: canonical JSON/hash
├─ AGENTS.md                  # canonical rules (4 sections + permissions)
├─ CLAUDE.md                  # adapter: @AGENTS.md
├─ .cursor/rules/000-project.mdc
├─ .github/copilot-instructions.md
├─ .env.example
├─ .gitignore
├─ .nvmrc
├─ .prettierrc.json
├─ .prettierignore
├─ eslint.config.js
├─ tsconfig.json
├─ package.json
├─ package-lock.json
├─ README.md
├─ PA2.md
├─ AI-LOG.md
└─ SELF_ASSESSMENT_REPORT.md
```

**Không commit:** `node_modules/`, `.env`, `coverage/`, `data/`, `*.db`, log, ảnh chứa secret.

### 4.3. Minimal endpoint slice — cần implement gì

Chỉ cần đủ để contract tests chạy:

| Thành phần | Nội dung tối thiểu |
|---|---|
| `User` | `id`, `role` (`student` / `ta` / `admin`), `token` |
| `Class` | `id`, `taId` |
| `Lab` | `id`, `classId` |
| `Enrollment` | `studentId`, `classId` |
| `Submission` | `id`, `labId`, `studentId`, `sourceCode`, `status` (`queued`), `submittedAt` |
| `IdempotencyRecord` | `studentId`, `key`, `fingerprint`, `status`, `responseBody`, `createdAt` |
| Auth | `Authorization: Bearer <token>` → user; thiếu/sai → 401 |
| Authorization | role student; enrolled trong class của lab; sai → 403 |
| Validation | body object; `sourceCode` string 1..64 KiB; JSON Pointer; gom **mọi** lỗi |
| Problem details | `application/problem+json`; `type`, `title`, `status`, `detail`, `errors` |
| Idempotency | key 1..255; scope `(studentId, key)`; canonical JSON; replay/reused/in-flight; TTL ≥ 24h |
| Body limit | 128 KiB; vượt → 413 |
| Content type | chỉ `application/json`; sai → 415 |
| Method/path | sai method → 405 + `Allow`; path lạ → 404 |

**Không cần:** login endpoint, refresh token, password hash, email, sandbox, compiler, queue, LLM, review, publish, appeals, paging, rate limit, metrics, deployment.

**Token seed:** README ghi các token dev/test và user tương ứng; contract nói token do account service cấp, PA2 chỉ dùng seed token. Đây là quyết định phạm vi, không phải yêu cầu mới của đề.

### 4.4. Luồng xử lý đề xuất (check order)

Contract phải ghi **thứ tự kiểm tra**; test phải bám thứ tự này. Đề xuất:

0. **Route:** path không tồn tại → **404 not-found**; path tồn tại nhưng method sai → **405 method-not-allowed** + `Allow`.
1. `Authorization` thiếu/sai → **401 unauthorized** (kèm `WWW-Authenticate`).
2. Token hợp lệ nhưng role không phải student → **403 forbidden**.
3. `Content-Type` không phải `application/json` → **415 unsupported-media-type**.
4. `Idempotency-Key` thiếu/rỗng/>255 → **400 idempotency-key-missing**.
5. Body > 128 KiB → **413 payload-too-large**.
6. Body không phải JSON hợp lệ → **400 invalid-json**.
7. Lab không tồn tại → **404 not-found**.
8. Student không enrolled trong class của lab → **403 forbidden**.
9. Idempotency: replay → **201** + `Idempotent-Replayed: true`; in-flight → **409**; key+different body → **422**.
10. Validate body → **400 validation** với mọi lỗi.
11. Tạo submission + lưu idempotency trong cùng “transaction” (in-memory: atomic synchronous) → **201**.

**Vì sao thứ tự này:** auth trước để không leak; role trước content type để TA không dùng được endpoint; content type/key trước parse để lỗi rõ; lab/enrollment trước validation để không cho student lớp khác dò rule; idempotency trước validation để replay ổn định. Đây là **quyết định thiết kế**, phải ghi trong contract và test các cặp order-sensitive.

### 4.5. Idempotency — thiết kế chi tiết

- **Header:** `Idempotency-Key`, 1–255 ký tự; UUID khuyến nghị; không trim; rỗng/whitespace-only coi như thiếu.
- **Scope:** `(studentId, Idempotency-Key)`. Hai student khác nhau dùng cùng key → độc lập.
- **Fingerprint:** canonical JSON của `{ labId, body }` (hoặc method + path + body); **không** phụ thuộc thứ tự key/whitespace. Key khác nhau về bất kỳ giá trị nào → different body.
- **Replay:** same key + same fingerprint → trả **đúng** status/body đã lưu (201), thêm `Idempotent-Replayed: true`; không tạo submission mới; response đầu tiên **không** có header.
- **Reused:** same key + different fingerprint → **422 idempotency-key-reused**; không tạo gì.
- **In-flight:** key đang được xử lý → **409 idempotency-key-in-flight**; client chờ và retry.
- **Chỉ lưu 201:** mọi 4xx không lưu key; client có thể sửa body và dùng lại key.
- **TTL:** giữ ≥ 24h. PA2 in-memory có thể giữ vô hạn; ghi rõ “at least 24h” trong contract. Nếu muốn test TTL, dùng clock inject; không bắt buộc.
- **Atomicity:** trong in-memory, kiểm tra + set pending + create là synchronous; không có `await` xen giữa. Nếu PA3 dùng DB, dùng unique constraint + transaction.
- **Concurrency test:** dùng hook/barrier để giữ request đầu ở trạng thái pending; gửi request thứ hai; assert 409; thả request đầu; retry → replay 201. Không dùng `setTimeout` mò.

### 4.6. Error model — bảng đề xuất

Tất cả lỗi 4xx/5xx (kể cả path lạ) trả `application/problem+json`:

| Slug | Status | Title | Khi nào |
|---|---:|---|---|
| `invalid-json` | 400 | Malformed JSON | body không phải JSON hợp lệ |
| `validation` | 400 | Invalid request | field/path param sai rule; `errors` liệt kê **mọi** lỗi |
| `idempotency-key-missing` | 400 | Idempotency-Key required | thiếu/rỗng/>255 |
| `unauthorized` | 401 | Authentication required | thiếu/sai/hết hạn token; kèm `WWW-Authenticate: Bearer` |
| `forbidden` | 403 | Forbidden | role không phải student; không enrolled; lớp khác |
| `not-found` | 404 | Not found | lab không tồn tại; path lạ |
| `method-not-allowed` | 405 | Method not allowed | sai method; kèm `Allow` |
| `payload-too-large` | 413 | Payload too large | body > 128 KiB |
| `unsupported-media-type` | 415 | Unsupported media type | `Content-Type` không phải `application/json` |
| `idempotency-key-in-flight` | 409 | Request in progress | key đang xử lý |
| `idempotency-key-reused` | 422 | Idempotency-Key reused | cùng key, khác body |
| `internal` | 500 | Internal error | lỗi không lường trước; `detail` cố định, generic |

**Quy tắc `detail`:** một câu về lần xảy ra này; **không** stack trace, SQL, tên bảng, file path, token, source code. `errors` chỉ có ở `validation` (và có thể `unknown-*` nếu contract có): mỗi entry `{ detail, pointer }` cho body field (JSON Pointer) hoặc `{ detail, parameter }` cho path/query.

### 4.7. Contract doc — bố cục bắt buộc

File thật do Tuệ viết tại `docs/contract/post-labs-labId-submissions.md`. Bố cục:

1. **Conventions** — base `/v1`, JSON UTF-8, ID, timestamp, unknown fields.
2. **Errors** — RFC 9457 + bảng trên + examples.
3. **Auth & ownership** — role, enrollment, token, 401/403, check order.
4. **Resources** — User/Submission shapes; không trả source code.
5. **Endpoint** — method/path/headers/path params/body rules/response 201.
6. **Idempotency** — scope, fingerprint, replay/reused/in-flight, TTL, only 201 stored.
7. **Paging** — N/A vì create, không list.
8. **What happens when it changes** — additive trong `/v1`; breaking → `/v2` + Sunset; contract change PR riêng + changelog.
9. **Examples** — success, validation, 401, 403, 404, 409, 422.
10. **Security & privacy** — không log source code; không nhận `studentId` từ body; body limit; no secret.

**“Stranger test”:** cuối buổi review, một người không viết contract (Tín hoặc Tùng) thử viết một client request chỉ từ file; nếu phải hỏi thêm bất kỳ điều gì ngoài file → contract thiếu, sửa trước freeze.

---

## 5. Chiến lược contract tests

### 5.1. Nguyên tắc

- **Black-box qua HTTP**: test dùng `fetch` tới server thật trên `127.0.0.1:0` (port động), không import handler nội bộ. Riêng test 500 được phép inject repo lỗi qua `createApp` để mô phỏng failure, nhưng vẫn đi qua HTTP.
- **Test viết từ contract, không đọc code implement.** Tác giả test chỉ đọc `docs/contract/...md`.
- **Mỗi test mapping một section contract**; tên test ghi `contract §...` để khi đỏ biết ngay điều khoản nào.
- **Không test implementation detail** (tên hàm, cấu trúc DB). Test hành vi quan sát được: status, headers, body, số bản ghi qua một lần đọc lại (nếu có) hoặc qua repo test.
- **Deterministic:** mỗi test tạo app + seed mới; không dùng port cố định; không sleep mò; idempotency in-flight dùng hook/barrier.
- **Không sửa test để pass.** Khi test đỏ, báo tên test + section contract cho implementer.

### 5.2. Test matrix

| ID | Section contract | Case | Kỳ vọng | Owner |
|---|---|---|---|---|
| C-01 | §5 happy path | student enrolled, body hợp lệ, key mới | 201; body đúng shape; `studentId` từ token; `status=queued`; đúng 1 submission | Tuệ |
| C-02 | §5 body rules | thiếu/rỗng/sai kiểu/quá 64 KiB `sourceCode`; nhiều lỗi cùng lúc | 400 `validation`; mọi lỗi có JSON Pointer đúng | Tuệ |
| C-03 | §2 | body không phải JSON | 400 `invalid-json`; `application/problem+json` | Tuệ |
| C-04 | §2 | `Content-Type: text/plain` | 415 `unsupported-media-type` | Tuệ |
| C-05 | §2 | body > 128 KiB | 413 `payload-too-large` | Tuệ |
| C-06 | §2 | lab không tồn tại; path lạ | 404 `not-found` | Tuệ |
| C-07 | §2 | `GET` vào path create | 405 `method-not-allowed` + `Allow` | Tuệ |
| C-08 | §2 | repo throw | 500 `internal`; detail generic; không lộ stack/SQL/path | Tuệ |
| C-09 | §3 auth | không token; token sai/hết hạn | 401 `unauthorized` + `WWW-Authenticate` | Tùng |
| C-10 | §3 role | TA/admin token | 403 `forbidden` | Tùng |
| C-11 | §3 ownership | student không enrolled; student lớp khác | 403 `forbidden` | Tùng |
| C-12 | §3 identity | body có `studentId` lạ | field bị ignore; response dùng token | Tùng |
| C-13 | §3 order | no token + lab lạ → 401; student hợp lệ + lab lạ → 404; lab thật + lớp khác → 403 | đúng thứ tự contract | Tùng |
| C-14 | §2 shape | mọi lỗi có `type`/`title`/`status`/`detail`; `type` đúng slug; status khớp HTTP | đúng contract | Tùng |
| C-15 | §6 key missing | thiếu/rỗng/>255 | 400 `idempotency-key-missing` | Tín |
| C-16 | §6 replay | same key + same body 2 lần; khác thứ tự key/whitespace | lần 2: 201 identical body + `Idempotent-Replayed: true`; chỉ 1 submission | Tín |
| C-17 | §6 reused | same key + different body | 422 `idempotency-key-reused`; không tạo mới | Tín |
| C-18 | §6 in-flight | request 1 giữ pending, request 2 cùng key | request 2: 409 `idempotency-key-in-flight`; sau đó retry → replay | Tín |
| C-19 | §6 4xx not stored | invalid body + key → 400; valid body + same key | lần 2: 201 (key chưa bị lưu) | Tín |
| C-20 | §6 scope | 2 student khác nhau dùng cùng key | cả hai 201 độc lập | Tín |
| C-21 | §7 paging | N/A | không có test paging; contract ghi rõ N/A | — |
| C-22 | §8 change policy | review tài liệu | không phải runtime test; checklist review | — |

**Độ phủ tối thiểu:** 12 error type trong bảng error phải có ít nhất một test, trừ `internal` có thể test bằng inject; nếu bỏ type nào khỏi contract thì bỏ test tương ứng, không được list mà không test.

### 5.3. Fixtures dùng chung

`test/contract/helpers.js` cung cấp:

- `startApp({ repoOverrides })`: tạo app mới, listen port 0, trả `baseUrl`, `close`, `repo`, `clock`.
- Seed:
  - Class A (TA `taA`), Lab A1;
  - Class B (TA `taB`), Lab B1;
  - Student S1 enrolled A, S2 enrolled B, S3 không enrolled;
  - TA, admin;
  - token tương ứng.
- `request(path, { method, token, key, body, contentType })`: wrapper `fetch`, tự set header.
- `validBody()`: source code C++ nhỏ, hợp lệ.
- `assertProblem(res, { status, slug, title })`: assert content type, shape, status, `type` kết thúc bằng slug.
- `countSubmissions()`: đọc repo test để assert không tạo trùng (không dùng trong production code).

### 5.4. Deliberate contract break

Mục đích: chứng minh test **thật sự bắt** vi phạm, không phải test trang trí.

**Cách làm:**

1. Full suite xanh trên `main` (sau khi merge implementation + tests).
2. Tạo branch `test/contract-break`.
3. Sửa **chỉ code** (ví dụ: bỏ kiểm tra enrollment, hoặc trả 200 thay 201). **Không sửa test, không sửa contract.**
4. Push, mở PR; required check `ci` đỏ; chụp URL run đỏ + trạng thái PR không merge được.
5. Push commit fix; check xanh; merge.
6. Lưu URL: PR, run đỏ, commit xanh, run xanh. Ghi AI-LOG: test nào bắt, vì sao đúng.
7. Đưa link vào `PA2.md` mục “deliberate contract break”.

**Chọn break nào:** ưu tiên break **ownership** (bỏ enrollment check) vì liên quan bảo mật, test C-11 sẽ đỏ; hoặc break **status 201 → 200** vì test C-01 sẽ đỏ. Không chọn break làm test crash vì lỗi cú pháp — phải là vi phạm contract thật.

### 5.5. Chống flaky

- Port 0, không hardcode 3000.
- Mỗi test file/app riêng; `node --test` có thể chạy file song song; nếu dùng chung seed file, tạo app riêng trong từng test.
- Không dùng `setTimeout` để test race; dùng hook `beforeCreate` trả promise để giữ request.
- Không gọi network/model thật.
- Chạy `npm test` 3 lần trước khi tag; nếu flaky, sửa test hoặc implementation, không retry CI.

---

## 6. CI và branch protection — giải pháp “gate thật sự cắn”

### 6.1. Workflow

Một workflow `.github/workflows/ci.yml`, một job `ci`:

| Bước | Lệnh | Ghi chú |
|---|---|---|
| Trigger | `pull_request`, `push` main, `push` tag `pa2` | Tag run là bằng chứng bắt buộc |
| Checkout | `actions/checkout@v4` | |
| Setup Node | `actions/setup-node@v4` với `node-version-file: .nvmrc`, cache npm | Local/CI cùng version |
| Install | `npm ci` | Phải có `package-lock.json` |
| Lint | `npm run lint` | Đúng lệnh README |
| Format | `npm run format:check` | Đúng lệnh README |
| Type | `npm run typecheck` | Đúng lệnh README |
| Test | `npm test` | Gồm contract tests |

**Không được có:** `|| true`, `continue-on-error`, `if: always()` cho các bước check, `--passWithNoTests`, skip test, `npm test -- --test-name-pattern` để né test đỏ.

**Gợi ý chi tiết:** đặt `timeout-minutes: 10`, `permissions: contents: read`, `concurrency` để hủy run cũ. Không dùng path filter vì required check có thể treo `pending`.

### 6.2. Branch protection

Bật **ngay sau khi repo có workflow và check `ci` chạy lần đầu**:

- Require a pull request before merging.
- Require approvals: **1**.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass: chọn **`ci`**.
- Require branches to be up to date before merging.
- Require conversation resolution.
- **Do not allow bypassing the above settings** (include administrators).
- Không cho force push/delete `main` nếu GitHub cho chọn.

**Bằng chứng:**

- Ảnh chụp Settings → Branches/Rulesets, lưu `docs/evidence/branch-protection.png`.
- PR đỏ: merge button bị disable; ảnh + URL.
- Commit/PR xanh: URL.
- Sau protection: mọi thay đổi qua PR; kiểm tra `git log`/PR list.

### 6.3. Hai loại PR đỏ→xanh

| PR | Mục đích | Cách tạo | Bằng chứng |
|---|---|---|---|
| PR #1 — gate demo | Chứng minh CI chặn merge nói chung | Cố ý để lint/type/test đỏ (ví dụ unused variable), push; chụp màn hình; sửa; xanh; merge | URL PR, URL run đỏ, URL commit xanh |
| PR #2 — deliberate contract break | Chứng minh contract test bắt vi phạm | Bỏ enrollment check / đổi 201→200; test contract đỏ; sửa; xanh; merge | URL PR, run đỏ, commit xanh |

Có thể dùng PR #2 cho cả tiêu chí #4 và #6, nhưng làm **hai PR riêng** an toàn hơn và rõ ràng hơn. Nếu thời gian gấp, tối thiểu PR #2 phải có đủ red→green; PR #1 có thể là một PR lint nhỏ.

### 6.4. Tag `pa2`

- Sau khi merge commit cuối, tạo annotated tag:
  - `git tag -a pa2 -m "PA2 submission"`
  - `git push origin pa2`
- Workflow phải trigger `push: tags: ['pa2']`; lấy URL run của tag.
- Nếu tag run đỏ: sửa, merge, **xóa tag cũ và tạo lại** (hoặc tạo tag mới `pa2` trên commit mới) — nhưng phải đảm bảo tag cuối trỏ đúng commit nộp và run xanh. Ghi AI-LOG nếu phải re-tag.
- Không tạo tag trước khi freeze; không tag một commit chưa qua CI.

---

## 7. Rules, permissions, secrets, AI-LOG

### 7.1. Rules file — nội dung cốt lõi

Nhóm dùng **nhiều công cụ AI**, nên chọn **một nguồn duy nhất** là `AGENTS.md`; các file khác chỉ là adapter ngắn (không copy nội dung dài, tránh lệch luật):

- `AGENTS.md` — canonical, đủ 4 phần + 3 tầng permissions; đây là file được chấm.
- `CLAUDE.md` — một dòng `@AGENTS.md`.
- `.cursor/rules/000-project.mdc` — `alwaysApply: true` + “Read AGENTS.md before any change.”
- `.github/copilot-instructions.md` — pointer ngắn tới `AGENTS.md`.

Nếu một công cụ không tự đọc `AGENTS.md`, adapter của công cụ đó phải chứa tối thiểu **4 lệnh** và **never list cốt lõi**; vẫn coi `AGENTS.md` là canonical, không copy toàn bộ file dài vào 4 chỗ.

Nội dung `AGENTS.md` ≤ 1 trang:

```text
# Stack
Node 24 LTS, ESM, JS + JSDoc + tsc --noEmit, ESLint, Prettier,
node:test, in-memory repo (PA2), GitHub Actions, RFC 9457.

# Commands
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test

# Conventions
Contract-first; test named after contract section; one PR one concern;
update AI-LOG per prompt; no source code/identity in logs; problem details.

# Permissions
Allowed: ...
Ask first: ...
Never: ...

# Never (product-specific)
- Never commit a secret or expose MODEL_API_KEY to sandbox/CI logs. (AI-LOG #..., commit ...)
- Never make a real model call in a unit test. (AI-LOG #..., commit ...)
- Never edit a test, the contract, eval data or a label to make a check pass.
- Never add || true / continue-on-error / skip flags to a required check.
- Never push directly to main or merge with a red required check.
- Never run untrusted student code outside the sandbox (PA3+).
- Never send un-stripped code/identity to the model (PA3+).
- Never change the contract silently.
```

**Hai dòng có trace:** phải kèm câu chuyện thật, ví dụ:

> “Assistant thêm `continue-on-error: true` để CI xanh; PR #12/commit `abc1234` cho thấy check đỏ vẫn merge được. Đã bỏ và thêm required check. Từ đó: never add continue-on-error.”

hoặc:

> “Assistant sửa expected 201→200 trong test để pass; commit `def5678`; đã revert test và sửa code. Từ đó: never edit a test to make a check pass.”

Nếu chưa có sự cố tự nhiên: chạy **gate self-test** (deliberate probe), ghi rõ là deliberate, kèm commit/PR. Không bịa “sự cố” không tồn tại.

### 7.2. Permissions 3 tầng

| Tầng | Ví dụ cụ thể |
|---|---|
| **Allowed** | Đọc repo; sửa `src/`, `docs/`; thêm test mới (không làm yếu assertion cũ); chạy 4 lệnh; tạo branch/commit/PR; chạy server local; dùng fake model adapter. |
| **Ask first** | Cài/đổi dependency; đổi `package.json` scripts; đổi CI; đổi branch protection; đổi contract; thêm/xóa file; đổi schema/migration; gọi network; gọi model thật; dùng secret; force-push/rewrite history; xóa test. |
| **Never** | Commit secret; push main; merge đỏ; sửa test/contract/eval label để pass; real model call trong unit test; đưa key vào sandbox/CI log; chạy code sinh viên ngoài sandbox; đổi contract âm thầm. |

### 7.3. Secrets

- `.env.example` liệt kê **mọi biến**, không giá trị:
  - `PORT`, `HOST`;
  - `MODEL_PROVIDER`, `MODEL_API_KEY`, `MODEL_NAME`, `MODEL_SPEND_CAP_USD`;
  - `DATABASE_PATH` (reserved PA3).
- `.env` ignored; `.env.*` ignored trừ `.env.example`.
- Không có secret trong code/test/docs/CI/ảnh.
- Quét full history:
  - `gitleaks detect --source . --log-opts="--all"` hoặc `trufflehog git file://. --only-verified`;
  - GitHub Secret Scanning (repo public) bật;
  - lưu report 0 finding vào `docs/evidence/secret-scan.txt`.
- Nếu lỡ commit: **rotate key ngay**, ghi AI-LOG, không chỉ xóa commit; rubric band 1–4 nếu key từng có trong history, band 9–10 nếu đã rotate và nói rõ trong AI-LOG.
- Spending cap: đặt trên dashboard provider (số cụ thể, ví dụ 5 USD/tháng); README ghi model dự kiến, cap, PA2 cost = 0, PA3 cost/lab sẽ đo.

### 7.4. AI-LOG — template entry

```markdown
## 2026-11-08 — Tín — <tool>/<model> (ví dụ Claude Code, Cursor, Copilot, OpenCode)
**Prompt:** "<verbatim hoặc tóm tắt trung thực>"
**Commit/PR:** abc1234 / #12
**Kết quả:** ...
**Changed:** ...
**Rejected:** ...
**Bài học:** ...
```

- Mỗi lượt prompt làm thay đổi repo → một entry.
- Ghi cả việc không dùng AI: setup, đọc contract, quyết định.
- `Changed`/`Rejected` phải cụ thể: file, dòng, lý do, bằng chứng.
- Bắt buộc có:
  - CI step/assistant đề xuất không thể fail, và cách phát hiện;
  - một lần assistant muốn sửa test/contract để pass, hoặc một ambiguity contract;
  - ít nhất một `Changed` thật và một `Rejected` thật.
- Ghi tool/model cho từng phần; PA2 không gọi model thật.

---

## 8. Release, PA2.md, self-assessment, zip

### 8.1. PA2.md — bố cục

```markdown
# PA#2 — Harness and quality gate
Team: ...
Repo: <public URL>
Tag: pa2 — commit <sha>

## 1. Rules and permissions
- Rules file: <link>
- Permissions: <link>

## 2. Commands (same locally and CI)
| Check | Command | CI |
...

## 3. CI that blocks a merge
- Protected branch settings: ![](docs/evidence/branch-protection.png)
- Blocked PR: <URL> — red run: <URL>
- Commit that turned it green: <URL>
- CI run for tag pa2: <URL>

## 4. Contract
- Contract: docs/contract/...
- Contract tests: ...
- Deliberate contract break: PR <URL> — red run <URL>; fix commit <URL> — green run <URL>

## 5. Secrets
- .env.example, .gitignore, secret scan report, README spend cap

## 6. AI-LOG
- AI-LOG.md

## 7. Self-assessment
- SELF_ASSESSMENT_REPORT.md
```

**Link bắt buộc theo Rubric:** repository, protected-branch settings (ảnh), blocked PR, PR turned green, CI run for tag, deliberate contract break. Không dùng link local; không để placeholder khi nộp.

### 8.2. SELF_ASSESSMENT_REPORT.md

Một bảng 7 dòng:

| # | Criterion | Max | Claimed | Evidence | What we did not manage |
|---|---|---:|---:|---|---|
| 1 | Rules file | 15 | ... | file + commit + AI-LOG | ... |
| 2 | Permissions and secrets | 10 | ... | `.env.example`, scan report, README | ... |
| 3 | One command for every check | 10 | ... | package.json + CI + fresh clone log | ... |
| 4 | CI that blocks a merge | 20 | ... | protection screenshot + PR links | ... |
| 5 | Contract endpoint | 25 | ... | contract file + stranger review | ... |
| 6 | Contract tests that bite | 15 | ... | test files + CI + break PR | ... |
| 7 | AI-LOG | 5 | ... | AI-LOG entries | ... |
| | **Total** | **100** | **...** | | |

- Tổng trong bảng **phải khớp** số trong tên file zip.
- Claim thực tế 90–95 nếu evidence đầy đủ; đừng claim 100 nếu thiếu.
- “What we did not manage” phải thật: ví dụ in-memory thay DB, chưa có paging vì endpoint create, chưa có load test (ngoài PA2).
- Không claim tiêu chí không có evidence line.

### 8.3. Tag, zip, nộp

1. Freeze code 18:00 ngày 10/11.
2. Chạy full checks + secret scan + fresh-clone verification.
3. Tạo tag `pa2`, push, lấy CI run xanh.
4. Tạo zip **gồm `.git`**:
   - `Compress-Archive`/`zip -r` từ thư mục repo;
   - loại `node_modules`, `.env`, `coverage`, `data`, file log;
   - giữ `.git`, `PA2.md`, `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md`.
5. Giải nén ra thư mục tạm, chạy lại 4 lệnh; kiểm tra `.git` tồn tại.
6. Đặt tên `<ID1>-<ID2>-<ID3>_<total>.zip`, MSSV **tăng dần**.
7. Nộp từ email `<StudentID>@student.hcmus.edu.vn` trước 18:00 ngày 11/11.
8. Lưu ảnh/URL xác nhận nộp.

---

## 9. Rủi ro và cách giảm

| Rủi ro | Khả năng | Tác động | Cách giảm |
|---|---|---|---|
| Chọn sai MSSV/tên file zip | Trung bình | Chậm kết quả, không mất điểm nhưng rủi ro | Chốt 0.1 ngay; cả nhóm kiểm tra tên trước khi nộp |
| Branch protection không bật được (không có admin/gói) | Thấp | Mất 20 điểm | Tín kiểm tra quyền admin ngay ngày 06/11; dùng Rulesets nếu cần |
| CI flaky (port, race) | Trung bình | Mất thời gian, evidence xấu | Port 0, in-memory, hook deterministic, chạy 3 lần |
| Contract thiếu → test thiếu | Trung bình | Mất điểm #5/#6 | “Stranger test”; error table phủ 12 type; review độc lập |
| Test bị sửa để pass | Trung bình | Band 0–2 tiêu chí #6 | Rules never; PR review; tách commit; AI-LOG |
| Secret lỡ commit | Thấp | Mất điểm #2, phải rotate | `.gitignore` trước; scan full history; không dùng key thật PA2 |
| Hết thời gian | Cao | Cắt test/evidence | Freeze 10/11; ưu tiên contract + CI; buffer ngày 11 |
| Windows/Linux khác nhau | Trung bình | CI đỏ local xanh | Dùng `fileURLToPath`, path.join; test không đọc file; CI Linux |
| AI-LOG generic/hồi tố | Trung bình | Mất điểm #7 và rules trace | Tùng nhắc mỗi ngày; log ngay khi xảy ra |
| Không có 2 sự cố thật cho rules | Trung bình | Mất điểm #1 | Gate self-test có kiểm soát; ghi trung thực là deliberate probe |

---

## 10. Timeline tóm tắt

| Ngày | Việc chính | Kết quả phải có |
|---|---|---|
| **T6 06/11** | Chốt quyết định; tạo repo; scaffold; `.gitignore`; `.env.example`; rules skeleton; contract outline; AI-LOG | Repo public, main protection sớm nhất có thể |
| **T7 07/11** | CI workflow; branch protection; contract v1 freeze; implement endpoint; test skeleton | CI chạy trên PR; contract frozen |
| **CN 08/11** | Endpoint pass success/error/auth/ownership; idempotency tests; rules v1; secret scan; README | `npm test` phần lớn xanh |
| **T2 09/11** | Full suite xanh; PR đỏ→xanh; deliberate break đỏ→xanh; protection screenshot; AI-LOG ≥ 2 sự cố | Đủ evidence #4/#6 |
| **T3 10/11** | Freeze 18:00; fresh clone; secret scan; PA2.md; AI-LOG final; self-assessment; tag; zip | Tag `pa2` + CI xanh + zip |
| **T4 11/11** | Buffer; kiểm tra lần cuối; nộp trước 18:00 | Đã nộp, có xác nhận |

---

## 11. Truy vết yêu cầu — không bịa đề

### 11.1. Điều đề bài cố định (không được thương lượng)

- Sản phẩm là **LeeTKOB**; PA#2 là harness + quality gate + một endpoint contract + contract tests.
- 7 tiêu chí, điểm số, band điểm, deadline 11/11/2026 22:00.
- Rules file đủ 4 phần; never list sản phẩm-specific; ≥ 2 dòng có trace.
- Permissions 3 tầng; `.env.example`; không secret trong history; spending cap; README.
- 4 lệnh check; local = CI; clone sạch xanh.
- `main` protected; required checks; PR đỏ→xanh; không push thẳng main.
- Contract đủ section; RFC 9457; paging/idempotency; change policy.
- Contract tests từng error type, ownership, idempotency/paging; required CI; deliberate break.
- AI-LOG thật; tag `pa2`; repo public; PA2.md link; zip incl `.git`; self-assessment; email student.

### 11.2. Điều nhóm được tự chọn (Brief §5, §8)

- Ngôn ngữ/framework/architecture (nhóm chọn Node + JS/JSDoc + in-memory).
- Endpoint nào trong 4 gợi ý (nhóm chọn submissions).
- Model provider/model cho PA3 (chưa dùng PA2).
- Cách viết contract, cách đặt tên error slug, cách chọn fixture.
- Có dùng AI hay không, dùng một hay nhiều công cụ (nhóm dùng nhiều; `AGENTS.md` là nguồn duy nhất, AI-LOG ghi rõ tool/model từng entry).

### 11.3. Điều không được tự bịa

- Không thêm yêu cầu “phải có TypeScript”, “phải dùng Postgres”, “phải có paging cho endpoint create”, “phải làm LLM ở PA2”.
- Không thêm error/status không có trong contract; nếu có, phải viết vào contract và test.
- Không nói “đã làm” khi chưa có commit/PR/CI run.
- Không tự đặt ngưỡng/điểm khác rubric.
- Không đưa ra con số chi phí/lab giả khi chưa đo; PA2 ghi 0 model call.

### 11.4. Câu hỏi cần hỏi product owner nếu vướng

Brief §8: product owner quyết định chỗ brief im lặng (ví dụ: student có thấy evidence trước publish không; TA thấy gì với `unsure`; appeal có mở lại được không). Nếu contract PA2 cần một quyết định như vậy, hỏi trong group Facebook theo pinned post, **không hỏi private**, và cite FAQ entry trong repo. Với PA2, cố gắng tránh các quyết định sản phẩm sâu bằng cách giữ endpoint scope tối thiểu.

---

## 12. Kết luận

PA#2 không khó vì thuật toán; khó vì **bằng chứng**. Ba việc quyết định điểm:

1. **Contract đủ chặt để người lạ viết client** — đầu tư 25 điểm này trước, test viết từ contract.
2. **Gate thật sự chặn** — branch protection + required check + PR đỏ→xanh + deliberate break; không có bypass.
3. **Bằng chứng trung thực** — AI-LOG, rules file có sự cố thật, self-assessment có evidence; không overclaim.

Nếu làm đúng thứ tự: contract freeze → implementation → test độc lập → CI/protection → break evidence → freeze/tag/zip, nhóm có thể đạt band cao nhất ở cả 7 tiêu chí mà không phải làm LLM hay sandbox ở PA#2.
