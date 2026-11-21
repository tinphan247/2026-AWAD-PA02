# PA#3 deployment — Render free + Oracle worker + Neon

Chosen architecture (see `PA3_PLAN.md` §3.1): the web/API runs on Render's free
tier, the worker and the Docker sandbox run on an Oracle Cloud Always Free VM,
and Postgres lives on Neon's free tier. The Gemini key exists only on the
Oracle worker.

## 1. Neon (database)

1. Create a free project at https://neon.tech (no card required).
2. Copy the pooled connection string (TLS) into `DATABASE_URL`.
3. Run the migrations in `db/migrations/` (Tùng owns this folder).
4. Neon scales to zero after 5 minutes of idle; the worker retries with backoff.

## 2. Render (web)

1. New Web Service, connect the GitHub repo, build from `Dockerfile` (or Node
   runtime) on the `main` branch.
2. Environment variables: `DATABASE_URL`, `PORT`. **Do not set `MODEL_API_KEY`
   or `GEMINI_API_KEY` here.**
3. Health check path: `/healthz` (or `/health`).
4. Free tier sleeps after 15 minutes of inactivity: create a cron-job.org job
   that GETs `https://<app>.onrender.com/healthz` every 10 minutes
   (24/7 ≈ 730 h/month, just under the 750 h limit).

## 3. Oracle Cloud Always Free (worker + sandbox)

1. Sign up at https://www.oracle.com/cloud/free/ (card required for
   verification, no charge on Always Free). Tín owns this account.
2. Create a VM: "Always Free" Ampere A1 (4 OCPU / 24 GB) or, if capacity is
   gone, an AMD micro (1 GB). Region with available capacity.
3. Open only SSH (22) in the security list; the worker needs **outbound** only.
4. Install Docker and create a non-root user (`useradd -m -u 1000 sandbox` is
   already in the sandbox image).
5. Set env on the VM: `DATABASE_URL`, `GEMINI_API_KEY` (from Tùng), `MODEL_NAME`,
   `MODEL_SPEND_CAP_USD`, `WORKER_ID`.
6. Run the worker: `docker compose up -d worker` (or `node worker/index.js`
   under a process manager).
7. Budget alert at 0 USD.

## 4. Cron ping

- cron-job.org: GET `https://<app>.onrender.com/healthz` every 10 minutes.
- Optional: a second job that runs a tiny CPU task on the Oracle VM every few
  hours so Oracle does not reclaim it as idle.

## 5. Accounts and test data

- Admin creates classes and assigns TAs (FAQ-01).
- TA creates the lab from the `sort-merge` dev-set problem through the UI.
- Test accounts for `PA3.md`: 1 admin, 2 TAs in 2 different classes, and 3
  students in the first TA's class (2 required + 1 extra for the three demo
  submissions, FAQ-02).

## 6. Verification

- `curl https://<app>.onrender.com/healthz` returns 200.
- `docker run hello-world` works on the Oracle VM.
- Worker connects to Neon and claims a job.
- Submitting a solution on Render results in a judged submission and a row in
  the review queue.

## Fallback

If Render runs out of the 750 free hours or sleeps during marking, move the web
service onto the Oracle VM: run `web` + `caddy` in the same `docker-compose.yml`,
point `DATABASE_URL` at Neon, and update `PA3.md` with the new URL. No code
changes are needed.