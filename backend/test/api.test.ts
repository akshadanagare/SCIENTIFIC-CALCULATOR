import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { newDb } from 'pg-mem';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import type { Queryable } from '../src/interfaces/db.interface';

let app: FastifyInstance;
let db: Queryable;
const A = { 'x-client-id': 'client-AAAAAAAA' };
const B = { 'x-client-id': 'client-BBBBBBBB' };

const entry = (n: number) => ({
  expression: `${n} + 1`,
  tokens: [String(n), '+', '1'],
  result: String(n + 1),
  mode: 'standard',
  angle: 'deg',
});

before(async () => {
  const { Pool } = newDb().adapters.createPg();
  db = new Pool() as unknown as Queryable;
  app = await buildApp({ db });
});
after(async () => { await app.close(); });

const call = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, opts: { headers?: Record<string, string>; payload?: unknown } = {}) =>
  app.inject({ method, url, headers: opts.headers ?? A, payload: opts.payload as object | undefined });

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
  assert.deepEqual((await call('GET', '/api/history')).json(), { items: [], total: 0, limit: 30, offset: 0 });
});

test('create history item', async () => {
  const res = await call('POST', '/api/history', { payload: entry(2) });
  assert.equal(res.statusCode, 201);
  const item = res.json();
  assert.equal(item.expression, '2 + 1');
  assert.equal(item.result, '3');
  assert.deepEqual(item.tokens, ['2', '+', '1']);
  assert.ok(item.id && item.createdAt && item.updatedAt);
  assert.equal(item.clientId, undefined);
  assert.equal(item.client_id, undefined);
  assert.equal(item.deletedAt, undefined);
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
    assert.equal((await call('POST', '/api/history', { payload })).statusCode, 400, JSON.stringify(payload).slice(0, 60));
  }
  const notJson = await app.inject({ method: 'POST', url: '/api/history', headers: { ...A, 'content-type': 'application/json' }, payload: '{bad' });
  assert.equal(notJson.statusCode, 400);
});

test('list is newest first, with paging and search', async () => {
  for (const n of [10, 20, 30, 40]) {
    await call('POST', '/api/history', { payload: entry(n) });
    await new Promise((r) => setTimeout(r, 5));
  }
  const all = (await call('GET', '/api/history')).json();
  assert.equal(all.total, 5);
  assert.deepEqual(all.items.map((i: { result: string }) => i.result), ['41', '31', '21', '11', '3']);

  const page1 = (await call('GET', '/api/history?limit=2&offset=0')).json();
  const page2 = (await call('GET', '/api/history?limit=2&offset=2')).json();
  const page3 = (await call('GET', '/api/history?limit=2&offset=4')).json();
  assert.deepEqual(page1.items.map((i: { result: string }) => i.result), ['41', '31']);
  assert.deepEqual(page2.items.map((i: { result: string }) => i.result), ['21', '11']);
  assert.deepEqual(page3.items.map((i: { result: string }) => i.result), ['3']);
  assert.equal(page2.total, 5);

  const search = (await call('GET', '/api/history?q=30')).json();
  assert.equal(search.total, 1);
  assert.equal(search.items[0].expression, '30 + 1');
  assert.equal((await call('GET', '/api/history?q=%25')).json().total, 0); // % is not a wildcard

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

test('edit updates the same record and does not add a new one', async () => {
  const before = (await call('GET', '/api/history')).json();
  const target = before.items[2];
  const res = await call('PUT', `/api/history/${target.id}`, { payload: { ...entry(500), mode: 'scientific' } });
  assert.equal(res.statusCode, 200);
  const updated = res.json();
  assert.equal(updated.id, target.id);
  assert.equal(updated.result, '501');
  assert.equal(updated.mode, 'scientific');
  assert.equal(updated.createdAt, target.createdAt);
  assert.ok(new Date(updated.updatedAt) >= new Date(target.updatedAt));

  const after = (await call('GET', '/api/history')).json();
  assert.equal(after.total, before.total);
  assert.equal(after.items[2].id, target.id);
  assert.equal(after.items[2].expression, '500 + 1');

  // not mine / not found / bad id
  assert.equal((await call('PUT', `/api/history/${target.id}`, { headers: B, payload: entry(1) })).statusCode, 404);
  assert.equal((await call('PUT', '/api/history/00000000-0000-4000-8000-000000000000', { payload: entry(1) })).statusCode, 404);
  assert.equal((await call('PUT', '/api/history/not-a-uuid', { payload: entry(1) })).statusCode, 400);
});

test('delete is a soft delete (row stays in the table)', async () => {
  const first = (await call('GET', '/api/history')).json().items[0];
  const other = (await call('GET', '/api/history', { headers: B })).json().items[0];

  assert.equal((await call('DELETE', `/api/history/${other.id}`)).statusCode, 404); // not mine
  assert.equal((await call('DELETE', `/api/history/${first.id}`)).statusCode, 204);
  assert.equal((await call('DELETE', `/api/history/${first.id}`)).statusCode, 404); // already deleted
  assert.equal((await call('PUT', `/api/history/${first.id}`, { payload: entry(1) })).statusCode, 404);
  assert.equal((await call('GET', '/api/history')).json().total, 4);

  const row = await db.query('SELECT deleted_at FROM calculation_history WHERE id = $1', [first.id]);
  assert.equal(row.rows.length, 1);
  assert.ok(row.rows[0].deleted_at, 'deleted_at must be set');
});

test('delete works when the browser sends a JSON content type with no body', async () => {
  const first = (await call('GET', '/api/history')).json().items[0];
  const res = await app.inject({ method: 'DELETE', url: `/api/history/${first.id}`, headers: { ...A, 'content-type': 'application/json' } });
  assert.equal(res.statusCode, 204);
});

test('preferences: defaults, update and validation', async () => {
  assert.deepEqual((await call('GET', '/api/preferences')).json(), { theme: null, mode: 'standard', angle: 'deg', memory: null });

  const put = await call('PUT', '/api/preferences', { payload: { theme: 'dark', memory: 12.5 } });
  assert.equal(put.statusCode, 200);
  assert.deepEqual(put.json(), { theme: 'dark', mode: 'standard', angle: 'deg', memory: 12.5 });

  const put2 = await call('PUT', '/api/preferences', { payload: { mode: 'scientific', angle: 'rad', memory: null } });
  assert.deepEqual(put2.json(), { theme: 'dark', mode: 'scientific', angle: 'rad', memory: null });
  assert.deepEqual((await call('GET', '/api/preferences')).json(), { theme: 'dark', mode: 'scientific', angle: 'rad', memory: null });

  assert.equal((await call('PUT', '/api/preferences', { payload: {} })).statusCode, 400);
  assert.equal((await call('PUT', '/api/preferences', { payload: { theme: 'pink' } })).statusCode, 400);
  assert.equal((await call('PUT', '/api/preferences', { payload: { mode: 'x' } })).statusCode, 400);
  assert.equal((await call('GET', '/api/preferences', { headers: B })).json().theme, null);
});

test('clear all is a soft delete and only clears my own', async () => {
  const res = await call('DELETE', '/api/history');
  assert.equal(res.statusCode, 200);
  assert.ok(res.json().deleted >= 1);
  assert.equal((await call('GET', '/api/history')).json().total, 0);
  assert.equal((await call('GET', '/api/history', { headers: B })).json().total, 1);

  const rows = await db.query('SELECT count(*) AS n FROM calculation_history WHERE client_id = $1', ['client-AAAAAAAA']);
  assert.ok(Number(rows.rows[0].n) >= 5, 'rows are still stored');
  assert.equal((await call('DELETE', '/api/history')).json().deleted, 0);
});

test('unknown routes return a JSON 404', async () => {
  const res = await call('GET', '/api/nope');
  assert.equal(res.statusCode, 404);
  assert.equal(res.json().error, 'Not Found');
});

test('CORS allows the configured website only', async () => {
  const { Pool } = newDb().adapters.createPg();
  const strict = await buildApp({ db: new Pool() as unknown as Queryable, config: { corsOrigin: 'https://mathcorner.example' } });
  const ok = await strict.inject({ method: 'OPTIONS', url: '/api/history', headers: { origin: 'https://mathcorner.example', 'access-control-request-method': 'PUT', 'access-control-request-headers': 'x-client-id' } });
  assert.equal(ok.headers['access-control-allow-origin'], 'https://mathcorner.example');
  assert.match(String(ok.headers['access-control-allow-methods']), /PUT/);
  const no = await strict.inject({ method: 'GET', url: '/api/health', headers: { origin: 'https://evil.example' } });
  assert.notEqual(no.headers['access-control-allow-origin'], 'https://evil.example');
  await strict.close();
});
