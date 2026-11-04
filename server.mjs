import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.PORTFOLIO_DATA_DIR || path.join(root, 'data');
await mkdir(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'portfolio.json');
let db;
try { db = JSON.parse(await readFile(dbPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; db = JSON.parse(await readFile(path.join(root, 'seed.json'), 'utf8')); }
let saving = Promise.resolve();
function save() {
  const snapshot = JSON.stringify(db, null, 2);
  saving = saving.then(async () => { await writeFile(dbPath + '.tmp', snapshot); await rename(dbPath + '.tmp', dbPath); });
  return saving;
}
const sessions = new Map();
const attempts = new Map();
const port = Number(process.env.PORT || 3000);
const host = '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const bundledImages = new Set(['donut', 'cabinet', 'flower', 'bed'].map(name => `/assets/${name}.png`));
function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function reply(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function authed(req) {
  const token = req.headers.cookie?.match(/(?:^|;\s*)portfolio_session=([a-f0-9]+)/)?.[1];
  if (!token) return false;
  if ((sessions.get(token) || 0) < Date.now()) { sessions.delete(token); return false; }
  return token;
}
function session(res) {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
  res.setHeader('Set-Cookie', `portfolio_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
}
async function body(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 7_000_000) fail(413, 'The image is too large. Use an image under 5 MB.'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { fail(400, 'Invalid request.'); }
}
function str(value, limit, required = false) { if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) fail(400, 'Please check the text fields and their length.'); return value.trim(); }
function link(value) { const clean = str(value || '', 2000); if (clean) { try { if (new URL(clean).protocol !== 'https:') throw Error(); } catch { fail(400, 'Project links must start with https://.'); } } return clean; }
function imageData(value) {
  if (!value) return '';
  if (typeof value !== 'string') fail(400, 'Invalid image.');
  if (bundledImages.has(value)) return value;
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) fail(400, 'Use a PNG, JPEG, or WebP image.');
  const b = Buffer.from(match[2], 'base64');
  const valid = match[1] === 'png' ? b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : match[1] === 'jpeg' ? b[0] === 255 && b[1] === 216 && b[2] === 255 : b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP';
  if (!valid || b.length > 5_000_000) fail(400, 'Use a valid image under 5 MB.');
  return value;
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
    // Bind to loopback and reject foreign Host/Origin headers, including DNS rebinding.
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host)) fail(403, 'Local access only.');
    const url = new URL(req.url, `http://${req.headers.host}`);
    const route = url.pathname;
    if (route.startsWith('/api/')) {
      const mutation = !['GET', 'HEAD'].includes(req.method);
      if (mutation && (req.headers['x-portfolio-request'] !== '1' || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`))) fail(403, 'Request rejected.');
      if (route === '/api/session' && req.method === 'GET') return reply(res, 200, { authenticated: !!authed(req), needsSetup: !db.owner });
      if (route === '/api/portfolio' && req.method === 'GET') return reply(res, 200, { profile: db.profile, projects: db.projects });
      if ((route === '/api/setup' || route === '/api/login') && req.method === 'POST') {
        const key = req.socket.remoteAddress;
        const a = attempts.get(key);
        if (a && a.until > Date.now() && a.count >= 5) fail(429, 'Too many attempts. Try again in 15 minutes.');
        const input = await body(req);
        const password = str(input.password, 256, true);
        if (route === '/api/setup') {
          if (db.owner) fail(409, 'An owner account already exists. Please sign in.');
          if (password.length < 12) fail(400, 'Choose a password with at least 12 characters.');
          const salt = randomBytes(16).toString('hex');
          db.owner = { salt, hash: scryptSync(password, salt, 64).toString('hex') };
          await save();
        } else {
          if (!db.owner) fail(409, 'Create your owner password first.');
          const ok = timingSafeEqual(scryptSync(password, db.owner.salt, 64), Buffer.from(db.owner.hash, 'hex'));
          if (!ok) { const current = a && a.until > Date.now() ? a : { count: 0, until: Date.now() + 900000 }; current.count++; attempts.set(key, current); fail(401, 'Incorrect password.'); }
        }
        attempts.delete(key); session(res); return reply(res, 200, { ok: true });
      }
      const token = authed(req);
      if (!token) fail(401, 'Please sign in to manage your portfolio.');
      if (route === '/api/logout' && req.method === 'POST') { sessions.delete(token); res.setHeader('Set-Cookie', 'portfolio_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return reply(res, 200, { ok: true }); }
      if (route === '/api/profile' && req.method === 'PUT') {
        const input = await body(req);
        db.profile = { name: str(input.name, 100, true), role: str(input.role, 150, true), about: str(input.about, 3000, true) }; await save(); return reply(res, 200, db.profile);
      }
      if (route === '/api/projects' && req.method === 'POST' || /^\/api\/projects\/[a-f0-9-]+$/.test(route) && req.method === 'PUT') {
        const input = await body(req);
        const id = req.method === 'PUT' ? route.split('/').pop() : randomUUID();
        const index = db.projects.findIndex(p => p.id === id);
        if (req.method === 'PUT' && index < 0) fail(404, 'Project not found.');
        if (index < 0 && db.projects.length >= 100) fail(400, 'The portfolio supports up to 100 projects.');
        const p = { id, title: str(input.title, 120, true), category: str(input.category, 60, true), summary: str(input.summary, 250, true), description: str(input.description, 12000, true), tags: str(input.tags || '', 250), year: str(input.year || '', 4), url: link(input.url), image: imageData(input.image), featured: !!input.featured };
        if (index < 0) db.projects.unshift(p); else db.projects[index] = p;
        await save(); return reply(res, index < 0 ? 201 : 200, p);
      }
      if (/^\/api\/projects\/[a-f0-9-]+$/.test(route) && req.method === 'DELETE') { const id = route.split('/').pop(); if (!db.projects.some(p => p.id === id)) fail(404, 'Project not found.'); db.projects = db.projects.filter(p => p.id !== id); await save(); return reply(res, 200, { ok: true }); }
      fail(404, 'Not found.');
    }
    if (!['GET','HEAD'].includes(req.method)) fail(405, 'Method not allowed.');
    const files = { '/': 'index.html', '/portfolio': 'index.html', '/admin': 'index.html' };
    const filename = files[route] || (/^\/project\/[a-f0-9-]+$/.test(route) ? 'index.html' : ['/app.js','/playground.js','/styles.css'].includes(route) || bundledImages.has(route) ? route.slice(1) : null);
    if (!filename) fail(404, 'Page not found.');
    const data = await readFile(path.join(root, 'public', filename));
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)], 'Cache-Control': 'no-cache' }); res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) { if (!res.headersSent) reply(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' }); else res.end(); }
});
server.listen(port, host, () => console.log(`Portfolio ready: http://${host}:${port}\nOwner workspace: http://${host}:${port}/admin`));
