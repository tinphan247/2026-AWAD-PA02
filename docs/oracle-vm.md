# Oracle Cloud VM — worker + sandbox (PA#3)

Runbook cho phần hạ tầng của Tín: đăng ký Oracle, tạo VM Always Free, cài
Docker/Node, chạy worker, rồi nối Render + Neon + cron ping.

**Nguyên tắc:** key Gemini chỉ nằm trên VM này. Render không có key. Sandbox
không có key, không có mạng, không có Docker socket.

**Trạng thái code:** `src/queue/worker.js` trên `main` còn là stub
(`runWorker: not implemented`). VM và sandbox dựng được ngay, nhưng service
worker chỉ chạy thật sau khi Tùng merge `tung/queue-exactly-once` và
`tung/sandbox`. Đừng `enable` service trước đó, nó sẽ restart loop.

---

## 0. Checklist tổng

| # | Việc | Ai làm | Xong khi |
|---|---|---|---|
| 1 | Đăng ký Oracle, xác minh thẻ | Tín | Có email "account is ready" |
| 2 | Tạo VM Ubuntu 24.04, upload SSH key | Tín | `ssh ubuntu@IP` được |
| 3 | Security list chỉ mở 22 từ IP của bạn | Tín | `nmap`/scan ngoài không thấy port khác |
| 4 | Chạy `deploy/oracle-setup.sh` | Tín | `docker run hello-world` OK |
| 5 | Tạo `/etc/leetkob/worker.env` | Tín + Tùng (key) | `systemctl start` không lỗi env |
| 6 | Build image `leetkob-sandbox:latest` | Tín | `docker images` có image |
| 7 | Neon project + `DATABASE_URL` | Tín | Render và VM kết nối được |
| 8 | Render web + env | Tín | `curl /healthz` = 200 |
| 9 | Cron ping 10 phút | Tín | Lịch sử cron toàn 200 |
| 10 | Worker claim job đầu tiên | Tín + Tùng | Bài nộp chuyển `judged` |

Thời gian thực tế: 30–45 phút, chưa kể chờ Oracle duyệt tài khoản (5 phút đến
24 giờ) và chờ capacity A1.

---

## 1. Đăng ký Oracle Cloud Free Tier

Cần chuẩn bị trước:

- Email chưa từng dùng cho Oracle Cloud.
- Số điện thoại nhận SMS (số Việt Nam `+84` dùng được).
- **Thẻ Visa/Mastercard** đã bật thanh toán quốc tế. Thẻ tín dụng tốt hơn thẻ
  ghi nợ; thẻ trả trước (prepaid) và thẻ ảo thường bị từ chối.
- Tên và địa chỉ trên thẻ phải khớp với thông tin bạn nhập. Oracle không gửi
  hàng, địa chỉ chỉ dùng để xác minh.
- Chọn **home region** một lần, không đổi được. Từ Việt Nam: **Singapore
  (ap-singapore-1)** là gần nhất. Nhật (Osaka/Tokyo) là phương án hai.

Các bước:

1. Mở <https://signup.cloud.oracle.com>.
2. Country/Territory: **Vietnam**. Account type: **Individual** (dùng cá nhân,
   không cần mã số thuế doanh nghiệp).
3. Nhập email, xác nhận mã 6 số Oracle gửi.
4. Đặt password mạnh, nhập họ tên **giống trên thẻ**.
5. Home region: **Singapore**. Ghi lại region này vào `PA3.md`.
6. Xác minh số điện thoại bằng SMS.
7. Nhập thẻ: số thẻ, ngày hết hạn, CVV, tên, địa chỉ.
   - Oracle giữ tạm **~1 USD** để kiểm tra thẻ rồi hoàn lại. Đây không phải
     phí dịch vụ.
   - Nếu ngân hàng chặn: gọi hotline, nói "cho phép giao dịch quốc tế với
     Oracle", rồi thử lại. Đừng bấm nhiều lần liên tiếp, dễ bị chặn thẻ.
8. Đồng ý điều khoản, bấm **Start my free trial**.
9. Chờ email **"Your Oracle Cloud account is ready"**. Trong lúc chờ, không
   tạo tài khoản thứ hai: Oracle coi là vi phạm ToS và khoá cả hai.

Đăng nhập: <https://cloud.oracle.com> bằng email + password, hoặc bằng
**Cloud Account Name** Oracle gửi trong email.

> **Nếu đăng ký bị từ chối:** Oracle không nêu lý do. Các nguyên nhân thường
> gặp: thẻ prepaid, địa chỉ không khớp, email dùng VPN, hoặc trùng thiết bị
> với tài khoản cũ. Thử lại sau 24 giờ với thẻ khác, mạng khác. Nếu vẫn
> không được, dùng phương án dự phòng ở mục 12.

### Bảo vệ chi phí ngay sau khi vào được console

1. Góc phải → **Billing & Cost Management** → **Budgets** → **Create Budget**.
2. Name `pa3-zero`, amount **1 USD**, alert rule ở **0% actual spend**.
3. Không bấm **Upgrade to Pay As You Go**. Tài khoản Free Tier không bị trừ
   tiền cho tài nguyên Always Free; nâng cấp là mất lá chắn đó.

---

## 2. Tạo VM

Menu ☰ → **Compute** → **Instances** → **Create instance**.

| Trường | Giá trị |
|---|---|
| Name | `leetkob-worker` |
| Compartment | compartment gốc của bạn |
| Availability domain | AD-1 (nếu hết capacity, thử AD-2/AD-3) |
| Image | **Canonical Ubuntu 24.04** (đúng kiến trúc shape) |
| Shape | **Ampere → VM.Standard.A1.Flex** |
| OCPU / RAM | **2 OCPU / 12 GB** (hoặc 4/24) |
| Primary VNIC | tạo VCN mới, subnet public |
| Assign public IPv4 | **Yes** |
| SSH keys | **Paste public key** (mục 2.1) |
| Boot volume | 50 GB (mặc định) |

Always Free cho A1 là tổng **4 OCPU + 24 GB RAM** và **200 GB block storage**
trên toàn tài khoản; 2/12 để dư chỗ cho PA#4.

**Nếu báo "Out of host capacity":** đây là chuyện bình thường với A1.
- Thử availability domain khác.
- Thử lại sau vài giờ (capacity được trả về liên tục).
- Hoặc dùng **VM.Standard.E2.1.Micro** (AMD, 1 OCPU / 1 GB, luôn free). Micro
  chạy được worker + sandbox 256 MB nếu thêm 2 GB swap; script tự thêm swap
  khi RAM < 2 GB. Build image trên micro sẽ chậm (~5–10 phút).

### 2.1. Tạo SSH key trên Windows

```powershell
ssh-keygen -t ed25519 -C "leetkob-oracle" -f "$env:USERPROFILE\.ssh\leetkob_oracle"
Get-Content "$env:USERPROFILE\.ssh\leetkob_oracle.pub"
```

Dán nội dung file `.pub` vào ô **SSH keys** (một dòng, bắt đầu `ssh-ed25519`).
Không dán private key. Nếu Windows báo `UNPROTECTED PRIVATE KEY FILE`:

```powershell
icacls "$env:USERPROFILE\.ssh\leetkob_oracle" /inheritance:r /grant:r "$env:USERNAME:(R)"
```

Sau khi instance ở trạng thái **RUNNING**, copy **Public IP address** rồi:

```powershell
ssh -i "$env:USERPROFILE\.ssh\leetkob_oracle" ubuntu@<PUBLIC_IP>
```

Lần đầu bấm `yes`. Nếu timeout: kiểm tra security list ở mục 3 và IP của bạn
có đổi không (IP động).

---

## 3. Mở mạng: chỉ SSH

Worker chỉ cần **outbound**. Không mở 3000, 5432 hay bất kỳ port nào vào VM.

1. Menu ☰ → **Networking** → **Virtual Cloud Networks** → VCN của instance →
   **Security** → **Default Security List**.
2. **Xoá** ingress rule mặc định `0.0.0.0/0 → TCP 22`. Giữ lại chỉ nếu bạn
   thật sự muốn SSH từ mọi nơi.
3. **Add Ingress Rule**:
   - Source Type: **CIDR**
   - Source CIDR: `<IP nhà bạn>/32` (lấy tại <https://ifconfig.me>)
   - IP Protocol: **TCP**
   - Destination Port Range: **22**
4. Không thêm ingress nào khác.

Ubuntu trên Oracle đã có sẵn iptables chặn mọi thứ trừ 22; **không cài hay bật
`ufw`**, hai lớp firewall sẽ đánh nhau. Nếu sau này dựng web dự phòng trên VM
(mục 12), phải mở ở **cả** security list **và** iptables.

---

## 4. Cài đặt bằng script

Repo có sẵn `deploy/oracle-setup.sh` (idempotent, chạy lại được):

```bash
# PA#3 chưa merge vào main thì lấy từ nhánh:
curl -fsSLO https://raw.githubusercontent.com/tinphan247/2026-AWAD-PA02/feat/pa3-scaffold/deploy/oracle-setup.sh
# Sau khi merge:
# curl -fsSLO https://raw.githubusercontent.com/tinphan247/2026-AWAD-PA02/main/deploy/oracle-setup.sh
less oracle-setup.sh          # đọc trước khi chạy, nhất là phần get.docker.com
bash oracle-setup.sh
```

Script làm:

1. `apt update` + gói cơ bản.
2. Thêm 2 GB swap nếu RAM < 2 GB (micro).
3. Cài Docker qua script chính thức của Docker, bật `docker.service`, thêm
   `ubuntu` vào group `docker`.
4. Cài Node.js 24 LTS từ NodeSource.
5. Clone repo vào `~/leetkob` (mặc định branch `main`).
6. `npm ci --omit=dev`.
7. Build `leetkob-sandbox:latest` từ `sandbox/Dockerfile`.
8. Tạo `/etc/leetkob` và `/var/log/leetkob` với quyền hẹp.
9. Chạy `hello-world` và smoke test sandbox.

Nếu `sandbox/Dockerfile` chưa có (Tùng chưa merge), script cảnh báo và bỏ qua
bước build; chạy lại sau khi merge.

Biến có thể truyền:

```bash
BRANCH=feat/pa3-scaffold bash oracle-setup.sh   # chạy thử trước khi merge
REPO_DIR=/opt/leetkob bash oracle-setup.sh      # đổi thư mục
```

Sau khi script xong, **logout rồi login lại** để group `docker` có hiệu lực
(và để systemd thấy group mới).

Kiểm tra:

```bash
docker run --rm hello-world
docker images | grep leetkob-sandbox
node --version        # v24.x
free -h
```

Smoke test sandbox (không cần mạng, không cần code):

```bash
docker run --rm --network=none leetkob-sandbox:latest 1 3 1048576 10 </dev/null
# in ra: PROTOCOL bad-input   (đúng: stdin rỗng, runner từ chối)
```

---

## 5. Cấu hình worker

### 5.1. File env

```bash
sudo install -m 600 -o root -g root /dev/null /etc/leetkob/worker.env
sudo nano /etc/leetkob/worker.env
```

Nội dung (mẫu đầy đủ ở `deploy/worker.env.example`):

```ini
NODE_ENV=production
DATABASE_URL=postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require
GEMINI_API_KEY=<key Tùng giao>
MODEL_NAME=gemini-2.5-flash
MODEL_SPEND_CAP_USD=0
MODEL_TIMEOUT_MS=20000
MODEL_CALL_LOG=/var/log/leetkob/model-calls.jsonl
WORKER_ID=oracle-1
POLL_INTERVAL_MS=5000
SANDBOX_IMAGE=leetkob-sandbox:latest
```

| Biến | Ý nghĩa | Lấy ở đâu |
|---|---|---|
| `DATABASE_URL` | Postgres Neon, **pooled**, có `sslmode=require` | Neon → Connection string |
| `GEMINI_API_KEY` | key model | Tùng tạo, gửi qua kênh riêng, không commit |
| `MODEL_NAME` | model ID | `gemini-2.5-flash` |
| `MODEL_SPEND_CAP_USD` | cap theo giá list | `0` (free tier) |
| `MODEL_TIMEOUT_MS` | timeout mỗi call | `20000` |
| `MODEL_CALL_LOG` | JSONL call log | `/var/log/leetkob/model-calls.jsonl` |
| `WORKER_ID` | lease owner trong DB | `oracle-1` |
| `POLL_INTERVAL_MS` | nhịp poll | `5000`, tăng khi Neon gần hạn mức |
| `SANDBOX_IMAGE` | image sandbox | `leetkob-sandbox:latest` |

Quy tắc:

- File phải `600 root:root`. Không đặt key trong `docker-compose.yml`, không
  `export` trong `.bashrc`, không dán vào chat/PR.
- Nếu `src/queue/worker.js` sau khi merge đọc tên biến khác
  (`MODEL_API_KEY`), sửa theo mã. Đừng đặt cả hai nếu không cần.
- `GEMINI_API_KEY` **không** được có trên Render và **không** được truyền vào
  sandbox. `src/sandbox/run.js` đã chỉ chuyển `PATH/HOME/DOCKER_*` cho docker
  CLI, không chuyển env của worker vào container.

### 5.2. systemd

```bash
sudo cp ~/leetkob/deploy/leetkob-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
```

**Chưa enable ngay** nếu `worker.js` còn stub. Kiểm tra:

```bash
cd ~/leetkob && git log --oneline -3 && grep -n "not implemented" src/queue/worker.js
```

Khi Tùng đã merge (không còn `not implemented`):

```bash
sudo systemctl enable --now leetkob-worker
sudo systemctl status leetkob-worker --no-pager
sudo journalctl -u leetkob-worker -f
```

Unit file đã có `Restart=always`, `RestartSec=15`, `SupplementaryGroups=docker`
và `ExecStopPost` dọn các container `leetkob-sbx-*` còn sót.

Nếu sửa `WorkingDirectory` (ví dụ clone vào `/opt/leetkob`), sửa cả unit và
`REPO_DIR` trong script cho khớp.

---

## 6. Neon (Postgres)

1. <https://neon.tech> → đăng nhập bằng GitHub → **New Project**.
2. Region: **Singapore** (gần Render và VM).
3. Postgres 16 hoặc 17, database `leetkob`.
4. **Connection string** → chọn **Pooled connection** → copy. Dạng:

   ```text
   postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/leetkob?sslmode=require
   ```

5. Chạy migration **sau khi** Tùng merge `db/migrations/`:

   ```bash
   psql "$DATABASE_URL" -f db/migrations/001_init.sql
   ```

   Nếu máy chưa có `psql`: chạy từ Neon SQL Editor (dán nội dung file), hoặc
   `docker run --rm -e DATABASE_URL -v "$PWD/db:/db" postgres:16 psql "$DATABASE_URL" -f /db/migrations/001_init.sql`.

6. Kiểm tra bảng:

   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public' order by 1;
   ```

Neon free: 100 CU-hour/project/tháng, scale-to-zero sau 5 phút idle. Worker
phải backoff khi DB ngủ; nếu thấy log lỗi kết nối lặp lại, tăng
`POLL_INTERVAL_MS` lên `15000`–`30000`.

---

## 7. Render (web)

1. <https://dashboard.render.com> → **New** → **Web Service**.
2. Connect repo `tinphan247/2026-AWAD-PA02`.
3. Branch: **main** (sau khi PR PA#3 merge).
4. Runtime: **Docker**. Dockerfile path: `./Dockerfile`.
5. Instance type: **Free**.
6. Health check path: **`/healthz`**.
7. Environment:

   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URL` | chuỗi Neon pooled ở mục 6 |
   | `NODE_ENV` | `production` |
   | `HOST` | `0.0.0.0` (Dockerfile đã đặt; chỉ thêm nếu dùng runtime Node) |

   **Không** đặt `GEMINI_API_KEY`/`MODEL_API_KEY`. Không đặt `PORT`: Render
   tự gán và `src/main.js` đọc biến đó.
8. **Create Web Service**, chờ deploy xong, rồi:

   ```bash
   curl -i https://<app>.onrender.com/healthz
   # HTTP/1.1 200 OK  {"status":"ok"}
   ```

9. Mở `/` bằng trình duyệt, đăng nhập `ta1-token`, tạo lab thử.

Lưu ý free tier:

- Ngủ sau 15 phút không có request; request đầu tiên sau ngủ mất 30–60 giây.
- 750 giờ/tháng. Chạy 24/7 là ~730 giờ, sát trần → cron ping ở mục 8 vừa giữ
  thức vừa tốn giờ; nếu gần cuối tháng thấy vượt, tạm tắt cron và chấp nhận
  ngủ.
- Auto-deploy mỗi lần push `main`. Đừng push thẳng `main` (branch protection).

---

## 8. Cron ping giữ Render thức

Dùng cron-job.org (miễn phí, không cần thẻ):

1. <https://cron-job.org> → đăng ký → **Create cronjob**.
2. Title: `leetkob-healthz`.
3. URL: `https://<app>.onrender.com/healthz`.
4. Schedule: **Every 10 minutes**.
5. Advanced: bật **Save responses**, tắt follow redirect (endpoint trả 200
   trực tiếp).
6. Notifications: bật email khi fail.
7. Save → **Run now** → xem lịch sử phải là `200`.

Kiểm tra sau 30 phút: lịch sử toàn 200, không có 502/503. Nếu có 502 lẻ tẻ ngay
sau deploy là bình thường.

Phương án khác: UptimeRobot 5 phút. GitHub Actions schedule không phù hợp:
delay 5–15 phút và tự tắt sau 60 ngày không commit.

Giữ VM Oracle không bị thu hồi: Oracle có thể thu hồi instance Always Free
nhàn rỗi. Thêm cron nhẹ trên VM:

```bash
crontab -e
# mỗi ngày 03:00 dọn image cũ; đủ để có hoạt động đều
0 3 * * * /usr/bin/docker image prune -f >/dev/null 2>&1
```

---

## 9. Kiểm tra cuối (làm theo thứ tự)

```bash
# 1. Render sống
curl -fsS https://<app>.onrender.com/healthz && echo

# 2. VM: service và image
sudo systemctl is-active leetkob-worker
sudo docker images --format '{{.Repository}}:{{.Tag}}' | grep leetkob-sandbox

# 3. VM: worker nối được Neon (không in mật khẩu)
set -a; sudo cat /etc/leetkob/worker.env | grep '^DATABASE_URL=' > /tmp/db.env; set +a
. /tmp/db.env; rm -f /tmp/db.env
host=$(printf '%s' "$DATABASE_URL" | sed -E 's#^[^@]*@##; s#[:/].*$##')
timeout 8 openssl s_client -connect "$host:5432" -brief </dev/null

# 4. Worker log
sudo journalctl -u leetkob-worker -n 30 --no-pager
```

Trên UI, chạy đúng kịch bản demo:

1. `ta1-token` tạo lab có 2 constraint và 2 cặp test.
2. `sv1-token` nộp bài sạch, `sv2-token` nộp bài gọi `std::sort`,
   `sv3-token` nộp bài injection.
3. Bài chuyển `queued → judging → judged`.
4. `ta1-token` thấy violation kèm evidence đúng dòng, pass nằm ngoài mẫu 10%,
   `unsure` có lý do.
5. `ta2-token` mở lab lớp 1 → 403.
6. Call log có dòng mới và **không** chứa MSSV:

   ```bash
   sudo tail -n 1 /var/log/leetkob/model-calls.jsonl
   sudo grep -c '23120372' /var/log/leetkob/model-calls.jsonl || true   # phải là 0
   ```

7. Student mở lại bài: chỉ thấy trạng thái + kết quả test, chưa thấy verdict
   constraint (FAQ-08).

---

## 10. Chi phí

| Dịch vụ | Gói | Giới hạn | Cách giữ trong free |
|---|---|---|---|
| Oracle | Always Free | 4 OCPU/24 GB A1, 200 GB storage, 10 TB egress | không nâng cấp PAYG, budget alert |
| Render | Free | 750 giờ/tháng, ngủ sau 15 phút | cron 10 phút; tắt cron nếu sát trần |
| Neon | Free | 100 CU-hour/tháng, 0,5 GB | worker backoff, không poll dày |
| Gemini | Free tier | theo hạn mức ngày | cap 0, call log theo dõi |

Model cost của lab demo ghi vào `PA3.md` §8 theo giá list; hoá đơn thực tế 0.

---

## 11. Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `Out of host capacity` | A1 hết chỗ ở AD | đổi AD, thử lại sau vài giờ, hoặc micro + swap |
| `Permission denied (publickey)` | sai user/key/quyền file | user `ubuntu`, đúng file key, `icacls` ở mục 2.1 |
| SSH timeout | security list chặn IP mới | cập nhật CIDR `/32` |
| `permission denied /var/run/docker.sock` | chưa login lại sau `usermod` | logout/login, hoặc `sudo` |
| Service restart loop `runWorker: not implemented` | chưa merge nhánh Tùng | `systemctl disable --now`, chờ merge |
| `sandbox did not start` | thiếu image hoặc Docker chết | `docker images`, `systemctl status docker` |
| Worker không claim job | sai `DATABASE_URL`, chưa migration, hoặc chưa có job | log worker, `select * from submissions` |
| Neon lỗi kết nối lặp lại | DB ngủ / hết CU-hour | tăng `POLL_INTERVAL_MS`, xem Usage |
| Render 502 sau deploy | bind `127.0.0.1` | đặt `HOST=0.0.0.0` (Dockerfile đã có) |
| Render ngủ dù có cron | cron sai URL/giờ, hoặc job bị tắt | xem lịch sử cron, bấm Run now |
| Hết 750 giờ Render | ping 24/7 + deploy | tạm tắt cron, hoặc chuyển web sang VM (mục 12) |

---

## 12. Phương án dự phòng

Nếu Oracle không duyệt tài khoản hoặc không có capacity A1 sau 24 giờ:

- **Micro AMD** vẫn đủ cho worker + sandbox: thêm swap (script tự làm), build
  image một lần, chấp nhận chậm.
- Nếu Oracle bế tắc hoàn toàn: chuyển **web** lên VM bằng `web` + `caddy`
  trong `docker-compose.yml`, giữ Neon; worker chạy cùng máy. Cần mở 80/443 ở
  security list **và** iptables. Cập nhật URL trong `PA3.md`.
- Phương án cuối: thuê VPS 1–2 USD/tháng (Vultr/Hetzner), vẫn giữ kiến trúc
  worker + Docker. Ghi rõ trong `PA3.md` nếu phải đổi.

---

## 13. Việc không được làm

- Không đặt key Gemini trên Render, trong repo, trong `docker-compose.yml`,
  hay trong biến môi trường của sandbox.
- Không mount `/var/run/docker.sock` vào sandbox, không `--privileged`,
  không `--env-file` cho container sandbox.
- Không mở port database ra Internet. Neon chỉ nhận kết nối TLS có mật khẩu.
- Không chạy `npm test` cần mạng trên VM; test offline chạy ở máy local/CI.
- Không dùng chung một tài khoản Oracle cho nhiều người; Tín là chủ tài khoản,
  Tùng/Tuệ không cần quyền vào console.
