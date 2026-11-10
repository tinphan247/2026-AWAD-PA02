# PA#2 — TIẾN ĐỘ CÔNG VIỆC

**Cập nhật:** 08/11/2026  
**Repo:** https://github.com/tinphan247/2026-AWAD-PA02  
**Branch:** `main`  
**Commit scaffold:** `8c5cad5` — toolchain, health skeleton và CI  
**Merge gần nhất:** `c677c0a` — PR #1 (rules + security baseline)  
**CI run đầu tiên:** [run #1 — success](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42266378686)

---

## 0. Cập nhật cuối — 10/11/2026

Các mục ở dưới được giữ làm lịch sử; bảng này là trạng thái thực tế.

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Toolchain + 4 lệnh | `DONE` | `main` xanh qua run #23 |
| Rules + permissions + `.env.example` | `DONE` | PR #1 merged `c677c0a` |
| Branch protection + evidence | `DONE` | PR #2 merged; ruleset `26715397` |
| Contract endpoint | `DONE` | PR #3 merged `b59e804` |
| Endpoint implementation | `DONE` | PR #4 merged `59e058e` |
| Success/error contract tests | `DONE` | PR #4, 69 case |
| Idempotency tests | `DONE` | PR #5 + PR #7 merged |
| Auth/ownership tests | `IN REVIEW` | PR #8, CI run #25 xanh, Tuệ approved |
| Deliberate contract break | `IN REVIEW` | PR #6, đỏ ở `5fbc56e` (run #20), xanh ở `9924b2d` (run #26) |
| `PA2.md` + self-assessment | `IN REVIEW` | nhánh `docs/pa2-release` |
| Secret scan trên commit cuối | `NEXT` | chạy lại sau khi merge PR #6/#8 |
| Tag `pa2` + CI run cho tag | `NEXT` | sau khi `main` cuối cùng ổn định |
| Zip + nộp bài | `NEXT` | `23120372-23120398-23120399_95.zip` |

**Còn chặn:** cần Tín approve/merge PR #8 và PR #6, sau đó merge PR tài liệu.

---

**Ký hiệu trạng thái:**

- `DONE` — đã xong, có bằng chứng trong repo
- `NEXT` — có thể làm ngay, chưa bắt đầu
- `BLOCKED` — đang chờ việc của người khác
- `TODO` — làm sau, chưa đến thời điểm

---

## 1. Tình trạng tổng quan

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Repo public | `DONE` | Đã kiểm tra HTTP 200 |
| Tài liệu phân công + giải pháp | `DONE` | Commit `2d43857` |
| Toolchain 4 lệnh | `DONE` | `package.json`, ESLint, Prettier, TypeScript/JSDoc, `node:test` |
| Skeleton HTTP | `DONE` | `GET /health`; chưa implement endpoint contract |
| CI workflow | `DONE` | `.github/workflows/ci.yml`, trigger PR/main/tag `pa2` |
| CI run đầu tiên trên `main` | `DONE` | [run #1 — success](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42266378686) |
| 4 lệnh local xanh | `DONE` | lint, format:check, typecheck, test đều pass |
| Fresh-clone verification | `DONE` | Clone sạch + `npm ci` + 4 lệnh xanh trên Node 24.22.2 và Node 25.1.0 |
| Branch protection | `DONE` | Ruleset `protect-main` active: PR + 1 approval + check `ci` + up-to-date, no bypass; verify qua API |
| Rules file / permissions | `DONE` | PR #1 đã merge vào `main` (`c677c0a`); `AGENTS.md` + 3 adapter + 3 tầng quyền |
| `.env.example` + secret scan | `DONE` | PR #1 — đủ biến (`PORT`, `HOST`, `MODEL_*`, `DATABASE_PATH`), Gitleaks sạch |
| AI-LOG | `DONE` | PR #1 — 3 entry: Tùng ×2, Tín scaffold |
| Spending cap PA#3 | `PENDING` | README ghi cap **USD 0**; chờ account owner xác nhận provider-side trước lần gọi PA#3 đầu tiên |
| Contract doc | `NEXT` | Tuệ phụ trách, là critical path |
| Endpoint implementation | `BLOCKED` | Chờ contract freeze |
| Contract tests đầy đủ | `BLOCKED` | Chờ contract + implementation |
| Deliberate contract break | `TODO` | Sau khi full suite xanh |
| Tag `pa2` + zip + nộp | `TODO` | Sau khi đủ evidence |

**Đã xác nhận:**

- MSSV: Tín `23120372`, Tuệ `23120398`, Tùng `23120399`
- Endpoint: `POST /v1/labs/{labId}/submissions`
- Stack: Node.js 24 LTS (CI), JavaScript + JSDoc + `tsc --noEmit`, ESLint, Prettier, `node:test`
- Nhiều công cụ AI: `AGENTS.md` là nguồn duy nhất, các file khác là adapter

---

## 2. Task của Tín — 23120372 — Gate & Release Lead

### 2.1. Đã hoàn thành

| Task | Trạng thái | Bằng chứng |
|---|---|---|
| T1. Khởi tạo toolchain + 4 lệnh | `DONE` | `package.json`, `package-lock.json`, `eslint.config.js`, `.prettierrc.json`, `tsconfig.json`, `.nvmrc` |
| T1. Skeleton HTTP tối thiểu | `DONE` | `src/app.js`, `src/server.js`, `src/main.js`, `test/unit/smoke.test.js` |
| T1. README skeleton | `DONE` | `README.md` — 4 lệnh, Node 24, scope, secrets |
| T2. CI workflow | `DONE` | `.github/workflows/ci.yml` — PR/main/tag `pa2`, job `ci` |
| Push scaffold + CI run đầu tiên | `DONE` | [run #1 — success](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42266378686) |
| Kiểm tra local 4 lệnh | `DONE` | `npm run lint`, `format:check`, `typecheck`, `test` đều pass ngày 07/11 |
| Fresh-clone verification | `DONE` | Clone sạch + `npm ci` + 4 lệnh xanh trên Node 24.22.2 và Node 25.1.0 |
| Commit scaffold | `DONE` | `8c5cad5` |
| Review + approve PR #1 | `DONE` | Approved và merged, `c677c0a` |

### 2.2. Việc tiếp theo của Tín

| Task | Trạng thái | Điều kiện / ghi chú |
|---|---|---|
| Bật branch protection cho `main` | `DONE` | Ruleset `protect-main` active — [rules/26715397](https://github.com/tinphan247/2026-AWAD-PA02/rules/26715397) |
| Chụp ảnh protection | `DONE` | `docs/evidence/branch-protection-1.png`, `-2.png`; API: `docs/evidence/branch-protection-api.json` |
| PR #2 — bằng chứng protection + tracker | `IN REVIEW` | `docs/branch-protection-evidence`, đã sync với `main`; chờ `ci` xanh + approval |
| Tạo PR đỏ → xanh đầu tiên | `NEXT` | Cố ý để lint/test đỏ, chụp merge bị chặn, sửa xanh, merge |
| T3. Implement endpoint submissions | `BLOCKED` | Chờ Tuệ freeze contract |
| T4. Idempotency contract tests | `BLOCKED` | Chờ contract + implementation |
| T5. PA2.md + tag + zip + nộp | `TODO` | Chờ đủ evidence cuối |
| T6. Review rules/contract | `TODO` | Khi Tùng/Tuệ có bản nháp |

**Lưu ý:** local dùng Node `v25.1.0`, CI pin Node 24 LTS qua `.nvmrc`. Fresh clone đã được verify trên Node `24.22.2` và `25.1.0`. Docker Desktop chưa chạy nên chưa có Docker verification; không bắt buộc vì CI đã chạy Node 24.

---

## 3. Task của Tùng — 23120399 — Rules, Security & AI-LOG Lead

| Task | Trạng thái | Điều kiện / ghi chú |
|---|---|---|
| T1. `AGENTS.md` canonical | `DONE` | PR #1 merged — 4 phần + 3 tầng quyền |
| T1. Adapter `CLAUDE.md` | `DONE` | PR #1 — `@AGENTS.md` |
| T1. Adapter `.cursor/rules/000-project.mdc` | `DONE` | PR #1 — `alwaysApply: true`, trỏ `AGENTS.md` |
| T1. Adapter `.github/copilot-instructions.md` | `DONE` | PR #1 — pointer ngắn tới `AGENTS.md` |
| T1. 2 dòng “never” có truy vết | `DONE` | PR #1 — link tới AI-LOG anchor + commit `8c5cad5` |
| T2. Permissions 3 tầng | `DONE` | PR #1 — Allowed / Ask first / Never |
| T3. `.env.example` | `DONE` | PR #1 — `PORT`, `HOST`, `MODEL_*`, `DATABASE_PATH`, không giá trị |
| T3. Secret scan full history | `DONE` | PR #1 — Gitleaks 8.30.1, `docs/evidence/secret-scan.txt`; chạy lại trên commit nộp cuối |
| T3. Spending cap + README | `PENDING` | README ghi cap **USD 0** (billing trả phí chỉ bật khi cả nhóm đồng ý); chờ account owner xác nhận provider-side + ảnh bằng chứng trước lần gọi PA#3 đầu tiên |
| T4. Khởi tạo `AI-LOG.md` | `DONE` | PR #1 — 3 entry: Tùng ×2, Tín scaffold (OpenCode / DeepSeek V4.1 Flash Free) |
| T5. Auth/ownership contract tests | `BLOCKED` | Chờ contract freeze |
| T6. Review contract/CI | `TODO` | Sau khi có bản nháp |

**PR #1:** `docs: add assistant rules and security baseline` — branch `tung/rules-security`, merged tại `c677c0a` (5 commit, `ci` success, 1 approval).

**Việc còn lại của Tùng:** xác nhận provider-side spending cap trước PA#3; review contract; viết auth/ownership contract tests sau khi contract freeze.

---

## 4. Task của Tuệ — 23120398 — Contract & Contract Tests Lead

| Task | Trạng thái | Điều kiện / ghi chú |
|---|---|---|
| T1. Contract doc `docs/contract/post-labs-labId-submissions.md` | `NEXT` | **Critical path** — làm ngay, freeze trước khi Tín implement |
| T1. Error table RFC 9457 | `NEXT` | 12 error type: invalid-json, validation, idempotency-key-missing, unauthorized, forbidden, not-found, method-not-allowed, payload-too-large, unsupported-media-type, idempotency-key-in-flight, idempotency-key-reused, internal |
| T1. Auth + ownership + check order | `NEXT` | Role student; enrolled trong class của lab; route → auth → role → content-type → key → size → JSON → lab → enrollment → idempotency → validation |
| T1. Idempotency semantics | `NEXT` | Scope `(studentId, key)`, canonical JSON, replay/reused/in-flight, chỉ lưu 201, TTL ≥ 24h |
| T1. Change policy + examples | `NEXT` | Additive trong `/v1`; breaking → `/v2` + Sunset |
| T2. Shared test helper | `BLOCKED` | Chờ contract freeze |
| T2. Success/validation/error tests | `BLOCKED` | Chờ contract + implementation |
| T3. Deliberate contract break | `TODO` | Sau full suite xanh; chỉ sửa code, không sửa test/contract |
| T4. Review idempotency tests + rules | `TODO` | Khi Tín/Tùng có bản nháp |

**Ưu tiên:** viết contract v1 ngay; đây là việc đang chặn Tín và Tùng.

---

## 5. Critical path hiện tại

```text
Tuệ: contract v1 freeze
        ↓
Tín: implement endpoint submissions
        ↓
Tùng + Tuệ + Tín: contract tests (auth/ownership, success/errors, idempotency)
        ↓
Full suite xanh
        ↓
Tuệ: deliberate contract break → CI đỏ → fix xanh
        ↓
Tín: PA2.md + tag pa2 + zip + nộp
```

**Trong lúc chờ contract:**

- Tùng làm rules/permissions/secrets/AI-LOG.
- Tín bật branch protection, tạo PR đỏ→xanh đầu tiên, fresh-clone verification.

---

## 6. Bằng chứng đã có / còn thiếu

### Đã có

- [x] Repo public
- [x] Commit tài liệu `2d43857`
- [x] Commit scaffold `8c5cad5`
- [x] 4 lệnh local xanh (log ngày 07/11)
- [x] CI workflow trong repo
- [x] CI run đầu tiên trên `main` — success
- [x] Fresh-clone verification trên Node 24.22.2 và 25.1.0
- [x] Smoke test `GET /health`
- [x] Ảnh cấu hình ruleset đã lưu: `docs/evidence/branch-protection-1.png`, `docs/evidence/branch-protection-2.png` (trạng thái **trước khi bấm Create**)
- [x] Branch protection **đã lưu và active**: ruleset `protect-main` (`id 26715397`) — bằng chứng API trong `docs/evidence/branch-protection-api.json`
- [x] Direct push bị chặn — `docs/evidence/push-blocked.txt` (trên nhánh `docs/branch-protection-evidence`)
- [x] PR #1 đã merge vào `main` (`c677c0a`) — rules, permissions, `.env.example`, secret scan, AI-LOG
- [x] Never list có 2 dòng truy vết AI-LOG + commit `8c5cad5`
- [x] AI-LOG có entry scaffold của Tín (OpenCode / DeepSeek V4.1 Flash Free)
- [x] README ghi spending cap **USD 0**

### Còn thiếu

- [ ] Merge PR #2 (`docs/branch-protection-evidence`) — cần `ci` xanh + 1 approval
- [ ] PR bị check đỏ chặn merge (deliberate red run)
- [ ] Commit/PR làm xanh
- [ ] Spending cap PA#3: account owner xác nhận provider-side + ảnh bằng chứng
- [ ] `docs/contract/post-labs-labId-submissions.md`
- [ ] Contract tests đầy đủ
- [ ] Deliberate contract break PR
- [ ] `PA2.md` đủ link
- [ ] Tag `pa2` + CI run cho tag
- [ ] `SELF_ASSESSMENT_REPORT.md`
- [ ] Zip incl `.git` đúng tên

---

## 7. Việc nên làm trong 24 giờ tới

| Ưu tiên | Việc | Người | Kết quả |
|---:|---|---|---|
| 1 | Merge PR #2 (sau `ci` xanh + approval) | Tín / Tùng / Tuệ | Bằng chứng protection + tracker vào `main` |
| 2 | Contract v1 | Tuệ | `docs/contract/post-labs-labId-submissions.md` |
| 3 | PR đỏ → xanh đầu tiên | Tín | Evidence tiêu chí #4: chụp màn hình merge bị chặn khi `ci` đỏ, link run đỏ + commit xanh |
| 4 | Xác nhận spending cap provider-side | Tùng | Ảnh/ghi chú vào `docs/evidence/`, cập nhật README nếu cần |
| 5 | Implement endpoint + contract tests | Tín / Tuệ / Tùng | Sau khi contract freeze |

---

## 8. Ghi chú

- Không ai được sửa test/contract để làm CI xanh.
- Không push thẳng `main` **sau khi** branch protection bật.
- Mọi entry AI-LOG phải ghi tool/model và commit/PR; không viết hồi tố.
- PA2 dùng in-memory repo; DB thật để PA3. Ghi rõ giới hạn này trong README/AI-LOG.
