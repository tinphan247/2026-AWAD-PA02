# PA#3 — LeeTKOB

Nhóm: Phan Trung Tín (23120372), Nguyễn Sơn Tùng (23120399), Minh Tuệ (23120398).

Repo: <https://github.com/tinphan247/2026-AWAD-PA02>

> Mọi mục dưới đây có bằng chứng trong repo hoặc trên deployment; chỗ chưa có
> bằng chứng thì ghi rõ là chưa có.

## 1. Kiến trúc và deployment

| Thành phần | Dịch vụ | Trạng thái |
|---|---|---|
| Web/API | Render Web Service (free) | <https://two026-awad-pa02.onrender.com/> |
| Worker + sandbox | Azure for Students VM `leetkob-worker` (Ubuntu 24.04, Japan East) | chạy, service systemd |
| Postgres | Neon (free, Singapore) | chạy; connection string chỉ ở biến môi trường, không trong repo |
| Model | Google Gemini free tier. Dev run: `gemini-3.1-flash-lite`. Worker trên deployment cũng dùng `gemini-3.1-flash-lite`, `MODEL_TIMEOUT_MS=30000` | key chỉ trên VM |

- Health check: `GET /healthz` → `{"status":"ok"}`. Render dùng path này.
- Render free ngủ sau 15 phút không có request: timer systemd trên worker VM
  gọi `/healthz` mỗi 10 phút ([`deploy/leetkob-keepalive.timer`](deploy/leetkob-keepalive.timer)).
  `/healthz` không đụng Postgres nên Neon vẫn scale to zero được.
- `GEMINI_API_KEY` chỉ đặt trên worker VM; **không** đặt trên Render và
  **không** truyền vào sandbox.
- Worker: `worker/index.js` → `src/judge/pipeline.js` chạy sandbox → hard rules
  (ban list, không gọi model) → model (mỗi constraint một call), rồi ghi
  `verdicts` và `model_calls`. Không có key thì semantic thành `unsure`.
- Hướng dẫn từng bước: [`docs/deploy.md`](docs/deploy.md).
- Runbook VM hiện tại (Azure: tạo VM, NSG, SSH, systemd):
  [`docs/azure-vm.md`](docs/azure-vm.md); script cài: `deploy/oracle-setup.sh`
  (không phụ thuộc provider). Runbook Oracle Always Free (phương án dự phòng,
  A1 hết capacity nên chưa dùng được): [`docs/oracle-vm.md`](docs/oracle-vm.md).

## 2. Tài khoản test

Mật khẩu/token là token đăng nhập của UI (`/login`). Lab được tạo **qua UI**,
không seed bằng script; chỉ tài khoản là seed.

| Vai trò | Tên | Lớp | Token |
|---|---|---|---|
| Admin | Quản trị viên | — | `admin-token` |
| TA | Trợ giảng lớp 1 | 1 | `ta1-token` |
| TA | Trợ giảng lớp 2 | 2 | `ta2-token` |
| Student | Phan Trung Tín | 1 | `sv1-token` |
| Student | Sinh viên 2 | 1 | `sv2-token` |
| Student | Sinh viên 3 | 1 | `sv3-token` |

Ba sinh viên lớp 1 dùng cho ba bài demo (compliant / violation / injection),
vì chỉ bài nộp cuối của mỗi sinh viên được tính (FAQ-02).

## 3. CI và tag

- PR đã merge: [#14 queue](https://github.com/tinphan247/2026-AWAD-PA02/pull/14),
  [#15 sandbox](https://github.com/tinphan247/2026-AWAD-PA02/pull/15),
  [#16 hard rules](https://github.com/tinphan247/2026-AWAD-PA02/pull/16),
  [#17 checker](https://github.com/tinphan247/2026-AWAD-PA02/pull/17),
  [#18 scaffold, model, UI, worker](https://github.com/tinphan247/2026-AWAD-PA02/pull/18),
  [#19 bỏ qua model khi lỗi biên dịch](https://github.com/tinphan247/2026-AWAD-PA02/pull/19),
  [#20 nối model vào checker](https://github.com/tinphan247/2026-AWAD-PA02/pull/20),
  [#21 file demo](https://github.com/tinphan247/2026-AWAD-PA02/pull/21),
  [#22 pacing/retry 429](https://github.com/tinphan247/2026-AWAD-PA02/pull/22),
  [#23 dev run](https://github.com/tinphan247/2026-AWAD-PA02/pull/23),
  [#24 tài liệu PA#3](https://github.com/tinphan247/2026-AWAD-PA02/pull/24).
- Tag `pa3`: [CI run #46001759926](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/46001759926)
  (xanh cả `ci` và `sandbox` với 9 attack).
- `npm test`: unit test offline, không cần Docker/Neon/mạng.
- `npm run test:sandbox`: 9 attack + compile trong Docker (Tùng).

## 4. Checker

```bash
# Dựng image
docker build -f Dockerfile.checker -t leetkob-checker .

# Chạy dev set, model tắt, không mạng
docker run --network none --memory 1g --pids-limit 256 \
  -v "$PWD/leetkob-eval:/data:ro" -v "$PWD/runs:/out" \
  -e MODEL_OFF=1 leetkob-checker --dataset /data --out /out/predictions.jsonl

# Chấm
node leetkob-eval/eval.mjs --data leetkob-eval \
  --predictions runs/pa3-dev/predictions.jsonl
```

Chạy với model thật (dev run): đặt `MODEL_NAME`, key (`GEMINI_API_KEY`) và
tuỳ chọn `MODEL_MIN_INTERVAL_MS`, `MODEL_MAX_RETRIES`, `MODEL_RETRY_DELAY_MS`
(PR #22) trong môi trường, rồi `node bin/check.mjs --dataset leetkob-eval --out
runs/pa3-dev/predictions.jsonl`. Key không nằm trong repo.

- `MODEL_OFF=1` không mở kết nối mạng; mọi constraint semantic thành `unsure`.
- `eval.mjs` trả `0` (đạt) hoặc `1` (không đạt), **không bao giờ** `2`.
- Dev set giữ nguyên byte-for-byte; hash trong `leetkob-eval.sha256`
  (`eval.mjs` `c836…`, `labels.jsonl` `262c…`).

## 5. Dev run

Thư mục [`runs/pa3-dev/`](runs/pa3-dev/) (PR #23): `predictions.jsonl`,
`decisions.jsonl`, `calls.jsonl` (36 lời gọi, có request id của nhà cung cấp và
prompt đã gửi), `eval-report.txt`, `summary.json`, [`README.md`](runs/pa3-dev/README.md).

Model `gemini-3.1-flash-lite`, free tier, checker ở commit `b23e078`. Kết quả
**FAIL**, báo đúng như thật (PA#3 chưa có điểm chuẩn):

| Chỉ số | Kết quả | Ngưỡng PA#4 |
|---|---|---|
| Phạt oan | 3 | 0 |
| Recall | 64,9% (24/37) | ≥ 90% |
| Unsure | 17,6% (18/102) | ≤ 20% |

Ba lần phạt oan là do model, không phải luật cứng: 55 cặp ban-list do luật cứng
quyết, không gọi model. 47 cặp semantic được gửi cho model nhưng chỉ 36 có
trả lời được ghi log; 11 cặp còn lại nhiều khả năng là lời gọi lỗi/timeout
(suy ra từ số đếm, log không ghi lý do từng cặp).

## 6. Video

**TODO** link video ≤5 phút: TA tạo lab → 3 sinh viên nộp 3 bài → worker chấm →
TA review queue (verdict/evidence/deduction) → student chỉ thấy kết quả test,
không thấy verdict constraint trước publish.

Kịch bản chi tiết theo từng phút: [`docs/video-script.md`](docs/video-script.md).

## 7. Tuân thủ FAQ

| FAQ | Cách làm |
|---|---|
| FAQ-02 | Chỉ bài nộp cuối của mỗi sinh viên được tính; UI ghi rõ; 3 bài demo dùng 3 sinh viên. |
| FAQ-06 | Student thấy constraint + mức trừ trước khi nộp; model chỉ nhận đề + một constraint + code đã bỏ comment/tên/MSSV (`src/model/prompt.js`). |
| FAQ-08 | Student không thấy verdict constraint trước khi TA công bố; trang bài nộp ghi "chưa được công bố". |
| FAQ-09 | `unsure` cần TA quyết định, không tự trừ; TA chọn `pass`/`violation`; `violation` bắt buộc có evidence. |
| FAQ-10 | Review queue = mọi `violation` + mọi `unsure` + `ceil(10%)` của `pass` (`src/domain/review.js`). Tab "Tất cả verdict" phục vụ rubric C1. |
| FAQ-12 | Nút publish (khi có) phải từ chối nếu còn `unsure` chưa xử lý. |

## 8. Chi phí model

- Giá list (USD / 1 triệu token): vào `0.30`, ra `2.50` cho `gemini-2.5-flash`.
- Công thức: `cost = tokensIn/1e6 * 0.30 + tokensOut/1e6 * 2.50`
  (`src/model/cost.js`).
- Free tier: hoá đơn thực tế 0 USD; call log vẫn ghi giá list để so sánh.
- Call log (`src/model/calllog.js`): một dòng JSON mỗi lần gọi, gồm
  `requestId`, token vào/ra, latency, cost và **prompt đã ẩn danh**; không có
  tên, MSSV, email hay source gốc.
- Pipeline (`src/model/judge.js`): ẩn danh → 1 constraint/lần → schema →
  kiểm tra từng dòng evidence trên bản đã ẩn danh → lấy `text` từ **dòng gốc**
  (để `eval.mjs` khớp). Timeout, schema sai, evidence lệch, cost cap đều thành
  `unsure` kèm lý do; model không bao giờ đặt mức trừ.

**Dự toán cho 80 bài** (giả định mỗi call ~1.200 token vào + 150 token ra,
2 constraint semantic/bài):

| Số bài | Constraint/bài | Số call | Token vào | Token ra | Giá list |
|---:|---:|---:|---:|---:|---:|
| 80 | 2 | 160 | 192.000 | 24.000 | **$0,1176** |
| 80 | 3 | 240 | 288.000 | 36.000 | **$0,1764** |

Free tier: hoá đơn thực tế **$0**; bảng trên là giá list để so sánh và để
phát hiện bất thường (ví dụ một prompt phình to).

**Số đo thực tế của dev run** (`runs/pa3-dev/calls.jsonl`): 36 lời gọi, 23.581
token vào, 4.129 token ra, `costUsd` tổng **$0,0174** (≈ $0,000483 một lời
gọi). `gemini-3.1-flash-lite` chưa có trong `src/model/cost.js` nên cost dùng
giá dự phòng của `gemini-2.5-flash`: con số này cao hơn giá thật của model
lite. Key free tier nên hoá đơn thực tế là $0.

Một lab 80 bài, mỗi bài một constraint semantic như dev set (47 cặp semantic
cho 47 bài): `80 × 0,000483 ≈ $0,039`; hai constraint mỗi bài vẫn dưới $0,08.
Hai bảng dự toán ở trên (giả định 1.200 token vào) là mức trần thận trọng hơn.

**Lab demo trên deployment (lab #2, 4 bài nộp, worker `gemini-3.1-flash-lite`)**:
3 call model, 2.079 token vào, 408 token ra, giá niêm yết ước tính $0,001643
(dùng bảng giá 2.5-flash nên cao hơn thực tế; free tier tính $0). Bài vi phạm
và bài injection ra `violation` kèm evidence đúng dòng; bài đúng ra `pass` ở cả
hai constraint (C1 do luật cứng, C2 do model). Lần chạy đầu với giới hạn 20 s
bị `unsure: timeout` vì model lite mất khoảng 17 s mỗi call; nâng
`MODEL_TIMEOUT_MS` lên 30000 rồi nộp lại (bài #5) thì ra `pass`.

## 9. Chạy thử local

```bash
npm ci
npm run dev        # http://127.0.0.1:3000
```

Đăng nhập bằng token ở mục 2. Luồng demo:

1. `ta1-token` → **Tạo lab mới** → nhập đề, constraint, chọn nhiều file
   `NN.in`/`NN.out` → **Tạo lab**.
2. `sv1-token`, `sv2-token`, `sv3-token` → mở lab → nộp 3 bài khác nhau.
3. `ta1-token` → **Review** → tab queue/all → xem verdict, evidence, mức trừ →
   quyết định `pass`/`violation` (violation cần evidence).
4. `ta2-token` mở lab của lớp 1 → **403**.
5. Student mở lại bài nộp → chỉ thấy trạng thái + kết quả test, không thấy
   verdict constraint trước publish.

`npm test` chạy offline, không cần Docker/Neon/mạng.
