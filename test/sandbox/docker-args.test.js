// Runs in `npm test` (no Docker needed): the command the worker builds for
// the sandbox must carry every limit and none of the flags AGENTS.md forbids.

import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_LIMITS, buildDockerArgs, resolveLimits } from '../../src/sandbox/run.js';

const args = buildDockerArgs({
  image: 'leetkob-sandbox:test',
  name: 'leetkob-sbx-unit',
  limits: DEFAULT_LIMITS,
});
const joined = args.join(' ');

test('sandbox args: no network, non-root, read-only, no privileges', () => {
  for (const flag of [
    '--network=none',
    '--user=1000:1000',
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--rm',
  ]) {
    assert.ok(args.includes(flag), `missing ${flag}`);
  }
});

test('sandbox args: memory equals memory plus swap, so there is no swap', () => {
  assert.ok(args.includes('--memory=256m'));
  assert.ok(args.includes('--memory-swap=256m'));
  assert.ok(args.includes('--pids-limit=16'));
  assert.ok(args.includes('--cpus=1'));
});

test('sandbox args: no mounts, no environment, no Docker socket', () => {
  assert.doesNotMatch(joined, /(^| )(-v|--volume|--mount|-e|--env|--env-file|--privileged)( |=|$)/);
  assert.doesNotMatch(joined, /docker\.sock/);
  assert.doesNotMatch(joined, /MODEL_API_KEY|DATABASE_URL/);
});

test('sandbox args: /tmp is the only writable place, and it is size-capped tmpfs', () => {
  const tmpfs = args.filter((arg) => arg.startsWith('--tmpfs='));
  assert.equal(tmpfs.length, 1);
  assert.match(tmpfs[0] ?? '', /^--tmpfs=\/tmp:.*size=\d+m/);
});

test('sandbox limits: FAQ-05 defaults, wall-clock three times CPU, TA range enforced', () => {
  assert.deepEqual(DEFAULT_LIMITS, {
    cpuSec: 1,
    wallSec: 3,
    memoryMb: 256,
    pids: 16,
    outputBytes: 1024 * 1024,
    compileSec: 10,
    sourceBytes: 64 * 1024,
  });
  assert.equal(resolveLimits({ cpuSec: 2 }).wallSec, 6);
  assert.throws(() => resolveLimits({ cpuSec: 9 }), /cpuSec/);
  assert.throws(() => resolveLimits({ memoryMb: 1024 }), /memoryMb/);
});
