# PA#2 — TIẾN ĐỘ CÔNG VIỆC

**Cập nhật:** 07/11/2026  
**Repo:** https://github.com/tinphan247/2026-AWAD-PA02  
**Branch:** `main`  
**Commit scaffold:** `8c5cad5` — toolchain, health skeleton và CI  
**CI run đầu tiên:** [run #1 — success](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42266378686)

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
| Rules file / permissions | `NEXT` | Tùng phụ trách |
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

### 2.2. Việc tiếp theo của Tín

| Task | Trạng thái | Điều kiện / ghi chú |
|---|---|---|
| Bật branch protection cho `main` | `DONE` | Ruleset `protect-main` active — [rules/26715397](https://github.com/tinphan247/2026-AWAD-PA02/rules/26715397) |
| Chụp ảnh protection | `DONE` | `docs/evidence/branch-protection-1.png`, `-2.png`; API: `docs/evidence/branch-protection-api.json` |
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
| T1. `AGENTS.md` canonical | `NEXT` | Có thể làm ngay; đủ 4 phần stack/commands/conventions/never + 3 tầng permissions |
| T1. Adapter `CLAUDE.md` | `NEXT` | `@AGENTS.md` |
| T1. Adapter `.cursor/rules/000-project.mdc` | `NEXT` | `alwaysApply: true`, trỏ `AGENTS.md` |
| T1. Adapter `.github/copilot-instructions.md` | `NEXT` | Pointer ngắn tới `AGENTS.md` |
| T1. 2 dòng “never” có truy vết | `BLOCKED` | Cần sự cố thật hoặc gate self-test có commit/AI-LOG |
| T2. Permissions 3 tầng | `NEXT` | Có thể làm ngay trong `AGENTS.md` hoặc `docs/permissions.md` |
| T3. `.env.example` | `NEXT` | Hiện app đọc `PORT`, `HOST`; thêm `MODEL_*` reserved cho PA3 |
| T3. Secret scan full history | `NEXT` | Chạy `gitleaks`/`trufflehog`, lưu report |
| T3. Spending cap + README | `NEXT` | Chốt provider/model PA3, cap cụ thể; PA2 cost = 0 |
| T4. Khởi tạo `AI-LOG.md` | `NEXT` | Nhận entry setup/scaffold từ Tín; ghi tool/model |
| T5. Auth/ownership contract tests | `BLOCKED` | Chờ contract freeze |
| T6. Review contract/CI | `TODO` | Sau khi có bản nháp |

**Ưu tiên:** T1 + T2 + T3 có thể làm song song ngay hôm nay; T4 nhận entry từ Tín.

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

### Còn thiếu

- [ ] PR bị check đỏ chặn merge
- [ ] Commit/PR làm xanh
- [ ] `AGENTS.md` + 3 adapter
- [ ] `.env.example` + secret scan report
- [ ] `docs/contract/post-labs-labId-submissions.md`
- [ ] Contract tests đầy đủ
- [ ] Deliberate contract break PR
- [ ] `PA2.md` đủ link
- [ ] `AI-LOG.md` với ≥ 2 sự cố thật
- [ ] Tag `pa2` + CI run cho tag
- [ ] `SELF_ASSESSMENT_REPORT.md`
- [ ] Zip incl `.git` đúng tên

---

## 7. Việc nên làm trong 24 giờ tới

| Ưu tiên | Việc | Người | Kết quả |
|---:|---|---|---|
| 1 | ~~Bật branch protection + screenshot~~ (xong) | Tín | `docs/evidence/branch-protection-*.png` + API JSON |
| 2 | Contract v1 | Tuệ | `docs/contract/post-labs-labId-submissions.md` |
| 3 | `AGENTS.md` + adapters + permissions | Tùng | Rules file đủ 4 phần + 3 tầng |
| 4 | `.env.example` + AI-LOG khởi tạo | Tùng | Secrets baseline |
| 5 | PR đỏ → xanh đầu tiên | Tín | Evidence tiêu chí #4 |

---

## 8. Ghi chú

- Không ai được sửa test/contract để làm CI xanh.
- Không push thẳng `main` **sau khi** branch protection bật.
- Mọi entry AI-LOG phải ghi tool/model và commit/PR; không viết hồi tố.
- PA2 dùng in-memory repo; DB thật để PA3. Ghi rõ giới hạn này trong README/AI-LOG.
