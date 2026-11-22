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

1. New Web Service, connect the GitHub repo, build from the root `Dockerfile`
   (recommended; it is also what `docker-compose.yml` builds) or use the Node
   runtime with `npm ci && npm start`, on the `main` branch.
2. Environment variables: `DATABASE_URL`, `NODE_ENV=production`, and
   `HOST=0.0.0.0` when using the Node runtime. The root `Dockerfile` already
   sets `HOST`; `src/main.js` otherwise binds `127.0.0.1` and the service is
   unreachable. Do not set `PORT` (Render provides it). **Do not set
   `MODEL_API_KEY` or `GEMINI_API_KEY` here.**
3. Health check path: `/healthz` (or `/health`).
4. Free tier sleeps after 15 minutes of inactivity: create a cron-job.org job
   that GETs `https://<app>.onrender.com/healthz` every 10 minutes
   (24/7 ≈ 730 h/month, just under the 750 h limit).

## 3. Oracle Cloud Always Free (worker + sandbox)

Step-by-step runbook, including signup, card verification, SSH keys, firewall
and systemd: [`docs/oracle-vm.md`](oracle-vm.md). The bootstrap script is
[`deploy/oracle-setup.sh`](../deploy/oracle-setup.sh).

1. Sign up at https://www.oracle.com/cloud/free/ (card required for
   verification, no charge on Always Free). Tín owns this account.
2. Create a VM: "Always Free" Ampere A1 (4 OCPU / 24 GB) or, if capacity is
   gone, an AMD micro (1 GB, add 2 GB swap).
3. Open only SSH (22) in the security list, restricted to your own IP; the
   worker needs **outbound** only.
4. Run `deploy/oracle-setup.sh`: it installs Docker and Node 24, clones the
   repo, builds `leetkob-sandbox:latest` and prepares `/etc/leetkob` and
   `/var/log/leetkob`.
5. Set env in `/etc/leetkob/worker.env` (mode 600): `DATABASE_URL`,
   `GEMINI_API_KEY` (from Tùng), `MODEL_NAME`, `MODEL_SPEND_CAP_USD`,
   `MODEL_TIMEOUT_MS`, `MODEL_CALL_LOG`, `WORKER_ID`, `POLL_INTERVAL_MS`,
   `SANDBOX_IMAGE`. Template: `deploy/worker.env.example`.
6. Install `deploy/leetkob-worker.service` and enable it **after** the queue
   branch is merged. The worker runs on the host, not in a container, because
   `src/sandbox/run.js` starts sandbox containers with the Docker CLI. Do not
   use `docker compose up worker`: compose would also start a local Postgres,
   and a worker container would need the Docker socket.
7. Budget alert at 0 USD; do not upgrade to Pay As You Go.

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

## Local stack

`docker-compose.yml` builds the root `Dockerfile` for both `web` and `worker`
and starts `postgres:16`. It needs a running Docker daemon:

```bash
docker compose up --build
```

The web service is then on <http://127.0.0.1:3000>. `npm test` does not need
this stack: it runs offline against the in-memory repo.