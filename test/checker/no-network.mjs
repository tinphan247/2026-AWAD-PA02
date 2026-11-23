// Preload for the checker tests (`node --import`): any attempt to open a
// network connection throws, so a checker run that passes made none.

import { syncBuiltinESMExports } from 'node:module';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';

const refuse = (/** @type {string} */ what) => () => {
  throw new Error(`network blocked by test: ${what}`);
};

globalThis.fetch = refuse('fetch');
net.connect = refuse('net.connect');
net.createConnection = refuse('net.createConnection');
tls.connect = refuse('tls.connect');
http.request = refuse('http.request');
http.get = refuse('http.get');
https.request = refuse('https.request');
https.get = refuse('https.get');
dns.lookup = refuse('dns.lookup');
syncBuiltinESMExports();
