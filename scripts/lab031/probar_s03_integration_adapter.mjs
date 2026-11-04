import assert from 'node:assert/strict';
import { createManifest, EXECUTE_CONFIRM, runPreparedS03 } from './s03_fixture_documental.mjs';
import { createS03IntegrationAdapter, evaluateExecutionGates, managementPayload } from './s03_integration_adapter.mjs';

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; process.stdout.write(`LOCAL_PASS ${name}\n`); }
const env = { LAB031_INTERNAL_BASE_URL: 'https://local.invalid', LAB031_INTERNAL_WEBHOOK_PATH: 'vetatiende-interno-lab025', LAB031_INTERNAL_HEADER_NAME: 'X-Test', LAB031_INTERNAL_HEADER_VALUE: 'mock-secret' };
const manifest = () => createManifest({ runId: 'INTEGRATION_001' });
const resources = (m) => [
  { store: 'postgres', type: 'document', id: m.fixture.document_id, clinic_id: m.clinic_id, visibility: 'internal', status: 'active' },
  { store: 'postgres', type: 'version', id: 'version-real', clinic_id: m.clinic_id, document_id: m.fixture.document_id, visibility: 'internal', status: 'active' },
  { store: 'postgres', type: 'event', id: 'event-real', clinic_id: m.clinic_id, document_id: m.fixture.document_id, version_id: 'version-real', event_type: 'activated', status: 'accepted' },
  { store: 'qdrant', type: 'point', id: 'point-real', clinic_id: m.clinic_id, document_id: m.fixture.document_id, version_id: 'version-real', visibility: 'internal', status: 'active', collection: 'vetatiende_interno' },
];
const response = (m, fallback = false) => ({ ok: true, status: 200, json: async () => ({ ok: true, action: 'consulta_rag_interno', message: fallback ? 'Información insuficiente' : 'El código es QA-S03-742.', data: { fuentes: fallback ? [] : [m.fixture.document_id], requiere_revision_humana: fallback } }) });

await test('Management acepta exclusivamente fixture válido', async () => {
  const m = manifest(), payload = managementPayload(m); assert.equal(payload.document_id, m.fixture.document_id); assert.equal(payload.visibility, 'internal'); assert.match(payload.document_content, /QA-S03-742/);
  const bad = structuredClone(m); bad.fixture.visibility = 'public'; assert.throws(() => managementPayload(bad), /FIXTURE_INVALIDO/);
});

await test('creación duplicada queda bloqueada por PRE_CREATE', async () => {
  const m = manifest(), adapter = createS03IntegrationAdapter({ env, managementInvoke: async () => ({ ok: true }), inventoryAdapter: { inventoryExact: async (_m, { mode }) => { if (mode === 'PRE_CREATE') throw new Error('PRE_CREATE_NO_VACIO'); return resources(m); } }, fetchImpl: async () => response(m) });
  await assert.rejects(() => adapter.inventoryExact(m, { mode: 'PRE_CREATE' }), /PRE_CREATE_NO_VACIO/);
});

await test('respuesta Management incompleta se rechaza y no inventa IDs', async () => {
  const m = manifest(), adapter = createS03IntegrationAdapter({ env, managementInvoke: async () => ({}), inventoryAdapter: { inventoryExact: async () => [] }, fetchImpl: async () => response(m) });
  await assert.rejects(() => adapter.createViaManagement(m), /RESPUESTA_INCOMPLETA/);
});

await test('inventario posterior acredita IDs reales', async () => {
  const m = manifest(), r = resources(m), adapter = createS03IntegrationAdapter({ env, managementInvoke: async () => ({ ok: true }), inventoryAdapter: { inventoryExact: async () => r }, fetchImpl: async () => response(m) });
  assert.deepEqual(await adapter.inventoryExact(m, { mode: 'POST_CREATE' }), r); assert.deepEqual(await adapter.createViaManagement(m), { ok: true });
});

await test('consulta RAG usa identidad, acción y atribución por fuentes', async () => {
  const m = manifest(); let request; const adapter = createS03IntegrationAdapter({ env, managementInvoke: async () => ({ ok: true }), inventoryAdapter: { inventoryExact: async () => resources(m) }, fetchImpl: async (_url, options) => { request = options; return response(m); } });
  const result = await adapter.queryInternal(m); assert.equal(result.sources[0], m.fixture.document_id); assert.equal(result.version_id, undefined);
  assert.equal(request.headers['x-vetatiende-identity-provider'], 'prueba_oidc'); assert.equal(request.headers['x-vetatiende-identity-subject'], 'usuario_veterinario_001'); assert.equal(JSON.parse(request.body).accion, 'consulta_rag_interno');
});

await test('fallback RAG se conserva para que el fixture lo rechace', async () => {
  const m = manifest(), adapter = createS03IntegrationAdapter({ env, managementInvoke: async () => ({ ok: true }), inventoryAdapter: { inventoryExact: async () => resources(m) }, fetchImpl: async () => response(m, true) });
  assert.equal((await adapter.queryInternal(m)).fallback, true);
});

await test('gates bloquean endpoint o dependencias faltantes', async () => {
  const m = manifest(), blocked = evaluateExecutionGates({ manifest: m, env: {} }); assert.equal(blocked.status, 'BLOCKED'); assert.ok(blocked.blocked.includes('MANAGEMENT_INVOKER_AUSENTE')); assert.ok(blocked.blocked.includes('WEBHOOK_INTERNO_NO_CONFIGURADO'));
});

await test('gates completos requieren autorización posterior, no ejecutan red', async () => {
  const m = manifest(), ready = evaluateExecutionGates({ manifest: m, env, managementInvoke: async () => ({}), inventoryAdapter: { inventoryExact: async () => [] }, deleteExactPostgres: async () => {}, deleteExactQdrant: async () => {} }); assert.equal(ready.status, 'READY_FOR_EXPLICIT_AUTHORIZATION');
});

await test('endpoint no configurado bloquea consulta antes de red', async () => {
  let calls = 0; const adapter = createS03IntegrationAdapter({ env: {}, fetchImpl: async () => { calls += 1; }, managementInvoke: async () => ({ ok: true }), inventoryAdapter: { inventoryExact: async () => [] } });
  await assert.rejects(() => adapter.queryInternal(manifest()), /ENDPOINT_NO_CONFIGURADO/); assert.equal(calls, 0);
});

await test('cleanup delega solo recursos exactos y postcheck al inventario', async () => {
  const m = manifest(), r = resources(m); let q = 0, pg = 0, post = 0;
  const adapter = createS03IntegrationAdapter({ env, managementInvoke: async () => ({ ok: true }), inventoryAdapter: { inventoryExact: async (_m, options) => { if (options?.mode === 'RECOVERY_CLEANUP') post += 1; return []; } }, deleteExactQdrant: async (items) => { q = items.length; }, deleteExactPostgres: async (items) => { pg = items.length; }, fetchImpl: async () => response(m) });
  await adapter.deleteExactQdrant(r.filter((x) => x.store === 'qdrant'), m); await adapter.deleteExactPostgres(r.filter((x) => x.store === 'postgres'), m); assert.deepEqual(await adapter.postcheckExact(m), []); assert.deepEqual([q, pg, post], [1, 3, 1]);
});

await test('secreto no aparece en error sanitizado', async () => {
  const m = manifest(), adapter = createS03IntegrationAdapter({ env, managementInvoke: async () => { throw new Error('mock-secret'); }, inventoryAdapter: { inventoryExact: async () => [] } });
  await assert.rejects(() => adapter.createViaManagement(m), (error) => error.message === 'S03_INTEGRATION_MANAGEMENT_ERROR' && !error.message.includes('mock-secret'));
});

process.stdout.write(`RESULT LOCAL_PASS=${passed}/11 E2_NOT_EXECUTED network_calls_real=0\n`);
