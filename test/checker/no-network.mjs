// Preload for the checker tests (`node --import`): any attempt to open a
// network connection throws, so a checker run that passes made none.
//
// This is a test guard, not a sandbox: code can still reach the network through
// a native addon or by deleting these patches. The real proof is the Docker run
// with `--network none` (see the README). The guard covers every network
// channel Node itself ships: fetch and WebSocket, TCP and TLS sockets (including
// the prototype method every client goes through), HTTP/1 and HTTP/2, UDP, all
// DNS entry points, and child processes, which could start curl.

import { syncBuiltinESMExports } from 'node:module';
import childProcess from 'node:child_process';
import dgram from 'node:dgram';
import dns from 'node:dns';
import http from 'node:http';
import http2 from 'node:http2';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';

const refuse = (/** @type {string} */ what) => () => {
  throw new Error(`network blocked by test: ${what}`);
};

/**
 * Replace every function property of `target` with one that throws.
 * @param {Record<string, any>} target
 * @param {string} label
 * @param {(name: string) => boolean} [skip]
 */
function refuseAll(target, label, skip = () => false) {
  for (const name of Object.getOwnPropertyNames(target)) {
    if (skip(name) || typeof target[name] !== 'function') continue;
    // Classes (Resolver) stay constructible; their methods are refused below.
    if (/^[A-Z]/.test(name)) continue;
    target[name] = refuse(`${label}.${name}`);
  }
}

globalThis.fetch = refuse('fetch');
// These are used with `new`, and an arrow function cannot be constructed, so
// they are replaced by classes whose constructor throws.
for (const name of ['WebSocket', 'EventSource']) {
  if (name in globalThis) {
    globalThis[name] = class {
      constructor() {
        refuse(name)();
      }
    };
  }
}

net.connect = refuse('net.connect');
net.createConnection = refuse('net.createConnection');
net.Socket.prototype.connect = refuse('net.Socket.prototype.connect');
tls.connect = refuse('tls.connect');

http.request = refuse('http.request');
http.get = refuse('http.get');
https.request = refuse('https.request');
https.get = refuse('https.get');
http2.connect = refuse('http2.connect');

dgram.createSocket = refuse('dgram.createSocket');
dgram.Socket.prototype.send = refuse('dgram.Socket.prototype.send');
dgram.Socket.prototype.connect = refuse('dgram.Socket.prototype.connect');

// Every dns function resolves a name (lookup, resolve*, reverse, ...); the
// callback and promise APIs are separate objects, and Resolver has its own.
const dnsKeep = new Set([
  'setServers',
  'getServers',
  'setDefaultResultOrder',
  'getDefaultResultOrder',
]);
refuseAll(dns, 'dns', (n) => dnsKeep.has(n));
refuseAll(dns.promises, 'dns.promises', (n) => dnsKeep.has(n));
for (const name of Object.getOwnPropertyNames(dns.Resolver.prototype)) {
  if (name === 'constructor' || dnsKeep.has(name) || name === 'cancel') continue;
  if (typeof dns.Resolver.prototype[name] === 'function') {
    dns.Resolver.prototype[name] = refuse(`dns.Resolver.prototype.${name}`);
    dns.promises.Resolver.prototype[name] = refuse(`dns.promises.Resolver.prototype.${name}`);
  }
}

for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
  /** @type {Record<string, any>} */ (childProcess)[name] = refuse(`child_process.${name}`);
}

syncBuiltinESMExports();
