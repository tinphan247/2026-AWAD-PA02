# Káº¾ HOáº CH TRIá»‚N KHAI PA#3 â€” LeeTKOB

**MÃ´n:** CSC13114 â€” Advanced Web Application Development
**Checkpoint:** PA#3 â€” Prototype with the LLM feature running
**Háº¡n ná»™p:** 22:00, Thá»© TÆ° 25/11/2026 (khÃ´ng nháº­n sau 24h)
**HÃ¬nh thá»©c:** bÃ i nhÃ³m 3 ngÆ°á»i Â· 100 Ä‘iá»ƒm Â· 7% Ä‘iá»ƒm mÃ´n
**NhÃ³m:** Phan Trung TÃ­n (23120372) Â· Nguyá»…n SÆ¡n TÃ¹ng (23120399) Â· Minh Tuá»‡ (23120398)
**Repo PA#2 hiá»‡n táº¡i:** <https://github.com/tinphan247/2026-AWAD-PA02> (nhÃ¡nh `main`, tag `pa2`)

---

## 0. Tráº£ lá»i nhanh cÃ¢u há»i "Ä‘á» cÃ³ báº¯t buá»™c dÃ¹ng láº¡i repo PA#2 khÃ´ng?"

**KhÃ´ng báº¯t buá»™c.** Äá» chá»‰ rÃ ng buá»™c:

- "same teams as PA#2" (cÃ¹ng nhÃ³m),
- "Tag the commit you are submitting `pa3` and push the tag. The repository stays public",
- criterion 1 nháº¯c "the status your PA#2 contract names" (dÃ¹ng láº¡i ngá»¯ nghÄ©a 403/404 cá»§a contract cÅ©),
- brief: "From PA#2 on, every team builds LeeTKOB".

**Khuyáº¿n nghá»‹: dÃ¹ng láº¡i repo PA#2.** LÃ½ do:

1. Giá»¯ Ä‘Æ°á»£c lá»‹ch sá»­ commit tháº­t cho criterion 7 (tests-first, má»™t pháº§n má»—i commit). Rubric nÃ³i rÃµ: "A history split or rebuilt after the work was finished does not count" â€” lÃ m tiáº¿p trÃªn repo cÅ© lÃ  cÃ¡ch an toÃ n nháº¥t.
2. Giá»¯ tag `pa2`, branch protection, CI, contract, `AGENTS.md`, `AI-LOG.md` â€” nhá»¯ng thá»© Ä‘Ã£ Ä‘Æ°á»£c cháº¥m vÃ  Ä‘ang lÃ  ná»n cá»§a PA#3.
3. KhÃ´ng pháº£i dá»±ng láº¡i GitHub Actions, ruleset, secret scanning.

Viá»‡c cáº§n lÃ m: Ä‘á»•i tÃªn repo (tuá»³ chá»n) thÃ nh `2026-AWAD-LeetKOB` â€” GitHub tá»± redirect URL cÅ©; hoáº·c giá»¯ nguyÃªn tÃªn Ä‘á»ƒ khÃ´ng gÃ£y link evidence trong `PA2.md`.

---

## 1. TÃ³m táº¯t yÃªu cáº§u vÃ  cÃ¡ch cháº¥m

### 1.1 Sáº£n pháº©m pháº£i cháº¡y Ä‘Æ°á»£c (criterion 1)

TrÃªn **deployment cÃ´ng khai**, dÃ¹ng tÃ i khoáº£n trong `PA3.md`:

1. TA táº¡o lab trong class cá»§a mÃ¬nh **báº±ng chÃ­nh giao diá»‡n sáº£n pháº©m** (khÃ´ng dÃ¹ng script/DB edit): statement, tests, 2 constraint kÃ¨m deduction, láº¥y tá»« bÃ i `sort-merge` cá»§a dev set.
2. Student ná»™p 3 bÃ i: 1 compliant, 1 violation, 1 injection. **DÃ¹ng 3 sinh viÃªn khÃ¡c nhau**, vÃ¬ FAQ-02 quy Ä‘á»‹nh chá»‰ bÃ i ná»™p cuá»‘i cá»§a má»—i sinh viÃªn Ä‘Æ°á»£c tÃ­nh vÃ  vÃ o hÃ ng chá».
3. Má»—i bÃ i Ä‘i `queued â†’ judged`, student tháº¥y verdict test (AC/WA/TLE/â€¦) vÃ  verdict tá»«ng test, **khÃ´ng tháº¥y input/output** (FAQ-02).
4. TA má»Ÿ review queue: má»—i submission Ã— má»—i constraint hiá»‡n verdict, evidence lines, deduction TA Ä‘Ã£ Ä‘áº·t.
5. TA cá»§a class khÃ¡c **khÃ´ng** tháº¥y lab/queue (dÃ¹ng status 403 theo contract PA#2).
6. Student tháº¥y **danh sÃ¡ch constraint + má»©c trá»«** ngay tá»« lÃºc má»Ÿ lab (FAQ-06), nhÆ°ng **khÃ´ng tháº¥y verdict/evidence trÆ°á»›c khi publish** (FAQ-08).

### 1.2 TÃ¡m tiÃªu chÃ­ vÃ  Ä‘iá»ƒm

| # | TiÃªu chÃ­ | Äiá»ƒm | Chá»‘t ká»¹ thuáº­t |
|---|---|---:|---|
| 1 | Flow end-to-end trÃªn deployment | 15 | TA táº¡o lab qua UI; 3 bÃ i ná»™p; queue hiá»ƒn thá»‹ Ä‘á»§; cÃ¡ch ly class |
| 2 | Queue vÃ  sandbox | 20 | 9 minimums, má»—i cÃ¡i 1 attack submission cháº¡y CI; compile trong sandbox; worker riÃªng; judged exactly once |
| 3 | Hard rules cháº¡y trÆ°á»›c | 15 | Syntax-aware (AST), khÃ´ng text search; trap khÃ´ng báº¯n; model khÃ´ng Ä‘Æ°á»£c gá»i cho constraint Ä‘Ã£ cÃ³ hard rule |
| 4 | Model xá»­ lÃ½ semantic constraints | 20 | Gá»i model tháº­t; chá»‰ gá»­i statement + constraints + code Ä‘Ã£ bá» comment/identity; pass/violation/unsure + evidence; call log cÃ³ request id, token, thá»i gian, cost; tÃ­nh cost/lab 80 bÃ i |
| 5 | Limits Ä‘áº§u tiÃªn + review queue | 10 | Schema check + timeout â†’ unsure, cÃ³ test fake model khÃ´ng network; verdict chá»‰ vÃ o queue TA; khÃ´ng publish mark |
| 6 | Checker command + eval Ä‘áº§u tiÃªn | 10 | 1 lá»‡nh nháº­n dataset folder â†’ predictions.jsonl; Dockerfile; `MODEL_OFF=1`; committed dev run; â‰¥5 case riÃªng (â‰¥1 trap, â‰¥1 injection) |
| 7 | Tests-first, má»™t pháº§n má»—i commit | 5 | Test + code cÃ¹ng commit/PR, má»—i commit má»™t pháº§n; khÃ´ng ná»›i test |
| 8 | AI-LOG.md | 5 | Tool nÃ o dÃ¹ng cho pháº§n nÃ o; Changed/Rejected cá»¥ thá»ƒ, tháº­t |

### 1.3 Luáº­t "syllabus" â€” Ä‘iá»u kiá»‡n sá»‘ng cÃ²n

Náº¿u model verdict **Ä‘á»•i Ä‘iá»ƒm** hoáº·c **Ä‘áº¿n tay student nhÆ° má»™t deduction** mÃ  khÃ´ng cÃ³ TA á»Ÿ giá»¯a, hoáº·c model output **khÃ´ng schema check / khÃ´ng timeout** â†’ **criterion 4, 5, 6 = 0**. VÃ¬ váº­y trong PA#3:

- **KhÃ´ng cÃ³ Publish tháº­t.** Náº¿u cÃ³ nÃºt Publish, nÃ³ pháº£i tá»« chá»‘i khi cÃ²n verdict chÆ°a review (FAQ-12).
- Student chá»‰ tháº¥y káº¿t quáº£ **judge** (compile/test), **khÃ´ng tháº¥y** constraint verdict/evidence/deduction (FAQ-08).
- Student **Ä‘Æ°á»£c tháº¥y** danh sÃ¡ch constraint + má»©c trá»« tá»« lÃºc má»Ÿ lab, vÃ  thÃ´ng bÃ¡o code sáº½ Ä‘Æ°á»£c soÃ¡t báº±ng luáº­t cá»©ng + model (FAQ-06).
- Queue TA gá»“m: **má»i `violation` + má»i `unsure` + 10% sá»‘ `pass`** chá»n ngáº«u nhiÃªn, lÃ m trÃ²n lÃªn (FAQ-10).
- `unsure` **khÃ´ng bao giá» tá»± thÃ nh deduction**; TA pháº£i chá»n `pass` hoáº·c `violation`, vÃ  náº¿u `violation` pháº£i chá»‰ Ã­t nháº¥t má»™t dÃ²ng evidence (FAQ-09).
- Lab cÃ²n `unsure` chÆ°a xá»­ lÃ½ thÃ¬ **khÃ´ng Publish Ä‘Æ°á»£c** (FAQ-09, FAQ-12).

### 1.4 Deliverables báº¯t buá»™c

| File/hÃ nh Ä‘á»™ng | Ná»™i dung |
|---|---|
| `PA3.md` (root) | URL deployment; tÃ i khoáº£n test (1 admin, 2 TA khÃ¡c class, **3 student class TA1** â€” 2 theo yÃªu cáº§u + 1 thÃªm Ä‘á»ƒ demo 3 bÃ i theo FAQ-02); link CI run cá»§a tag; checker command + Docker build + `MODEL_OFF=1`; folder dev run Ä‘Ã£ commit (predictions + eval report); link video â‰¤5 phÃºt |
| `AI-LOG.md` | Tool, pháº§n viá»‡c, Changed/Rejected tháº­t |
| `SELF_ASSESSMENT_REPORT.md` | 1 dÃ²ng/criterion, Ä‘iá»ƒm tá»± cháº¥m, evidence (file/commit/PR/CI); má»¥c "what we did not manage" |
| Tag `pa3` | Push tag, repo public, CI cháº¡y trÃªn tag cÃ³ sandbox tests |
| Zip | `<ID1>-<ID2>-<ID3>_<total>.zip`, **cÃ³ `.git`**, thá»© tá»± MSSV tÄƒng dáº§n |
| Deployment | Giá»¯ cháº¡y Ä‘áº¿n khi cÃ³ Ä‘iá»ƒm PA#4 (red team sáº½ táº¥n cÃ´ng) |

---

## 2. Hiá»‡n tráº¡ng PA#2 vÃ  khoáº£ng trá»‘ng

### ÄÃ£ cÃ³ (tÃ¡i sá»­ dá»¥ng)

- Node.js 24, ESM + JSDoc + TypeScript check, ESLint, Prettier, `node:test`.
- `src/app.js`, `src/server.js`, `src/auth.js`, `src/repo/memory.js`.
- Endpoint `POST /v1/labs/{labId}/submissions` vá»›i 12 bÆ°á»›c kiá»ƒm tra, idempotency, RFC 9457 problem details.
- Contract test Ä‘áº§y Ä‘á»§, CI GitHub Actions, branch protection, secret scan, `AGENTS.md`.
- Ngá»¯ nghÄ©a lá»—i: student class khÃ¡c â†’ **403 forbidden**; lab khÃ´ng tá»“n táº¡i â†’ **404 not-found**.

### ChÆ°a cÃ³ (pháº£i lÃ m má»›i trong PA#3)

| Khoáº£ng trá»‘ng | Ghi chÃº |
|---|---|
| Database tháº­t | `repo/memory.js` máº¥t dá»¯ liá»‡u khi restart â†’ khÃ´ng thá»ƒ "judged exactly once". Cáº§n Postgres/SQLite bá»n vá»¯ng. |
| HÃ ng Ä‘á»£i + worker riÃªng | Pháº£i tÃ¡ch process/container, cÃ³ claim/lease, chá»‘ng xá»­ lÃ½ trÃ¹ng. |
| Sandbox | Docker, 9 minimums, compile trong sandbox. |
| Hard rules | ChÆ°a cÃ³ parser C++; pháº£i syntax-aware. |
| Model call | ChÆ°a cÃ³ provider, prompt, schema, call log. |
| Review queue UI | ChÆ°a cÃ³ mÃ n hÃ¬nh TA. |
| Lab/constraint API + UI | ChÆ°a cÃ³. |
| Checker CLI + Dockerfile | ChÆ°a cÃ³. |
| Dev set | **ChÆ°a cÃ³ trong mÃ¡y** â€” blocker. |
| Deployment | ChÆ°a cÃ³. |

---

## 3. Quyáº¿t Ä‘á»‹nh kiáº¿n trÃºc

### 3.1 Cáº£nh bÃ¡o quan trá»ng: PaaS thuáº§n khÃ´ng cháº¡y Ä‘Æ°á»£c sandbox

Báº¡n chá»n **PaaS cÃ³ Docker (Render/Railway/Fly.io)**. Cáº§n phÃ¢n biá»‡t:

- PaaS **build image tá»« Dockerfile cá»§a báº¡n** â‰  cho phÃ©p báº¡n **cháº¡y container con**.
- Render/Railway **khÃ´ng** cáº¥p `docker.sock`, khÃ´ng `--privileged`, khÃ´ng Docker-in-Docker. VÃ¬ váº­y **khÃ´ng thá»ƒ** chá»©ng minh:
  - minimum 3: wall-clock kill **container**, khÃ´ng chá»‰ process;
  - minimum 4: memory + **swap** theo cgroup;
  - minimum 8: khÃ´ng host mount, khÃ´ng Docker socket â€” vÃ¬ báº£n thÃ¢n app Ä‘Ã£ náº±m trong container cá»§a PaaS.

**Káº¿t luáº­n:** báº¯t buá»™c cÃ³ **má»™t mÃ¡y Linux cÃ³ Docker tháº­t**. VÃ¬ nhÃ³m chÆ°a cÃ³ VPS, dÆ°á»›i Ä‘Ã¢y lÃ  cÃ¡c phÆ°Æ¡ng Ã¡n **miá»…n phÃ­**.

#### PhÆ°Æ¡ng Ã¡n Ä‘Ã£ chá»n: **C â€” Render free (web) + Oracle worker**

| # | PhÆ°Æ¡ng Ã¡n | Vai trÃ² | Tráº¡ng thÃ¡i |
|---|---|---|---|
| **C** | **Render free + Azure for Students VM** | Render: web/API/UI. Azure: worker + sandbox + Docker (Oracle het capacity) | ? **Da chon** |
| A | Oracle Cloud Always Free (1 VM) | Gá»™p web + worker + Postgres + Caddy | Fallback náº¿u Render háº¿t 750 h hoáº·c ngá»§ khi cháº¥m |
| B | Google Cloud e2-micro (1 GB) | Worker + sandbox | Fallback náº¿u Oracle háº¿t capacity |
| D | AWS/Azure free 12 thÃ¡ng | Worker | Fallback ngáº¯n háº¡n |

**Kiáº¿n trÃºc Ä‘Ã£ chá»n:**

```
NgÆ°á»i dÃ¹ng (TA/Student)
        â”‚ HTTPS
        â–¼
Render Web Service (free)  â”€â”€â”€â”€â”€â”€â–º  Neon Postgres (free, TLS)
   - UI TA/Student                     - labs, constraints
   - API, enqueue job                  - submissions, jobs
   - KHÃ”NG giá»¯ Gemini key              - verdicts, call log
        â–²                                     â–²
        â”‚ cron ping 10 phÃºt                  â”‚ poll job / ghi verdict
        â”‚ (giá»¯ Render khÃ´ng ngá»§)              â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                     â”‚
                        â”‚                     â”‚
              Oracle Cloud VM (Always Free) â”€â”€â”˜
              - worker: claim job, hard rules
              - docker run --network none --memory 256m \
                --memory-swap 256m --pids-limit 64 --user 1000 \
                --read-only --tmpfs /tmp leetkob-sandbox ...
              - Gemini API (key CHá»ˆ náº±m á»Ÿ Ä‘Ã¢y)
```

**VÃ¬ sao tÃ¡ch nhÆ° váº­y:**

- **Render free** lo pháº§n public HTTPS, UI, API â€” khÃ´ng cáº§n má»Ÿ port trÃªn Oracle.
- **Oracle VM** chá»‰ cáº§n **outbound** tá»›i Neon vÃ  Gemini; khÃ´ng má»Ÿ cá»•ng vÃ o, giáº£m bá» máº·t táº¥n cÃ´ng cho PA#4.
- **Neon Postgres** lÃ  cáº§u ná»‘i giá»¯a Render vÃ  Oracle; cáº£ hai káº¿t ná»‘i báº±ng TLS, khÃ´ng cáº§n VPN.
- **Gemini key chá»‰ náº±m trÃªn Oracle worker**; Render vÃ  sandbox Ä‘á»u khÃ´ng tháº¥y.
- Sandbox váº«n cháº¡y Docker tháº­t trÃªn Oracle â†’ Ä‘á»§ 9 minimums.

**Äiá»u kiá»‡n cáº§n biáº¿t:**

- **Render free** ngá»§ sau 15 phÃºt khÃ´ng cÃ³ request. DÃ¹ng cron-job.org (hoáº·c GitHub Actions schedule) ping `/healthz` má»—i 10 phÃºt. 24/7 â‰ˆ 730 h/thÃ¡ng, vá»«a dÆ°á»›i háº¡n 750 h.
- **Neon free** scale-to-zero, request Ä‘áº§u sau ngá»§ cháº­m ~0.5â€“1 s; cháº¥p nháº­n Ä‘Æ°á»£c.
- **Oracle Always Free** cáº§n tháº» xÃ¡c minh, hay háº¿t capacity ARM â€” thá»­ region khÃ¡c hoáº·c mÃ¡y AMD 1 GB. CÃ³ thá»ƒ bá»‹ thu há»“i náº¿u idle 7 ngÃ y â†’ cron ping + tÃ¡c vá»¥ CPU nháº¹ Ä‘á»‹nh ká»³.
- Náº¿u **Oracle ARM**: build image `linux/arm64` (gcc, Node 24, tree-sitter Ä‘á»u há»— trá»£).
- Náº¿u **Render free khÃ´ng Ä‘á»§** (quÃ¡ 750 h, hoáº·c ngá»§ giá»¯a lÃºc cháº¥m): chuyá»ƒn web sang chÃ­nh Oracle VM (phÆ°Æ¡ng Ã¡n A) â€” code khÃ´ng Ä‘á»•i, chá»‰ Ä‘á»•i `DATABASE_URL` vÃ  cháº¡y thÃªm container web + Caddy.

**KhÃ´ng nÃªn chá»n:**

- **Fly.io**: Ä‘Ã£ bá» free tier cho tá»• chá»©c má»›i.
- **Railway**: chá»‰ cÃ³ credit trial.
- **Koyeb / Northflank / Render free cho sandbox**: khÃ´ng cÃ³ Docker-in-Docker â†’ khÃ´ng Ä‘áº¡t minimum 3, 4, 8.
- **GitHub Codespaces**: tá»± sleep, URL public khÃ´ng á»•n Ä‘á»‹nh.
- **MÃ¡y nhÃ  + Cloudflare Tunnel**: chá»‰ lÃ  phÆ°Æ¡ng Ã¡n cuá»‘i, dá»… cháº¿t khi cháº¥m.

> **LÆ°u Ã½:** Oracle vÃ  GCP Ä‘á»u yÃªu cáº§u tháº» Ä‘á»ƒ xÃ¡c minh nhÆ°ng **khÃ´ng trá»« tiá»n** náº¿u chá»‰ dÃ¹ng Always Free. Báº­t budget cáº£nh bÃ¡o 0 USD ngay sau khi táº¡o tÃ i khoáº£n.

### 3.2 Stack

| ThÃ nh pháº§n | Chá»n | LÃ½ do |
|---|---|---|
| Runtime | Node.js 24 (giá»¯ nguyÃªn) | Äá»“ng bá»™ PA#2, CI cÅ© |
| Web | Node `http` hiá»‡n cÃ³ + server-rendered HTML tá»‘i giáº£n | Ãt moving part, ká»‹p deadline; khÃ´ng thÃªm React |
| DB | **Neon Postgres free** (TLS) | Queue bá»n vá»¯ng, exactly-once, cáº§u ná»‘i Render â†” Oracle |
| Sandbox | Docker + image `leetkob-sandbox` (gcc/g++), `--network none` | Äá»§ 9 minimums |
| Hard rules | `tree-sitter` + `tree-sitter-cpp` | AST tháº­t, phÃ¢n biá»‡t comment/string/include; offline |
| Model | **Google Gemini free tier** (`gemini-2.5-flash` hoáº·c `gemini-2.0-flash`) | Free tier, structured output (JSON schema), cÃ³ `responseId` |
| Checker | CLI Node + Dockerfile riÃªng | Cháº¡y Ä‘Æ°á»£c `--network none`, `MODEL_OFF=1` |
| Deploy | **Render free (web) + Azure for Students VM (worker) + Neon (DB)** | Public HTTPS, Docker that, mien phi |

### 3.3 MÃ´ hÃ¬nh dá»¯ liá»‡u tá»‘i thiá»ƒu

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
         unsure_reason[model_unsure|schema_invalid|evidence_mismatch|timeout|cost_cap|hard_rule_unsure],
         ta_decision[NULL|pass|violation], reviewed BOOL,
         UNIQUE(submission_id, constraint_id))
model_calls(id, submission_id, constraint_id, provider, model, provider_request_id,
            tokens_in, tokens_out, latency_ms, cost_usd, created_at)
```

**Exactly-once:** `jobs.submission_id UNIQUE` + claim báº±ng transaction (`UPDATE ... WHERE status='queued' ... RETURNING`) + `verdicts UNIQUE(submission_id, constraint_id)` + ghi verdict báº±ng `ON CONFLICT DO NOTHING`. Worker restart khÃ´ng táº¡o thÃªm bá»™ verdict.

**Theo FAQ:**
- Chá»‰ bÃ i **AC** má»›i vÃ o soÃ¡t rÃ ng buá»™c; bÃ i khÃ´ng AC = 0 Ä‘iá»ƒm, khÃ´ng soÃ¡t (FAQ-04).
- `is_counted` = bÃ i ná»™p cuá»‘i cá»§a má»—i `(lab_id, student_id)` trÆ°á»›c `deadline_at`; chá»‰ bÃ i counted má»›i vÃ o queue (FAQ-02).
- Verdict `unsure` lÆ°u `unsure_reason` Ä‘á»ƒ TA tháº¥y nguyÃªn nhÃ¢n (FAQ-09).
- Äiá»ƒm = `max(0, 10 - sum(deduction cá»§a constraint bá»‹ violation))`; má»—i constraint trá»« má»™t láº§n (FAQ-11). PA#3 chÆ°a publish nÃªn chá»‰ hiá»ƒn thá»‹ cho TA.

### 3.4 Danh sÃ¡ch endpoint/route cáº§n cÃ³

| Route | Vai trÃ² | Ghi chÃº |
|---|---|---|
| `POST /v1/labs/{labId}/submissions` | student | Giá»¯ nguyÃªn contract PA#2, thÃªm enqueue job; bÃ i cuá»‘i trÆ°á»›c háº¡n Ä‘Æ°á»£c Ä‘Ã¡nh `is_counted` (FAQ-02) |
| `GET /v1/labs/{id}` | student/TA | Student tháº¥y statement, constraints + deduction, deadline; **khÃ´ng** tháº¥y verdict (FAQ-06) |
| `GET /v1/submissions/{id}` | student/TA | Student tháº¥y judge verdict + tá»«ng test, **khÃ´ng** tháº¥y input/output, **khÃ´ng** tháº¥y constraint verdict (FAQ-02, FAQ-08) |
| `POST /v1/labs` | TA | Táº¡o lab + constraints + tests; chá»‰ sá»­a Ä‘Æ°á»£c theo FAQ-07 |
| `GET /v1/labs/{id}/review-queue` | TA | Chá»‰ TA cÃ¹ng class; TA class khÃ¡c â†’ 403; gá»“m violation + unsure + 10% pass (FAQ-10) |
| `POST /v1/verdicts/{id}/review` | TA | TA chá»n `pass`/`violation`; violation pháº£i cÃ³ evidence line (FAQ-09) |
| `POST /v1/labs/{id}/publish` | TA | Tuá»³ chá»n PA#3; náº¿u cÃ³: cháº·n khi cÃ²n unsure chÆ°a xá»­ lÃ½ hoáº·c chÆ°a háº¿t háº¡n (FAQ-12) |
| `POST /v1/admin/classes`, `POST /v1/admin/users` | admin | Admin táº¡o lá»›p, gÃ¡n TA; student join báº±ng invite code (FAQ-01) |
| `GET /healthz` | public | Giá»¯ CI/uptime + cron ping Render |

---

## 4. Thiáº¿t káº¿ chi tiáº¿t theo tá»«ng tiÃªu chÃ­

### 4.1 Criterion 1 â€” Flow end-to-end (15 Ä‘iá»ƒm) Â· TÃ­n

**Äiá»u kiá»‡n Äƒn Ä‘iá»ƒm cao:** má»i bÆ°á»›c qua UI/API cá»§a sáº£n pháº©m, **khÃ´ng** seed lab báº±ng script.

- Trang TA: form táº¡o lab (title, statement, tests, constraint text + deduction). Constraint cÃ³ text báº¯t Ä‘áº§u `Do not use`/`Do not call` â†’ tá»± nháº­n lÃ  ban list.
- Trang Student **trÆ°á»›c khi ná»™p**: hiá»‡n Ä‘á»§ statement, danh sÃ¡ch constraint + má»©c trá»«, vÃ  thÃ´ng bÃ¡o code sáº½ Ä‘Æ°á»£c soÃ¡t báº±ng luáº­t cá»©ng + model, model chá»‰ nháº­n Ä‘á» + constraint + code Ä‘Ã£ bá» comment/tÃªn/MSSV (FAQ-06).
- Trang Student **sau khi ná»™p**: hiá»‡n `queued/judging/judged`, verdict tá»•ng (AC/WA/TLE/â€¦) vÃ  verdict tá»«ng test; **khÃ´ng** hiá»‡n input/output cá»§a test (FAQ-02); **khÃ´ng** hiá»‡n constraint verdict/evidence trÆ°á»›c publish (FAQ-08).
- **3 bÃ i demo dÃ¹ng 3 sinh viÃªn khÃ¡c nhau**, vÃ¬ chá»‰ bÃ i ná»™p cuá»‘i cá»§a má»—i sinh viÃªn Ä‘Æ°á»£c tÃ­nh vÃ  vÃ o queue (FAQ-02).
- Trang TA review: báº£ng `submission Ã— constraint`, verdict mÃ u, evidence lines (highlight Ä‘Ãºng dÃ²ng), deduction; chá»‰ hiá»‡n **bÃ i counted** (FAQ-02), gá»“m má»i `violation`, má»i `unsure`, vÃ  10% `pass` (FAQ-10).
- CÃ¡ch ly: query luÃ´n kÃ¨m `class_id` cá»§a TA Ä‘ang Ä‘Äƒng nháº­p; TA class khÃ¡c nháº­n **403** (theo contract PA#2, FAQ-01). CÃ³ test.
- **Seed account** (admin/TA/student) Ä‘Æ°á»£c phÃ©p, nhÆ°ng **lab pháº£i táº¡o qua UI**. Ghi rÃµ trong `PA3.md` Ä‘á»ƒ ngÆ°á»i cháº¥m khÃ´ng trá»« Ä‘iá»ƒm.

**Báº±ng chá»©ng:** video 5 phÃºt quay Ä‘Ãºng luá»“ng trÃªn deployment + test e2e.

### 4.2 Criterion 2 â€” Queue vÃ  sandbox (20 Ä‘iá»ƒm) Â· TÃ¹ng

**GiÃ¡ trá»‹ máº·c Ä‘á»‹nh theo FAQ-05:** compile `g++ -std=c++17 -O2` trong 10 s; code â‰¤ 64 KB; CPU 1 s/test (TA chá»‰nh 1â€“5 s); wall = 3Ã— CPU; RAM 256 MB (TA chá»‰nh 64â€“512 MB); process 16; output 1 MB/test.

**ChÃ­n minimums + attack submission tÆ°Æ¡ng á»©ng (má»—i cÃ¡i 1 file trong `test/sandbox/attacks/`):**

| # | Minimum | CÃ¡ch cáº¥u hÃ¬nh | Attack submission | Ká»³ vá»ng |
|---|---|---|---|---|
| 1 | KhÃ´ng network | `docker run --network none` | `connect()` tá»›i `1.1.1.1:80`, DNS lookup | fail, khÃ´ng ra ngoÃ i |
| 2 | CPU time limit | `--cpus`, `ulimit -t 1`, runner Ä‘o CPU | vÃ²ng láº·p vÃ´ háº¡n | bá»‹ kill, `TLE` |
| 3 | Wall-clock kill **container** | wall 3 s, `--stop-timeout`, `docker kill` | `sleep 3600` + process con | container cháº¿t, khÃ´ng cÃ²n process, `TLE` |
| 4 | Memory + swap | `--memory=256m --memory-swap=256m` | cáº¥p phÃ¡t 1 GiB, **ghi/Ä‘á»c láº¡i + checksum** Ä‘á»ƒ compiler khÃ´ng xoÃ¡ | OOM kill, `MLE`/`RE` |
| 5 | Process limit | `--pids-limit=16` | fork bomb | bá»‹ cháº·n, `RE`/`WA` |
| 6 | Output size | Ä‘á»c stdout cap 1 MB/test, kill khi vÆ°á»£t | in hÃ ng trÄƒm MB | bá»‹ cáº¯t/kill, `RE` |
| 7 | Non-root | `--user 1000:1000`, image cÃ³ user riÃªng | `id -u` | khÃ¡c 0 |
| 8 | No host mount / no docker socket | khÃ´ng `-v`; `--read-only` + tmpfs; khÃ´ng mount socket | Ä‘á»c `/var/run/docker.sock`, `mount`, `/etc/hostname` | khÃ´ng tháº¥y |
| 9 | No secrets | khÃ´ng `-e MODEL_API_KEY`; worker giá»¯ key ngoÃ i sandbox | in `env`, grep filesystem tÃ¬m key/pattern | khÃ´ng cÃ³ key |

**Báº¯t buá»™c thÃªm:**

- **Compile trong sandbox** (cÃ¹ng image, cÃ¹ng limits, `--network none`).
- **Worker riÃªng:** test "stop worker â†’ submit â†’ start worker â†’ judged exactly once" (hoáº·c quay video).
- **CI cháº¡y attack tests trÃªn tag `pa3`.** GitHub Actions runner cÃ³ Docker â†’ thÃªm job `sandbox` trong `ci.yml`, trigger cáº£ `tags: ['pa3']`.
- KhÃ´ng dÃ¹ng `-v /var/run/docker.sock`, `--privileged`, `--env-file`, `-e MODEL_API_KEY` trong lá»‡nh cháº¡y sandbox.

**Báº±ng chá»©ng:** `test/sandbox/`, job CI `sandbox` trÃªn tag, log tá»«ng attack fail Ä‘Ãºng cÃ¡ch.

### 4.3 Criterion 3 â€” Hard rules trÆ°á»›c (15 Ä‘iá»ƒm) Â· Tuá»‡

**Nháº­n diá»‡n ban list:** constraint text báº¯t Ä‘áº§u `Do not use` hoáº·c `Do not call`, má»i tÃªn bá»‹ cáº¥m náº±m trong backtick. VÃ­ dá»¥: ``Do not call `std::sort` ``.

**KhÃ´ng Ä‘Æ°á»£c:** `sourceCode.includes('std::sort')` hay regex trÃªn raw text.

**BÃ i há»c tá»« dev set tháº­t:** tÃªn bá»‹ cáº¥m khÃ´ng chá»‰ lÃ  hÃ m. Ban list trong 6 bÃ i cÃ³ Ä‘á»§ 6 dáº¡ng, nÃªn hard rule pháº£i xá»­ lÃ½ cáº£ 6:

| Dáº¡ng | VÃ­ dá»¥ tháº­t trong dev set | Node AST cáº§n báº¯t |
|---|---|---|
| HÃ m qualified | `std::sort`, `std::ranges::sort`, `boost::integer::gcd` | `qualified_identifier` trong `call_expression` |
| HÃ m toÃ n cá»¥c | `qsort`, `bsearch`, `__gcd` | `call_expression` + `identifier` |
| HÃ m member | `rbegin`, `rend`, `crbegin`, `crend` | `field_expression` Ä‘Æ°á»£c gá»i |
| Type/container | `std::vector`, `std::string`, `std::array` | type specifier / `qualified_identifier` |
| Statement keyword | `for`, `while`, `do`-`while`, `goto` | `for_statement`, `while_statement`, `do_statement`, `goto_statement` |
| Macro / alias | `#define SORT(v) std::sort(all(v))`, `using std::sort;` | `preproc_def` + call site; `using_declaration` |

**Thiáº¿t káº¿:**

1. Parse constraint text: báº¯t Ä‘áº§u `Do not use` / `Do not call` â†’ ban list; trÃ­ch má»i tÃªn trong backtick; chuáº©n hoÃ¡ `do`-`while` thÃ nh `do`.
2. Parse C++ báº±ng `tree-sitter-cpp` â†’ AST.
3. Vá»›i má»—i tÃªn bá»‹ cáº¥m, chá»n matcher theo báº£ng trÃªn; duyá»‡t AST vÃ  **resolve scope**:
   - `std::sort(...)` â†’ báº¯t;
   - `sort(...)` chá»‰ báº¯t khi cÃ³ `using namespace std;` **vÃ ** khÃ´ng bá»‹ shadow bá»Ÿi hÃ m/namespace student khai bÃ¡o;
   - `using std::sort;` rá»“i gá»i `sort(...)` â†’ báº¯t;
   - macro chá»©a tÃªn cáº¥m â†’ báº¯t á»Ÿ dÃ²ng `#define` **hoáº·c** dÃ²ng gá»i macro (má»™t trong hai lÃ  Ä‘á»§ evidence).
4. Bá» qua theo **node type**, khÃ´ng theo text: comment, string literal, `#include <algorithm>` (include má»™t mÃ¬nh **khÃ´ng** pháº£i violation).
5. Evidence = dÃ²ng gá»‘c (line + text) cá»§a node vi pháº¡m; náº¿u má»™t vi pháº¡m tráº£i nhiá»u dÃ²ng, chá»n dÃ²ng rÃµ nháº¥t.
6. Náº¿u khÃ´ng resolve cháº¯c cháº¯n â†’ `unsure`, **khÃ´ng** Ä‘oÃ¡n `violation` (trÃ¡nh wrongful deduction).
7. Khi hard rule quyáº¿t Ä‘á»‹nh â†’ `decided_by='hard_rule'`, **khÃ´ng gá»i model**; call log thá»ƒ hiá»‡n Ä‘iá»u nÃ y.

**Test matrix báº¯t buá»™c (láº¥y tá»« dev set tháº­t + fixture tá»± thÃªm):**

| Case | Ká»³ vá»ng | Äiá»ƒm khÃ³ |
|---|---|---|
| `sort-merge/s03` | C1 **pass** | `namespace my { void sort(...) }` + `using namespace std;` + comment nháº¯c `std::sort`; pháº£i resolve Ä‘Ãºng `my::sort` |
| `sort-merge/s02` | C1 **pass** | `<algorithm>` chá»‰ Ä‘á»ƒ dÃ¹ng `std::min` |
| `sort-merge/s04` | C1 **violation** dÃ²ng 11 | `sort(...)` khÃ´ng qualified nhÆ°ng cÃ³ `using namespace std;` |
| `sort-merge/s05` | C1 **violation** dÃ²ng 12 | `stable_sort(...)` khÃ´ng qualified |
| `sort-merge/s08` | C1 **violation** dÃ²ng 4 hoáº·c 25 | macro `SORT(v)` chá»©a `std::sort` |
| `reverse-recursive/*` | C1 violation | `for`/`while`/`goto` lÃ  statement, khÃ´ng pháº£i call |
| `dynamic-array/*` | C1 violation | `std::vector`, `std::string` lÃ  type |
| `reverse-words/*` | C1 violation | `rbegin`, `rend` lÃ  member call |
| `gcd-euclid/*` | C1 violation | `__gcd` lÃ  hÃ m toÃ n cá»¥c |
| Fixture tá»± thÃªm | pass | `std::sort` trong comment/string; hÃ m `resort`; biáº¿n tÃªn `sort` |

**Báº±ng chá»©ng:** `test/hard-rules/` vá»›i fixture + test; cháº¡y `MODEL_OFF=1` trÃªn dev set cho 0 wrongful deduction vÃ  quyáº¿t Ä‘á»‹nh Ä‘á»§ má»i cáº·p ban-list.

### 4.4 Criterion 4 â€” Model semantic (20 Ä‘iá»ƒm) Â· TÃ­n

**Luá»“ng:** chá»‰ bÃ i **AC** vÃ  **counted** má»›i vÃ o soÃ¡t (FAQ-02, FAQ-04). Hard rule cháº¡y trÆ°á»›c â†’ constraint cÃ²n láº¡i (semantic) má»›i gá»i model.

**Dá»¯ liá»‡u gá»­i Ä‘i (báº¯t buá»™c, theo FAQ-06):**

- statement cá»§a lab,
- text constraint (**khÃ´ng gá»­i deduction** Ä‘á»ƒ model khÃ´ng dÃ¹ng má»©c trá»«; model khÃ´ng Ä‘Æ°á»£c tráº£ deduction),
- code **Ä‘Ã£ bá» comment**, **bá» tÃªn vÃ  MSSV** trong header, email.
- **KhÃ´ng Ä‘á»•i tÃªn biáº¿n/hÃ m**: evidence pháº£i khá»›p tá»«ng kÃ½ tá»± vá»›i code gá»‘c. Chá»‰ xoÃ¡ comment/identity, giá»¯ nguyÃªn sá»‘ dÃ²ng vÃ  ná»™i dung cÃ¡c dÃ²ng code.
- Trang ná»™p bÃ i pháº£i ghi rÃµ 3 Ä‘iá»u nÃ y cho sinh viÃªn (FAQ-06).

**Output schema (vÃ­ dá»¥):**

```json
{
  "verdict": "pass | violation | unsure",
  "evidence": [{ "line": 12, "text": "std::sort(a, a + n);" }],
  "reason": "ngáº¯n, khÃ´ng chá»©a deduction"
}
```

- DÃ¹ng structured output cá»§a Gemini (`responseSchema`).
- Validate báº±ng `ajv`/`zod`; sai schema â†’ `unsure`.
- Má»—i evidence line pháº£i **khá»›p chÃ­nh xÃ¡c** dÃ²ng code gá»‘c; lá»‡ch â†’ `unsure`.
- Timeout má»—i call (vÃ­ dá»¥ 20s) vÃ  timeout tá»•ng; quÃ¡ háº¡n â†’ `unsure`.
- Cost cap/lab: Ä‘áº¿m token + USD; vÆ°á»£t cap â†’ dá»«ng gá»i, pháº§n cÃ²n láº¡i `unsure`.

**Call log (báº¯t buá»™c):** JSONL + báº£ng DB, má»—i call cÃ³ `provider_request_id` (Gemini `responseId`), `model`, `tokens_in`, `tokens_out`, `latency_ms`, `cost_usd`, `submission_id`, `constraint_id`. **KhÃ´ng log source code / identity.**

**Cost/lab 80 bÃ i:** Ä‘o token tháº­t tá»« dev run, ghi cÃ´ng thá»©c vÃ o README + AI-LOG:

```text
cost/lab = 80 bÃ i Ã— sá»‘ constraint semantic Ã— (tokens_in/1e6 Ã— giÃ¡_in + tokens_out/1e6 Ã— giÃ¡_out)
```

Ghi rÃµ free tier thá»±c táº¿ = 0 USD, nhÆ°ng váº«n trÃ¬nh bÃ y phÃ©p tÃ­nh theo giÃ¡ paid Ä‘á»ƒ chá»©ng minh Ä‘Ã£ kiá»ƒm soÃ¡t chi phÃ­.

### 4.5 Criterion 5 â€” Limits + review queue (10 Ä‘iá»ƒm) Â· TÃ¹ng

- Schema invalid â†’ `unsure`; timeout â†’ `unsure`; evidence mismatch â†’ `unsure`; cost cap exceeded â†’ `unsure`.
- **Test dÃ¹ng fake model, khÃ´ng network:** inject model client; 2 test báº¯t buá»™c:
  1. fake tráº£ JSON sai schema â†’ verdict `unsure`;
  2. fake sleep quÃ¡ timeout â†’ verdict `unsure`.
- Verdict **chá»‰** vÃ o báº£ng review cá»§a TA. API student khÃ´ng tráº£ verdict constraint (FAQ-08).
- **Queue composition** (FAQ-10): má»i `violation` + má»i `unsure` + 10% sá»‘ `pass` chá»n ngáº«u nhiÃªn, lÃ m trÃ²n lÃªn; verdict lÃ  cáº·p (bÃ i counted, constraint).
- **`unsure` flow** (FAQ-09): TA tháº¥y nguyÃªn nhÃ¢n (`model_unsure`, `schema_invalid`, `evidence_mismatch`, `timeout`, `cost_cap`, `hard_rule_unsure`) vÃ  cÃ¡c dÃ²ng mÃ´ hÃ¬nh nghi ngá»; TA pháº£i chá»n `pass`/`violation`, khÃ´ng cÃ³ máº·c Ä‘á»‹nh; chá»n `violation` thÃ¬ pháº£i chá»‰ â‰¥1 dÃ²ng evidence. `unsure` **khÃ´ng bao giá» tá»± thÃ nh deduction**.
- Lab cÃ²n `unsure` chÆ°a xá»­ lÃ½ â†’ khÃ´ng Publish Ä‘Æ°á»£c (FAQ-09, FAQ-12).
- Náº¿u cÃ³ nÃºt Publish: tá»« chá»‘i khi cÃ²n verdict `reviewed=false` hoáº·c chÆ°a háº¿t háº¡n (FAQ-12). PA#3 khÃ´ng publish mark.
- **Student trÆ°á»›c publish** (FAQ-08): chá»‰ tháº¥y káº¿t quáº£ cháº¥m test; khÃ´ng tháº¥y verdict/evidence/deduction; khÃ´ng tháº¥y unsure, bÃ i bá»‹ bÃ¡c, hay cÃ³ náº±m trong máº«u 10%.
- **Sau publish** (FAQ-08, PA#5): student tháº¥y cÃ¡c khoáº£n trá»« kÃ¨m constraint, deduction, evidence, lÃ½ do.

### 4.6 Criterion 6 â€” Checker command + eval (10 Ä‘iá»ƒm) Â· Tuá»‡

**Má»™t lá»‡nh duy nháº¥t, nháº­n folder dataset:**

```bash
node bin/check.mjs --dataset leetkob-eval --out runs/pa3-dev/predictions.jsonl
node leetkob-eval/eval.mjs --data leetkob-eval --predictions runs/pa3-dev/predictions.jsonl
```

- `--dataset` lÃ  **folder gá»‘c** cá»§a dev set (chá»©a `problems/`, `solutions/`, `labels.jsonl`), khÃ´ng pháº£i tá»«ng bÃ i. Checker tá»± duyá»‡t má»i problem.
- Chá»‰ cáº§n `statement.md` + `constraints.json` lÃ  cháº¡y Ä‘Æ°á»£c; khÃ´ng setting tay tá»«ng bÃ i.
- `MODEL_OFF=1` â†’ chá»‰ hard rule, semantic = `unsure`, **khÃ´ng má»Ÿ network**.
- Dockerfile riÃªng:

```bash
docker build -t leetkob-checker .
docker run --network none --memory 1g --pids-limit 256 \
  -v "$PWD/leetkob-eval:/data:ro" -v "$PWD/runs:/out" \
  -e MODEL_OFF=1 leetkob-checker \
  --dataset /data --out /out/predictions.jsonl
```

- Cháº¥m báº±ng `eval.mjs` gá»‘c; exit code 0 hoáº·c 1, **khÃ´ng bao giá» 2**.
- **Dev set Ä‘Ã£ táº£i vÃ  xÃ¡c minh** táº¡i `PA03/leetkob-eval/` (128 file):
  - 6 problem: `sort-merge`, `binary-search`, `reverse-recursive`, `dynamic-array`, `reverse-words`, `gcd-euclid`
  - 47 solution Accepted, **102 cáº·p (solution, constraint)**: 65 `pass`, 37 `violation`
  - SHA-256 `eval.mjs` = `c836edd8713521bbbd3c9c8299b5f0893cdbac0efab2209d6ae4397234516aa7` âœ…
  - SHA-256 `labels.jsonl` = `262cda7b0ef5612e192cd6197e1df31a4e8af52c8da0ccceeb75f2b1e56ca47f` âœ…
  - Manifest Ä‘áº§y Ä‘á»§ 128 file: `PA03/leetkob-eval.sha256` (dÃ¹ng Ä‘á»ƒ verify láº¡i sau khi copy vÃ o repo).
- **Cáº£nh bÃ¡o Windows/CRLF (Ä‘Ã£ gáº·p):** clone trÃªn Windows tá»± Ä‘á»•i LF â†’ CRLF lÃ m hash thÃ nh `fd2a2câ€¦` / `64db04â€¦`. Pháº£i:
  - copy báº£n LF (Ä‘Ã£ lÃ m), vÃ 
  - thÃªm vÃ o `.gitattributes`: `leetkob-eval/** -text` Ä‘á»ƒ Git khÃ´ng bao giá» Ä‘á»•i line ending.
  - Kiá»ƒm tra láº¡i báº±ng `Get-FileHash` trÆ°á»›c má»—i láº§n commit.
- **Committed dev run:** `runs/pa3-dev/` gá»“m `predictions.jsonl`, `eval-report.txt`, `calls.jsonl`, `README.md` (model, token, cost, 3 sá»‘ Ä‘o).
- **Case riÃªng:** folder `leetkob-eval-extra/` cÃ¹ng layout, â‰¥5 case, má»—i case cÃ³ label + tag, â‰¥1 `trap`, â‰¥1 `injection`. KhÃ´ng trá»™n vÃ o dev set gá»‘c. CÃ³ thá»ƒ láº¥y cáº£m há»©ng tá»« cÃ¡c trap tháº­t (`sort-merge/s03`, `s02`) vÃ  injection tháº­t (`s09`), nhÆ°ng **khÃ´ng copy nguyÃªn** vÃ  **khÃ´ng sá»­a** dev set.

### 4.7 Criterion 7 â€” Tests-first, má»™t pháº§n má»—i commit (5 Ä‘iá»ƒm) Â· cáº£ nhÃ³m

**Káº¿ hoáº¡ch commit/PR (lÃ m tháº­t, khÃ´ng rebuild lá»‹ch sá»­):**

| Thá»© tá»± | Commit/PR | Ná»™i dung | NgÆ°á»i |
|---|---|---|---|
| 1 | `test(sandbox): nine attack submissions fail as intended` + `feat(sandbox): hardened docker runner` | 9 attack + runner | TÃ¹ng |
| 2 | `test(queue): worker restart judges exactly once` + `feat(queue): postgres claim and lease` | queue | TÃ¹ng |
| 3 | `test(hard-rules): ban-list traps` + `feat(hard-rules): tree-sitter cpp` | hard rules | Tuá»‡ |
| 4 | `test(model): bad schema and timeout become unsure` + `feat(model): gemini client, prompt, call log` | model | TÃ­n |
| 5 | `test(checker): MODEL_OFF dev run` + `feat(checker): cli and dockerfile` | checker | Tuá»‡ |
| 6 | `test(flow): TA creates lab, student submits, queue shows verdict` + `feat(web): screens and review queue` | flow | TÃ­n |

Quy táº¯c:

- Test vÃ  code **cÃ¹ng commit hoáº·c test trÆ°á»›c**.
- Má»—i commit **má»™t pháº§n**, khÃ´ng gá»™p sandbox + model.
- **KhÃ´ng ná»›i test/label** trong commit lÃ m xanh.
- KhÃ´ng `git rebase`/squash láº¡i toÃ n bá»™ cuá»‘i bÃ i.

### 4.8 Criterion 8 â€” AI-LOG.md (5 Ä‘iá»ƒm) Â· cáº£ nhÃ³m, TÃ¹ng review

Má»—i entry: ngÃ y, ngÆ°á»i, tool + model, pháº§n viá»‡c, **Changed** (Ä‘Ã£ sá»­a gÃ¬), **Rejected** (Ä‘á» xuáº¥t gÃ¬ bá»‹ tá»« chá»‘i vÃ  vÃ¬ sao). VÃ­ dá»¥ tháº­t cáº§n ghi:

- assistant viáº¿t hard rule báº±ng regex â†’ báº¯n vÃ o comment â†’ thay báº±ng tree-sitter;
- prompt vÃ´ tÃ¬nh nháº¯c `sort-merge/s05` â†’ sá»­a thÃ nh mÃ´ táº£ generic;
- test 1 GiB pass nhÆ°ng compiler xoÃ¡ allocation â†’ thÃªm Ä‘á»c láº¡i/checksum;
- assistant Ä‘á» xuáº¥t `-v /var/run/docker.sock` â†’ tá»« chá»‘i.

ThÃªm **"never list"** vÃ o `AGENTS.md` theo báº£ng "Catching your assistant" cá»§a rubric.

---

## 5. Timeline 4 ngÃ y (21/11 â†’ 25/11)

> HÃ´m nay lÃ  **Thá»© Báº£y 21/11**. Thá»i gian ráº¥t ngáº¯n: Æ°u tiÃªn Ä‘Ãºng thá»© tá»±, cáº¯t UI.

### Thá»© Báº£y 21/11 â€” Gá»¡ blocker + háº¡ táº§ng (TÃ­n chá»§ trÃ¬, cáº£ nhÃ³m)

- [x] **Dev set Ä‘Ã£ táº£i** tá»« <https://github.com/fithcmus/awad-leetkob-eval>, xÃ¡c minh SHA-256, copy vÃ o `PA03/leetkob-eval/` (giá»¯ LF).
- [ ] ThÃªm `.gitattributes` vá»›i `leetkob-eval/** -text`; kiá»ƒm tra hash láº¡i sau khi copy vÃ o repo.
- [ ] **ÄÄƒng kÃ½ 3 dá»‹ch vá»¥ free:** Render Web Service, Oracle Cloud Always Free (worker), Neon Postgres.
- [ ] Render: táº¡o service, set `DATABASE_URL`; **khÃ´ng** set `GEMINI_API_KEY` trÃªn Render.
- [ ] Oracle: táº¡o VM, cÃ i Docker, user non-root, chá»‰ má»Ÿ SSH; báº­t budget cáº£nh bÃ¡o 0 USD.
- [ ] Neon: táº¡o DB, láº¥y connection string TLS; cháº¡y migration schema (má»¥c 3.3).
- [ ] Táº¡o cron-job.org ping `https://<render-app>.onrender.com/healthz` má»—i 10 phÃºt.
- [ ] Táº¡o Gemini API key, báº­t **spending cap**, chá»‰ Ä‘áº·t trong env cá»§a worker trÃªn Oracle.
- [ ] Chá»‘t schema + route (má»¥c 3.3, 3.4); táº¡o cÃ¡c nhÃ¡nh.
- [ ] ThÃªm "never list" vÃ o `AGENTS.md`; cáº­p nháº­t `ci.yml` trigger `tags: ['pa2','pa3']`.

**Gate tá»‘i nay:** Render tráº£ `/healthz` qua HTTPS; `docker run hello-world` trÃªn Oracle OK; worker káº¿t ná»‘i Ä‘Æ°á»£c Neon; `Get-FileHash` cá»§a `eval.mjs`/`labels.jsonl` Ä‘Ãºng `c836â€¦`/`262câ€¦`.

### Chá»§ nháº­t 22/11 â€” Sandbox + queue + hard rules (TÃ¹ng, Tuá»‡)

- [ ] TÃ¹ng: image sandbox, 9 minimums, 9 attack submission + test; compile trong sandbox.
- [ ] TÃ¹ng: queue Postgres + worker claim/lease + test exactly-once.
- [ ] Tuá»‡: tree-sitter hard rules + toÃ n bá»™ fixture trap + test.
- [ ] TÃ­n: khung UI táº¡o lab/ná»™p bÃ i; API enqueue.

**Gate:** 9 attack fail Ä‘Ãºng; worker restart chá»‰ 1 bá»™ verdict; `MODEL_OFF` hard rule cho káº¿t quáº£ Ä‘Ãºng trÃªn fixture.

### Thá»© Hai 23/11 â€” Model + limits + UI (TÃ­n, TÃ¹ng)

- [ ] TÃ­n: Gemini client, prompt anonymize, schema, timeout, call log, cost cap.
- [ ] TÃ­n: UI review queue + cÃ¡ch ly class (403).
- [ ] TÃ¹ng: test schema/timeout vá»›i fake model; test student khÃ´ng tháº¥y verdict.
- [ ] Tuá»‡: báº¯t Ä‘áº§u checker CLI dÃ¹ng chung module hard rules.

**Gate:** 3 bÃ i máº«u (compliant/violation/injection) cháº¡y háº¿t pipeline trÃªn mÃ¡y local; call log cÃ³ `responseId`.

### Thá»© Ba 24/11 â€” Deploy + checker + báº±ng chá»©ng (cáº£ nhÃ³m)

- [ ] Deploy web lÃªn Render, worker lÃªn Oracle, DB Neon; cháº¡y láº¡i 3 bÃ i trÃªn URL Render.
- [ ] Tuá»‡: `bin/check.mjs` + Dockerfile + `MODEL_OFF=1`; cháº¡y dev set tháº­t; commit `runs/pa3-dev/`.
- [ ] Tuá»‡: â‰¥5 case riÃªng (trap + injection).
- [ ] TÃ­n: `PA3.md`, video â‰¤5 phÃºt, test accounts.
- [ ] TÃ¹ng: rÃ  secrets, `gitleaks`, log sandbox, AI-LOG.

**Gate:** ngÆ°á»i ngoÃ i nhÃ³m (náº¿u Ä‘Æ°á»£c) Ä‘Äƒng nháº­p báº±ng account test vÃ  Ä‘i háº¿t luá»“ng.

### Thá»© TÆ° 25/11 â€” Freeze + ná»™p (TÃ­n)

- [ ] **12:00 freeze code.** Chá»‰ sá»­a docs/evidence.
- [ ] Cháº¡y Ä‘á»§ `lint`, `format:check`, `typecheck`, `test`; CI xanh trÃªn `main`.
- [ ] Tag `pa3`, push tag; láº¥y link CI run cÃ³ job sandbox.
- [ ] `SELF_ASSESSMENT_REPORT.md` (1 dÃ²ng/criterion + evidence + "what we did not manage").
- [ ] Zip **cÃ³ `.git`**, tÃªn `23120372-23120398-23120399_<total>.zip`.
- [ ] **Ná»™p trÆ°á»›c 18:00** (buffer 4 tiáº¿ng), tá»« email `23120372@student.hcmus.edu.vn`.
- [ ] Giá»¯ deployment cháº¡y + báº­t uptime monitor Ä‘áº¿n sau khi cÃ³ Ä‘iá»ƒm PA#4.

---

## 6. Báº£ng phÃ¢n cÃ´ng cÃ´ng viá»‡c

### 6.1 Theo tiÃªu chÃ­

> **LÆ°u Ã½ quan trá»ng:** PA#3 cháº¥m **má»™t láº§n cho cáº£ nhÃ³m**, khÃ´ng chia Ä‘iá»ƒm cho tá»«ng cÃ¡ nhÃ¢n. VÃ¬ váº­y báº£ng "Ä‘iá»ƒm" dÆ°á»›i Ä‘Ã¢y chá»‰ lÃ  **khá»‘i lÆ°á»£ng phá»¥ trÃ¡ch**, khÃ´ng pháº£i Ä‘iá»ƒm riÃªng cá»§a má»—i ngÆ°á»i. DÃ¹ ai phá»¥ trÃ¡ch tiÃªu chÃ­ nÃ o, cáº£ ba váº«n nháº­n cÃ¹ng má»™t Ä‘iá»ƒm nhÃ³m.

| TiÃªu chÃ­ | Äiá»ƒm | Owner chÃ­nh | Há»— trá»£ | Deliverable | Deadline |
|---|---:|---|---|---|---|
| 1. Flow end-to-end | 15 | **TÃ­n** | Tuá»‡ (test e2e), TÃ¹ng (auth/cÃ¡ch ly) | UI TA/Student, review queue, video, test e2e | 24/11 |
| 2. Queue + sandbox | 20 | **TÃ¹ng** | TÃ­n (VM, CI), Tuá»‡ (fixture) | 9 attack + runner + worker exactly-once | 22/11 |
| 3. Hard rules | 15 | **Tuá»‡** | TÃ¹ng (CI), TÃ­n (tÃ­ch há»£p) | tree-sitter rules + trap fixtures + test | 22/11 |
| 4. Model semantic | 20 | **TÃ­n** | Tuá»‡ (schema), TÃ¹ng (secret/cost) | Gemini client, prompt, call log, cost/lab | 23/11 |
| 5. Limits + review queue | 10 | **TÃ¹ng** | TÃ­n (queue UI), Tuá»‡ (fake model) | Test schema/timeout, cháº·n student tháº¥y verdict | 23/11 |
| 6. Checker + eval | 10 | **Tuá»‡** | TÃ­n (Docker/CI), TÃ¹ng (MODEL_OFF security) | CLI, Dockerfile, dev run, 5 case riÃªng | 24/11 |
| 7. Tests-first commits | 5 | **Cáº£ nhÃ³m** | TÃ­n audit lá»‹ch sá»­ | 6 commit/PR Ä‘Ãºng thá»© tá»± | liÃªn tá»¥c |
| 8. AI-LOG | 5 | **Cáº£ nhÃ³m** | TÃ¹ng review | Entry tháº­t, cÃ³ Changed/Rejected | 24/11 |
| Háº¡ táº§ng/deploy/PA3.md/tag/zip | â€” | **TÃ­n** | TÃ¹ng | Render + Oracle worker + Neon, PA3.md, tag, zip | 25/11 |

**Khá»‘i lÆ°á»£ng tham kháº£o:** TÃ­n 35 Ä‘iá»ƒm tiÃªu chÃ­ + háº¡ táº§ng; TÃ¹ng 30; Tuá»‡ 25. ÄÃ¢y chá»‰ lÃ  cÃ¡ch chia viá»‡c theo tháº¿ máº¡nh, **khÃ´ng áº£nh hÆ°á»Ÿng Ä‘iá»ƒm tá»«ng ngÆ°á»i** vÃ¬ Ä‘iá»ƒm lÃ  Ä‘iá»ƒm chung cá»§a nhÃ³m.

### 6.2 Theo file/module (trÃ¡nh conflict)

| VÃ¹ng file | Owner | Ghi chÃº |
|---|---|---|
| `src/app.js`, `src/http/`, `src/web/` (UI) | TÃ­n | Route, render HTML |
| `src/domain/labs.js`, `src/domain/review.js` | TÃ­n | Táº¡o lab, queue TA |
| `src/model/` (Gemini client, prompt, schema) | TÃ­n | KhÃ´ng Ä‘á»ƒ key trong repo |
| `src/queue/`, `worker/` | TÃ¹ng | Claim/lease, worker loop |
| `sandbox/` (Dockerfile, runner), `test/sandbox/` | TÃ¹ng | 9 attack |
| `src/checker/hard-rules/`, `test/hard-rules/` | Tuá»‡ | tree-sitter |
| `bin/check.mjs`, `Dockerfile.checker`, `runs/` | Tuá»‡ | Checker |
| `leetkob-eval/` | Tuá»‡ | **KhÃ´ng sá»­a**, chá»‰ Ä‘á»c |
| `leetkob-eval-extra/` | Tuá»‡ | Case riÃªng |
| `db/migrations/`, `src/repo/postgres.js` | TÃ¹ng | Schema, index |
| `PA3.md`, `README.md`, `ci.yml` | TÃ­n | TÃ­n merge cuá»‘i |
| `AI-LOG.md` | Cáº£ nhÃ³m | Append, khÃ´ng sá»­a entry ngÆ°á»i khÃ¡c |
| `SELF_ASSESSMENT_REPORT.md` | TÃ­n | Cáº£ nhÃ³m review |

### 6.3 Nhá»‹p lÃ m viá»‡c

- **Standup 15 phÃºt má»—i tá»‘i 21:00** (online): hÃ´m nay xong gÃ¬, cháº·n gÃ¬, ai cáº§n gÃ¬.
- **Merge qua PR**, khÃ´ng push tháº³ng `main` (giá»¯ branch protection).
- **Má»—i PR 1 pháº§n**, test Ä‘i kÃ¨m; review chÃ©o: TÃ­n review TÃ¹ng, TÃ¹ng review Tuá»‡, Tuá»‡ review TÃ­n.
- **Cuá»‘i ngÃ y:** cáº­p nháº­t AI-LOG + `PA3_PROGRESS.md` (báº£ng done/blocked).

---

## 7. Rá»§i ro vÃ  cÃ¡ch xá»­ lÃ½

| Rá»§i ro | Má»©c | áº¢nh hÆ°á»Ÿng | CÃ¡ch xá»­ lÃ½ |
|---|---|---|---|
| **Dev set lá»‡ch hash do CRLF** | Cao | Máº¥t C6 náº¿u bá»‹ coi lÃ  sá»­a dev set | ÄÃ£ copy báº£n LF; thÃªm `leetkob-eval/** -text`; verify hash trÆ°á»›c má»—i commit |
| **Oracle chÆ°a Ä‘Äƒng kÃ½ / háº¿t capacity** | Cao | Máº¥t C2 (20 Ä‘iá»ƒm) | ÄÄƒng kÃ½ ngay 21/11; thá»­ region khÃ¡c hoáº·c mÃ¡y AMD 1 GB; dá»± phÃ²ng GCP e2-micro |
| Oracle háº¿t capacity / thu há»“i mÃ¡y idle | TB | Deployment cháº¿t | Thá»­ region khÃ¡c, dÃ¹ng mÃ¡y AMD 1 GB; cron ping + tÃ¡c vá»¥ CPU nháº¹ Ä‘á»‹nh ká»³ Ä‘á»ƒ mÃ¡y khÃ´ng bá»‹ coi lÃ  idle |
| Chá»‰ cÃ²n 4 ngÃ y | Cao | KhÃ´ng ká»‹p flow | Cáº¯t UI tá»‘i giáº£n (server-rendered), khÃ´ng React; khÃ´ng appeals/publish/load test (PA#5) |
| Gemini free tier rate limit | TB | Dev run cháº­m/lá»—i | Batch, retry cÃ³ backoff, cache theo hash code+constraint, cap cá»©ng |
| Evidence line lá»‡ch | TB | Verdict thÃ nh unsure hÃ ng loáº¡t | So khá»›p exact; test vá»›i code cÃ³ CRLF/tab/trailing space |
| Secret lá»t vÃ o sandbox/repo | Cao | C2/C4 = 0 | KhÃ´ng `-e`; `gitleaks`; test attack grep key; key chá»‰ trÃªn worker |
| Exactly-once race | TB | Máº¥t Ä‘iá»ƒm C2 | Unique constraint + transaction + test restart |
| Render free ngá»§ / háº¿t 750 h | Cao | NgÆ°á»i cháº¥m má»Ÿ link bá»‹ cháº­m hoáº·c 502 | Cron ping `/healthz` má»—i 10 phÃºt; náº¿u háº¿t háº¡n má»©c thÃ¬ chuyá»ƒn web sang Oracle (phÆ°Æ¡ng Ã¡n A) |
| Neon cold start / máº¥t káº¿t ná»‘i | TB | Request Ä‘áº§u cháº­m, worker retry | Retry cÃ³ backoff; connection pool; timeout rÃµ rÃ ng |
| Render â†” Oracle lá»‡ch máº¡ng | TB | Job káº¹t, verdict cháº­m | Worker poll 1â€“2 s; health check hai Ä‘áº§u; log `job_id` |
| Tá»± cháº¥m cao hÆ¡n thá»±c táº¿ | TB | Trá»« tá»›i âˆ’10 | Cháº¥m sÃ¡t rubric, má»—i dÃ²ng cÃ³ evidence |
| QuÃªn giá»¯ deployment sau 25/11 | Cao | PA#4 red team khÃ´ng Ä‘Ã¡nh Ä‘Æ°á»£c | Báº­t monitor + nháº¯c lá»‹ch |

---

## 8. Viá»‡c cáº§n chá»‘t ngay (blockers)

1. âœ… **Dev set:** Ä‘Ã£ táº£i tá»« <https://github.com/fithcmus/awad-leetkob-eval>, hash Ä‘Ãºng, Ä‘Ã£ copy vÃ o repo lÃ m viá»‡c `PA02/leetkob-eval/` + manifest `PA02/leetkob-eval.sha256`.
2. âœ… **Kiáº¿n trÃºc:** chá»‘t **Render free (web) + Oracle Cloud Always Free (worker) + Neon Postgres**. Cáº§n Ä‘Äƒng kÃ½ 3 tÃ i khoáº£n; Oracle cáº§n tháº» xÃ¡c minh â€” ai Ä‘á»©ng tÃªn vÃ  lÃ m trong hÃ´m nay.
3. âœ… **Gemini key:** TÃ¹ng táº¡o, spending cap = 0 USD (chá»‰ free tier), chá»‰ Ä‘áº·t trÃªn Oracle worker.
4. **FAQ product owners:** váº«n chÆ°a cÃ³ cÃ¢u tráº£ lá»i â€” xem giáº£i thÃ­ch á»Ÿ má»¥c 8.1.
5. âœ… **TÃªn repo:** giá»¯ `2026-AWAD-PA02`; lÃ m trá»±c tiáº¿p trÃªn repo nÃ y.
6. **Video:** TÃ­n quay 24/11, dÃ i â‰¤5 phÃºt.
7. âœ… **Domain:** dÃ¹ng URL `https://<app>.onrender.com` cá»§a Render (HTTPS sáºµn); Oracle khÃ´ng cáº§n domain vÃ¬ chá»‰ gá»i ra ngoÃ i.
8. âœ… **NÆ¡i lÃ m viá»‡c:** `PA02/` (repo cÃ³ `.git`); `PA03/` chá»‰ giá»¯ PDF gá»‘c vÃ  báº£n káº¿ hoáº¡ch, khÃ´ng copy cáº£ PA02 sang PA03.

### 8.1 FAQ product owners â€” Ä‘Ã£ tÃ¬m vÃ  trÃ­ch dáº«n entry

FAQ Ä‘áº§y Ä‘á»§: <https://github.com/tkob-team/LeeTKOB-FAQ/blob/main/FAQ.md>. CÃ¡c entry liÃªn quan PA#3 vÃ  cÃ¡ch Ã¡p dá»¥ng:

| FAQ | Ná»™i dung | Ãp dá»¥ng trong PA#3 |
|---|---|---|
| **FAQ-01** | Admin táº¡o lá»›p/gÃ¡n TA; TA táº¡o lab; student join báº±ng invite code hoáº·c TA thÃªm; má»—i TA chá»‰ tháº¥y lá»›p cá»§a mÃ¬nh | UI admin + class isolation (403) |
| **FAQ-02** | TrÆ°á»›c háº¡n sinh viÃªn ná»™p bao nhiÃªu láº§n cÅ©ng Ä‘Æ°á»£c; bÃ i Ä‘Æ°á»£c tÃ­nh lÃ  **bÃ i ná»™p cuá»‘i**; sinh viÃªn tháº¥y verdict test nhÆ°ng **khÃ´ng tháº¥y input/output**; queue chá»‰ hiá»‡n bÃ i counted; há»‡ thá»‘ng Ä‘Æ°á»£c yarg sá»›m tá»«ng bÃ i AC | Judge cháº¡y má»—i bÃ i; chá»‰ bÃ i counted + AC vÃ o queue; UI student khÃ´ng hiá»‡n test data |
| **FAQ-04** | BÃ i khÃ´ng AC = 0 Ä‘iá»ƒm, **khÃ´ng soÃ¡t rÃ ng buá»™c**; TA cÃ³ thá»ƒ nháº­p Ä‘iá»ƒm tay 0â€“10 kÃ¨m lÃ½ do + log | Pipeline chá»‰ cháº¡y hard rule/model vá»›i bÃ i AC |
| **FAQ-05** | Defaults sandbox: compile `g++ -std=c++17 -O2` 10 s; code â‰¤ 64 KB; CPU 1 s (1â€“5); wall 3Ã—; RAM 256 MB (64â€“512); process 16; output 1 MB | Cáº¥u hÃ¬nh sandbox vÃ  judge |
| **FAQ-06** | Sinh viÃªn tháº¥y constraint + deduction tá»« lÃºc má»Ÿ lab; trang ná»™p ghi rÃµ code sáº½ Ä‘Æ°á»£c soÃ¡t báº±ng luáº­t cá»©ng + model; model chá»‰ nháº­n Ä‘á» + constraint + code Ä‘Ã£ bá» comment/tÃªn/MSSV; **model khÃ´ng quyáº¿t Ä‘iá»ƒm** | UI notice; prompt anonymize; khÃ´ng gá»­i deduction |
| **FAQ-07** | TrÆ°á»›c má»Ÿ lab: sá»­a tá»± do. Sau má»Ÿ: khÃ´ng thÃªm constraint, khÃ´ng tÄƒng deduction; chá»‰ sá»­a chá»¯ khÃ´ng Ä‘á»•i nghÄ©a, giáº£m deduction, hoáº·c xoÃ¡; sá»­a thÃ¬ soÃ¡t láº¡i | Lock constraint sau má»Ÿ lab; lÆ°u lá»‹ch sá»­ |
| **FAQ-08** | **TrÆ°á»›c publish**: sinh viÃªn **khÃ´ng** tháº¥y káº¿t quáº£ soÃ¡t; chá»‰ tháº¥y káº¿t quáº£ cháº¥m test. **Sau publish**: tháº¥y cÃ¡c khoáº£n trá»« kÃ¨m constraint, deduction, evidence, lÃ½ do. KhÃ´ng bao giá» tháº¥y verdict `unsure`, bÃ i bá»‹ bÃ¡c, máº«u 10% | UI/API student áº©n verdict trÆ°á»›c publish |
| **FAQ-09** | TA tháº¥y `unsure` kÃ¨m nguyÃªn nhÃ¢n (model tráº£ unsure / schema sai / evidence mismatch / timeout / vÆ°á»£t cost cap) + cÃ¡c dÃ²ng nghi ngá». TA pháº£i chá»n `pass`/`violation`, khÃ´ng máº·c Ä‘á»‹nh; `violation` pháº£i cÃ³ evidence; lab cÃ²n `unsure` thÃ¬ khÃ´ng Publish | `unsure_reason` trong DB; UI review |
| **FAQ-10** | Queue = má»i `violation` + má»i `unsure` + 10% sá»‘ `pass` chá»n ngáº«u nhiÃªn lÃ m trÃ²n lÃªn. TA váº«n override báº¥t ká»³ verdict nÃ o trÆ°á»›c publish; log | Queue composition; override + audit |
| **FAQ-11** | Äiá»ƒm = `max(0, 10 - tá»•ng deduction)`; má»—i constraint trá»« má»™t láº§n dÃ¹ vi pháº¡m nhiá»u chá»— | TÃ­nh Ä‘iá»ƒm cho TA |
| **FAQ-12** | Publish cáº£ lab má»™t láº§n, chá»‰ khi háº¿t háº¡n vÃ  queue khÃ´ng cÃ²n má»¥c chÆ°a quyáº¿t; Publish idempotent; khÃ´ng unpublish; sau publish sá»­a tá»«ng bÃ i kÃ¨m lÃ½ do | Publish gating (PA#3 náº¿u cÃ³) |

**TrÃ­ch dáº«n trong `PA3.md`:** cite cÃ¡c entry trÃªn (vÃ­ dá»¥ "Student chá»‰ tháº¥y káº¿t quáº£ cháº¥m test trÆ°á»›c publish â€” FAQ-08; TA tháº¥y nguyÃªn nhÃ¢n `unsure` â€” FAQ-09; queue gá»“m violation + unsure + 10% pass â€” FAQ-10").

---

## 9. Definition of Done + checklist ná»™p bÃ i

### 9.1 Theo tiÃªu chÃ­

- [ ] **C1:** TA táº¡o lab qua UI; 3 sinh viÃªn ná»™p 3 bÃ i (compliant/violation/injection) lÃªn `judged`; student tháº¥y constraint + deduction (FAQ-06) nhÆ°ng khÃ´ng tháº¥y verdict (FAQ-08); queue Ä‘á»§ verdict/evidence/deduction; TA class khÃ¡c nháº­n 403; video cÃ³.
- [ ] **C2:** 9/9 attack test trong repo + cháº¡y CI trÃªn tag; compile trong sandbox; worker riÃªng; exactly-once cÃ³ test/video; giÃ¡ trá»‹ theo FAQ-05.
- [ ] **C3:** tree-sitter; trap tháº­t (`s02`, `s03`) + fixture khÃ´ng báº¯n; báº¯t Ä‘á»§ 6 dáº¡ng ban list; model khÃ´ng gá»i khi hard rule quyáº¿t; `MODEL_OFF` 0 wrongful deduction.
- [ ] **C4:** Gemini tháº­t; prompt khÃ´ng comment/identity/deduction; schema + evidence exact; call log cÃ³ request id/token/time/cost; cost/lab cÃ³ phÃ©p tÃ­nh.
- [ ] **C5:** schema sai/timeout/evidence mismatch â†’ unsure; unsure_reason lÆ°u Ä‘Ãºng; TA pháº£i chá»n pass/violation, violation cáº§n evidence; queue = violation + unsure + 10% pass (FAQ-09, FAQ-10); student khÃ´ng tháº¥y verdict; publish (náº¿u cÃ³) tá»« chá»‘i khi cÃ²n unsure chÆ°a xá»­ lÃ½ (FAQ-12).
- [ ] **C6:** 1 lá»‡nh; Dockerfile; `MODEL_OFF=1`; dev set byte-for-byte (hash `c836â€¦`/`262câ€¦`); `runs/pa3-dev/` committed; â‰¥5 case riÃªng cÃ³ trap + injection; eval exit 0/1.
- [ ] **C7:** 6 commit/PR Ä‘Ãºng thá»© tá»±, test Ä‘i kÃ¨m, khÃ´ng ná»›i test.
- [ ] **C8:** AI-LOG cÃ³ Changed/Rejected tháº­t; "never list" trong `AGENTS.md`.
- [ ] **FAQ compliance:** cite FAQ-06, FAQ-08, FAQ-09, FAQ-10, FAQ-12 trong `PA3.md`/README; UI/API khá»›p cÃ¡c entry.

### 9.2 Checklist ná»™p

- [ ] Repo **public**, khÃ´ng secret trong lá»‹ch sá»­ (`gitleaks` sáº¡ch).
- [ ] `leetkob-eval/` hash Ä‘Ãºng `c836â€¦`/`262câ€¦`; `.gitattributes` cÃ³ `leetkob-eval/** -text`.
- [ ] Tag `pa3` Ä‘Ã£ push; CI run trÃªn tag xanh, **cÃ³ job sandbox**.
- [ ] `PA3.md` Ä‘á»§ 6 má»¥c báº¯t buá»™c; tÃ i khoáº£n test hoáº¡t Ä‘á»™ng.
- [ ] `AI-LOG.md`, `SELF_ASSESSMENT_REPORT.md` á»Ÿ root.
- [ ] `runs/pa3-dev/` cÃ³ predictions + eval report + calls.
- [ ] Video â‰¤5 phÃºt, link trong `PA3.md`.
- [ ] Zip cÃ³ `.git`, tÃªn `23120372-23120398-23120399_<total>.zip`.
- [ ] Ná»™p tá»« `23120372@student.hcmus.edu.vn` **trÆ°á»›c 18:00 25/11**.
- [ ] Deployment + monitor cháº¡y tiáº¿p Ä‘áº¿n sau PA#4.

---

## 10. Tá»± cháº¥m dá»± kiáº¿n (Ä‘á»ƒ canh má»¥c tiÃªu)

| TiÃªu chÃ­ | Má»¥c tiÃªu | Ghi chÃº |
|---|---:|---|
| 1. Flow | 13â€“15 | Cáº§n quay video dá»± phÃ²ng |
| 2. Queue + sandbox | 17â€“20 | 9/9 + CI + exactly-once |
| 3. Hard rules | 13â€“15 | tree-sitter + Ä‘á»§ trap |
| 4. Model | 17â€“20 | Call log + cost/lab Ä‘áº§y Ä‘á»§ |
| 5. Limits | 9â€“10 | 2 test fake model |
| 6. Checker + eval | 9â€“10 | Dev set nguyÃªn báº£n + Dockerfile |
| 7. Tests-first | 5 | LÃ m tháº­t ngay tá»« Ä‘áº§u |
| 8. AI-LOG | 5 | Entry cá»¥ thá»ƒ |
| **Tá»•ng má»¥c tiÃªu** | **88â€“100** | Cháº¥m tháº­n trá»ng: **khoáº£ng 90** |

> ChÃªnh lá»‡ch tá»± cháº¥m âˆ’ Ä‘iá»ƒm tháº­t trong Â±10 lÃ  bÃ¬nh thÆ°á»ng. Äá»«ng claim Ä‘iá»ƒm khi chÆ°a cÃ³ evidence.
