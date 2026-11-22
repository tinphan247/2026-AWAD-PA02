# PA#3 — LeeTKOB

Nhóm: Phan Trung Tín (23120372), Nguyễn Sơn Tùng (23120399), Minh Tuệ (23120398).

Repo: <https://github.com/tinphan247/2026-AWAD-PA02>

> Đây là bản nháp của `PA3.md`. Các mục ghi **TODO** cần điền sau khi deploy và
> sau khi Tùng/Tuệ merge phần của họ. Không đánh dấu xong khi chưa có bằng chứng.

## 1. Kiến trúc và deployment

| Thành phần | Dịch vụ | Trạng thái |
|---|---|---|
| Web/API | Render Web Service (free) | đã có tài khoản, **TODO URL** |
| Worker + sandbox | Oracle Cloud Always Free VM | **TODO** (đăng ký + VM) |
| Postgres | Neon (free) | đã có project, **TODO connection string** |
| Model | Google Gemini free tier (`gemini-2.5-flash`) | **TODO** key (Tùng) |

- Health check: `GET /healthz` → `{"status":"ok"}`. Render dùng path này.
- Cron-job.org gọi `/healthz` mỗi 10 phút để Render free không ngủ.
- `GEMINI_API_KEY` chỉ đặt trên worker Oracle; **không** đặt trên Render và
  **không** truyền vào sandbox.
- Hướng dẫn từng bước: [`docs/deploy.md`](docs/deploy.md).

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

- PR: **TODO** link PR đã merge.
- Tag `pa3`: **TODO** link CI run trên tag, gồm job `sandbox` (9 attack).
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

- `MODEL_OFF=1` không mở kết nối mạng; mọi constraint semantic thành `unsure`.
- `eval.mjs` trả `0` (đạt) hoặc `1` (không đạt), **không bao giờ** `2`.
- Dev set giữ nguyên byte-for-byte; hash trong `leetkob-eval.sha256`
  (`eval.mjs` `c836…`, `labels.jsonl` `262c…`).

## 5. Dev run

**TODO** (Tuệ): `runs/pa3-dev/` gồm `predictions.jsonl`, báo cáo `eval.mjs`,
và call log.

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

- **TODO**: điền số call/token/cost thực tế của lab demo sau khi chạy worker.

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
