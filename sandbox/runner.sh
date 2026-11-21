#!/usr/bin/env bash
# Placeholder runner invoked by the worker inside the sandbox.
# Real implementation: compile with g++ -std=c++17 -O2, run against tests,
# enforce CPU/wall/memory/output limits, capture verdict.
set -euo pipefail
echo "sandbox runner: not implemented" >&2
exit 1