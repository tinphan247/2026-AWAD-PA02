#!/usr/bin/env bash
# Bootstrap an Oracle Cloud Always Free VM for the LeeTKOB PA#3 worker.
#
# Run as the default `ubuntu` user (it uses sudo, never runs as root):
#   curl -fsSLO https://raw.githubusercontent.com/tinphan247/2026-AWAD-PA02/feat/pa3-scaffold/deploy/oracle-setup.sh
#   bash oracle-setup.sh
#
# Overrides:
#   REPO_URL=... REPO_DIR=~/leetkob BRANCH=main SANDBOX_IMAGE=leetkob-sandbox:latest
#
# Idempotent: re-running upgrades nothing that is already installed and only
# fetches the branch again. See docs/oracle-vm.md for the click-by-click guide.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/tinphan247/2026-AWAD-PA02.git}"
REPO_DIR="${REPO_DIR:-$HOME/leetkob}"
BRANCH="${BRANCH:-main}"
SANDBOX_IMAGE="${SANDBOX_IMAGE:-leetkob-sandbox:latest}"

log() { printf '\n==> %s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this as the 'ubuntu' user, not root; it calls sudo where needed." >&2
  exit 1
fi
if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is missing; this does not look like the Oracle Ubuntu image." >&2
  exit 1
fi

# ---------------------------------------------------------------- OS + swap
log "Operating system"
# shellcheck disable=SC1091
. /etc/os-release
printf '%s (%s)\n' "$PRETTY_NAME" "$(uname -m)"

mem_mb=$(awk '/MemTotal/ {print int($2 / 1024)}' /proc/meminfo)
log "Memory: ${mem_mb} MB"
if [ "$mem_mb" -lt 2000 ] && [ ! -f /swapfile ]; then
  log "Adding a 2 GB swap file (small shape)"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
  sudo sysctl -q vm.swappiness=10
fi

# ------------------------------------------------------------ base packages
log "Base packages"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl git gnupg lsb-release

# ------------------------------------------------------------------- Docker
if command -v docker >/dev/null 2>&1; then
  log "Docker already installed: $(docker --version)"
else
  log "Installing Docker from the official convenience script"
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
fi
sudo systemctl enable --now docker
if ! id -nG "$USER" | tr ' ' '\n' | grep -qx docker; then
  sudo usermod -aG docker "$USER"
  NEEDS_RELOGIN=1
fi

# --------------------------------------------------------------------- Node
node_major=0
if command -v node >/dev/null 2>&1; then
  node_major=$(node -p 'process.versions.node.split(".")[0]')
fi
if [ "$node_major" -lt 24 ]; then
  log "Installing Node.js 24 LTS"
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
else
  log "Node.js already installed: $(node --version)"
fi
node --version
npm --version

# ------------------------------------------------------------------- source
log "Repository: $REPO_URL ($BRANCH)"
if [ -d "$REPO_DIR/.git" ]; then
  git -C "$REPO_DIR" fetch --prune origin
  git -C "$REPO_DIR" checkout "$BRANCH"
  git -C "$REPO_DIR" pull --ff-only
else
  git clone --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"

log "Runtime dependencies"
npm ci --omit=dev

log "Sandbox image: $SANDBOX_IMAGE"
if [ -f sandbox/Dockerfile ]; then
  sudo docker build -t "$SANDBOX_IMAGE" sandbox
else
  warn "sandbox/Dockerfile is missing: merge Tùng's sandbox branch, then re-run."
fi

# --------------------------------------------------------------- directories
log "Directories"
# /etc/leetkob is root-owned: the worker must not be able to rewrite its env.
sudo install -d -m 0750 -o root -g root /etc/leetkob
# The call log is the only path the worker writes.
sudo install -d -m 0750 -o "$USER" -g "$USER" /var/log/leetkob

# ------------------------------------------------------------------- smoke
log "Docker smoke test"
sudo docker run --rm hello-world >/dev/null
echo "docker run hello-world: ok"

if sudo docker image inspect "$SANDBOX_IMAGE" >/dev/null 2>&1; then
  log "Sandbox smoke test (empty stdin must be rejected)"
  sudo docker run --rm --network=none "$SANDBOX_IMAGE" 1 3 1048576 10 </dev/null \
    || true
fi

# ------------------------------------------------------------------ summary
cat <<EOF

Done.

Next steps (see docs/oracle-vm.md §5):
  1. sudo install -m 600 -o root -g root /dev/null /etc/leetkob/worker.env
     sudo nano /etc/leetkob/worker.env        # template: deploy/worker.env.example
  2. sudo cp "$REPO_DIR/deploy/leetkob-worker.service" /etc/systemd/system/
     sudo systemctl daemon-reload
  3. Check that the worker is implemented before enabling it:
       grep -n "not implemented" "$REPO_DIR/src/queue/worker.js"
  4. sudo systemctl enable --now leetkob-worker
     sudo journalctl -u leetkob-worker -f

EOF

if [ "${NEEDS_RELOGIN:-0}" -eq 1 ]; then
  echo "Log out and back in (or run 'newgrp docker') before using docker without sudo."
fi
