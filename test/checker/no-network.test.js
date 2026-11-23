// The no-network preload (test/checker/no-network.mjs) is what makes
// "the checker made no network call" mean something, so each channel it is
// meant to block is tried here. A channel that is not blocked would let a
// checker run pass while still reaching out.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const NO_NETWORK = pathToFileURL(join(import.meta.dirname, 'no-network.mjs')).href;

/**
 * Each entry is a snippet that would open a connection if the preload let it.
 * 127.0.0.1:9 (discard) is used so that a gap fails by "connected or refused",
 * never by reaching a real host.
 * @type {Record<string, string>}
 */
const CHANNELS = {
  fetch: `await fetch('http://127.0.0.1:9/')`,
  WebSocket: `new WebSocket('ws://127.0.0.1:9/')`,
  'net.connect': `net.connect(9, '127.0.0.1')`,
  'net.createConnection': `net.createConnection(9, '127.0.0.1')`,
  'net.Socket.prototype.connect': `new net.Socket().connect(9, '127.0.0.1')`,
  'tls.connect': `tls.connect(9, '127.0.0.1')`,
  'http.request': `http.request('http://127.0.0.1:9/')`,
  'http.get': `http.get('http://127.0.0.1:9/')`,
  'https.request': `https.request('https://127.0.0.1:9/')`,
  'https.get': `https.get('https://127.0.0.1:9/')`,
  'http2.connect': `http2.connect('http://127.0.0.1:9/')`,
  'dgram.createSocket': `dgram.createSocket('udp4')`,
  'dns.lookup': `dns.lookup('example.com', () => {})`,
  'dns.resolve': `dns.resolve('example.com', () => {})`,
  'dns.reverse': `dns.reverse('127.0.0.1', () => {})`,
  'dns.promises.lookup': `await dns.promises.lookup('example.com')`,
  'dns.promises.resolve': `await dns.promises.resolve('example.com')`,
  'dns.Resolver.resolve4': `new dns.Resolver().resolve4('example.com', () => {})`,
  'dns.promises.Resolver.resolve4': `await new dns.promises.Resolver().resolve4('example.com')`,
  'child_process.spawn': `cp.spawn('curl', ['http://127.0.0.1:9/'])`,
  'child_process.spawnSync': `cp.spawnSync('curl', ['http://127.0.0.1:9/'])`,
  'child_process.exec': `cp.exec('curl http://127.0.0.1:9/')`,
  'child_process.execFileSync': `cp.execFileSync('curl', ['http://127.0.0.1:9/'])`,
};

const PRELUDE = `
import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
import http2 from 'node:http2';
import dgram from 'node:dgram';
import dns from 'node:dns';
import cp from 'node:child_process';
`;

for (const [channel, snippet] of Object.entries(CHANNELS)) {
  test(`no-network preload: ${channel} is blocked`, () => {
    const result = spawnSync(
      process.execPath,
      ['--import', NO_NETWORK, '--input-type=module', '--eval', `${PRELUDE}\n${snippet}`],
      { encoding: 'utf8', timeout: 10_000 },
    );
    assert.notEqual(result.status, 0, 'the snippet ran to the end: the channel is open');
    assert.match(result.stderr, /network blocked by test: /);
  });
}

test('no-network preload: an ordinary file read and a local computation still work', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      NO_NETWORK,
      '--input-type=module',
      '--eval',
      `import { readFileSync } from 'node:fs'; import dns from 'node:dns';
       readFileSync(process.argv[1]); dns.setServers(['127.0.0.1']); console.log('ok');`,
      '--',
      join(import.meta.dirname, 'no-network.mjs'),
    ],
    { encoding: 'utf8', timeout: 10_000 },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ok/);
});
