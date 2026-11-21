# Sandbox image for LeeTKOB (PA#3, criterion 2).
# Runs as a non-root user, with no network, no host mounts and no secrets.
# Invoked by the worker with --network none --memory 256m --memory-swap 256m
# --pids-limit 16 --user 1000:1000 --read-only --tmpfs /tmp.

FROM gcc:13
RUN useradd -m -u 1000 sandbox
USER sandbox
WORKDIR /tmp
# The worker mounts the source read-only and runs:
#   g++ -std=c++17 -O2 -o /tmp/a.out /tmp/submission.cpp && /tmp/a.out