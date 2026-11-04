import assert from 'node:assert/strict';
import { createManifest } from './s03_fixture_documental.mjs';
import { POSTGRES_INVENTORY_SQL, QDRANT_COLLECTION, createReadonlyInventoryAdapter } from './s03_inventory_readonly.mjs';

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; process.stdout.write(`LOCAL_PASS ${name}\n`); }
const manifest = () => createManifest({ runId: 'INVENTORY_001' });
const pgRows = (m) => [
  { record_type: 'document', id: m.fixture.document_id, clinic_id: m.clinic_id, visibility: 'internal', status: 'active', document_id: null, version_id: null, event_type: null },
  { record_type: 'version', id: 'version-real-1', clinic_id: m.clinic_id, visibility: 'internal', status: 'active', document_id: m.fixture.document_id, version_id: 'version-real-1', event_type: null },
  { record_type: 'event', id: 'event-real-1', clinic_id: m.clinic_id, visibility: 'internal', status: 'accepted', document_id: m.fixture.document_id, version_id: 'version-real-1', event_type: 'activated' },
];
const point = (m, over = {}) => ({ id: over.id ?? 'point-real-1', payload: { metadata: { clinic_id: m.clinic_id, document_id: m.fixture.document_id, version_id: 'version-real-1', visibility: 'internal', status: 'active', ...over.metadata } } });
const adapter = (rows, points, qdrantOver = {}) => createReadonlyInventoryAdapter({ postgresRead: async (request) => { assert.deepEqual(request.params, [manifest().clinic_id, manifest().fixture.document_id]); assert.match(request.query, /WHERE d\.clinic_id = \$1 AND d\.document_id = \$2/); return rows; }, qdrantScroll: async (request) => ({ status: 'ok', result: { points, next_page_offset: null }, ...qdrantOver }) });

await test('inventario completo devuelve IDs reales PostgreSQL y Qdrant', async () => {
  const m = manifest(), result = await adapter(pgRows(m), [point(m)]).inventoryExact(m);
  assert.deepEqual(result.map((x) => x.id), [m.fixture.document_id, 'version-real-1', 'event-real-1', 'point-real-1']);
  assert.equal(result.at(-1).collection, QDRANT_COLLECTION); assert.doesNotMatch(POSTGRES_INVENTORY_SQL, /content|details/);
});

await test('inventario vacío se distingue y devuelve lista vacía', async () => {
  assert.deepEqual(await adapter([], []).inventoryExact(manifest(), { mode: 'PRE_CREATE' }), []);
});

await test('PRE_CREATE bloquea cualquier recurso preexistente', async () => {
  const m = manifest(); await assert.rejects(() => adapter(pgRows(m), [point(m)]).inventoryExact(m, { mode: 'PRE_CREATE' }), /PRE_CREATE_NO_VACIO/);
});

await test('POST_CREATE exige documento, versión activa y punto activo', async () => {
  const m = manifest(); assert.equal((await adapter(pgRows(m), [point(m)]).inventoryExact(m, { mode: 'POST_CREATE' })).length, 4);
  await assert.rejects(() => adapter(pgRows(m), []).inventoryExact(m, { mode: 'POST_CREATE' }), /POST_CREATE_INCOMPLETO/);
});

await test('RECONCILE_CREATION acredita recursos tras retorno ambiguo sin autoridad previa', async () => {
  const m = manifest();
  const result = await adapter(pgRows(m), [point(m)]).inventoryExact(m, { mode: 'RECONCILE_CREATION' });
  assert.ok(result.some((x) => x.type === 'document')); assert.ok(result.some((x) => x.store === 'qdrant'));
});

await test('RECOVERY_CLEANUP acepta ausencia parcial solo del inventario sellado', async () => {
  const m = manifest(), full = await adapter(pgRows(m), [point(m)]).inventoryExact(m); m.resources.created = full;
  const partialRows = pgRows(m).filter((row) => row.record_type === 'document');
  const partial = await adapter(partialRows, []).inventoryExact(m, { mode: 'RECOVERY_CLEANUP' }); assert.equal(partial.length, 1);
  m.resources.created = []; await assert.rejects(() => adapter(partialRows, []).inventoryExact(m, { mode: 'RECOVERY_CLEANUP' }), /RECOVERY_SIN_AUTORIDAD/);
});

await test('Qdrant pagina múltiples páginas hasta agotamiento', async () => {
  const m = manifest(); let page = 0;
  const a = createReadonlyInventoryAdapter({ postgresRead: async () => pgRows(m), qdrantScroll: async () => ++page === 1 ? { status: 'ok', result: { points: [point(m, { id: 'p1' })], next_page_offset: 'next' } } : { status: 'ok', result: { points: [point(m, { id: 'p2' })], next_page_offset: null } } });
  const result = await a.inventoryExact(m); assert.equal(result.filter((x) => x.store === 'qdrant').length, 2); assert.equal(page, 2);
});

await test('Qdrant bloquea offset repetido, truncamiento y fallo intermedio', async () => {
  const m = manifest(); let page = 0;
  const repeated = createReadonlyInventoryAdapter({ postgresRead: async () => pgRows(m), qdrantScroll: async () => ({ status: 'ok', result: { points: [point(m, { id: `p${++page}` })], next_page_offset: 'same' } }) });
  await assert.rejects(() => repeated.inventoryExact(m), /PAGINACION_AMBIGUA/);
  const truncated = createReadonlyInventoryAdapter({ postgresRead: async () => pgRows(m), qdrantScroll: async () => ({ status: 'ok', result: { points: [], next_page_offset: 'more' } }) });
  await assert.rejects(() => truncated.inventoryExact(m), /RESPUESTA_TRUNCADA/);
  page = 0; const intermediate = createReadonlyInventoryAdapter({ postgresRead: async () => pgRows(m), qdrantScroll: async () => { if (++page === 2) throw new Error('offline'); return { status: 'ok', result: { points: [point(m)], next_page_offset: 'next' } }; } });
  await assert.rejects(() => intermediate.inventoryExact(m), /QDRANT_ERROR_CONEXION/);
});

await test('duplicados se rechazan', async () => {
  const m = manifest(); await assert.rejects(() => adapter(pgRows(m), [point(m), point(m)]).inventoryExact(m), /ID_DUPLICADO/);
});

await test('clinic_id incorrecto se rechaza', async () => {
  const m = manifest(), rows = pgRows(m); rows[0].clinic_id = 'otra_clinica'; await assert.rejects(() => adapter(rows, []).inventoryExact(m), /RECURSO_AJENO/);
});

await test('colección interna es fija y metadata incorrecta se rechaza', async () => {
  const m = manifest(); let collection; const a = createReadonlyInventoryAdapter({ postgresRead: async () => pgRows(m), qdrantScroll: async (request) => { collection = request.collection; return { status: 'ok', result: { points: [point(m, { metadata: { visibility: 'public' } })], next_page_offset: null } }; } });
  await assert.rejects(() => a.inventoryExact(m), /METADATA_INVALIDA/); assert.equal(collection, 'vetatiende_interno');
});

await test('IDs o metadata faltantes se rechazan', async () => {
  const m = manifest(); await assert.rejects(() => adapter(pgRows(m), [{ payload: { metadata: {} } }]).inventoryExact(m), /ID_O_METADATA_FALTANTE/);
});

await test('recursos inesperados y versiones no acreditadas se rechazan', async () => {
  const m = manifest(); await assert.rejects(() => adapter(pgRows(m), [point(m, { metadata: { version_id: 'foreign-version' } })]).inventoryExact(m), /VERSION_NO_ACREDITADA/);
});

await test('error de conexión no se convierte en inventario vacío', async () => {
  const m = manifest(), pgError = createReadonlyInventoryAdapter({ postgresRead: async () => { throw new Error('offline'); }, qdrantScroll: async () => ({}) });
  await assert.rejects(() => pgError.inventoryExact(m), /POSTGRES_ERROR_CONEXION/);
  const qError = createReadonlyInventoryAdapter({ postgresRead: async () => pgRows(m), qdrantScroll: async () => { throw new Error('offline'); } });
  await assert.rejects(() => qError.inventoryExact(m), /QDRANT_ERROR_CONEXION/);
});

await test('resultado ambiguo bloquea avance', async () => {
  const m = manifest(), rows = pgRows(m); rows.push({ ...rows[0] }); await assert.rejects(() => adapter(rows, []).inventoryExact(m), /POSTGRES_AMBIGUO/);
  const orphan = createReadonlyInventoryAdapter({ postgresRead: async () => [], qdrantScroll: async () => ({ status: 'ok', result: { points: [point(m)], next_page_offset: null } }) });
  await assert.rejects(() => orphan.inventoryExact(m), /QDRANT_SIN_POSTGRES|VERSION_NO_ACREDITADA/);
});

process.stdout.write(`RESULT LOCAL_PASS=${passed}/15 E2_NOT_VERIFIED network_calls=0\n`);
