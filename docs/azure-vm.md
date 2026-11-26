# Azure VM — worker + sandbox (PA#3)

Runbook cho phần hạ tầng của Tín, dùng khi Oracle hết capacity. Azure for
Students đã đăng nhập được, nên đây là phương án chính; mọi bước dưới đây dùng
portal Azure và cùng một script với Oracle (`deploy/oracle-setup.sh`, script
không phụ thuộc provider).

**Nguyên tắc:** key Gemini chỉ nằm trên VM này. Render không có key. Sandbox
không có key, không có mạng, không có Docker socket.

> Đây là VM trả tiền bằng credit sinh viên, không phải Always Free. Bật budget
> alert và tắt VM khi chấm xong (mục 8).

---

## 0. Checklist

| # | Việc | Xong khi |
|---|---|---|
| 1 | Tạo VM Ubuntu 24.04, SSH key, size ≥ 2 GB RAM | `ssh azureuser@IP` được |
| 2 | NSG: chỉ mở 22 từ IP của bạn | scan ngoài không thấy port khác |
| 3 | Chạy `deploy/oracle-setup.sh` | `docker run hello-world` OK |
| 4 | `/etc/leetkob/worker.env` (mode 600) | `systemctl start` không lỗi env |
| 5 | `systemctl enable --now leetkob-worker` | `is-active` = `active` |
| 6 | Nộp bài trên Render | bài chuyển `judged` |

Thời gian: ~20 phút, chưa kể build sandbox image lần đầu (2–5 phút trên B2s).

---

## 1. Tạo VM

<https://portal.azure.com> → **Virtual machines** → **Create** → **Azure virtual
machine**.

| Trường | Giá trị |
|---|---|
| Subscription | **Azure for Students** |
| Resource group | `leetkob-rg` (Create new) |
| Virtual machine name | `leetkob-worker` |
| Region | **Southeast Asia** (Singapore, gần Neon) — nếu báo hết size thì thử **East Asia** |
| Availability options | **No infrastructure redundancy required** |
| Security type | **Standard** (Trusted launch cũng được với Ubuntu 24.04 Gen2) |
| Image | **Ubuntu Server 24.04 LTS - x64 Gen2** |
| Size | **Standard_B1ms** (1 vCPU / 2 GB) hoặc **Standard_B2s** (2 vCPU / 4 GB) |
| Authentication type | **SSH public key** |
| Username | `azureuser` (mặc định) |
| SSH public key source | **Use existing public key** (mục 1.1) |
| Public inbound ports | **None** (mở ở mục 2) |
| OS disk type | **Standard SSD**, 30 GB (đừng chọn Premium) |

`B1ms` đủ cho worker + sandbox 256 MB; `B2s` nhanh hơn khi build image và khi
chạy nhiều bài cùng lúc. Tránh `B1s` (1 GB) trừ khi chỉ còn size đó: script tự
thêm 2 GB swap nhưng build sẽ chậm.

Nếu portal báo **`NotAvailableForSubscription`** hoặc **quota exceeded**: đổi
region, hoặc **Subscription → Usage + quotas** để xin tăng vCPU cho họ B ở
region đó (thường duyệt tự động trong vài phút).

### 1.1. SSH key trên Windows

```powershell
ssh-keygen -t ed25519 -C "leetkob-azure" -f "$env:USERPROFILE\.ssh\leetkob_azure"
Get-Content "$env:USERPROFILE\.ssh\leetkob_azure.pub"
```

Dán **một dòng** bắt đầu bằng `ssh-ed25519` vào ô SSH public key. Không dán
private key. Nếu Windows báo `UNPROTECTED PRIVATE KEY FILE`:

```powershell
icacls "$env:USERPROFILE\.ssh\leetkob_azure" /inheritance:r /grant:r "$env:USERNAME:(R)"
```

Sau khi deployment xong (**Go to resource** → **Public IP address**):

```powershell
ssh -i "$env:USERPROFILE\.ssh\leetkob_azure" azureuser@<PUBLIC_IP>
```

Lần đầu bấm `yes`.

---

## 2. Mở mạng: chỉ SSH

Worker chỉ cần **outbound** (Neon + Gemini). Không mở 3000, 5432 hay port nào
khác.

1. VM → **Networking** → **Network settings** (hoặc **Add inbound port rule**).
2. Xoá/sửa rule mặc định `SSH` đang cho `0.0.0.0/0` nếu có.
3. **Add inbound port rule**:
   - Source: **My IP** (hoặc `IP Addresses` = `<IP nhà bạn>/32`, lấy ở
     <https://ifconfig.me>)
   - Destination port ranges: **22**
   - Protocol: **TCP**
   - Action: **Allow**
   - Priority: `300`
   - Name: `ssh-my-ip`

Azure chỉ lọc ở NSG; Ubuntu image của Azure **không** có iptables chặn sẵn và
không bật `ufw`. **Không cài/bật `ufw`** — thêm một lớp firewall nữa chỉ làm
rối khi debug. Nếu IP nhà đổi, sửa lại rule.

---

## 3. Cài đặt bằng script

```bash
curl -fsSLO https://raw.githubusercontent.com/tinphan247/2026-AWAD-PA02/feat/pa3-scaffold/deploy/oracle-setup.sh
less oracle-setup.sh          # đọc trước, nhất là phần get.docker.com
BRANCH=feat/pa3-scaffold bash oracle-setup.sh
```

Script làm (idempotent, chạy lại được):

1. `apt update` + gói cơ bản; thêm 2 GB swap nếu RAM < 2 GB.
2. Cài Docker (script chính thức), bật `docker.service`, thêm `$USER` vào group
   `docker`.
3. Cài Node.js 24 LTS từ NodeSource.
4. Clone repo vào `~/leetkob`, `npm ci --omit=dev`.
5. Build `leetkob-sandbox:latest` từ `sandbox/Dockerfile`.
6. Tạo `/etc/leetkob` (root, 0750) và `/var/log/leetkob` (user, 0750).
7. Cài `/etc/systemd/system/leetkob-worker.service` với `User=$USER` và
   `WorkingDirectory=$REPO_DIR` — trên Azure là `azureuser`, không phải
   `ubuntu`, nên đừng copy tay file template.
8. Smoke test `hello-world` + sandbox với stdin rỗng.

Sau khi xong, **logout rồi login lại** để group `docker` có hiệu lực.

Kiểm tra:

```bash
docker run --rm hello-world
docker images | grep leetkob-sandbox
node --version        # v24.x
free -h
```

Smoke test sandbox (không cần mạng):

```bash
docker run --rm --network=none leetkob-sandbox:latest 1 3 1048576 10 </dev/null
# in ra: PROTOCOL bad-input   (đúng: stdin rỗng, runner từ chối)
```

---

## 4. Cấu hình worker

### 4.1. File env

```bash
sudo install -m 600 -o root -g root /dev/null /etc/leetkob/worker.env
sudo nano /etc/leetkob/worker.env
```

Nội dung (mẫu đầy đủ: `deploy/worker.env.example`):

```ini
NODE_ENV=production
DATABASE_URL=postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require
GEMINI_API_KEY=<key Tùng giao>
MODEL_NAME=gemini-2.5-flash
MODEL_TIMEOUT_MS=20000
MODEL_CALL_LOG=/var/log/leetkob/model-calls.jsonl
WORKER_ID=azure-1
POLL_INTERVAL_MS=5000
WORKER_MAX_IDLE_MS=30000
SANDBOX_IMAGE=leetkob-sandbox:latest
```

Quy tắc:

- File phải `600 root:root`. Không đặt key trong `docker-compose.yml`, không
  `export` trong `.bashrc`, không dán vào chat/PR.
- `GEMINI_API_KEY` **không** có trên Render và **không** được truyền vào
  sandbox. `src/sandbox/run.js` chỉ chuyển `PATH/HOME/DOCKER_*` cho docker CLI.
- `MODEL_SPEND_CAP_USD` không được worker đọc: cap theo `labs.cost_cap_usd`
  trong Postgres; đặt spending cap phía Google console.

### 4.2. systemd

Unit đã được script cài sẵn. Xem lại cho chắc:

```bash
systemctl cat leetkob-worker | head -30
# phải thấy User=azureuser và WorkingDirectory=/home/azureuser/leetkob
```

Rồi:

```bash
sudo systemctl enable --now leetkob-worker
sudo systemctl status leetkob-worker --no-pager
sudo journalctl -u leetkob-worker -f
```

Không có `GEMINI_API_KEY` thì worker vẫn chạy: hard rules quyết ban list, mọi
constraint semantic thành `unsure` (giống `MODEL_OFF=1`), và in cảnh báo lúc
khởi động.

Unit có `Restart=always`, `RestartSec=15`, `SupplementaryGroups=docker` và
`ExecStopPost` dọn các container `leetkob-sbx-*` còn sót.

---

## 5. Kiểm tra cuối

```bash
# 1. Service và image
sudo systemctl is-active leetkob-worker
sudo docker images --format '{{.Repository}}:{{.Tag}}' | grep leetkob-sandbox

# 2. Worker nối được Neon (không in mật khẩu)
host=$(sudo sed -n 's/^DATABASE_URL=[^@]*@\([^:/]*\).*/\1/p' /etc/leetkob/worker.env)
timeout 8 openssl s_client -connect "$host:5432" -brief </dev/null

# 3. Log worker: phải thấy dòng poll, không có lỗi env
sudo journalctl -u leetkob-worker -n 30 --no-pager
```

Trên UI Render, chạy kịch bản demo (giống `docs/oracle-vm.md` §9):

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

---

## 6. Chi phí và credit

| Dịch vụ | Gói | Giới hạn | Cách giữ trong hạn mức |
|---|---|---|---|
| Azure VM | Azure for Students ($100 credit) | B1ms ~0.02 USD/h (~0.5 USD/ngày) | tắt VM khi không chấm; budget alert |
| Render | Free | 750 giờ/tháng, ngủ sau 15 phút | cron 10 phút |
| Neon | Free | 100 CU-hour/tháng, 0,5 GB | tăng `POLL_INTERVAL_MS` nếu gần hạn mức |
| Gemini | Free tier | hạn mức ngày | spending cap phía Google; `labs.cost_cap_usd` |

Bật cảnh báo chi phí: **Cost Management + Billing → Cost alerts → Add**,
ngưỡng **1 USD** và **10 USD**, gửi mail cho tài khoản trường.

Tắt VM (giữ ổ đĩa, không mất dữ liệu):

```bash
sudo shutdown -h now
# hoặc portal: VM → Stop
```

Portal → VM → **Auto-shutdown** **không** nên bật khi đang chấm bài, nhưng bật
sau khi nộp để quên VM cũng không bị trừ credit.

---

## 7. Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `Permission denied (publickey)` | sai user/key/quyền file | user `azureuser`, đúng file key, `icacls` ở mục 1.1 |
| SSH timeout | NSG chặn IP mới | sửa rule `ssh-my-ip` |
| `NotAvailableForSubscription` | size không có ở region / hết quota | đổi region hoặc xin tăng quota |
| `permission denied /var/run/docker.sock` | chưa login lại sau `usermod` | logout/login, hoặc `sudo` |
| Service restart loop `DATABASE_URL is not set` | thiếu `/etc/leetkob/worker.env` | `systemctl disable --now`, tạo env, rồi `enable --now` |
| `Unit ... not found` | script chưa chạy tới bước systemd | `sudo systemctl daemon-reload`, kiểm tra `/etc/systemd/system/leetkob-worker.service` |
| Unit chạy sai nhà | file template copy tay (`User=ubuntu`) | chạy lại script, hoặc `sudo systemctl edit --full` sửa `User`/`WorkingDirectory` |
| Mọi constraint semantic thành `unsure` | thiếu `GEMINI_API_KEY` hoặc chạm `labs.cost_cap_usd` | xem log khởi động, `select sum(cost_usd) from model_calls` |
| `sandbox did not start` | thiếu image hoặc Docker chết | `docker images`, `systemctl status docker` |
| Worker không claim job | sai `DATABASE_URL`, chưa migration, hoặc chưa có job | log worker, `select * from submissions` |
| Build sandbox rất chậm / hết RAM | size 1 GB | dùng B1ms/B2s, hoặc thêm swap |

---

## 8. Dọn dẹp sau khi nộp

1. `sudo systemctl disable --now leetkob-worker` nếu không chấm tiếp.
2. Portal → VM → **Stop** (giữ ổ đĩa), hoặc **Delete** cả resource group
   `leetkob-rg` khi đã chụp xong ảnh/video và không cần chấm lại.
3. Không xoá Neon project trước khi hết hạn nộp: DB là bằng chứng của PA#3.
4. Ghi vào `PA3.md` §1: provider **Azure**, region, size, ngày tạo, và lý do
   đổi từ Oracle (hết capacity A1).
