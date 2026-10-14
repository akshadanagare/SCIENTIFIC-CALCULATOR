import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../src/app.js';

let app, dir, dbFile;
const A = { 'x-client-id': 'client-AAAAAAAA' };
const B = { 'x-client-id': 'client-BBBBBBBB' };

const entry = (n) => ({
  expression: `${n} + 1`,
  tokens: [String(n), '+', '1'],
  result: String(n + 1),
  mode: 'standard',
  angle: 'deg',
});

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mathcorner-'));
  dbFile = path.join(dir, 'db.json');
  app = await buildApp({ dbFile });
});
after(async () => {
  await app.close();
  await rm(dir, { recursive: true, force: true });
});

const call = (method, url, { headers = A, payload } = {}) => app.inject({ method, url, headers, payload });

test('health works without a client id', async () => {
  const res = await call('GET', '/api/health', { headers: {} });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().status, 'ok');
});

test('history needs a valid x-client-id', async () => {
  assert.equal((await call('GET', '/api/history', { headers: {} })).statusCode, 400);
  assert.equal((await call('GET', '/api/history', { headers: { 'x-client-id': 'short' } })).statusCode, 400);
});

test('empty history at the start', async () => {
  const res = await call('GET', '/api/history');
  assert.deepEqual(res.json(), { items: [], total: 0, limit: 30, offset: 0 });
});

test('create history item', async () => {
  const res = await call('POST', '/api/history', { payload: entry(2) });
  assert.equal(res.statusCode, 201);
  const item = res.json();
  assert.equal(item.expression, '2 + 1');
  assert.equal(item.result, '3');
  assert.ok(item.id && item.createdAt);
  assert.equal(item.clientId, undefined); // never leak the client id
});

test('validation rejects bad bodies', async () => {
  const bad = [
    {},
    { expression: '', tokens: ['1'], result: '1' },
    { expression: '1', tokens: [], result: '1' },
    { expression: '1', tokens: ['1'] },
    { expression: '1', tokens: ['1'], result: '1', mode: 'weird' },
    { expression: 'x'.repeat(501), tokens: ['1'], result: '1' },
  ];
  for (const payload of bad) {
    const res = await call('POST', '/api/history', { payload });
    assert.equal(res.statusCode, 400, JSON.stringify(payload).slice(0, 60));
  }
  const notJson = await app.inject({ method: 'POST', url: '/api/history', headers: { ...A, 'content-type': 'application/json' }, payload: '{bad' });
  assert.equal(notJson.statusCode, 400);
});

test('list is newest first, with paging and search', async () => {
  for (const n of [10, 20, 30, 40]) await call('POST', '/api/history', { payload: entry(n) });
  const all = (await call('GET', '/api/history')).json();
  assert.equal(all.total, 5);
  assert.deepEqual(all.items.map((i) => i.result), ['41', '31', '21', '11', '3']);

  const page2 = (await call('GET', '/api/history?limit=2&offset=2')).json();
  assert.deepEqual(page2.items.map((i) => i.result), ['21', '11']);
  assert.equal(page2.total, 5);

  const search = (await call('GET', '/api/history?q=30')).json();
  assert.equal(search.total, 1);
  assert.equal(search.items[0].expression, '30 + 1');

  assert.equal((await call('GET', '/api/history?limit=0')).statusCode, 400);
  assert.equal((await call('GET', '/api/history?limit=101')).statusCode, 400);
});

test('each client only sees its own history', async () => {
  await call('POST', '/api/history', { headers: B, payload: entry(99) });
  const b = (await call('GET', '/api/history', { headers: B })).json();
  assert.equal(b.total, 1);
  assert.equal(b.items[0].result, '100');
  assert.equal((await call('GET', '/api/history')).json().total, 5);
});

test('delete one item (and not another client\'s item)', async () => {
  const first = (await call('GET', '/api/history')).json().items[0];
  const other = (await call('GET', '/api/history', { headers: B })).json().items[0];

  assert.equal((await call('DELETE', `/api/history/${other.id}`)).statusCode, 404); // not mine
  assert.equal((await call('DELETE', `/api/history/${first.id}`)).statusCode, 204);
  assert.equal((await call('DELETE', `/api/history/${first.id}`)).statusCode, 404); // already gone
  assert.equal((await call('GET', '/api/history')).json().total, 4);
  assert.equal((await call('GET', '/api/history', { headers: B })).json().total, 1);
});

test('delete works when the browser sends a JSON content type with no body', async () => {
  const first = (await call('GET', '/api/history')).json().items[0];
  const res = await app.inject({ method: 'DELETE', url: `/api/history/${first.id}`, headers: { ...A, 'content-type': 'application/json' } });
  assert.equal(res.statusCode, 204);
});

test('data is saved to the file and loaded again after a restart', async () => {
  const onDisk = JSON.parse(await readFile(dbFile, 'utf8'));
  assert.ok(onDisk.history.length >= 4);
  const second = await buildApp({ dbFile });
  const res = await second.inject({ method: 'GET', url: '/api/history', headers: B });
  assert.equal(res.json().total, 1);
  await second.close();
});

test('preferences: defaults, update and validation', async () => {
  const start = (await call('GET', '/api/preferences')).json();
  assert.deepEqual(start, { theme: null, mode: 'standard', angle: 'deg', memory: null });

  const put = await call('PUT', '/api/preferences', { payload: { theme: 'dark', memory: 12.5 } });
  assert.equal(put.statusCode, 200);
  assert.deepEqual(put.json(), { theme: 'dark', mode: 'standard', angle: 'deg', memory: 12.5 });

  const put2 = await call('PUT', '/api/preferences', { payload: { mode: 'scientific', angle: 'rad', memory: null } });
  assert.deepEqual(put2.json(), { theme: 'dark', mode: 'scientific', angle: 'rad', memory: null });

  assert.equal((await call('PUT', '/api/preferences', { payload: {} })).statusCode, 400);
  assert.equal((await call('PUT', '/api/preferences', { payload: { theme: 'pink' } })).statusCode, 400);
  assert.equal((await call('PUT', '/api/preferences', { payload: { mode: 'x' } })).statusCode, 400);

  // other clients are not affected
  assert.equal((await call('GET', '/api/preferences', { headers: B })).json().theme, null);
});

test('clear all history only clears my own', async () => {
  const res = await call('DELETE', '/api/history');
  assert.equal(res.statusCode, 200);
  assert.ok(res.json().deleted >= 1);
  assert.equal((await call('GET', '/api/history')).json().total, 0);
  assert.equal((await call('GET', '/api/history', { headers: B })).json().total, 1);
});

test('history is limited to 1000 items per client', async () => {
  const C = { 'x-client-id': 'client-CCCCCCCC' };
  // add directly through the store for speed
  const store = (await import('../src/store.js'));
  const s = await new store.JsonStore(path.join(dir, 'big.json')).init();
  for (let i = 0; i < 1005; i++) s.data.history.push({ id: String(i), clientId: 'c', expression: String(i), tokens: ['1'], result: '1', createdAt: new Date(2026, 0, 1, 0, 0, i).toISOString() });
  await s.addHistory('c', entry(1));
  assert.equal(s.listHistory('c', { limit: 100 }).total, 1000);
});

test('unknown routes return a JSON 404', async () => {
  const res = await call('GET', '/api/nope');
  assert.equal(res.statusCode, 404);
  assert.equal(res.json().error, 'Not Found');
});

test('CORS allows the configured website only', async () => {
  const strict = await buildApp({ dbFile: path.join(dir, 'cors.json'), corsOrigin: 'https://mathcorner.example' });
  const ok = await strict.inject({ method: 'OPTIONS', url: '/api/history', headers: { origin: 'https://mathcorner.example', 'access-control-request-method': 'GET', 'access-control-request-headers': 'x-client-id' } });
  assert.equal(ok.headers['access-control-allow-origin'], 'https://mathcorner.example');
  const no = await strict.inject({ method: 'GET', url: '/api/health', headers: { origin: 'https://evil.example' } });
  assert.notEqual(no.headers['access-control-allow-origin'], 'https://evil.example');
  await strict.close();
});
