/**
 * Run one submission in the sandbox container (PA#3, criterion 2).
 *
 * The worker calls this with the student's code and the lab's tests. Code
 * and test inputs go in on stdin; expected outputs stay here and are compared
 * here. The container gets every limit from the brief's nine minimums and is
 * killed as a whole when the worker's deadline passes.
 */

import { spawn, execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { createTar } from './tar.js';

/**
 * @typedef {{
 *   cpuSec: number, wallSec: number, memoryMb: number, pids: number,
 *   outputBytes: number, compileSec: number, sourceBytes: number,
 * }} Limits
 *
 * @typedef {'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE'} JudgeVerdict
 *
 * @typedef {{ name: string, verdict: JudgeVerdict, timeMs: number | null, reason?: string }} TestResult
 *
 * @typedef {{
 *   verdict: JudgeVerdict,
 *   compile: 'ok' | 'error',
 *   tests: TestResult[],
 *   killedByHost: boolean,
 *   containerName: string,
 * }} SandboxResult
 */

/** FAQ-05 defaults: wall clock is three times CPU. */
/** @type {Readonly<Limits>} */
export const DEFAULT_LIMITS = Object.freeze({
  cpuSec: 1,
  wallSec: 3,
  memoryMb: 256,
  pids: 16,
  outputBytes: 1024 * 1024,
  compileSec: 10,
  sourceBytes: 64 * 1024,
});

/**
 * Apply a lab's CPU and memory settings within the range a TA may choose
 * (FAQ-05: CPU 1–5 s, memory 64–512 MB). Wall clock follows CPU.
 *
 * @param {{ cpuSec?: number, memoryMb?: number }} [lab]
 * @returns {Limits}
 */
export function resolveLimits(lab = {}) {
  const cpuSec = lab.cpuSec ?? DEFAULT_LIMITS.cpuSec;
  const memoryMb = lab.memoryMb ?? DEFAULT_LIMITS.memoryMb;
  if (!Number.isInteger(cpuSec) || cpuSec < 1 || cpuSec > 5) {
    throw new RangeError('cpuSec must be an integer from 1 to 5');
  }
  if (!Number.isInteger(memoryMb) || memoryMb < 64 || memoryMb > 512) {
    throw new RangeError('memoryMb must be an integer from 64 to 512');
  }
  return { ...DEFAULT_LIMITS, cpuSec, memoryMb, wallSec: cpuSec * 3 };
}

/**
 * The `docker run` arguments. No mounts, no environment, no privileges.
 *
 * @param {{ image: string, name: string, limits: Limits }} options
 * @returns {string[]}
 */
export function buildDockerArgs({ image, name, limits }) {
  return [
    'run',
    '--rm',
    '-i',
    `--name=${name}`,
    '--network=none',
    '--user=1000:1000',
    '--read-only',
    `--tmpfs=/tmp:rw,exec,nosuid,nodev,mode=1777,size=${Math.max(16, Math.floor(limits.memoryMb / 4))}m`,
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    `--memory=${limits.memoryMb}m`,
    `--memory-swap=${limits.memoryMb}m`,
    `--pids-limit=${limits.pids}`,
    '--cpus=1',
    '--ulimit=core=0',
    image,
    String(limits.cpuSec),
    String(limits.wallSec),
    String(limits.outputBytes),
    String(limits.compileSec),
  ];
}

/**
 * @param {{
 *   sourceCode: string,
 *   tests: Array<{ name: string, input: string, output: string }>,
 *   limits?: { cpuSec?: number, memoryMb?: number },
 *   image?: string,
 *   docker?: string,
 *   hostTimeoutMs?: number,
 * }} options
 * @returns {Promise<SandboxResult>}
 */
export async function runInSandbox({
  sourceCode,
  tests,
  limits: labLimits,
  image = process.env.SANDBOX_IMAGE ?? 'leetkob-sandbox:latest',
  docker = 'docker',
  hostTimeoutMs,
}) {
  const limits = resolveLimits(labLimits);
  const containerName = `leetkob-sbx-${randomUUID()}`;

  if (Buffer.byteLength(sourceCode, 'utf8') > limits.sourceBytes) {
    return { verdict: 'CE', compile: 'error', tests: [], killedByHost: false, containerName };
  }
  for (const test of tests) {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(test.name)) throw new Error(`bad test name: ${test.name}`);
  }

  const deadline =
    hostTimeoutMs ?? (limits.compileSec + tests.length * (limits.wallSec + 1) + 10) * 1000;
  const stdin = createTar([
    { name: 'submission.cpp', data: sourceCode },
    ...tests.map((test) => ({ name: `tests/${test.name}.in`, data: test.input })),
  ]);

  const { stdout, killedByHost } = await runContainer({
    docker,
    args: buildDockerArgs({ image, name: containerName, limits }),
    stdin,
    deadlineMs: deadline,
    containerName,
    maxStdoutBytes: tests.length * Math.ceil((limits.outputBytes * 4) / 3 + 256) + 4096,
  });

  // No COMPILE line and not killed by us: the container never ran (no image,
  // daemon down). That is the worker's failure, not the student's: throw so
  // the queue retries the job instead of storing a verdict.
  if (!killedByHost && !/^COMPILE /m.test(stdout)) {
    throw new Error('sandbox did not start (is the image built and Docker running?)');
  }
  return { ...parseRunnerOutput(stdout, tests), killedByHost, containerName };
}

/**
 * @param {string} stdout
 * @param {Array<{ name: string, output: string }>} tests
 * @returns {{ verdict: JudgeVerdict, compile: 'ok' | 'error', tests: TestResult[] }}
 */
export function parseRunnerOutput(stdout, tests) {
  const lines = stdout.split('\n');
  const compileLine = lines.find((line) => line.startsWith('COMPILE '));
  if (compileLine === 'COMPILE error') return { verdict: 'CE', compile: 'error', tests: [] };

  /** @type {Map<string, string[]>} */
  const byName = new Map();
  for (const line of lines) {
    if (line.startsWith('TEST ')) {
      const fields = line.split(' ');
      byName.set(fields[1] ?? '', fields);
    }
  }

  /** @type {TestResult[]} */
  const results = tests.map((test) => {
    const fields = byName.get(test.name);
    // No line for this test: the run was cut short by the worker's deadline.
    if (!fields) return { name: test.name, verdict: 'TLE', timeMs: null, reason: 'killed' };
    const [, , status = '', ms = '', output = ''] = fields;
    const timeMs = Number(ms);
    switch (status) {
      case 'ok':
        return {
          name: test.name,
          verdict: sameOutput(Buffer.from(output, 'base64').toString('utf8'), test.output)
            ? 'AC'
            : 'WA',
          timeMs,
        };
      case 'tle':
        return { name: test.name, verdict: 'TLE', timeMs };
      case 'mle':
        return { name: test.name, verdict: 'MLE', timeMs };
      case 'output-limit':
        return { name: test.name, verdict: 'RE', timeMs, reason: 'output-limit' };
      default:
        return { name: test.name, verdict: 'RE', timeMs };
    }
  });

  const firstBad = results.find((result) => result.verdict !== 'AC');
  return { verdict: firstBad ? firstBad.verdict : 'AC', compile: 'ok', tests: results };
}

/**
 * Same output up to trailing spaces on each line and trailing blank lines.
 *
 * @param {string} actual
 * @param {string} expected
 */
export function sameOutput(actual, expected) {
  /** @param {string} text */
  const normalise = (text) =>
    text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t\r]+$/, ''))
      .join('\n')
      .replace(/\n+$/, '');
  return normalise(actual) === normalise(expected);
}

/**
 * @param {{
 *   docker: string, args: string[], stdin: Buffer, deadlineMs: number,
 *   containerName: string, maxStdoutBytes: number,
 * }} options
 * @returns {Promise<{ stdout: string, killedByHost: boolean }>}
 */
function runContainer({ docker, args, stdin, deadlineMs, containerName, maxStdoutBytes }) {
  return new Promise((resolve, reject) => {
    // The docker CLI gets only what it needs to reach the daemon; the
    // container itself never receives an environment (no -e, no --env-file).
    const child = spawn(docker, args, {
      stdio: ['pipe', 'pipe', 'ignore'],
      env: cliEnvironment(),
    });
    /** @type {Buffer[]} */
    const chunks = [];
    let size = 0;
    let killedByHost = false;

    const kill = () => {
      if (killedByHost) return;
      killedByHost = true;
      execFile(docker, ['kill', containerName], { env: cliEnvironment() }, () => {});
    };
    const timer = setTimeout(kill, deadlineMs);

    child.stdout.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxStdoutBytes) kill();
      else chunks.push(chunk);
    });
    child.stdin.on('error', () => {});
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', () => {
      clearTimeout(timer);
      // `--rm` removes the container; wait until it is really gone so no
      // process from this submission outlives the call.
      waitUntilGone(docker, containerName).then(() =>
        resolve({ stdout: Buffer.concat(chunks).toString('utf8'), killedByHost }),
      );
    });
    child.stdin.end(stdin);
  });
}

/**
 * @param {string} docker
 * @param {string} containerName
 * @returns {Promise<void>}
 */
async function waitUntilGone(docker, containerName) {
  for (let i = 0; i < 50; i += 1) {
    const listed = await new Promise((resolve) => {
      execFile(
        docker,
        ['ps', '-a', '-q', '--filter', `name=^${containerName}$`],
        { env: cliEnvironment() },
        (error, out) => resolve(error ? '' : String(out).trim()),
      );
    });
    if (!listed) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/** Environment for the docker CLI only: never the worker's secrets. */
function cliEnvironment() {
  /** @type {Record<string, string>} */
  const env = {};
  for (const name of ['PATH', 'HOME', 'DOCKER_HOST', 'DOCKER_CONFIG', 'DOCKER_CONTEXT']) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  return env;
}
