import assert from 'node:assert/strict';
import { createPostgresReadonlyReader, createQdrantReadonlyReader, readersFromEnvironment } from './s03_readers_e2.mjs';

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; process.stdout.write(`LOCAL_PASS ${name}\n`); }

await test('PostgreSQL conserva SELECT parametrizado y timeout', async () => {
  let seen; const reader = createPostgresReadonlyReader({ connection: 'external-config', timeoutMs: 3210, executor: async (request) => { seen = request; return []; } });
  assert.deepEqual(await reader({ query: 'SELECT id FROM x WHERE a=$1 AND b=$2', params: ['a', 'b'], read_only: true }), []);
  assert.deepEqual(seen.params, ['a', 'b']); assert.equal(seen.timeoutMs, 3210); assert.equal(seen.readOnly, true);
});

await test('PostgreSQL rechaza escritura y sanitiza error', async () => {
  const reader = createPostgresReadonlyReader({ connection: 'external-config', executor: async () => { throw new Error('secret host detail'); } });
  await assert.rejects(() => reader({ query: 'DELETE FROM x', params: ['a', 'b'], read_only: true }), /POSTGRES_NO_READONLY/);
  await assert.rejects(() => reader({ query: 'SELECT x FROM y WHERE a=$1 AND b=$2', params: ['a', 'b'], read_only: true }), /^Error: S03_READERS_POSTGRES_ERROR$/);
});

await test('Qdrant prepara scroll exacto sin exponer configuración', async () => {
  let seen; const reader = createQdrantReadonlyReader({ baseUrl: 'https://qdrant.invalid/base', apiKey: 'test-secret', timeoutMs: 2222, fetchImpl: async (url, options) => { seen = { url, options }; return { ok: true, json: async () => ({ status: 'ok', result: { points: [], next_page_offset: null } }) }; } });
  const filter = { must: [{ key: 'metadata.clinic_id', match: { value: 'c' } }, { key: 'metadata.document_id', match: { value: 'd' } }] };
  await reader({ collection: 'vetatiende_interno', filter, offset: null, limit: 10, with_payload: true, with_vector: false, read_only: true });
  assert.match(seen.url, /vetatiende_interno\/points\/scroll$/); assert.equal(seen.options.headers['api-key'], 'test-secret'); assert.equal(JSON.parse(seen.options.body).with_vector, false);
});

await test('Qdrant rechaza colección/filtro y sanitiza fallos', async () => {
  const reader = createQdrantReadonlyReader({ baseUrl: 'https://qdrant.invalid', apiKey: 'x', fetchImpl: async () => { throw new Error('secret network detail'); } });
  await assert.rejects(() => reader({ collection: 'otra', filter: { must: [] }, read_only: true }), /QDRANT_SOLICITUD_INVALIDA/);
  await assert.rejects(() => reader({ collection: 'vetatiende_interno', filter: { must: [{}, {}] }, read_only: true }), /^Error: S03_READERS_QDRANT_ERROR$/);
});

await test('sin configuración externa se rechaza ejecución', async () => {
  assert.throws(() => readersFromEnvironment({ env: {}, postgresExecutor: async () => [] }), /CONFIGURACION_INCOMPLETA/);
  assert.throws(() => readersFromEnvironment({ env: { LAB031_S03_POSTGRES_CONNECTION: 'x', LAB031_S03_QDRANT_URL: 'https://x', LAB031_S03_QDRANT_API_KEY: 'y' } }), /POSTGRES_EXECUTOR_REQUERIDO/);
});

process.stdout.write(`RESULT LOCAL_PASS=${passed}/5 E2_NOT_VERIFIED network_calls=0\n`);
