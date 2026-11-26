# PA#3 deployment — Render free + cloud VM worker + Neon

Chosen architecture (see `PA3_PLAN.md` §3.1): the web/API runs on Render's free
tier, the worker and the Docker sandbox run on a small Ubuntu VM, and Postgres
lives on Neon's free tier. The Gemini key exists only on that worker VM.

Oracle Cloud Always Free was the first choice, but A1 capacity was unavailable,
so the VM runs on **Azure for Students**. The bootstrap script is
provider-agnostic: [`docs/azure-vm.md`](azure-vm.md) is the current runbook,
[`docs/oracle-vm.md`](oracle-vm.md) is kept for the Always Free fallback.

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

## 3. Cloud VM (worker + sandbox)

**Current: Azure for Students.** Step-by-step runbook:
[`docs/azure-vm.md`](azure-vm.md). The bootstrap script is
[`deploy/oracle-setup.sh`](../deploy/oracle-setup.sh) (provider-agnostic despite
the name: it installs Docker and Node 24, clones the repo, builds
`leetkob-sandbox:latest`, prepares `/etc/leetkob` and `/var/log/leetkob`, and
installs the systemd unit with the right `User=`/`WorkingDirectory=`).

1. Create a VM: Ubuntu 24.04, size ≥ 2 GB RAM (`Standard_B1ms` or `B2s`),
   region near Neon, SSH public key, no extra inbound ports.
2. Open only SSH (22) in the NSG, restricted to your own IP; the worker needs
   **outbound** only.
3. `BRANCH=feat/pa3-scaffold bash deploy/oracle-setup.sh` on the VM.
4. Set env in `/etc/leetkob/worker.env` (mode 600): `DATABASE_URL`,
   `GEMINI_API_KEY` (from Tùng), `MODEL_NAME`, `MODEL_TIMEOUT_MS`,
   `MODEL_CALL_LOG`, `WORKER_ID`, `POLL_INTERVAL_MS`, `SANDBOX_IMAGE`.
   Template: `deploy/worker.env.example`. The per-lab budget is
   `labs.cost_cap_usd` in Postgres, not an env var.
5. `sudo systemctl enable --now leetkob-worker`. The worker runs on the host,
   not in a container, because `src/sandbox/run.js` starts sandbox containers
   with the Docker CLI. Do not use `docker compose up worker`: compose would
   also start a local Postgres, and a worker container would need the Docker
   socket.
6. Budget/cost alert; stop the VM when marking is finished.

Oracle Cloud Always Free remains a valid fallback: the same script and unit
work there, and [`docs/oracle-vm.md`](oracle-vm.md) covers signup, card
verification and firewall. Do not upgrade Oracle to Pay As You Go.

## 4. Cron ping

- cron-job.org: GET `https://<app>.onrender.com/healthz` every 10 minutes.
- Optional: a second job that runs a tiny CPU task on the worker VM every few
  hours so an Always Free instance is not reclaimed as idle (Azure does not
  reclaim; this only matters on Oracle).

## 5. Accounts and test data

- Admin creates classes and assigns TAs (FAQ-01).
- TA creates the lab from the `sort-merge` dev-set problem through the UI.
- Test accounts for `PA3.md`: 1 admin, 2 TAs in 2 different classes, and 3
  students in the first TA's class (2 required + 1 extra for the three demo
  submissions, FAQ-02).

## 6. Verification

- `curl https://<app>.onrender.com/healthz` returns 200.
- `docker run hello-world` works on the worker VM.
- Worker connects to Neon and claims a job.
- Submitting a solution on Render results in a judged submission and a row in
  the review queue.

## Fallback

If Render runs out of the 750 free hours or sleeps during marking, move the web
service onto the worker VM: run `web` + `caddy` in the same `docker-compose.yml`,
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