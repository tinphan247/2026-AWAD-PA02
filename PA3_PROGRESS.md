# PA#3 — bảng tiến độ

Cập nhật: **24/11/2026**. Mỗi người sửa đúng dòng của mình; không đánh dấu xong
khi chưa có test/commit.

## Nhánh và merge

| Nhánh | Nội dung | Trạng thái |
|---|---|---|
| `feat/pa3-scaffold` | scaffold, model, UI flow, worker pipeline, `PA3.md` | đã merge `main` vào nhánh (`554d7bf`); **cần PR → `main`** |
| `tung/sandbox` | 9 attack, `src/sandbox/run.js`, CI job `sandbox` | **đã merge** (PR #15) |
| `tung/queue-exactly-once` | schema 9 bảng, claim/lease, test exactly-once | **đã merge** |
| `tue/hard-rules`, `tue/checker` | tree-sitter, trap fixtures, checker | **đã merge** (PR #16, #17) |

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
| Runbook Oracle + script cài + systemd unit | xong | `docs/oracle-vm.md`, `deploy/oracle-setup.sh` |
| Merge `main` vào nhánh, resolve 2 conflict | xong | `554d7bf`, `npm test` 270 test |
| **Tích hợp worker** (sandbox → hard rules → model) | xong | `src/judge/pipeline.js`, `worker/index.js`, `test/judge/pipeline.test.js` |
| **Oracle VM** | **chờ bấm** | AD-1 hết capacity A1/Micro; runbook sẵn |
| Env Render/Neon + cron ping | chờ VM | `docs/deploy.md`, `scripts/keepalive.mjs` |
| Gọi Gemini thật | **blocked** | chờ key của Tùng |
| Cầu web ↔ Postgres (submission → job) | **chưa ai làm** | web đang in-memory, `enqueueJob` không có caller |
| Video, tag `pa3`, zip | chưa | hạn 25/11 |

## Tùng (C2, C5, schema, secrets)

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| 9 attack + runner hardened + CI `sandbox` | xong, đã merge | `sandbox/`, `test/sandbox/`, PR #15 |
| Schema 9 bảng + `model_calls` | xong, đã merge | `db/migrations/001_init.sql` |
| Claim/lease + exactly-once | xong, đã merge | `src/queue/claim.js`, `test/queue/exactly-once.test.js` |
| Gemini key (spending cap 0) | **chưa** | giao Tín đặt env VM |
| Limits test (schema/timeout → unsure) | chưa | C5 |
| Publish gating FAQ-12 | chưa | C5 |
| gitleaks lần cuối | chưa | trước tag |

## Tuệ (C3, C6)

| Việc | Trạng thái |
|---|---|
| `web-tree-sitter` (WASM) + grammar C++ | xong, đã merge (PR #16) |
| `decideBanList` 6 dạng + scope trap | xong, đã merge |
| Fixture `s02`, `s03` + trap không bẩn | xong, đã merge |
| Checker CLI dùng chung hard-rules | xong, đã merge (PR #17) |
| `Dockerfile.checker`, `runs/pa3-dev-model-off/` | xong, đã merge |
| `runs/pa3-dev/` với model bật | **chờ key** |

## Blockers

| Blocker | Ai gỡ | Ảnh hưởng |
|---|---|---|
| Oracle Cloud VM | Tín | deploy worker + sandbox trên deployment |
| Gemini key | Tùng → Tín | chưa có call thật (C4), chưa có `runs/pa3-dev/` |
| Cầu web ↔ Postgres | Tùng/Tín | web không tạo job nên worker không chấm bài trên deployment |
| PR `feat/pa3-scaffold` | Tín mở, Tùng/Tuệ approve | `main` chưa có PA#3 |

## Mốc thời gian

- **24/11:** merge `main` vào nhánh (xong) + tích hợp worker (xong); Neon + Render
  + VM.
- **25/11:** 3 bài demo, `runs/pa3-dev/`; freeze 12:00 → tag `pa3` → zip → nộp
  trước **18:00**.
