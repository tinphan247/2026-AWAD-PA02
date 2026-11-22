# PA#3 — bảng tiến độ

Cập nhật: **22/11/2026**. Mỗi người sửa đúng dòng của mình; không đánh dấu xong
khi chưa có test/commit.

## Nhánh và merge

| Nhánh | Nội dung | Trạng thái |
|---|---|---|
| `feat/pa3-scaffold` | scaffold, model, UI flow, `PA3.md` | đã push; **cần PR → `main`** |
| `tung/sandbox` | 9 attack, `src/sandbox/run.js`, CI job `sandbox` | đã push; **chờ merge** |
| `tung/queue-exactly-once` | schema 9 bảng, claim/lease, test exactly-once | đã push; **chờ merge** |
| `feat/hard-rules-checker` (Tuệ) | tree-sitter, trap fixtures, checker | **chưa có** |

Thứ tự merge đề nghị: `tung/queue-exactly-once` → `tung/sandbox` →
`feat/pa3-scaffold` → nhánh Tuệ. Mỗi PR cần 1 approval + `ci` xanh.

## Tín (C1, C4, hạ tầng, release)

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| `anonymizeCode` + prompt 1 constraint | xong | `src/model/prompt.js`, `test/unit/model-anonymize.test.js` |
| Gemini client, schema, timeout | xong | `src/model/gemini.js`, `schema.js` |
| Judge pipeline + evidence → dòng gốc + cost cap | xong | `src/model/judge.js`, `test/unit/model-judge.test.js` |
| Cost/lab + call log | xong | `src/model/cost.js`, `calllog.js`, `PA3.md` §8 |
| UI TA tạo lab (upload nhiều file) | xong | `src/web/routes.js`, `test/web/flow.test.js` |
| UI student nộp + ẩn verdict (FAQ-08) | xong | `src/web/routes.js` |
| Review queue FAQ-10 + tab tất cả verdict | xong | `src/domain/review.js` |
| Cách ly lớp 403 | xong | `test/web/flow.test.js` |
| `PA3.md`, README, kịch bản video | xong | `PA3.md`, `README.md`, `docs/video-script.md` |
| **Oracle VM** | **blocked** | chưa đăng ký; cần thẻ xác minh |
| Env Render/Neon + cron ping | chờ Oracle | `docs/deploy.md`, `scripts/keepalive.mjs` |
| Gọi Gemini thật | **blocked** | chờ key của Tùng |
| Tích hợp worker | chờ Tùng merge | `src/model/judge.js` là điểm gọi |
| Video, tag `pa3`, zip | chưa | hạn 25/11 |

## Tùng (C2, C5, schema, secrets)

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| 9 attack + runner hardened + CI `sandbox` | xong trên nhánh | `tung/sandbox` |
| Schema 9 bảng + `model_calls` | xong trên nhánh | `tung/queue-exactly-once` |
| Claim/lease + exactly-once | xong trên nhánh | `tung/queue-exactly-once` |
| Merge 2 nhánh | **chưa** | cần PR + approval |
| Gemini key (spending cap 0) | **chưa** | giao Tín đặt env Oracle |
| Limits test (schema/timeout → unsure) | chưa | C5 |
| Publish gating FAQ-12 | chưa | C5 |
| gitleaks lần cuối | chưa | trước tag |

## Tuệ (C3, C6)

| Việc | Trạng thái |
|---|---|
| `web-tree-sitter` (WASM) + grammar C++ | **chưa** |
| `decideBanList` 6 dạng + scope trap | **chưa** |
| Fixture `s02`, `s03` + trap không bền | **chưa** |
| Checker CLI dùng chung hard-rules | **chưa** |
| `Dockerfile.checker`, `runs/pa3-dev/` | **chưa** |
| ≥5 case riêng (≥1 trap, ≥1 injection) | **chưa** |

## Blockers

| Blocker | Ai gỡ | Ảnh hưởng |
|---|---|---|
| Oracle Cloud VM | Tín | deploy worker + sandbox (C2 trên deployment) |
| Gemini key | Tùng → Tín | chưa có call thật (C4) |
| Merge schema Postgres | Tùng | UI còn in-memory, restart mất lab |
| Merge sandbox | Tùng | chưa có job CI trên tag |
| Hard rules + checker | Tuệ | C3/C6 = 0 |
| PR `feat/pa3-scaffold` | Tín mở, Tùng/Tuệ approve | `main` chưa có PA#3 |

## Mốc thời gian

- **22/11 tối:** Oracle VM + key; Tùng merge schema/sandbox.
- **23/11:** tích hợp worker gọi `judgeConstraint`; Tuệ có hard rules.
- **24/11:** deploy đủ 3 thành phần; chạy 3 bài demo; `runs/pa3-dev/`.
- **25/11:** freeze 12:00 → tag `pa3` → zip → nộp trước **18:00**.
