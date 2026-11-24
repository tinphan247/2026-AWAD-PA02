# Sandbox image for LeeTKOB (PA#3, criterion 2): compiler plus the runner.
# The worker starts it with src/sandbox/run.js, which adds the limits:
#   --network=none --user=1000:1000 --read-only --tmpfs=/tmp:... --cap-drop=ALL
#   --security-opt=no-new-privileges --memory=256m --memory-swap=256m
#   --pids-limit=16 --cpus=1, and no mounts, no -e, no Docker socket.
# The image carries no secrets and no environment of the worker.

ARG BASE_IMAGE=gcc:13
FROM ${BASE_IMAGE}

RUN getent passwd 1000 >/dev/null || useradd --uid 1000 --create-home --shell /usr/sbin/nologin sandbox
COPY runner.sh /usr/local/bin/leetkob-runner
RUN chmod 0555 /usr/local/bin/leetkob-runner

USER 1000:1000
WORKDIR /tmp
ENTRYPOINT ["/usr/local/bin/leetkob-runner"]
