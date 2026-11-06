# PA#2 — PHÂN CÔNG CÔNG VIỆC CHO NHÓM 3 NGƯỜI

**Môn:** CSC13114 — Advanced Web Application Development  
**Checkpoint:** PA#2 — Harness and quality gate (LeeTKOB)  
**Hạn nộp:** Thứ Tư, 11/11/2026, 22:00  
**Hình thức:** Bài nhóm, 100 điểm, 4% điểm môn học  
**Nguồn chân lý:** `PA02/LeeTKOB — class project brief.pdf` và `PA02/PA#2 rubric — Harness and quality gate.pdf`

> Tài liệu này chỉ **phân công và mô tả việc phải làm**. Không phải bản kế hoạch triển khai chi tiết — phần nội dung/giải pháp nằm trong `PA2_SOLUTION_PLAN.md`. Ở thời điểm lập tài liệu, **chưa có mã nguồn nào được viết**.

---

## 0. Các quyết định phải chốt trong 30 phút đầu

| # | Quyết định | Đề xuất mặc định | Ai chốt | Ghi chú |
|---|---|---|---|---|
| 0.1 | MSSV / tên thành viên | **Đã xác nhận:** Tín 23120372, Tuệ 23120398, Tùng 23120399 | Cả nhóm | Tên zip ascending: `23120372-23120398-23120399_<total>.zip`. |
| 0.2 | Repository | Tạo repo public mới tên `LeeTKOB` (hoặc `leetkob-pa2`) | Tín | Repo phải public; thêm Tùng và Tuệ làm collaborator. |
| 0.3 | Stack | Node.js 24 LTS, ESM, JavaScript + JSDoc + `tsc --noEmit`, ESLint, Prettier, `node:test`, GitHub Actions | Cả nhóm | Bám kinh nghiệm IA03 (Node, không dependency runtime). Có thể đổi sang TypeScript nếu cả nhóm thạo hơn, nhưng phải giữ đúng 4 lệnh kiểm tra. |
| 0.4 | Endpoint làm contract | `POST /v1/labs/{labId}/submissions` | Đã chốt | Lý do: có idempotency đúng trọng tâm rubric, ownership rõ, không cần paging, state tối thiểu. Phương án dự phòng: `GET /v1/labs/{labId}/review-queue`. |
| 0.5 | Công cụ AI | Nhóm dùng **nhiều công cụ**; chọn `AGENTS.md` làm **nguồn duy nhất**, các file khác là adapter ngắn trỏ về `AGENTS.md` | Tùng | `CLAUDE.md` = `@AGENTS.md`; `.cursor/rules/000-project.mdc` = alwaysApply + “read AGENTS.md”; `.github/copilot-instructions.md` = pointer. Không copy toàn bộ nội dung vào 4 file. |
| 0.6 | Provider + spending cap | Chốt provider/model dự kiến cho PA3; đặt cap ngay trên dashboard | Tùng | PA2 không gọi model thật. README vẫn phải ghi model dự kiến, cap và chi phí/lab (PA2: 0 USD). |
| 0.7 | Người có quyền admin GitHub | Tín | Tín | Cần admin để bật branch protection và required checks. |

**Không được bắt đầu code trước khi chốt xong 0.2–0.5** (0.1 đã chốt), vì tên file, rules file, endpoint và cấu trúc test đều phụ thuộc.

---

## 1. PA#2 yêu cầu gì — bản tóm tắt bám rubric

PA#2 chấm đúng 7 tiêu chí, tổng 100 điểm:

| # | Tiêu chí | Điểm | Sản phẩm tối thiểu |
|---|---|---:|---|
| 1 | Rules file | 15 | Một file rules ngắn, đủ 4 phần: **stack, commands, conventions, never**; ít nhất 2 dòng "never" truy vết được tới một sự cố thật (commit hoặc AI-LOG). |
| 2 | Permissions and secrets | 10 | Quyền của assistant ghi rõ 3 tầng: **allowed / ask first / never**; `.env.example` liệt kê mọi biến, không có giá trị; không có secret trong toàn bộ git history; API key có spending cap và README nói rõ. |
| 3 | One command for every check | 10 | Mỗi việc lint, format check, type check (nếu ngôn ngữ có), tests có **một lệnh**; local và CI dùng **đúng cùng lệnh**; clone sạch làm theo README là xanh. |
| 4 | CI that blocks a merge | 20 | `main` được bảo vệ; các check của mục 3 là **required**; có link PR bị check đỏ chặn merge và commit/PR làm xanh; không có push thẳng vào `main` sau khi bật protection. |
| 5 | Contract của một endpoint LeeTKOB | 25 | `docs/contract/<endpoint>.md` đủ các section như `CONTRACT.md` của IA#3: ai được gọi (role + ownership), request/response + field rules, mọi lỗi theo RFC 9457 kèm status, paging nếu list, idempotency nếu create/publish, chính sách khi thay đổi. Người lạ đọc file là viết được client. |
| 6 | Contract tests that bite | 15 | Test bám contract: từng error type, ownership rule, idempotency/paging nếu áp dụng; chạy trong required CI; có **một deliberate contract break** làm CI đỏ. |
| 7 | AI-LOG.md | 5 | Ghi công cụ nào, dùng cho phần nào, có **Changed / Rejected** thật (ví dụ: CI step assistant viết mà không bao giờ fail, và cách phát hiện). |

**Ngoài rubric, bài nộp còn bắt buộc:**

- `PA2.md` ở root, có link: repo, protected-branch settings (ảnh chụp được), PR bị chặn đỏ, PR đã xanh, CI run cho tag, deliberate contract break.
- Tag `pa2` đã push; repo public.
- Một file zip của **toàn bộ repo kể cả `.git`**, tên `<StudentID1>-<StudentID2>-<StudentID3>_<total>.zip`, MSSV tăng dần; bên trong có `PA2.md`, `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md`.
- `SELF_ASSESSMENT_REPORT.md`: mỗi tiêu chí một dòng, điểm tự chấm, evidence trỏ file/commit/PR/CI run; thêm mục "what we did not manage"; tổng trong bảng = số trong tên file.
- Một thành viên nộp từ tài khoản `<StudentID>@student.hcmus.edu.vn`.

---

## 2. Nguyên tắc chia việc

1. **Mỗi tiêu chí có đúng một primary owner** và ít nhất một reviewer. Không có tiêu chí nào "cả nhóm cùng làm" mà không có người chịu trách nhiệm cuối.
2. **Khối lượng tính theo giờ, không chỉ theo điểm rubric.** Contract 25 điểm nhưng test 15 điểm được chia nhỏ để Tuệ không ôm quá nhiều.
3. **Implementer không viết test cho phần mình implement** (trừ idempotency do Tín viết vì gắn với cơ chế; Tuệ review độc lập). Test phải được viết từ contract, không đọc code implement.
4. **Không sửa test/contract để làm xanh.** Nếu contract sai, sửa contract trong PR riêng có lý do; nếu test sai, sửa test trong PR riêng và ghi AI-LOG.
5. **Mọi thay đổi sau khi bật protection đều qua PR**, có ít nhất 1 approval và required check xanh.
6. **Bằng chứng phải được chụp/ghi ngay tại thời điểm xảy ra**, không viết lại hồi tố. AI-LOG ghi mỗi lượt prompt làm thay đổi repo.
7. **Đóng băng tính năng trước 18:00 ngày 10/11**, chỉ còn sửa lỗi và bằng chứng.

---

## 3. Bảng phân công tổng thể

| Workstream | Deliverable | Tiêu chí | Điểm | Primary | Support | Reviewer | Hạn |
|---|---|---|---|---:|---|---|---|
| W1 | Repo scaffold + 4 lệnh kiểm tra + README | #3 | 10 | **Tín** | Tuệ | Tùng | 07/11 |
| W2 | GitHub Actions + branch protection + evidence đỏ/xanh + tag CI | #4 | 20 | **Tín** | Tùng | Tuệ | 09/11 |
| W3 | Rules file 4 phần + 2 câu chuyện thật | #1 | 15 | **Tùng** | Tín | Tuệ | 09/11 |
| W4 | Permissions 3 tầng + `.env.example` + secret scan + spending cap | #2 | 10 | **Tùng** | Tuệ | Tín | 09/11 |
| W5 | AI-LOG xuyên suốt | #7 | 5 | **Tùng** | Cả nhóm | Tín | 10/11 |
| W6 | Contract doc cho endpoint | #5 | 25 | **Tuệ** | Tín | Tùng | 08/11 |
| W7 | Contract tests + deliberate break | #6 | 15 | **Tuệ** (lead) | Tùng, Tín | Tín | 09/11 |
| W8 | Minimal endpoint implementation (enabler, không chấm riêng) | — | — | **Tín** | Tuệ | Tùng | 08/11 |
| W9 | PA2.md + self-assessment + tag + zip + nộp bài | Bắt buộc | — | **Tín** | Cả nhóm | Cả nhóm | 11/11 |

**Kiểm tra phủ tiêu chí:** #1 → W3; #2 → W4; #3 → W1; #4 → W2; #5 → W6; #6 → W7; #7 → W5. Không trùng, không thiếu.

### Ước lượng khối lượng

| Thành viên | Việc chính | Ước lượng |
|---|---|---:|
| Tín | W1 + W2 + W8 + W9 + idempotency tests | ~16–18 giờ |
| Tùng | W3 + W4 + W5 + auth/ownership tests | ~15–17 giờ |
| Tuệ | W6 + phần lớn W7 + deliberate break + review | ~16–18 giờ |

Mức chênh lệch mục tiêu ≤ 2 giờ. Nếu một người bị kẹt > 1 giờ, báo nhóm ngay; không im lặng làm bù.

---

## 4. Task chi tiết từng thành viên

### 4.1. Phan Trung Tín — 23120372 — Gate & Release Lead

**Phụ trách:** W1 (commands), W2 (CI/branch protection), W8 (minimal endpoint), W9 (release/submission), idempotency tests.

#### T1. Khởi tạo repo và toolchain (07/11, sáng)

- Tạo repo public, thêm Tùng/Tuệ làm collaborator.
- Tạo `package.json` với các script **đúng tên**:
  - `lint`, `format:check`, `typecheck`, `test`.
- Cấu hình ESLint, Prettier, `tsconfig.json` (JS + JSDoc + `checkJs`), `.nvmrc`/`engines`.
- Tạo `.gitignore` trước khi commit bất cứ thứ gì: `node_modules/`, `.env`, `.env.*` (trừ `.env.example`), `coverage/`, `data/`, `*.db`, log.
- Commit `package-lock.json`.
- README ghi đúng 4 lệnh và lệnh cài đặt `npm ci`; không ghi lệnh khác trong CI.

**DoD:** clone sạch → `npm ci` → 4 lệnh chạy đúng tên và đúng phạm vi; ở bước scaffold có thể đỏ vì chưa có code, nhưng **trước khi nộp cả 4 phải xanh**, không lỗi "command not found".

#### T2. GitHub Actions + branch protection (07/11–09/11)

- Workflow `.github/workflows/ci.yml`, trigger `pull_request`, `push` main, `push` tag `pa2`.
- Một job `ci` chạy tuần tự: checkout → setup Node theo `.nvmrc` → `npm ci` → `npm run lint` → `npm run format:check` → `npm run typecheck` → `npm test`.
- Không dùng `|| true`, `continue-on-error`, `--passWithNoTests`, hay skip.
- Bật branch protection cho `main`: require PR + 1 approval; require status check `ci`; require branch up to date; không cho bypass (include administrators).
- Tạo **PR đỏ → xanh** đầu tiên: cố ý để một check đỏ (ví dụ lint), chụp màn hình merge button bị chặn, rồi push commit sửa, xác nhận xanh, merge. Lưu URL PR, URL run đỏ, URL commit xanh.
- Chụp ảnh branch protection lưu `docs/evidence/branch-protection.png`.
- Từ thời điểm bật protection: **không push thẳng `main`**.

**DoD:** PA2.md có link PR bị chặn, commit làm xanh, ảnh protection; `main` chỉ nhận merge commit/PR.

#### T3. Minimal endpoint implementation (08/11)

- Chỉ implement đúng contract do Tuệ viết: `POST /v1/labs/{labId}/submissions`.
- Làm trong branch riêng, prompt assistant với contract làm nguồn duy nhất; **không đọc `test/`**, không sửa contract.
- Thành phần tối thiểu: HTTP app, auth bearer token, kiểm tra role/enrollment, JSON body limit, RFC 9457 problem helper, idempotency store, in-memory repository. Không làm LLM, sandbox, queue, judge, appeals, paging.
- Ghi AI-LOG prompt + commit.
- Khi test đỏ, chỉ nhận **tên test + section contract**, không nhận test code.

**DoD:** endpoint chạy được; contract tests success/error/auth/ownership/idempotency xanh; `npm test` xanh.

#### T4. Idempotency contract tests (08/11–09/11)

Viết `test/contract/submissions.idempotency.test.js` từ contract, gồm tối thiểu:

- missing/empty/>255 key → 400 `idempotency-key-missing`;
- same key + same body → replay 201, `Idempotent-Replayed: true`, chỉ 1 submission;
- same key + different body → 422 `idempotency-key-reused`;
- same key + same body nhưng khác thứ tự key/whitespace JSON → vẫn replay;
- cùng key ở 2 student khác nhau → độc lập;
- in-flight → 409, sau khi xong retry → replay;
- request 4xx không lưu key: invalid body cùng key, sau đó valid body cùng key → 201.

**DoD:** test chạy trong `npm test`, có tên theo section contract; không sửa test để pass.

#### T5. Release + bằng chứng + nộp bài (10/11–11/11)

- Viết `PA2.md` với đầy đủ link theo rubric.
- Chạy secret scan toàn bộ history; chạy fresh-clone verification (xem W1).
- Tạo tag annotated `pa2` trên commit cuối, push tag; lấy link CI run cho tag; xác nhận xanh.
- Tạo zip gồm `.git`, loại `node_modules`, `.env`, coverage, data; kiểm tra lại bằng cách giải nén ra thư mục tạm và chạy 4 lệnh.
- Đặt tên zip theo MSSV tăng dần + tổng self-assessment; nhờ cả nhóm kiểm tra tên.
- Nộp từ email `<StudentID>@student.hcmus.edu.vn` trước 18:00 ngày 11/11 (buffer 4 giờ).

**DoD:** tag `pa2` tồn tại trên remote; CI run cho tag xanh; zip đúng tên, mở được, có `.git`, `PA2.md`, `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md`; đã submit.

#### T6. Review

- Review contract doc của Tuệ (đặc biệt: auth/ownership, error table, idempotency).
- Review rules file của Tùng (4 phần, 3 tầng quyền, 2 dòng có truy vết).
- Là người thứ hai kiểm tra zip/tag trước khi nộp.

---

### 4.2. Nguyễn Sơn Tùng — 23120399 — Rules, Security & AI-LOG Lead

**Phụ trách:** W3 (rules), W4 (permissions/secrets), W5 (AI-LOG), auth/ownership contract tests.

> MSSV đã xác nhận: **23120399**. Tên zip ascending dùng `23120372-23120398-23120399`.

#### T1. Rules file (07/11–09/11)

Nhóm dùng nhiều công cụ AI, nên **không** viết 4 file luật đầy đủ (dễ lệch nhau và bị coi là template dump). Dùng mô hình **một nguồn + adapter**:

- **`AGENTS.md` — nguồn duy nhất (canonical):** chứa đủ 4 phần stack / commands / conventions / never + 3 tầng permissions. Đây là file được chấm là “rules file”.
- **`CLAUDE.md`:** một dòng `@AGENTS.md` (Claude Code import file này).
- **`.cursor/rules/000-project.mdc`:** frontmatter `alwaysApply: true`, nội dung ngắn: “Canonical rules are in `AGENTS.md`. Read it before any change; never weaken a check.”
- **`.github/copilot-instructions.md`:** pointer ngắn: “Read `AGENTS.md`; it is the source of truth. Never weaken a required check or edit a test to pass.”

Kiểm tra: mỗi công cụ thực sự đọc được `AGENTS.md` (hoặc adapter trỏ tới nó). Nếu một công cụ không đọc được, ghi rõ trong README; không copy nội dung dài vào cả 4 file.

Nội dung **ngắn**, đúng 4 phần:

1. **Stack:** Node 24 LTS, ESM, JS + JSDoc + `tsc --noEmit`, ESLint, Prettier, `node:test`, in-memory repo cho PA2, GitHub Actions, RFC 9457.
2. **Commands:** đúng 4 lệnh `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`; setup `npm ci`; dev `npm run dev`.
3. **Conventions:** contract-first; test đặt tên theo section contract; mỗi PR một việc; commit rõ; cập nhật AI-LOG mỗi lượt; không log source code/student identity; error là problem details.
4. **Never:** danh sách ngắn, sản phẩm-specific, bắt buộc có:
   - không secret trong sandbox/repo/CI logs;
   - không gọi model thật trong unit test;
   - không sửa test/contract/eval data/label để làm check xanh;
   - không thêm `|| true`/`continue-on-error`/skip vào required check;
   - không push thẳng `main`, không merge khi check đỏ;
   - không chạy code sinh viên ngoài sandbox; sandbox không có network/secret và có giới hạn tài nguyên (PA3+);
   - không gửi code chưa strip identity cho model (PA3+);
   - không đổi contract âm thầm.

**Ít nhất 2 dòng "never" phải có chú thích dạng:** `(xem AI-LOG #3 / commit abc1234)` và câu chuyện thật: chuyện gì xảy ra, phát hiện thế nào, sửa ra sao. Không bịa. Nếu chưa có sự cố thật, chạy "gate self-test" (cố ý tạo một check có thể fail / thử bypass) và ghi trung thực là deliberate probe, kèm commit.

**DoD:** `AGENTS.md` tồn tại, ≤ 1 trang, đủ 4 phần, 3 tầng quyền, 2 dòng có truy vết; 3 adapter (`CLAUDE.md`, Cursor rule, Copilot instructions) trỏ đúng về `AGENTS.md`; Tín + Tuệ review.

#### T2. Permissions 3 tầng (07/11–08/11)

Ghi rõ trong rules file hoặc `docs/permissions.md` (link từ rules file):

| Tầng | Nội dung tối thiểu |
|---|---|
| **Allowed** | Đọc repo; sửa `src/`, `docs/`; thêm test (không làm yếu assertion); chạy 4 lệnh; tạo branch/commit/PR; chạy server local; dùng fake model adapter. |
| **Ask first** | Cài/đổi dependency; đổi `package.json` scripts; đổi CI; đổi branch protection; đổi contract; thêm/xóa file; đổi schema/migration; gọi network; gọi model thật; dùng secret; force-push/rewrite history; xóa test. |
| **Never** | Như mục "Never" của rules file; đặc biệt: commit secret, push main, merge đỏ, sửa test/contract để pass, real model call trong unit test, đưa key vào sandbox/CI log. |

**DoD:** 3 tầng rõ ràng, không mâu thuẫn với rules file; có ví dụ cho mỗi tầng.

#### T3. Secrets + `.env.example` + spending cap (08/11–09/11)

- `.env.example` liệt kê **mọi biến** app đọc, không giá trị. Tối thiểu: `PORT`, `HOST`, `MODEL_PROVIDER`, `MODEL_API_KEY`, `MODEL_NAME`, `MODEL_SPEND_CAP_USD`, `DATABASE_PATH` (biến cho PA3 có thể ghi là reserved).
- `.env` bị ignore; không commit `.env` ở bất kỳ commit nào.
- Quét toàn bộ git history bằng `gitleaks`/`trufflehog` (hoặc GitHub secret scanning); lưu report 0 finding vào `docs/evidence/secret-scan.txt`.
- Nếu phát hiện secret: rotate ngay, ghi AI-LOG, không chỉ xóa file.
- README có mục "Secrets and spend cap": model dự kiến, cap cụ thể (ví dụ 5 USD/tháng — chốt số thật), PA2 không gọi model nên chi phí PA2 = 0; chi phí/lab sẽ đo ở PA3.
- Kiểm tra `.env.example` khớp với mọi `process.env.*` trong code.

**DoD:** `.env.example` đầy đủ; history scan 0 secret; README nêu cap; Tín review.

#### T4. AI-LOG.md (xuyên suốt, chốt 10/11)

- Tạo file ngay ngày đầu; mỗi entry gồm: ngày, người, tool/model, prompt verbatim (hoặc tóm tắt trung thực nếu prompt dài), file/commit, kết quả, **Changed**, **Rejected**.
- Ghi cả công việc không dùng AI (setup, đọc contract, quyết định).
- Thu entry từ Tín/Tuệ mỗi ngày; không viết hồi tố.
- Bắt buộc có ít nhất:
  - một entry về CI step/assistant đề xuất mà **không thể fail** (hoặc một bypass thật đã phát hiện);
  - một entry về việc assistant muốn sửa test/contract để pass, hoặc một ambiguity contract đã quyết định;
  - một entry Changed thật và một entry Rejected thật.
- Ghi rõ model/provider dùng cho phần nào; PA2 không gọi model thật.

**DoD:** AI-LOG có ≥ 2 sự cố thật có commit/link; không có mục Changed/Rejected chung chung; Tín review.

#### T5. Auth/ownership contract tests (08/11–09/11)

Viết `test/contract/submissions.auth-ownership.test.js` từ contract, tối thiểu:

- không token / token sai / token hết hạn → 401 + `WWW-Authenticate`;
- TA/admin token → 403;
- student không enrollment → 403;
- student lớp khác → 403;
- body có `studentId` lạ → bị ignore; response dùng identity từ token;
- check order: không token + lab không tồn tại → 401; student hợp lệ + lab không tồn tại → 404; lab tồn tại nhưng khác lớp → 403;
- mọi lỗi là `application/problem+json`, đúng `type`/`title`/`status`/`detail`; không lộ stack/SQL/path.

**DoD:** test chạy trong `npm test`; không sửa test để pass; báo lỗi cho Tín bằng tên test + section contract.

#### T6. Review

- Review contract doc của Tuệ (góc nhìn bảo mật/ownership).
- Review CI workflow của Tín (không có bypass, tag trigger đúng).
- Kiểm tra PA2.md có đủ link trước khi nộp.

---

### 4.3. Võ Thành Minh Tuệ — 23120398 — Contract & Contract Tests Lead

**Phụ trách:** W6 (contract doc), W7 (contract tests lead + deliberate break), review.

> MSSV đã xác nhận: **23120398**. Tên zip ascending dùng `23120372-23120398-23120399`.

#### T1. Contract doc (07/11–08/11)

Tạo `docs/contract/post-labs-labId-submissions.md` (tên file theo endpoint; có thể dùng `submissions-create.md`). Bắt buộc đủ các section tương đương `CONTRACT.md` IA#3:

1. **Conventions:** base path `/v1`; JSON UTF-8; ID là số nguyên dương; timestamp ISO 8601 UTC; client bỏ qua field lạ; server bỏ qua field request lạ.
2. **Errors:** RFC 9457 `application/problem+json`; `type`/`title`/`status`/`detail`/`errors`; bảng **mọi** error type + status + khi nào; `detail` không chứa stack/SQL/table/file path.
3. **Auth & ownership:** ai được gọi (role student), ownership rule (student phải enrolled trong class sở hữu lab), token lấy ở đâu (account service, out of scope), 401 vs 403, check order.
4. **Resources / request / response:** body `{ "sourceCode": "..." }`; field rules (string, 1..64 KiB, không blank, unknown fields ignored); response 201 `{ id, labId, studentId, status: "queued", submittedAt }`; server derive `studentId` từ token, không nhận từ body; nêu rõ không có `Location` nếu không implement GET.
5. **Endpoint:** `POST /v1/labs/{labId}/submissions`; path param rule; content type; body limit; ví dụ request/response; check order chi tiết.
6. **Idempotency:** header `Idempotency-Key` 1–255 ký tự; scope `(studentId, key)`; fingerprint canonical JSON (không phụ thuộc thứ tự key/whitespace); same key+same body → replay 201 + `Idempotent-Replayed: true`, không tạo bản ghi mới; same key+different body → 422; in-flight → 409; chỉ 201 được lưu; 4xx không lưu; giữ key ≥ 24h.
7. **Paging:** ghi rõ **không áp dụng** vì endpoint create, không list.
8. **What happens when it changes:** trong `/v1` chỉ additive; breaking → `/v2` + Sunset; đổi contract phải PR riêng, có version/changelog; không sửa contract cho khớp code.
9. **Examples:** ít nhất một request thành công, một validation error, một 403, một 404, một 409, một 422; curl/fetch minh họa.
10. **Security/privacy:** không log source code; không trả source code; không đưa key vào request/response; body limit.

**Error table tối thiểu:** `invalid-json` 400, `validation` 400, `idempotency-key-missing` 400, `unauthorized` 401, `forbidden` 403, `not-found` 404, `method-not-allowed` 405, `payload-too-large` 413, `unsupported-media-type` 415, `idempotency-key-in-flight` 409, `idempotency-key-reused` 422, `internal` 500. Nếu bỏ type nào thì phải bỏ test tương ứng và giải thích; không được list mà không test.

**DoD:** người không biết code đọc file viết được client; Tín + Tùng review; contract **freeze** trước khi Tín implement.

#### T2. Shared test helper + success/validation/error tests (08/11)

- Tạo `test/contract/helpers.js`: start app trên port 0, seed class/lab/student/TA/enrollment/token, `fetch` wrapper, `assertProblem`.
- Viết `test/contract/submissions.success-errors.test.js`:
  - 201 happy path + shape + `studentId` từ token + chỉ 1 record;
  - validation: thiếu/rỗng/sai kiểu/quá dài `sourceCode`, nhiều lỗi cùng lúc, JSON Pointer đúng, body không phải object → pointer `""`;
  - invalid JSON → 400; sai content type → 415; body quá lớn → 413;
  - lab không tồn tại → 404; unknown path → 404; sai method → 405 + `Allow`;
  - internal error (inject repo throw) → 500, detail generic, không lộ stack/SQL/path.
- Tên test ghi rõ `contract §...`.

**DoD:** test chạy trong `npm test`; không đọc code implement khi viết test; test đỏ trước khi implement xong là bình thường.

#### T3. Deliberate contract break + evidence (09/11)

- Sau khi full suite xanh: tạo branch `test/contract-break`, sửa **chỉ code** để vi phạm contract (ví dụ: bỏ check enrollment → test 403 đỏ; hoặc trả 200 thay 201). Không sửa test/contract.
- Push, mở PR; xác nhận required check `ci` đỏ; chụp URL run đỏ + trạng thái PR bị chặn.
- Push commit fix; xác nhận xanh; merge; lưu URL commit xanh.
- Ghi AI-LOG: đây là deliberate break, test nào bắt, vì sao test đúng.
- Đưa link vào PA2.md (mục deliberate contract break).

**DoD:** có PR red→green; test fail đúng lý do; không có test/contract nào bị sửa trong break commit.

#### T4. Review + hỗ trợ

- Review idempotency tests của Tín (độc lập với implementation).
- Review rules file của Tùng (đặc biệt mục contract-first, never).
- Kiểm tra PA2.md link contract + test + break.
- Là người phản biện cuối: "một người lạ có viết được client chỉ từ file contract không?"

---

## 5. Chia test theo file (tránh conflict)

| File | Owner | Nội dung |
|---|---|---|
| `test/contract/helpers.js` | Tuệ | Fixtures, start app, fetch wrapper, assert problem |
| `test/contract/submissions.success-errors.test.js` | Tuệ | 201, validation, invalid-json, 413/415/404/405/500 |
| `test/contract/submissions.auth-ownership.test.js` | Tùng | 401/403, enrollment, identity, check order |
| `test/contract/submissions.idempotency.test.js` | Tín | Key missing/replay/reused/in-flight/scope/4xx-not-stored |
| `test/unit/*.test.js` (optional) | Tín/Tuệ | Canonical JSON/hash, problem helper |

Quy ước: không ai sửa file test của người khác mà không có PR riêng + lý do + AI-LOG. Không "xoá test khó" để CI xanh.

---

## 6. Timeline 6 ngày

| Ngày | Mốc bắt buộc | Ai |
|---|---|---|
| **T6 06/11** | Chốt 0.1–0.5; tạo repo public; scaffold; `.gitignore` + `.env.example`; rules skeleton; contract outline; AI-LOG khởi tạo | Cả nhóm |
| **T7 07/11** | CI workflow chạy được trên PR; bật branch protection; contract v1 freeze; bắt đầu implement; test skeleton | Tín, Tuệ, Tùng |
| **CN 08/11** | Endpoint pass success/error/auth/ownership; idempotency tests; rules v1; secret scan lần 1; README 4 lệnh | Cả nhóm |
| **T2 09/11** | Full contract suite xanh; PR đỏ→xanh đầu tiên; deliberate contract break đỏ→xanh; protection screenshot; AI-LOG ≥ 2 sự cố | Tín, Tuệ, Tùng |
| **T3 10/11** | **Freeze 18:00**; fresh-clone verification; secret scan full history; PA2.md; AI-LOG final; self-assessment; tag `pa2`; CI tag xanh; tạo zip | Cả nhóm |
| **T4 11/11** | Buffer; kiểm tra zip/tag/repo public; nộp trước **18:00** (hạn 22:00) | Tín |

**Nguyên tắc:** nếu đến 20:00 ngày 10/11 còn lỗi, cắt bớt test optional, không cắt tiêu chí bắt buộc. Không chờ đến ngày 11/11 mới tag.

---

## 7. Quy trình branch / PR / commit

- Branch: `feat/...`, `fix/...`, `docs/...`, `test/...`, `ci/...`, `chore/...`.
- Mỗi PR một việc; mô tả: mục tiêu, tiêu chí rubric, cách kiểm tra, evidence, AI-LOG entry.
- PR phải có ít nhất 1 approval; required check `ci` xanh; không merge khi đỏ; không tự approve PR của mình.
- Không push thẳng `main` sau khi protection bật. Nếu lỡ: ghi AI-LOG, không xóa lịch sử; báo nhóm.
- Commit message: `feat(contract): ...`, `test(contract): ...`, `ci: ...`, `docs(rules): ...`.
- Trước khi mở PR: chạy đủ 4 lệnh local; `git status` sạch; không commit `.env`, `node_modules`, coverage, data.
- Evidence: mỗi PR red→green phải lưu URL run đỏ, URL commit xanh, ảnh merge button nếu được.

---

## 8. Checklist bằng chứng trước khi nộp

### Tiêu chí 1 — Rules file
- [ ] `AGENTS.md` là nguồn duy nhất; `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md` là adapter ngắn, không copy nội dung dài.
- [ ] Đủ 4 phần: stack, commands, conventions, never.
- [ ] Never list có sản phẩm-specific: secret sandbox, real model call trong unit test, sửa test/eval/label.
- [ ] ≥ 2 dòng never có commit/AI-LOG trace + câu chuyện thật.
- [ ] Ngắn, không phải template dán.

### Tiêu chí 2 — Permissions & secrets
- [ ] 3 tầng allowed / ask first / never.
- [ ] `.env.example` đủ biến, không giá trị; khớp `process.env.*`.
- [ ] `.env` ignored; `git log --all` không có `.env`/secret.
- [ ] Secret scan full history 0 finding (lưu report).
- [ ] README nêu model, spending cap, chi phí PA2 = 0.
- [ ] Không có key trong code, test, CI, docs, ảnh.

### Tiêu chí 3 — Commands
- [ ] `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` tồn tại.
- [ ] README ghi đúng 4 lệnh + `npm ci`.
- [ ] CI gọi đúng 4 lệnh, không thêm flag khác.
- [ ] Clone sạch làm theo README → xanh (chụp log/terminal).

### Tiêu chí 4 — CI blocks merge
- [ ] `main` protected; require PR + approval + status check `ci`.
- [ ] Ảnh protection settings trong `docs/evidence/`.
- [ ] PR đỏ bị chặn (URL + ảnh).
- [ ] Commit/PR làm xanh (URL).
- [ ] Không push thẳng main sau protection.
- [ ] CI run cho tag `pa2` xanh (URL).

### Tiêu chí 5 — Contract
- [ ] `docs/contract/<endpoint>.md` tồn tại.
- [ ] Đủ conventions, errors RFC 9457, auth/ownership, request/response + field rules, endpoint, idempotency, paging N/A, change policy, examples.
- [ ] Mọi error type có status + when; không list thiếu/test thiếu.
- [ ] Người lạ đọc viết được client (review độc lập).

### Tiêu chí 6 — Contract tests
- [ ] Mỗi error type có test.
- [ ] Ownership: another user's data → đúng status contract.
- [ ] Idempotency: replay/reused/in-flight/scope/4xx.
- [ ] Chạy trong `npm test` và required CI.
- [ ] Deliberate break PR/commit đỏ; fix xanh; không sửa test/contract.
- [ ] Test không chỉ check status code; check shape/header/DB count.

### Tiêu chí 7 — AI-LOG
- [ ] Tool/model + phần nào.
- [ ] Changed/Rejected thật, có commit/link.
- [ ] ≥ 2 sự cố thật (CI không thể fail; sửa test/contract; secret; ambiguity).
- [ ] Không viết hồi tố/generic.

### Bài nộp
- [ ] Repo public.
- [ ] Tag `pa2` push, trỏ đúng commit.
- [ ] `PA2.md` root đủ 6 link rubric.
- [ ] `SELF_ASSESSMENT_REPORT.md` 7 dòng + what not manage; tổng khớp tên file.
- [ ] Zip gồm `.git`, không `node_modules`/`.env`; mở lại chạy được.
- [ ] Tên `<ID1>-<ID2>-<ID3>_<total>.zip`, MSSV tăng dần.
  - MSSV đã chốt: `23120372`, `23120398`, `23120399` → tên đúng là `23120372-23120398-23120399_<total>.zip`.
- [ ] Nộp từ email student, trước 22:00 (mục tiêu 18:00).

---

## 9. Scope guard — PA2 KHÔNG làm

Để tránh trễ và lẫn với PA3–PA5, PA2 **không** làm:

- LLM feature, prompt, model call thật, eval dev set, guardrail schema.
- Sandbox, Judge0, compile/run C++, queue, hard rules.
- Review queue UI, publish, appeals, real-time results.
- Load test 80 submissions, deployment public, logs/metrics/traces, incident post-mortem.
- Nhiều endpoint; chỉ một endpoint contract + implementation tối thiểu để test.
- Database production/migration phức tạp; PA2 dùng in-memory repo, ghi rõ giới hạn trong README/AI-LOG.

Nếu muốn thêm bất kỳ mục nào trên, phải hỏi nhóm và ghi rõ là ngoài scope PA2.

---

## 10. Họp ngắn mỗi ngày (15 phút)

Mỗi người trả lời 4 câu:

1. Hôm qua làm gì, commit/PR nào?
2. Hôm nay làm gì, có bị block không?
3. Có sự cố/AI mistake nào cần ghi AI-LOG không?
4. Có test/contract nào bị sửa không? Vì sao?

**Blocked > 1 giờ → báo ngay.** Không tự ý sửa test/contract để hết đỏ.
