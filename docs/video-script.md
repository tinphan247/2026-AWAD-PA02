# Video PA#3 — kịch bản ≤ 5 phút

Mục tiêu: người chấm thấy **toàn bộ luồng chạy trên deployment thật**, không
phải slide. Quay màn hình 1920×1080, chữ trong form phóng to (Ctrl +), không
cắt ghép qua chỗ có lỗi.

## Chuẩn bị trước khi quay

1. Deployment Render đã thức (`curl https://<app>.onrender.com/healthz`).
2. Worker Azure đang chạy (`systemctl is-active leetkob-worker`), Neon có lab
   trống.
3. Ba tab trình duyệt đăng nhập sẵn: `ta1-token`, `sv1-token`, `sv2-token`,
   cộng tab `sv3-token` cho bài injection (mỗi sinh viên một bài, FAQ-02).
4. Ba file nộp nằm trong [`demo/`](../demo/README.md), bản sao nguyên văn của
   dev set:
   - `compliant.cpp`: tự viết merge sort, không dùng `std::sort`.
   - `violation.cpp`: gọi `std::sort`.
   - `injection.cpp`: insertion sort đội lốt merge sort + comment lừa model
     trả `pass`.
5. Mở sẵn `leetkob-eval/problems/sort-merge/` để lấy đề, `constraints.json` và
   thư mục `tests/` (`01.in`…`07.out`).

## 0:00–0:40 — Kiến trúc

- Chỉ vào sơ đồ trong `PA3.md` mục 1: Render (web) → Neon (DB) → Azure VM
  (worker + Docker sandbox) → Gemini.
- Nói rõ: key Gemini **chỉ** trên VM worker; sandbox `--network none`.

## 0:40–1:40 — TA tạo lab

- `ta1-token` → **Tạo lab mới**.
- Nhập tiêu đề, đề bài (dán `statement.md` của `sort-merge`).
- Nhập 2 constraint, đúng `constraints.json` của dev set (trừ 3 và 4):
  - ``Do not call a library sort function: `std::sort`, `std::stable_sort`,
    `std::partial_sort`, `std::ranges::sort`, `std::ranges::stable_sort`,
    `qsort`. | 3``
  - `Sort with a merge sort you wrote yourself: split the range, sort both
    halves, merge them (top-down or bottom-up). Any other algorithm (bubble,
    insertion, selection, heap sort, counting sort, inserting into an ordered
    container) does not satisfy this constraint, whatever the function is
    called. | 4`
- Chọn **nhiều file** `01.in`, `01.out`, `02.in`, `02.out` cùng lúc → **Tạo lab**.
- Nói: lab được tạo qua UI, không seed bằng script.

## 1:40–2:40 — Ba sinh viên nộp bài

- Tab `sv1-token`: mở lab → chỉ vào **constraint + mức trừ** và thông báo
  model chỉ nhận code đã bỏ comment/tên/MSSV (FAQ-06).
- Nộp `compliant.cpp` → trang trạng thái `queued` → `judging` → `judged`.
  Chỉ vào kết quả test; nói rõ không thấy input/output (FAQ-02) và không thấy
  verdict constraint (FAQ-08).
- Tab `sv2-token`: nộp `violation.cpp`.
- Tab `sv3-token`: nộp `injection.cpp`.

## 2:40–4:00 — TA review

- `ta1-token` → **Review**.
- Tab **Review queue (FAQ-10)**: thấy violation + unsure + mẫu 10% pass.
- Mở một dòng violation: chỉ vào **evidence đúng dòng**, **mức trừ**, verdict
  màu.
- Mở một dòng `unsure`: chỉ vào lý do (timeout/schema/evidence mismatch) và
  nói TA phải quyết định, không tự trừ (FAQ-09).
- Bấm `pass`/`violation`; thử lưu `violation` không có evidence → hiện lỗi 400.
- Tab **Tất cả verdict**: chỉ vào dòng `pass` ngoài mẫu 10%.
- Nói: queue = violation + unsure + 10% pass.

## 4:00–4:40 — Cách ly và bảo mật

- Tab `ta2-token` mở URL review của lớp 1 → **403**.
- Chỉ vào call log/`PA3.md` mục 8: request id, token, latency, cost; prompt đã
  ẩn danh, không có MSSV.

## 4:40–5:00 — Kết

- Nói: `npm test` offline 293 test (0 fail, 12 skip); checker `MODEL_OFF=1`
  không mở mạng; tag `pa3` có job sandbox.
- Chỉ vào `PA3.md` để người chấm biết tài khoản test và lệnh checker.

## Sau khi quay

- Upload YouTube **unlisted** hoặc Google Drive (quyền "anyone with the link").
- Dán link vào `PA3.md` mục 6.
- Kiểm tra lại video không lộ token thật, không lộ key, không lộ source của
  sinh viên khác.
