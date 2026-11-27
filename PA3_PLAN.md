# KẾ HOẠCH TRIỂN KHAI PA#3 — LeeTKOB

**Môn:** CSC13114 — Advanced Web Application Development
**Checkpoint:** PA#3 — Prototype with the LLM feature running
**Hạn nộp:** 22:00, Thứ Tư 25/11/2026 (không nhận sau 24h)
**Hình thức:** bài nhóm 3 người · 100 điểm · 7% điểm môn
**Nhóm:** Phan Trung Tín (23120372) · Nguyễn Sơn Tùng (23120399) · Minh Tuệ (23120398)
**Repo PA#2 hiện tại:** <https://github.com/tinphan247/2026-AWAD-PA02> (nhánh `main`, tag `pa2`)

---

## 0. Trả lời nhanh câu hỏi "đề có bắt buộc dùng lại repo PA#2 không?"

**Không bắt buộc.** Đề chỉ ràng buộc:

- "same teams as PA#2" (cùng nhóm),
- "Tag the commit you are submitting `pa3` and push the tag. The repository stays public",
- criterion 1 nhắc "the status your PA#2 contract names" (dùng lại ngữ nghĩa 403/404 của contract cũ),
- brief: "From PA#2 on, every team builds LeeTKOB".

**Khuyến nghị: dùng lại repo PA#2.** Lý do:

1. Giữ được lịch sử commit thật cho criterion 7 (tests-first, một phần mỗi commit). Rubric nói rõ: "A history split or rebuilt after the work was finished does not count" — làm tiếp trên repo cũ là cách an toàn nhất.
2. Giữ tag `pa2`, branch protection, CI, contract, `AGENTS.md`, `AI-LOG.md` — những thứ đã được chấm và đang là nền của PA#3.
3. Không phải dựng lại GitHub Actions, ruleset, secret scanning.

Việc cần làm: đổi tên repo (tuỳ chọn) thành `2026-AWAD-LeetKOB` — GitHub tự redirect URL cũ; hoặc giữ nguyên tên để không gãy link evidence trong `PA2.md`.

---

## 1. Tóm tắt yêu cầu và cách chấm

### 1.1 Sản phẩm phải chạy được (criterion 1)

Trên **deployment công khai**, dùng tài khoản trong `PA3.md`:

1. TA tạo lab trong class của mình **bằng chính giao diện sản phẩm** (không dùng script/DB edit): statement, tests, 2 constraint kèm deduction, lấy từ bài `sort-merge` của dev set.
2. Student nộp 3 bài: 1 compliant, 1 violation, 1 injection. **Dùng 3 sinh viên khác nhau**, vì FAQ-02 quy định chỉ bài nộp cuối của mỗi sinh viên được tính và vào hàng chờ.
3. Mỗi bài đi `queued → judged`, student thấy verdict test (AC/WA/TLE/…) và verdict từng test, **không thấy input/output** (FAQ-02).
4. TA mở review queue: mỗi submission × mỗi constraint hiện verdict, evidence lines, deduction TA đã đặt.
5. TA của class khác **không** thấy lab/queue (dùng status 403 theo contract PA#2).
6. Student thấy **danh sách constraint + mức trừ** ngay từ lúc mở lab (FAQ-06), nhưng **không thấy verdict/evidence trước khi publish** (FAQ-08).

### 1.2 Tám tiêu chí và điểm

| # | Tiêu chí | Điểm | Chốt kỹ thuật |
|---|---|---:|---|
| 1 | Flow end-to-end trên deployment | 15 | TA tạo lab qua UI; 3 bài nộp; queue hiển thị đủ; cách ly class |
| 2 | Queue và sandbox | 20 | 9 minimums, mỗi cái 1 attack submission chạy CI; compile trong sandbox; worker riêng; judged exactly once |
| 3 | Hard rules chạy trước | 15 | Syntax-aware (AST), không text search; trap không bắn; model không được gọi cho constraint đã có hard rule |
| 4 | Model xử lý semantic constraints | 20 | Gọi model thật; chỉ gửi statement + constraints + code đã bỏ comment/identity; pass/violation/unsure + evidence; call log có request id, token, thời gian, cost; tính cost/lab 80 bài |
| 5 | Limits đầu tiên + review queue | 10 | Schema check + timeout → unsure, có test fake model không network; verdict chỉ vào queue TA; không publish mark |
| 6 | Checker command + eval đầu tiên | 10 | 1 lệnh nhận dataset folder → predictions.jsonl; Dockerfile; `MODEL_OFF=1`; committed dev run; ≥5 case riêng (≥1 trap, ≥1 injection) |
| 7 | Tests-first, một phần mỗi commit | 5 | Test + code cùng commit/PR, mỗi commit một phần; không nới test |
| 8 | AI-LOG.md | 5 | Tool nào dùng cho phần nào; Changed/Rejected cụ thể, thật |

### 1.3 Luật "syllabus" — điều kiện sống còn

Nếu model verdict **đổi điểm** hoặc **đến tay student như một deduction** mà không có TA ở giữa, hoặc model output **không schema check / không timeout** → **criterion 4, 5, 6 = 0**. Vì vậy trong PA#3:

- **Không có Publish thật.** Nếu có nút Publish, nó phải từ chối khi còn verdict chưa review (FAQ-12).
- Student chỉ thấy kết quả **judge** (compile/test), **không thấy** constraint verdict/evidence/deduction (FAQ-08).
- Student **được thấy** danh sách constraint + mức trừ từ lúc mở lab, và thông báo code sẽ được soát bằng luật cứng + model (FAQ-06).
- Queue TA gồm: **mọi `violation` + mọi `unsure` + 10% số `pass`** chọn ngẫu nhiên, làm tròn lên (FAQ-10).
- `unsure` **không bao giờ tự thành deduction**; TA phải chọn `pass` hoặc `violation`, và nếu `violation` phải chỉ ít nhất một dòng evidence (FAQ-09).
- Lab còn `unsure` chưa xử lý thì **không Publish được** (FAQ-09, FAQ-12).

### 1.4 Deliverables bắt buộc

| File/hành động | Nội dung |
|---|---|
| `PA3.md` (root) | URL deployment; tài khoản test (1 admin, 2 TA khác class, **3 student class TA1** — 2 theo yêu cầu + 1 thêm để demo 3 bài theo FAQ-02); link CI run của tag; checker command + Docker build + `MODEL_OFF=1`; folder dev run đã commit (predictions + eval report); link video ≤5 phút |
| `AI-LOG.md` | Tool, phần việc, Changed/Rejected thật |
| `SELF_ASSESSMENT_REPORT.md` | 1 dòng/criterion, điểm tự chấm, evidence (file/commit/PR/CI); mục "what we did not manage" |
| Tag `pa3` | Push tag, repo public, CI chạy trên tag có sandbox tests |
| Zip | `<ID1>-<ID2>-<ID3>_<total>.zip`, **có `.git`**, thứ tự MSSV tăng dần |
| Deployment | Giữ chạy đến khi có điểm PA#4 (red team sẽ tấn công) |

---

## 2. Hiện trạng PA#2 và khoảng trống

### Đã có (tái sử dụng)

- Node.js 24, ESM + JSDoc + TypeScript check, ESLint, Prettier, `node:test`.
- `src/app.js`, `src/server.js`, `src/auth.js`, `src/repo/memory.js`.
- Endpoint `POST /v1/labs/{labId}/submissions` với 12 bước kiểm tra, idempotency, RFC 9457 problem details.
- Contract test đầy đủ, CI GitHub Actions, branch protection, secret scan, `AGENTS.md`.
- Ngữ nghĩa lỗi: student class khác → **403 forbidden**; lab không tồn tại → **404 not-found**.

### Chưa có (phải làm mới trong PA#3)

| Khoảng trống | Ghi chú |
|---|---|
| Database thật | `repo/memory.js` mất dữ liệu khi restart → không thể "judged exactly once". Cần Postgres/SQLite bền vững. |
| Hàng đợi + worker riêng | Phải tách process/container, có claim/lease, chống xử lý trùng. |
| Sandbox | Docker, 9 minimums, compile trong sandbox. |
| Hard rules | Chưa có parser C++; phải syntax-aware. |
| Model call | Chưa có provider, prompt, schema, call log. |
| Review queue UI | Chưa có màn hình TA. |
| Lab/constraint API + UI | Chưa có. |
| Checker CLI + Dockerfile | Chưa có. |
| Dev set | **Chưa có trong máy** — blocker. |
| Deployment | Chưa có. |

---

## 3. Quyết định kiến trúc

### 3.1 Cảnh báo quan trọng: PaaS thuần không chạy được sandbox

Bạn chọn **PaaS có Docker (Render/Railway/Fly.io)**. Cần phân biệt:

- PaaS **build image từ Dockerfile của bạn** ≠ cho phép bạn **chạy container con**.
- Render/Railway **không** cấp `docker.sock`, không `--privileged`, không Docker-in-Docker. Vì vậy **không thể** chứng minh:
  - minimum 3: wall-clock kill **container**, không chỉ process;
  - minimum 4: memory + **swap** theo cgroup;
  - minimum 8: không host mount, không Docker socket — vì bản thân app đã nằm trong container của PaaS.

**Kết luận:** bắt buộc có **một máy Linux có Docker thật**. Vì nhóm chưa có VPS, dưới đây là các phương án **miễn phí**.

#### Phương án đã chọn: **C — Render free (web) + Azure worker**

| # | Phương án | Vai trò | Trạng thái |
|---|---|---|---|
| **C** | **Render free + Azure for Students VM** | Render: web/API/UI. Azure: worker + sandbox + Docker | ✅ **Đã chọn** |
| A | Oracle Cloud Always Free (1 VM) | Gộp web + worker + Postgres + Caddy | Fallback nếu Render hết 750 h hoặc ngủ khi chấm |
| B | Google Cloud e2-micro (1 GB) | Worker + sandbox | Fallback nếu Oracle hết capacity |
| D | AWS/Azure free 12 tháng | Worker | Fallback ngắn hạn |

**Kiến trúc đã chọn:**

```
Người dùng (TA/Student)
        │ HTTPS
        ▼
Render Web Service (free)  ──────►  Neon Postgres (free, TLS)
   - UI TA/Student                     - labs, constraints
   - API, enqueue job                  - submissions, jobs
   - KHÔNG giữ Gemini key              - verdicts, call log
        ▲                                     ▲
        │ cron ping 10 phút                  │ poll job / ghi verdict
        │ (giữ Render không ngủ)              │
        └───────────────┐                     │
                        │                     │
              Oracle Cloud VM (Always Free) ──┘
              - worker: claim job, hard rules
              - docker run --network none --memory 256m \
                --memory-swap 256m --pids-limit 64 --user 1000 \
                --read-only --tmpfs /tmp leetkob-sandbox ...
              - Gemini API (key CHỈ nằm ở đây)
```

**Vì sao tách như vậy:**

- **Render free** lo phần public HTTPS, UI, API — không cần mở port trên Oracle.
- **Oracle VM** chỉ cần **outbound** tới Neon và Gemini; không mở cổng vào, giảm bề mặt tấn công cho PA#4.
- **Neon Postgres** là cầu nối giữa Render và Oracle; cả hai kết nối bằng TLS, không cần VPN.
- **Gemini key chỉ nằm trên Oracle worker**; Render và sandbox đều không thấy.
- Sandbox vẫn chạy Docker thật trên Oracle → đủ 9 minimums.

**Điều kiện cần biết:**

- **Render free** ngủ sau 15 phút không có request. Dùng cron-job.org (hoặc GitHub Actions schedule) ping `/healthz` mỗi 10 phút. 24/7 ≈ 730 h/tháng, vừa dưới hạn 750 h.
- **Neon free** scale-to-zero, request đầu sau ngủ chậm ~0.5–1 s; chấp nhận được.
- **Neon free chỉ có 100 CU-hours/project/tháng**; chạm hạn mức thì compute bị **suspend tới tháng sau** (<https://neon.com/faqs/free-plan-limits-and-quotas>). Compute chỉ ngủ khi **5 phút** không có truy vấn. Nếu worker poll DB mỗi 1–2 s thì DB thức 24/7: 0.25 CU × 730 h ≈ 182 CU-h/tháng > 100 → hết quota sau ~400 h (~17 ngày), **trước khi có điểm PA#4**. Cách xử lý (chốt khi có Oracle):
  - Lấy được Oracle **A1 (24 GB)** → chạy **tất cả trên Oracle** (web + worker + Postgres + Caddy, phương án A), Neon chỉ để dev.
  - Chỉ có **AMD 1 GB** → giữ Render + Neon, worker poll có **idle backoff** (giãn dần khi không có job), theo dõi CU-hours trên dashboard Neon mỗi 2–3 ngày.
- **Oracle Always Free** cần thẻ xác minh, hay hết capacity ARM — thử region khác hoặc máy AMD 1 GB. Có thể bị thu hồi nếu idle 7 ngày → cron ping + tác vụ CPU nhẹ định kỳ.
- Nếu **Oracle ARM**: build image `linux/arm64` (gcc, Node 24, tree-sitter đều hỗ trợ).
- Nếu **Render free không đủ** (quá 750 h, hoặc ngủ giữa lúc chấm): chuyển web sang chính Oracle VM (phương án A) — code không đổi, chỉ đổi `DATABASE_URL` và chạy thêm container web + Caddy.

**Không nên chọn:**

- **Fly.io**: đã bỏ free tier cho tổ chức mới.
- **Railway**: chỉ có credit trial.
- **Koyeb / Northflank / Render free cho sandbox**: không có Docker-in-Docker → không đạt minimum 3, 4, 8.
- **GitHub Codespaces**: tự sleep, URL public không ổn định.
- **Máy nhà + Cloudflare Tunnel**: chỉ là phương án cuối, dễ chết khi chấm.

> **Lưu ý:** Oracle và GCP đều yêu cầu thẻ để xác minh nhưng **không trừ tiền** nếu chỉ dùng Always Free. Bật budget cảnh báo 0 USD ngay sau khi tạo tài khoản.

### 3.2 Stack

| Thành phần | Chọn | Lý do |
|---|---|---|
| Runtime | Node.js 24 (giữ nguyên) | Đồng bộ PA#2, CI cũ |
| Web | Node `http` hiện có + server-rendered HTML tối giản | Ít moving part, kịp deadline; không thêm React |
| DB | **Neon Postgres free** (TLS) | Queue bền vững, exactly-once, cầu nối Render ↔ Oracle |
| Sandbox | Docker + image `leetkob-sandbox` (gcc/g++), `--network none` | Đủ 9 minimums |
| Hard rules | `web-tree-sitter` (WASM) + grammar `tree-sitter-cpp` | AST thật, phân biệt comment/string/include; offline. Dùng bản WASM thay cho binding native `tree-sitter`: không cần node-gyp, chạy được trên Node 24, trong image checker `--network none` và trên Oracle ARM |
| Model | **Google Gemini free tier** (`gemini-2.5-flash` hoặc `gemini-2.0-flash`) | Free tier, structured output (JSON schema), có `responseId` |
| Checker | CLI Node + Dockerfile riêng | Chạy được `--network none`, `MODEL_OFF=1` |
| Deploy | **Render free (web) + Azure for Students VM (worker) + Neon (DB)** | Public HTTPS, Docker thật, miễn phí |

### 3.3 Mô hình dữ liệu tối thiểu

```text
users(id, email, password_hash, role[admin|ta|student])
classes(id, name, invite_code)
class_members(class_id, user_id, role_in_class)
labs(id, class_id, title, statement, tests_json, cost_cap_usd,
     opens_at, deadline_at, published_at, created_by)
constraints(id, lab_id, text, deduction, kind[ban_list|semantic], position)
submissions(id, lab_id, student_id, source_code,
            judge_verdict[AC|WA|TLE|MLE|RE|CE], test_results_json,
            status[queued|judging|judged|error],
            is_counted BOOL, created_at)
jobs(id, submission_id UNIQUE, status[queued|claimed|done|failed], lease_until, attempts)
verdicts(id, submission_id, constraint_id, verdict[pass|violation|unsure],
         evidence_json, decided_by[hard_rule|model|fallback],
         unsure_reason[model_unsure|schema_invalid|evidence_mismatch|timeout|cost_cap|hard_rule_unsure|compile_error],
         ta_decision[NULL|pass|violation], reviewed BOOL,
         UNIQUE(submission_id, constraint_id))
model_calls(id, submission_id, constraint_id, provider, model, provider_request_id,
            tokens_in, tokens_out, latency_ms, cost_usd, created_at)
```

**Exactly-once:** `jobs.submission_id UNIQUE` + claim bằng transaction (`UPDATE ... WHERE status='queued' ... RETURNING`) + `verdicts UNIQUE(submission_id, constraint_id)` + ghi verdict bằng `ON CONFLICT DO NOTHING`. Worker restart không tạo thêm bộ verdict.

**Theo FAQ:**
- Chỉ bài **AC** mới vào soát ràng buộc; bài không AC = 0 điểm, không soát (FAQ-04).
- `is_counted` = bài nộp cuối của mỗi `(lab_id, student_id)` trước `deadline_at`; chỉ bài counted mới vào queue (FAQ-02).
- Verdict `unsure` lưu `unsure_reason` để TA thấy nguyên nhân (FAQ-09).
- Điểm = `max(0, 10 - sum(deduction của constraint bị violation))`; mỗi constraint trừ một lần (FAQ-11). PA#3 chưa publish nên chỉ hiển thị cho TA.

### 3.4 Danh sách endpoint/route cần có

| Route | Vai trò | Ghi chú |
|---|---|---|
| `POST /v1/labs/{labId}/submissions` | student | Giữ nguyên contract PA#2, thêm enqueue job; bài cuối trước hạn được đánh `is_counted` (FAQ-02) |
| `GET /v1/labs/{id}` | student/TA | Student thấy statement, constraints + deduction, deadline; **không** thấy verdict (FAQ-06) |
| `GET /v1/submissions/{id}` | student/TA | Student thấy judge verdict + từng test, **không** thấy input/output, **không** thấy constraint verdict (FAQ-02, FAQ-08) |
| `POST /v1/labs` | TA | Tạo lab + constraints + tests; chỉ sửa được theo FAQ-07 |
| `GET /v1/labs/{id}/review-queue` | TA | Chỉ TA cùng class; TA class khác → 403; gồm violation + unsure + 10% pass (FAQ-10) |
| `POST /v1/verdicts/{id}/review` | TA | TA chọn `pass`/`violation`; violation phải có evidence line (FAQ-09) |
| `POST /v1/labs/{id}/publish` | TA | Tuỳ chọn PA#3; nếu có: chặn khi còn unsure chưa xử lý hoặc chưa hết hạn (FAQ-12) |
| `POST /v1/admin/classes`, `POST /v1/admin/users` | admin | Admin tạo lớp, gán TA; student join bằng invite code (FAQ-01) |
| `GET /healthz` | public | Giữ CI/uptime + cron ping Render |

---

## 4. Thiết kế chi tiết theo từng tiêu chí

### 4.1 Criterion 1 — Flow end-to-end (15 điểm) · Tín

**Điều kiện ăn điểm cao:** mọi bước qua UI/API của sản phẩm, **không** seed lab bằng script.

- Trang TA: form tạo lab (title, statement, tests, constraint text + deduction). Constraint có text bắt đầu `Do not use`/`Do not call` → tự nhận là ban list.
  - **Tests phải upload được nhiều file một lần** (`<input type="file" multiple>`, ghép cặp `NN.in`/`NN.out` theo tên). `sort-merge` có 7 cặp test; người chấm tạo lab từ chính các file này qua UI, gõ tay từng test là không khả thi.
  - Constraint: nhập được ≥2 dòng (text + deduction); có thể thêm nút "nhập từ `constraints.json`" cho nhanh, nhưng vẫn là thao tác trên UI.
- Trang Student **trước khi nộp**: hiện đủ statement, danh sách constraint + mức trừ, và thông báo code sẽ được soát bằng luật cứng + model, model chỉ nhận đề + constraint + code đã bỏ comment/tên/MSSV (FAQ-06).
- Trang Student **sau khi nộp**: hiện `queued/judging/judged`, verdict tổng (AC/WA/TLE/…) và verdict từng test; **không** hiện input/output của test (FAQ-02); **không** hiện constraint verdict/evidence trước publish (FAQ-08).
- **3 bài demo dùng 3 sinh viên khác nhau**, vì chỉ bài nộp cuối của mỗi sinh viên được tính và vào queue (FAQ-02).
- Trang TA review: bảng `submission × constraint`, verdict màu, evidence lines (highlight đúng dòng), deduction; chỉ hiện **bài counted** (FAQ-02). Có **2 tab**:
  - **Review queue** (theo FAQ-10): mọi `violation`, mọi `unsure`, và 10% `pass` chọn ngẫu nhiên, làm tròn lên.
  - **Tất cả verdict**: đủ mọi cặp submission × constraint; `pass` không nằm trong mẫu 10% ghi nhãn "không vào mẫu review".
  - Lý do: rubric C1 yêu cầu queue hiện "for each submission and each constraint, the verdict, the evidence lines and the deduction". Nếu chỉ có tab FAQ-10, bài compliant của người chấm rất dễ không xuất hiện (3 bài × 2 constraint chỉ có khoảng 3 `pass` → mẫu 10% chỉ còn 1).
- Cách ly: query luôn kèm `class_id` của TA đang đăng nhập; TA class khác nhận **403** (theo contract PA#2, FAQ-01). Có test.
- **Seed account** (admin/TA/student) được phép, nhưng **lab phải tạo qua UI**. Ghi rõ trong `PA3.md` để người chấm không trừ điểm.

**Bằng chứng:** video 5 phút quay đúng luồng trên deployment + test e2e.

### 4.2 Criterion 2 — Queue và sandbox (20 điểm) · Tùng

**Giá trị mặc định theo FAQ-05:** compile `g++ -std=c++17 -O2` trong 10 s; code ≤ 64 KB; CPU 1 s/test (TA chỉnh 1–5 s); wall = 3× CPU; RAM 256 MB (TA chỉnh 64–512 MB); process 16; output 1 MB/test.

**Chín minimums + attack submission tương ứng (mỗi cái 1 file trong `test/sandbox/attacks/`):**

| # | Minimum | Cách cấu hình | Attack submission | Kỳ vọng |
|---|---|---|---|---|
| 1 | Không network | `docker run --network none` | `connect()` tới `1.1.1.1:80`, DNS lookup | fail, không ra ngoài |
| 2 | CPU time limit | `--cpus`, `ulimit -t 1`, runner đo CPU | vòng lặp vô hạn | bị kill, `TLE` |
| 3 | Wall-clock kill **container** | wall 3 s, `--stop-timeout`, `docker kill` | `sleep 3600` + process con | container chết, không còn process, `TLE` |
| 4 | Memory + swap | `--memory=256m --memory-swap=256m` | cấp phát 1 GiB, **ghi/đọc lại + checksum** để compiler không xoá | OOM kill, `MLE`/`RE` |
| 5 | Process limit | `--pids-limit=16` | fork bomb | bị chặn, `RE`/`WA` |
| 6 | Output size | đọc stdout cap 1 MB/test, kill khi vượt | in hàng trăm MB | bị cắt/kill, `RE` |
| 7 | Non-root | `--user 1000:1000`, image có user riêng | `id -u` | khác 0 |
| 8 | No host mount / no docker socket | không `-v`; `--read-only` + tmpfs; không mount socket | đọc `/var/run/docker.sock`, `mount`, `/etc/hostname` | không thấy |
| 9 | No secrets | không `-e MODEL_API_KEY`; worker giữ key ngoài sandbox | in `env`, grep filesystem tìm key/pattern; **thêm một attack lúc compile**: `#include "/proc/1/environ"` và `#include` đường dẫn file env của worker (vd. `/etc/leetkob/worker.env`) | không có key; compile lỗi vì file không tồn tại/không đọc được |

**Bắt buộc thêm:**

- **Compile trong sandbox** (cùng image, cùng limits, `--network none`).
- **Worker riêng:** test "stop worker → submit → start worker → judged exactly once" (hoặc quay video).
- **CI chạy attack tests trên tag `pa3`.** GitHub Actions runner có Docker → thêm job `sandbox` trong `ci.yml`, trigger cả `tags: ['pa3']`.
- Minimum 9 phải chặn cả **lúc compile**: rubric ghi key không được nằm trong "anything the compiler can `#include`". Vì compile chạy trong sandbox không mount gì, attack `#include` phải compile lỗi.
- **Tách test theo môi trường.** Khi chấm, người chấm chạy các lệnh check trong container: cài dependency xong thì **cắt mạng**, kill sau 15 phút, và **đọc sandbox test từ CI** chứ không chạy (rubric, "What we run when marking", bước 2). Vì vậy:
  - `npm test`: chỉ unit test chạy offline, **không cần Docker, Neon hay mạng**. Test exactly-once của queue dùng Postgres nhúng (`@electric-sql/pglite`) hoặc repo giả, không dùng Neon.
  - `npm run test:sandbox`: 9 attack + compile trong sandbox, cần Docker; chỉ chạy trong job CI `sandbox`.
  - README ghi rõ hai lệnh này.
- **Oracle không chặn việc làm sandbox.** Attack tests chạy được trên Docker ở máy local và trên GitHub Actions; rubric chấm C2 qua CI run của tag. Oracle chỉ cần cho deploy (thứ Ba) và cho "attack của người chấm trên deployment không lọt ra".
- Không dùng `-v /var/run/docker.sock`, `--privileged`, `--env-file`, `-e MODEL_API_KEY` trong lệnh chạy sandbox.

**Bằng chứng:** `test/sandbox/`, job CI `sandbox` trên tag, log từng attack fail đúng cách.

### 4.3 Criterion 3 — Hard rules trước (15 điểm) · Tuệ

**Nhận diện ban list:** constraint text bắt đầu `Do not use` hoặc `Do not call`, mọi tên bị cấm nằm trong backtick. Ví dụ: ``Do not call `std::sort` ``.

**Không được:** `sourceCode.includes('std::sort')` hay regex trên raw text.

**Bài học từ dev set thật:** tên bị cấm không chỉ là hàm. Ban list trong 6 bài có đủ 6 dạng, nên hard rule phải xử lý cả 6:

| Dạng | Ví dụ thật trong dev set | Node AST cần bắt |
|---|---|---|
| Hàm qualified | `std::sort`, `std::ranges::sort`, `boost::integer::gcd` | `qualified_identifier` trong `call_expression` |
| Hàm toàn cục | `qsort`, `bsearch`, `__gcd` | `call_expression` + `identifier` |
| Hàm member | `rbegin`, `rend`, `crbegin`, `crend` | `field_expression` được gọi |
| Type/container | `std::vector`, `std::string`, `std::array` | type specifier / `qualified_identifier` |
| Statement keyword | `for`, `while`, `do`-`while`, `goto` | `for_statement`, `while_statement`, `do_statement`, `goto_statement` |
| Macro / alias | `#define SORT(v) std::sort(all(v))`, `using std::sort;` | `preproc_def` + call site; `using_declaration` |

**Thiết kế:**

1. Parse constraint text: bắt đầu `Do not use` / `Do not call` → ban list; trích mọi tên trong backtick; chuẩn hoá `do`-`while` thành `do`.
2. Parse C++ bằng `tree-sitter-cpp` → AST.
3. Với mỗi tên bị cấm, chọn matcher theo bảng trên; duyệt AST và **resolve scope**:
   - `std::sort(...)` → bắt;
   - `sort(...)` chỉ bắt khi có `using namespace std;` **và** không bị shadow bởi hàm/namespace student khai báo;
   - `sort(...)` không qualify, file **không tự định nghĩa** `sort` → vẫn bắt, kể cả khi không có `using namespace std;`: bài đã AC nghĩa là compiler đã resolve tới `std::sort` (qua ADL với iterator của `std`);
   - `using std::sort;` rồi gọi `sort(...)` → bắt;
   - macro chứa tên cấm → bắt ở dòng `#define` **hoặc** dòng gọi macro (một trong hai là đủ evidence).
4. Bỏ qua theo **node type**, không theo text: comment, string literal, `#include <algorithm>` (include một mình **không** phải violation).
5. Evidence = dòng gốc (line + text) của node vi phạm; nếu một vi phạm trải nhiều dòng, chọn dòng rõ nhất.
6. Nếu không resolve chắc chắn → `unsure`, **không** đoán `violation` (tránh wrongful deduction).
7. Khi hard rule quyết định → `decided_by='hard_rule'`, **không gọi model**; call log thể hiện điều này.

**Test matrix bắt buộc (lấy từ dev set thật + fixture tự thêm):**

| Case | Kỳ vọng | Điểm khó |
|---|---|---|
| `sort-merge/s03` | C1 **pass** | `namespace my { void sort(...) }` + `using namespace std;` + comment nhắc `std::sort`; phải resolve đúng `my::sort` |
| `sort-merge/s02` | C1 **pass** | `<algorithm>` chỉ để dùng `std::min` |
| `sort-merge/s04` | C1 **violation** dòng 11 | `sort(...)` không qualified nhưng có `using namespace std;` |
| `sort-merge/s05` | C1 **violation** dòng 12 | `stable_sort(...)` không qualified |
| `sort-merge/s08` | C1 **violation** dòng 4 hoặc 25 | macro `SORT(v)` chứa `std::sort` |
| `reverse-recursive/*` | C1 violation | `for`/`while`/`goto` là statement, không phải call |
| `dynamic-array/*` | C1 violation | `std::vector`, `std::string` là type |
| `reverse-words/*` | C1 violation | `rbegin`, `rend` là member call |
| `gcd-euclid/*` | C1 violation | `__gcd` là hàm toàn cục |
| Fixture tự thêm | pass | `std::sort` trong comment/string; hàm `resort`; biến tên `sort` |

**Bằng chứng:** `test/hard-rules/` với fixture + test; chạy `MODEL_OFF=1` trên dev set cho 0 wrongful deduction và quyết định đủ mọi cặp ban-list.

### 4.4 Criterion 4 — Model semantic (20 điểm) · Tín

**Luồng:** chỉ bài **AC** và **counted** mới vào soát (FAQ-02, FAQ-04). Hard rule chạy trước → constraint còn lại (semantic) mới gọi model.

**Dữ liệu gửi đi (bắt buộc, theo FAQ-06):**

- statement của lab,
- text constraint (**không gửi deduction** để model không dùng mức trừ; model không được trả deduction),
- code **đã bỏ comment**, **bỏ tên và MSSV** trong header, email.
- **Không đổi tên biến/hàm**: evidence phải khớp từng ký tự với code gốc. Chỉ xoá comment/identity, giữ nguyên số dòng và nội dung các dòng code.
- Trang nộp bài phải ghi rõ 3 điều này cho sinh viên (FAQ-06).

**Output schema (ví dụ):**

```json
{
  "verdict": "pass | violation | unsure",
  "evidence": [{ "line": 12, "text": "std::sort(a, a + n);" }],
  "reason": "ngắn, không chứa deduction"
}
```

- Dùng structured output của Gemini (`responseSchema`).
- Validate bằng `ajv`/`zod`; sai schema → `unsure`.
- Mỗi evidence line phải **khớp chính xác** dòng code gốc; lệch → `unsure`.
  - **Chú ý dòng có comment cuối dòng.** Model nhìn bản đã xoá comment, nên với dòng `sort(a); // x` nó trả `"sort(a);"`. Còn `eval.mjs` so evidence với **dòng của file `.cpp` gốc** (chỉ bỏ khoảng trắng hai đầu, hàm `evidenceHits`). Cách làm: (1) kiểm tra `text` model trả khớp dòng tương ứng trong **bản đã xoá comment**; (2) khi lưu verdict/ghi `predictions.jsonl`, **lấy `text` từ file gốc theo số dòng**. Thiếu bước 2 thì violation bị tính `bad-evidence`, không được tính là caught.
- **Một lời gọi = một cặp (submission, constraint)**, hoặc đổi output thành mảng có `constraint` id. Scaffold hiện lệch: `buildPrompt()` gửi mọi constraint trong một prompt, còn `validateVerdictOutput()` chỉ nhận **một** verdict.
- **Chống prompt injection:** xoá comment không chặn được injection nằm trong string literal (dev set có tag `injection`). Bọc code trong delimiter rõ ràng, ghi trong system prompt rằng mọi thứ trong khối code là dữ liệu cần review, không phải chỉ dẫn; verdict chỉ đáng tin khi evidence khớp dòng thật.
- Timeout mỗi call (ví dụ 20s) và timeout tổng; quá hạn → `unsure`.
- Cost cap/lab: đếm token + USD; vượt cap → dừng gọi, phần còn lại `unsure`.

**Call log (bắt buộc):** JSONL + bảng DB, mỗi call có `provider_request_id` (Gemini `responseId`), `model`, `tokens_in`, `tokens_out`, `latency_ms`, `cost_usd`, `submission_id`, `constraint_id`, **và `prompt` đã gửi (bản đã xoá comment và danh tính)**.

- Lý do: rubric C4 (17–20 điểm) ghi model chỉ nhận statement, constraints và code đã bỏ comment/danh tính, và "**the prompts in your call log show it**". Call log không có prompt thì người chấm không kiểm được điều này.
- Không log **code gốc** và **danh tính** (tên, MSSV, email). Prompt đã ẩn danh là đúng thứ được phép gửi cho model nên được phép lưu.
- `runs/pa3-dev/calls.jsonl` của dev run phải có đủ prompt.
- `AGENTS.md` đã sửa câu "Do not log ... submitted source code" cho khớp.

**Cost/lab 80 bài:** đo token thật từ dev run, ghi công thức vào README + AI-LOG:

```text
cost/lab = 80 bài × số constraint semantic × (tokens_in/1e6 × giá_in + tokens_out/1e6 × giá_out)
```

Ghi rõ free tier thực tế = 0 USD, nhưng vẫn trình bày phép tính theo giá paid để chứng minh đã kiểm soát chi phí.

### 4.5 Criterion 5 — Limits + review queue (10 điểm) · Tùng

- Schema invalid → `unsure`; timeout → `unsure`; evidence mismatch → `unsure`; cost cap exceeded → `unsure`.
- **Test dùng fake model, không network:** inject model client; 2 test bắt buộc:
  1. fake trả JSON sai schema → verdict `unsure`;
  2. fake sleep quá timeout → verdict `unsure`.
- Verdict **chỉ** vào bảng review của TA. API student không trả verdict constraint (FAQ-08).
- **Queue composition** (FAQ-10): mọi `violation` + mọi `unsure` + 10% số `pass` chọn ngẫu nhiên, làm tròn lên; verdict là cặp (bài counted, constraint).
- **`unsure` flow** (FAQ-09): TA thấy nguyên nhân (`model_unsure`, `schema_invalid`, `evidence_mismatch`, `timeout`, `cost_cap`, `hard_rule_unsure`, `compile_error`) và các dòng mô hình nghi ngờ; TA phải chọn `pass`/`violation`, không có mặc định; chọn `violation` thì phải chỉ ≥1 dòng evidence. `unsure` **không bao giờ tự thành deduction**.
- Lab còn `unsure` chưa xử lý → không Publish được (FAQ-09, FAQ-12).
- Nếu có nút Publish: từ chối khi còn verdict `reviewed=false` hoặc chưa hết hạn (FAQ-12). PA#3 không publish mark.
- **Student trước publish** (FAQ-08): chỉ thấy kết quả chấm test; không thấy verdict/evidence/deduction; không thấy unsure, bài bị bác, hay có nằm trong mẫu 10%.
- **Sau publish** (FAQ-08, PA#5): student thấy các khoản trừ kèm constraint, deduction, evidence, lý do.

### 4.6 Criterion 6 — Checker command + eval (10 điểm) · Tuệ

**Một lệnh duy nhất, nhận folder dataset:**

```bash
node bin/check.mjs --dataset leetkob-eval --out runs/pa3-dev/predictions.jsonl
node leetkob-eval/eval.mjs --data leetkob-eval --predictions runs/pa3-dev/predictions.jsonl
```

- `--dataset` là **folder gốc** của dev set (chứa `problems/`, `solutions/`, `labels.jsonl`), không phải từng bài. Checker tự duyệt mọi problem.
- Chỉ cần `statement.md` + `constraints.json` là chạy được; không setting tay từng bài.
- `MODEL_OFF=1` → chỉ hard rule, semantic = `unsure`, **không mở network**.
- Dockerfile riêng:

```bash
docker build -t leetkob-checker .
docker run --network none --memory 1g --pids-limit 256 \
  -v "$PWD/leetkob-eval:/data:ro" -v "$PWD/runs:/out" \
  -e MODEL_OFF=1 leetkob-checker \
  --dataset /data --out /out/predictions.jsonl
```

- Chấm bằng `eval.mjs` gốc; exit code 0 hoặc 1, **không bao giờ 2**.
- **Dev set đã tải và xác minh** tại `PA03/leetkob-eval/` (128 file):
  - 6 problem: `sort-merge`, `binary-search`, `reverse-recursive`, `dynamic-array`, `reverse-words`, `gcd-euclid`
  - 47 solution Accepted, **102 cặp (solution, constraint)**: 65 `pass`, 37 `violation`
  - SHA-256 `eval.mjs` = `c836edd8713521bbbd3c9c8299b5f0893cdbac0efab2209d6ae4397234516aa7` ✅
  - SHA-256 `labels.jsonl` = `262cda7b0ef5612e192cd6197e1df31a4e8af52c8da0ccceeb75f2b1e56ca47f` ✅
  - Manifest đầy đủ 128 file: `PA03/leetkob-eval.sha256` (dùng để verify lại sau khi copy vào repo).
- **Cảnh báo Windows/CRLF (đã gặp):** clone trên Windows tự đổi LF → CRLF làm hash thành `fd2a2c…` / `64db04…`. Phải:
  - copy bản LF (đã làm), và
  - thêm vào `.gitattributes`: `leetkob-eval/** -text` để Git không bao giờ đổi line ending.
  - Kiểm tra lại bằng `Get-FileHash` trước mỗi lần commit.
- **Committed dev run:** `runs/pa3-dev/` gồm `predictions.jsonl`, `eval-report.txt`, `calls.jsonl`, `README.md` (model, token, cost, 3 số đo).
- **Case riêng:** folder `leetkob-eval-extra/` cùng layout, ≥5 case, mỗi case có label + tag, ≥1 `trap`, ≥1 `injection`. Không trộn vào dev set gốc. Có thể lấy cảm hứng từ các trap thật (`sort-merge/s03`, `s02`) và injection thật (`s09`), nhưng **không copy nguyên** và **không sửa** dev set.

### 4.7 Criterion 7 — Tests-first, một phần mỗi commit (5 điểm) · cả nhóm

**Kế hoạch commit/PR (làm thật, không rebuild lịch sử):**

| Thứ tự | Commit/PR | Nội dung | Người |
|---|---|---|---|
| 1 | `test(sandbox): nine attack submissions fail as intended` + `feat(sandbox): hardened docker runner` | 9 attack + runner | Tùng |
| 2 | `test(queue): worker restart judges exactly once` + `feat(queue): postgres claim and lease` | queue | Tùng |
| 3 | `test(hard-rules): ban-list traps` + `feat(hard-rules): tree-sitter cpp` | hard rules | Tuệ |
| 4 | `test(model): bad schema and timeout become unsure` + `feat(model): gemini client, prompt, call log` | model | Tín |
| 5 | `test(checker): MODEL_OFF dev run` + `feat(checker): cli and dockerfile` | checker | Tuệ |
| 6 | `test(flow): TA creates lab, student submits, queue shows verdict` + `feat(web): screens and review queue` | flow | Tín |

Quy tắc:

- Test và code **cùng commit hoặc test trước**.
- Mỗi commit **một phần**, không gộp sandbox + model.
- **Không nới test/label** trong commit làm xanh.
- Không `git rebase`/squash lại toàn bộ cuối bài.

**Đã lệch một lần (ghi thật, không sửa lịch sử):**

- `dc1060c` thêm client Gemini (`src/model/gemini.js`) **không kèm test**; `test/model/smoke.test.js` vẫn là placeholder `assert.ok(true)`. Commit này còn gộp hai phần (client model + `docs/deploy.md`/`scripts/keepalive.mjs`).
- `65d04fe` (scaffold) đặt stub cho mọi phần trong một commit; chấp nhận được vì là khung, nhưng từ đây mỗi PR chỉ một phần.
- Commit model tiếp theo của Tín: **test cho `callGemini` với `fetch` giả**, không gọi mạng (timeout → `TIMEOUT`, response không phải JSON, HTTP lỗi, đọc `usageMetadata`). Kèm sửa nhỏ: đưa API key từ query string `?key=` sang header `x-goog-api-key` để key không lọt vào log URL.
- Ghi rõ hai điểm lệch này trong `AI-LOG.md` và `SELF_ASSESSMENT_REPORT.md`; không claim 5/5 cho C7 nếu không chắc.

### 4.8 Criterion 8 — AI-LOG.md (5 điểm) · cả nhóm, Tùng review

Mỗi entry: ngày, người, tool + model, phần việc, **Changed** (đã sửa gì), **Rejected** (đề xuất gì bị từ chối và vì sao). Ví dụ thật cần ghi:

- assistant viết hard rule bằng regex → bắn vào comment → thay bằng tree-sitter;
- prompt vô tình nhắc `sort-merge/s05` → sửa thành mô tả generic;
- test 1 GiB pass nhưng compiler xoá allocation → thêm đọc lại/checksum;
- assistant đề xuất `-v /var/run/docker.sock` → từ chối.

Thêm **"never list"** vào `AGENTS.md` theo bảng "Catching your assistant" của rubric.

---

## 5. Timeline 4 ngày (21/11 → 25/11)

> Hôm nay là **Thứ Bảy 21/11**. Thời gian rất ngắn: ưu tiên đúng thứ tự, cắt UI.

### Thứ Bảy 21/11 — Gỡ blocker + hạ tầng (Tín chủ trì, cả nhóm)

- [x] **Dev set đã tải** từ <https://github.com/fithcmus/awad-leetkob-eval>, xác minh SHA-256, copy vào `PA03/leetkob-eval/` (giữ LF).
- [ ] Thêm `.gitattributes` với `leetkob-eval/** -text`; kiểm tra hash lại sau khi copy vào repo.
- [x] **Render Web Service** và **Neon Postgres** đã có (Tín).
- [ ] **Oracle Cloud Always Free (worker)** — vẫn cần đăng ký (Tín): VM, Docker, user non-root, chỉ mở SSH; budget cảnh báo 0 USD. **Hạn chót: tối Chủ nhật 22/11.** Không chặn việc ngày 22–23 (sandbox test chạy local + CI), nhưng nếu xác minh thẻ lỗi hoặc hết capacity thì còn thời gian chuyển sang GCP e2-micro trước khi deploy thứ Ba.
- [ ] **Merge `feat/pa3-scaffold` vào `main` qua PR tối nay**, để Tùng và Tuệ tạo nhánh từ `main` ngày 22/11.
- [ ] Render: set `DATABASE_URL` (Neon); **không** set `GEMINI_API_KEY` trên Render.
- [ ] Neon: chạy migration schema (mục 3.3) — Tùng.
- [ ] Tạo cron-job.org ping `https://<render-app>.onrender.com/healthz` mỗi 10 phút.
- [ ] Tạo Gemini API key, bật **spending cap**, chỉ đặt trong env của worker trên Oracle.
- [ ] Chốt schema + route (mục 3.3, 3.4); tạo các nhánh.
- [ ] Thêm "never list" vào `AGENTS.md`; cập nhật `ci.yml` trigger `tags: ['pa2','pa3']`.

**Gate tối nay:** Render trả `/healthz` qua HTTPS; worker kết nối được Neon; `Get-FileHash` của `eval.mjs`/`labels.jsonl` đúng `c836…`/`262c…`. (`docker run hello-world` trên Oracle dời sang gate Chủ nhật.)

### Chủ nhật 22/11 — Sandbox + queue + hard rules (Tùng, Tuệ)

- [ ] Tùng: image sandbox, 9 minimums, 9 attack submission + test; compile trong sandbox.
- [ ] Tùng: queue Postgres + worker claim/lease + test exactly-once.
- [ ] Tuệ: tree-sitter hard rules + toàn bộ fixture trap + test.
- [ ] Tín: khung UI tạo lab/nộp bài; API enqueue.

**Gate:** 9 attack fail đúng; worker restart chỉ 1 bộ verdict; `MODEL_OFF` hard rule cho kết quả đúng trên fixture; **`docker run hello-world` trên Oracle OK** (hoặc đã chuyển sang GCP e2-micro); đã chốt dùng Neon hay Postgres trên Oracle (mục 3.1).

### Thứ Hai 23/11 — Model + limits + UI (Tín, Tùng)

- [ ] Tín: Gemini client, prompt anonymize, schema, timeout, call log, cost cap.
- [ ] Tín: UI review queue + cách ly class (403).
- [ ] Tùng: test schema/timeout với fake model; test student không thấy verdict.
- [ ] Tuệ: bắt đầu checker CLI dùng chung module hard rules.

**Gate:** 3 bài mẫu (compliant/violation/injection) chạy hết pipeline trên máy local; call log có `responseId`.

### Thứ Ba 24/11 — Deploy + checker + bằng chứng (cả nhóm)

- [ ] Deploy web lên Render, worker lên Oracle, DB Neon; chạy lại 3 bài trên URL Render.
- [ ] Tuệ: `bin/check.mjs` + Dockerfile + `MODEL_OFF=1`; chạy dev set thật; commit `runs/pa3-dev/`.
- [ ] Tuệ: ≥5 case riêng (trap + injection).
- [ ] Tín: `PA3.md`, video ≤5 phút, test accounts.
- [ ] Tùng: rà secrets, `gitleaks`, log sandbox, AI-LOG.

**Gate:** người ngoài nhóm (nếu được) đăng nhập bằng account test và đi hết luồng.

### Thứ Tư 25/11 — Freeze + nộp (Tín)

- [ ] **12:00 freeze code.** Chỉ sửa docs/evidence.
- [ ] Chạy đủ `lint`, `format:check`, `typecheck`, `test`; CI xanh trên `main`.
- [ ] Tag `pa3`, push tag; lấy link CI run có job sandbox.
- [ ] `SELF_ASSESSMENT_REPORT.md` (1 dòng/criterion + evidence + "what we did not manage").
- [ ] Zip **có `.git`**, tên `23120372-23120398-23120399_<total>.zip`.
- [ ] **Nộp trước 18:00** (buffer 4 tiếng), từ email `23120372@student.hcmus.edu.vn`.
- [ ] Giữ deployment chạy + bật uptime monitor đến sau khi có điểm PA#4.

---

## 6. Bảng phân công công việc

### 6.1 Theo tiêu chí

> **Lưu ý quan trọng:** PA#3 chấm **một lần cho cả nhóm**, không chia điểm cho từng cá nhân. Vì vậy bảng "điểm" dưới đây chỉ là **khối lượng phụ trách**, không phải điểm riêng của mỗi người. Dù ai phụ trách tiêu chí nào, cả ba vẫn nhận cùng một điểm nhóm.

| Tiêu chí | Điểm | Owner chính | Hỗ trợ | Deliverable | Deadline |
|---|---:|---|---|---|---|
| 1. Flow end-to-end | 15 | **Tín** | Tuệ (test e2e), Tùng (auth/cách ly) | UI TA/Student, review queue, video, test e2e | 24/11 |
| 2. Queue + sandbox | 20 | **Tùng** | Tín (VM, CI), Tuệ (fixture) | 9 attack + runner + worker exactly-once | 22/11 |
| 3. Hard rules | 15 | **Tuệ** | Tùng (CI), Tín (tích hợp) | tree-sitter rules + trap fixtures + test | 22/11 |
| 4. Model semantic | 20 | **Tín** | Tuệ (schema), Tùng (secret/cost) | Gemini client, prompt, call log, cost/lab | 23/11 |
| 5. Limits + review queue | 10 | **Tùng** | Tín (queue UI), Tuệ (fake model) | Test schema/timeout, chặn student thấy verdict | 23/11 |
| 6. Checker + eval | 10 | **Tuệ** | Tín (Docker/CI), Tùng (MODEL_OFF security) | CLI, Dockerfile, dev run, 5 case riêng | 24/11 |
| 7. Tests-first commits | 5 | **Cả nhóm** | Tín audit lịch sử | 6 commit/PR đúng thứ tự | liên tục |
| 8. AI-LOG | 5 | **Cả nhóm** | Tùng review | Entry thật, có Changed/Rejected | 24/11 |
| Hạ tầng/deploy/PA3.md/tag/zip | — | **Tín** | Tùng | Render + Oracle worker + Neon, PA3.md, tag, zip | 25/11 |

**Khối lượng tham khảo:** Tín 35 điểm tiêu chí + hạ tầng; Tùng 30; Tuệ 25. Đây chỉ là cách chia việc theo thế mạnh, **không ảnh hưởng điểm từng người** vì điểm là điểm chung của nhóm.

### 6.2 Theo file/module (tránh conflict)

| Vùng file | Owner | Ghi chú |
|---|---|---|
| `src/app.js`, `src/http/`, `src/web/` (UI) | Tín | Route, render HTML |
| `src/domain/labs.js`, `src/domain/review.js` | Tín | Tạo lab, queue TA |
| `src/model/` (Gemini client, prompt, schema) | Tín | Không để key trong repo |
| `src/queue/`, `worker/` | Tùng | Claim/lease, worker loop |
| `sandbox/` (Dockerfile, runner), `test/sandbox/` | Tùng | 9 attack |
| `src/checker/hard-rules/`, `test/hard-rules/` | Tuệ | tree-sitter |
| `bin/check.mjs`, `Dockerfile.checker`, `runs/` | Tuệ | Checker |
| `leetkob-eval/` | Tuệ | **Không sửa**, chỉ đọc |
| `leetkob-eval-extra/` | Tuệ | Case riêng |
| `db/migrations/`, `src/repo/postgres.js` | Tùng | Schema, index |
| `PA3.md`, `README.md`, `ci.yml` | Tín | Tín merge cuối |
| `AI-LOG.md` | Cả nhóm | Append, không sửa entry người khác |
| `SELF_ASSESSMENT_REPORT.md` | Tín | Cả nhóm review |

### 6.3 Nhịp làm việc

- **Standup 15 phút mỗi tối 21:00** (online): hôm nay xong gì, chặn gì, ai cần gì.
- **Merge qua PR**, không push thẳng `main` (giữ branch protection).
- **Mỗi PR 1 phần**, test đi kèm; review chéo: Tín review Tùng, Tùng review Tuệ, Tuệ review Tín.
- **Cuối ngày:** cập nhật AI-LOG + `PA3_PROGRESS.md` (bảng done/blocked).

---

## 7. Rủi ro và cách xử lý

| Rủi ro | Mức | Ảnh hưởng | Cách xử lý |
|---|---|---|---|
| **Dev set lệch hash do CRLF** | Cao | Mất C6 nếu bị coi là sửa dev set | Đã copy bản LF; thêm `leetkob-eval/** -text`; verify hash trước mỗi commit |
| **Oracle chưa đăng ký / hết capacity** | Cao | Mất C2 (20 điểm) | Đăng ký ngay 21/11; thử region khác hoặc máy AMD 1 GB; dự phòng GCP e2-micro |
| Oracle hết capacity / thu hồi máy idle | TB | Deployment chết | Thử region khác, dùng máy AMD 1 GB; cron ping + tác vụ CPU nhẹ định kỳ để máy không bị coi là idle |
| Chỉ còn 4 ngày | Cao | Không kịp flow | Cắt UI tối giản (server-rendered), không React; không appeals/publish/load test (PA#5) |
| Gemini free tier rate limit | TB | Dev run chậm/lỗi | Batch, retry có backoff, cache theo hash code+constraint, cap cứng |
| Evidence line lệch | TB | Verdict thành unsure hàng loạt | So khớp exact; test với code có CRLF/tab/trailing space |
| Secret lọt vào sandbox/repo | Cao | C2/C4 = 0 | Không `-e`; `gitleaks`; test attack grep key; key chỉ trên worker |
| Exactly-once race | TB | Mất điểm C2 | Unique constraint + transaction + test restart |
| Render free ngủ / hết 750 h | Cao | Người chấm mở link bị chậm hoặc 502 | Cron ping `/healthz` mỗi 10 phút; nếu hết hạn mức thì chuyển web sang Oracle (phương án A) |
| Neon cold start / mất kết nối | TB | Request đầu chậm, worker retry | Retry có backoff; connection pool; timeout rõ ràng |
| **Neon hết 100 CU-hours/tháng** | Cao | DB bị suspend tới tháng sau → deployment chết giữa PA#4 | Worker poll 24/7 giữ DB thức; xem mục 3.1: chạy hết trên Oracle A1, hoặc idle backoff + theo dõi CU-hours |
| **`npm test` cần mạng/Docker/DB** | Cao | Người chấm chạy check với mạng đã cắt → đỏ | `npm test` chỉ offline (pglite/repo giả); sandbox test tách sang `npm run test:sandbox` trong job CI riêng (mục 4.2) |
| Evidence lệch vì comment cuối dòng | TB | Violation thành `bad-evidence`, recall tụt | Lấy `text` từ file gốc theo số dòng (mục 4.4) |
| Render ↔ Oracle lệch mạng | TB | Job kẹt, verdict chậm | Worker poll 1–2 s; health check hai đầu; log `job_id` |
| Tự chấm cao hơn thực tế | TB | Trừ tới −10 | Chấm sát rubric, mỗi dòng có evidence |
| Quên giữ deployment sau 25/11 | Cao | PA#4 red team không đánh được | Bật monitor + nhắc lịch |

---

## 8. Việc cần chốt ngay (blockers)

1. ✅ **Dev set:** đã tải từ <https://github.com/fithcmus/awad-leetkob-eval>, hash đúng, đã copy vào repo làm việc `PA02/leetkob-eval/` + manifest `PA02/leetkob-eval.sha256`.
2. ✅ **Kiến trúc:** chốt **Render free (web) + Azure for Students VM (worker) + Neon Postgres**. Cần đăng ký 3 tài khoản; Azure for Students cần xác minh tài khoản trước khi tạo VM — ai đứng tên và làm trong hôm nay.
3. ✅ **Gemini key:** Tùng tạo, spending cap = 0 USD (chỉ free tier), chỉ đặt trên Oracle worker.
4. **FAQ product owners:** vẫn chưa có câu trả lời — xem giải thích ở mục 8.1.
5. ✅ **Tên repo:** giữ `2026-AWAD-PA02`; làm trực tiếp trên repo này.
6. **Video:** Tín quay 24/11, dài ≤5 phút.
7. ✅ **Domain:** dùng URL `https://<app>.onrender.com` của Render (HTTPS sẵn); Oracle không cần domain vì chỉ gọi ra ngoài.
8. ✅ **Nơi làm việc:** `PA02/` (repo có `.git`); `PA03/` chỉ giữ PDF gốc và bản kế hoạch, không copy cả PA02 sang PA03.

### 8.1 FAQ product owners — đã tìm và trích dẫn entry

FAQ đầy đủ: <https://github.com/tkob-team/LeeTKOB-FAQ/blob/main/FAQ.md>. Các entry liên quan PA#3 và cách áp dụng:

| FAQ | Nội dung | Áp dụng trong PA#3 |
|---|---|---|
| **FAQ-01** | Admin tạo lớp/gán TA; TA tạo lab; student join bằng invite code hoặc TA thêm; mỗi TA chỉ thấy lớp của mình | UI admin + class isolation (403) |
| **FAQ-02** | Trước hạn sinh viên nộp bao nhiêu lần cũng được; bài được tính là **bài nộp cuối**; sinh viên thấy verdict test nhưng **không thấy input/output**; queue chỉ hiện bài counted; hệ thống được yarg sớm từng bài AC | Judge chạy mỗi bài; chỉ bài counted + AC vào queue; UI student không hiện test data |
| **FAQ-04** | Bài không AC = 0 điểm, **không soát ràng buộc**; TA có thể nhập điểm tay 0–10 kèm lý do + log | Pipeline chỉ chạy hard rule/model với bài AC |
| **FAQ-05** | Defaults sandbox: compile `g++ -std=c++17 -O2` 10 s; code ≤ 64 KB; CPU 1 s (1–5); wall 3×; RAM 256 MB (64–512); process 16; output 1 MB | Cấu hình sandbox và judge |
| **FAQ-06** | Sinh viên thấy constraint + deduction từ lúc mở lab; trang nộp ghi rõ code sẽ được soát bằng luật cứng + model; model chỉ nhận đề + constraint + code đã bỏ comment/tên/MSSV; **model không quyết điểm** | UI notice; prompt anonymize; không gửi deduction |
| **FAQ-07** | Trước mở lab: sửa tự do. Sau mở: không thêm constraint, không tăng deduction; chỉ sửa chữ không đổi nghĩa, giảm deduction, hoặc xoá; sửa thì soát lại | Lock constraint sau mở lab; lưu lịch sử |
| **FAQ-08** | **Trước publish**: sinh viên **không** thấy kết quả soát; chỉ thấy kết quả chấm test. **Sau publish**: thấy các khoản trừ kèm constraint, deduction, evidence, lý do. Không bao giờ thấy verdict `unsure`, bài bị bác, mẫu 10% | UI/API student ẩn verdict trước publish |
| **FAQ-09** | TA thấy `unsure` kèm nguyên nhân (model trả unsure / schema sai / evidence mismatch / timeout / vượt cost cap) + các dòng nghi ngờ. TA phải chọn `pass`/`violation`, không mặc định; `violation` phải có evidence; lab còn `unsure` thì không Publish | `unsure_reason` trong DB; UI review |
| **FAQ-10** | Queue = mọi `violation` + mọi `unsure` + 10% số `pass` chọn ngẫu nhiên làm tròn lên. TA vẫn override bất kỳ verdict nào trước publish; log | Queue composition; override + audit |
| **FAQ-11** | Điểm = `max(0, 10 - tổng deduction)`; mỗi constraint trừ một lần dù vi phạm nhiều chỗ | Tính điểm cho TA |
| **FAQ-12** | Publish cả lab một lần, chỉ khi hết hạn và queue không còn mục chưa quyết; Publish idempotent; không unpublish; sau publish sửa từng bài kèm lý do | Publish gating (PA#3 nếu có) |

**Trích dẫn trong `PA3.md`:** cite các entry trên (ví dụ "Student chỉ thấy kết quả chấm test trước publish — FAQ-08; TA thấy nguyên nhân `unsure` — FAQ-09; queue gồm violation + unsure + 10% pass — FAQ-10").

---

## 9. Definition of Done + checklist nộp bài

### 9.1 Theo tiêu chí

- [ ] **C1:** TA tạo lab qua UI; 3 sinh viên nộp 3 bài (compliant/violation/injection) lên `judged`; student thấy constraint + deduction (FAQ-06) nhưng không thấy verdict (FAQ-08); queue đủ verdict/evidence/deduction; TA class khác nhận 403; video có.
- [ ] **C2:** 9/9 attack test trong repo + chạy CI trên tag; compile trong sandbox; worker riêng; exactly-once có test/video; giá trị theo FAQ-05.
- [ ] **C3:** tree-sitter; trap thật (`s02`, `s03`) + fixture không bắn; bắt đủ 6 dạng ban list; model không gọi khi hard rule quyết; `MODEL_OFF` 0 wrongful deduction.
- [ ] **C4:** Gemini thật; prompt không comment/identity/deduction; schema + evidence exact; call log có request id/token/time/cost; cost/lab có phép tính.
- [ ] **C5:** schema sai/timeout/evidence mismatch → unsure; unsure_reason lưu đúng; TA phải chọn pass/violation, violation cần evidence; queue = violation + unsure + 10% pass (FAQ-09, FAQ-10); student không thấy verdict; publish (nếu có) từ chối khi còn unsure chưa xử lý (FAQ-12).
- [ ] **C6:** 1 lệnh; Dockerfile; `MODEL_OFF=1`; dev set byte-for-byte (hash `c836…`/`262c…`); `runs/pa3-dev/` committed; ≥5 case riêng có trap + injection; eval exit 0/1.
- [ ] **C7:** 6 commit/PR đúng thứ tự, test đi kèm, không nới test.
- [ ] **C8:** AI-LOG có Changed/Rejected thật; "never list" trong `AGENTS.md`.
- [ ] **FAQ compliance:** cite FAQ-06, FAQ-08, FAQ-09, FAQ-10, FAQ-12 trong `PA3.md`/README; UI/API khớp các entry.

### 9.2 Checklist nộp

- [ ] Repo **public**, không secret trong lịch sử (`gitleaks` sạch).
- [ ] `leetkob-eval/` hash đúng `c836…`/`262c…`; `.gitattributes` có `leetkob-eval/** -text`.
- [ ] Tag `pa3` đã push; CI run trên tag xanh, **có job sandbox**.
- [ ] `PA3.md` đủ 6 mục bắt buộc; tài khoản test hoạt động.
- [ ] `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md` ở root.
- [ ] `runs/pa3-dev/` có predictions + eval report + calls.
- [ ] Video ≤5 phút, link trong `PA3.md`.
- [ ] Zip có `.git`, tên `23120372-23120398-23120399_<total>.zip`.
- [ ] Nộp từ `23120372@student.hcmus.edu.vn` **trước 18:00 25/11**.
- [ ] Deployment + monitor chạy tiếp đến sau PA#4.

---

## 10. Tự chấm dự kiến (để canh mục tiêu)

| Tiêu chí | Mục tiêu | Ghi chú |
|---|---:|---|
| 1. Flow | 13–15 | Cần quay video dự phòng |
| 2. Queue + sandbox | 17–20 | 9/9 + CI + exactly-once |
| 3. Hard rules | 13–15 | tree-sitter + đủ trap |
| 4. Model | 17–20 | Call log + cost/lab đầy đủ |
| 5. Limits | 9–10 | 2 test fake model |
| 6. Checker + eval | 9–10 | Dev set nguyên bản + Dockerfile |
| 7. Tests-first | 5 | Làm thật ngay từ đầu |
| 8. AI-LOG | 5 | Entry cụ thể |
| **Tổng mục tiêu** | **88–100** | Chấm thận trọng: **khoảng 90** |

> Chênh lệch tự chấm − điểm thật trong ±10 là bình thường. Đừng claim điểm khi chưa có evidence.
