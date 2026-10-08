// Zero-framework server: static files + JSON state persisted to disk.
import http from 'node:http';
import { readFile, writeFile, rename, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 9999;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const LAN_ONLY = process.env.LAN_ONLY !== '0';
// Behind a reverse proxy (e.g. Coolify's Traefik) the socket address is the proxy;
// with TRUST_PROXY=1 the client IP is taken from X-Forwarded-For set by that proxy.
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const MAX_BODY = 2 * 1024 * 1024;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
const ALIASES = { '/vendor/chart.umd.js': path.join(ROOT, 'node_modules/chart.js/dist/chart.umd.js') };
const PUBLIC = path.join(ROOT, 'public');

// Private / loopback / link-local ranges, plus 100.64/10 (CGNAT, e.g. Tailscale).
function isPrivate(addr = '') {
  addr = addr.replace(/^::ffff:/, '');
  if (addr === '::1') return true;
  const v6 = addr.toLowerCase();
  if (/^f[cd][0-9a-f]{2}:/.test(v6) || v6.startsWith('fe80:')) return true;
  const p = addr.split('.').map(Number);
  if (p.length !== 4 || p.some(Number.isNaN)) return false;
  return p[0] === 10 || p[0] === 127 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127);
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function writeState(obj) {
  await mkdir(DATA_DIR, { recursive: true });
  await copyFile(STATE_FILE, STATE_FILE + '.prev').catch(() => {});
  const tmp = STATE_FILE + '.tmp';
  await writeFile(tmp, JSON.stringify(obj, null, 2));
  await rename(tmp, STATE_FILE);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function serveStatic(res, urlPath) {
  let file = ALIASES[urlPath];
  if (!file) {
    file = path.join(PUBLIC, urlPath === '/' ? 'index.html' : path.normalize(urlPath));
    if (!file.startsWith(PUBLIC + path.sep)) return send(res, 404, 'Not found', 'text/plain');
  }
  try {
    send(res, 200, await readFile(file), MIME[path.extname(file)] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

function clientIp(req) {
  const peer = req.socket.remoteAddress;
  if (!TRUST_PROXY || !isPrivate(peer)) return peer;
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return fwd.at(-1) || peer; // the entry appended by the nearest proxy
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/healthz') return send(res, 200, 'ok', 'text/plain');
    if (LAN_ONLY && !isPrivate(clientIp(req))) return send(res, 403, 'Home network only', 'text/plain');
    if (url.pathname === '/api/state') {
      if (req.method === 'GET') return send(res, 200, (await readState()) ?? {});
      if (req.method === 'PUT') {
        const data = JSON.parse(await readBody(req));
        if (!data || typeof data !== 'object' || Array.isArray(data)) return send(res, 400, { error: 'object expected' });
        data.savedAt = new Date().toISOString();
        await writeState(data);
        return send(res, 200, { ok: true, savedAt: data.savedAt });
      }
      return send(res, 405, { error: 'method not allowed' });
    }
    if (req.method !== 'GET') return send(res, 405, 'Method not allowed', 'text/plain');
    return serveStatic(res, url.pathname);
  } catch (e) {
    send(res, e.status || (e instanceof SyntaxError ? 400 : 500), { error: e.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`mortgage-view on http://${HOST}:${PORT}  (data: ${STATE_FILE}, LAN only: ${LAN_ONLY})`);
});
