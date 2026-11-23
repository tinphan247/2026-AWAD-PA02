#!/bin/bash
# LeeTKOB sandbox runner (PA#3, criterion 2). Entry point of the sandbox
# container, so it runs as PID 1, as uid 1000, with no network, a read-only
# root file system and a size-capped tmpfs at /tmp.
#
#   leetkob-runner CPU_SEC WALL_SEC OUTPUT_BYTES COMPILE_SEC  < job.tar
#
# job.tar holds submission.cpp and tests/NN.in. Expected outputs never enter
# the container: the worker compares outputs itself, so a submission cannot
# read the answers. Protocol on stdout, one line each:
#   COMPILE ok|error
#   TEST <name> <ok|tle|mle|re|output-limit> <wall_ms> <base64 output, if ok>
# Output is capped by a file-size limit (ulimit -f) at OUTPUT_BYTES + 1 KiB.
#   DONE
# The worker also kills the whole container at its own deadline.

set -u
CPU=$1 WALL=$2 OUTB=$3 COMPILE=$4
JOB=/tmp/job
umask 077
mkdir -p "$JOB" && cd "$JOB" || exit 2
tar -x -f - -C "$JOB" --no-same-owner --no-same-permissions 2>/dev/null || {
  echo "PROTOCOL bad-input"
  exit 2
}

# OOM kills in this container's cgroup (v2, then v1); 0 when unreadable.
oom_kills() {
  local f
  for f in /sys/fs/cgroup/memory.events /sys/fs/cgroup/memory/memory.oom_control; do
    if [ -r "$f" ]; then
      awk '$1 == "oom_kill" { print $2; found = 1 } END { if (!found) print 0 }' "$f"
      return
    fi
  done
  echo 0
}

# Compile inside the sandbox, under the same limits, with a time cap.
if timeout -s KILL "$COMPILE" g++ -std=c++17 -O2 -o "$JOB/a.out" "$JOB/submission.cpp" \
  >/dev/null 2>&1; then
  echo "COMPILE ok"
else
  echo "COMPILE error"
  echo "DONE"
  exit 0
fi

for input in "$JOB"/tests/*.in; do
  [ -e "$input" ] || continue
  name=$(basename "$input" .in)
  before=$(oom_kills)
  t0=$(date +%s%N)
  # The program is the preferred OOM victim, has a CPU limit, no core dumps
  # and a file-size limit just above the output limit. Its stdout goes to a
  # file, not a pipe: a child that escapes the program's session must not be
  # able to hold the runner open by keeping a pipe end.
  timeout -s KILL "$WALL" bash -c \
    'echo 1000 > /proc/self/oom_score_adj 2>/dev/null; ulimit -c 0; ulimit -t '"$CPU"'; ulimit -f '"$((OUTB / 1024 + 1))"'; exec "$0"' \
    "$JOB/a.out" <"$input" >"$JOB/actual" 2>/dev/null
  status=$?
  t1=$(date +%s%N)
  # We are PID 1: this kills every other process, including children that
  # left the program's session, before the next test starts.
  kill -KILL -1 2>/dev/null
  wait 2>/dev/null
  after=$(oom_kills)
  ms=$(((t1 - t0) / 1000000))
  size=$(stat -c %s "$JOB/actual")

  if [ "$size" -gt "$OUTB" ] || [ "$status" -eq 153 ]; then
    # 153: SIGXFSZ, the file-size limit.
    result=output-limit
  elif [ "$after" -gt "$before" ]; then
    result=mle
  elif [ "$status" -eq 152 ] || [ "$status" -eq 137 ] || [ "$ms" -ge $((WALL * 1000)) ]; then
    # 152: SIGXCPU (CPU limit); 137: SIGKILL (wall clock or hard CPU limit).
    result=tle
  elif [ "$status" -ne 0 ]; then
    result=re
  else
    result=ok
  fi

  if [ "$result" = ok ]; then
    echo "TEST $name ok $ms $(base64 -w0 "$JOB/actual")"
  else
    echo "TEST $name $result $ms"
  fi
  rm -f "$JOB/actual"
done
echo "DONE"
