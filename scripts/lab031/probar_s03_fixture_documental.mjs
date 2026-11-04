import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CLEANUP_CONFIRM, CLINIC_ID, EXECUTE_CONFIRM, EXPECTED_ANSWER, cleanupPreparedS03, loadManifest, prepareManifest, reconcileCreation, runPreparedS03 } from './s03_fixture_documental.mjs';

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; process.stdout.write(`LOCAL_PASS ${name}\n`); }
const resources = (m) => [
  { store: 'postgres', type: 'document', id: m.fixture.document_id, clinic_id: CLINIC_ID, visibility: 'internal', status: 'active' },
  { store: 'postgres', type: 'version', id: `${m.prefix}_VERSION_REAL_1`, clinic_id: CLINIC_ID, document_id: m.fixture.document_id, visibility: 'internal', status: 'active' },
  { store: 'postgres', type: 'event', id: `${m.prefix}_EVENT_REAL_1`, clinic_id: CLINIC_ID },
  { store: 'qdrant', type: 'point', id: 'point-real-1', clinic_id: CLINIC_ID, collection: 'vetatiende_interno' },
];
async function prepared(runId) { const root = await mkdtemp(join(tmpdir(), 'lab031-s03-')); return prepareManifest({ repoRoot: root, runId }); }
const query = (m, r) => ({ http_status: 200, answer: `Código: ${EXPECTED_ANSWER}`, fallback: false, clinic_id: CLINIC_ID, document_id: m.fixture.document_id, version_id: r[1].id });

await test('escritura atómica y rechazo de overwrite', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lab031-s03-')), out = await prepareManifest({ repoRoot: root, runId: 'HARD_001' });
  assert.equal((await loadManifest(out.manifest_path)).status, 'PREPARED');
  await assert.rejects(() => prepareManifest({ repoRoot: root, runId: 'HARD_001' }), /MANIFEST_YA_EXISTE/);
});

await test('reapertura recupera estado e inventario durable', async () => {
  const out = await prepared('HARD_002'), m = await loadManifest(out.manifest_path), r = resources(m); let calls = 0;
  await runPreparedS03({ manifestPath: out.manifest_path, confirm: EXECUTE_CONFIRM, adapter: { inventoryExact: async () => (++calls === 1 ? [] : r), createViaManagement: async () => ({}), queryInternal: async () => query(m, r) } });
  const reopened = await loadManifest(out.manifest_path); assert.equal(reopened.status, 'EXECUTED'); assert.deepEqual(reopened.resources.created, r);
});

await test('fallo de persistencia tras creación deja bloqueo durable', async () => {
  const out = await prepared('HARD_003'), m = await loadManifest(out.manifest_path), r = resources(m); let calls = 0, renames = 0;
  const io = { renameImpl: async (...args) => { renames += 1; if (renames === 4) throw new Error('injected_persist_failure'); return rename(...args); }, chmodImpl: chmod };
  await assert.rejects(() => runPreparedS03({ manifestPath: out.manifest_path, confirm: EXECUTE_CONFIRM, io, adapter: { inventoryExact: async () => (++calls === 1 ? [] : r), createViaManagement: async () => ({}), queryInternal: async () => query(m, r) } }));
  const disk = await loadManifest(out.manifest_path); assert.ok(['CREATION_IN_FLIGHT', 'CREATION_AMBIGUOUS'].includes(disk.status));
  await assert.rejects(() => runPreparedS03({ manifestPath: out.manifest_path, confirm: EXECUTE_CONFIRM, adapter: {} }), /RECONCILIACION_REQUERIDA/);
});

await test('reconciliación read-only recupera creación ambigua', async () => {
  const out = await prepared('HARD_004'), raw = JSON.parse(await readFile(out.manifest_path, 'utf8')); raw.status = 'CREATION_AMBIGUOUS'; raw.journal.push({ at: new Date().toISOString(), state: raw.status }); await writeFile(out.manifest_path, JSON.stringify(raw, null, 2));
  const result = await reconcileCreation({ manifestPath: out.manifest_path, adapter: { inventoryExact: async () => resources(raw) } });
  assert.equal(result.outcome, 'CREATED'); assert.equal((await loadManifest(out.manifest_path)).status, 'CREATED_INVENTORIED');
});

await test('inventario ajeno bloquea cleanup antes de borrar', async () => {
  const out = await prepared('HARD_005'), m = await loadManifest(out.manifest_path); m.resources.created = resources(m); m.status = 'EXECUTED'; await writeFile(out.manifest_path, JSON.stringify(m, null, 2)); let deletes = 0;
  const foreign = [...resources(m), { store: 'qdrant', type: 'point', id: 'foreign', clinic_id: 'otra_clinica', collection: 'vetatiende_interno' }];
  await assert.rejects(() => cleanupPreparedS03({ manifestPath: out.manifest_path, confirm: CLEANUP_CONFIRM, adapter: { inventoryExact: async () => foreign, deleteExactQdrant: async () => { deletes += 1; }, deleteExactPostgres: async () => { deletes += 1; }, postcheckExact: async () => [] } }), /RECURSO_AJENO/); assert.equal(deletes, 0);
});

await test('cleanup parcial reanuda sin repetir Qdrant', async () => {
  const out = await prepared('HARD_006'), m = await loadManifest(out.manifest_path), r = resources(m); m.resources.created = r; m.status = 'EXECUTED'; await writeFile(out.manifest_path, JSON.stringify(m, null, 2));
  let phase = 0, qDeletes = 0, pgDeletes = 0;
  await assert.rejects(() => cleanupPreparedS03({ manifestPath: out.manifest_path, confirm: CLEANUP_CONFIRM, adapter: { inventoryExact: async () => phase++ === 0 ? r : r.filter((x) => x.store === 'postgres'), deleteExactQdrant: async () => { qDeletes += 1; }, deleteExactPostgres: async () => { pgDeletes += 1; throw new Error('pg_partial'); }, postcheckExact: async () => [] } }), /pg_partial/);
  assert.equal((await loadManifest(out.manifest_path)).status, 'CLEANUP_AMBIGUOUS');
  const done = await cleanupPreparedS03({ manifestPath: out.manifest_path, confirm: CLEANUP_CONFIRM, adapter: { inventoryExact: async () => r.filter((x) => x.store === 'postgres'), deleteExactQdrant: async () => { qDeletes += 1; }, deleteExactPostgres: async () => { pgDeletes += 1; }, postcheckExact: async () => [] } });
  assert.equal(done.residues, 0); assert.equal(qDeletes, 1); assert.equal(pgDeletes, 2);
});

await test('post-check obligatorio impide PASS con residuos', async () => {
  const out = await prepared('HARD_007'), m = await loadManifest(out.manifest_path), r = resources(m); m.resources.created = r; m.status = 'EXECUTED'; await writeFile(out.manifest_path, JSON.stringify(m, null, 2)); let calls = 0;
  await assert.rejects(() => cleanupPreparedS03({ manifestPath: out.manifest_path, confirm: CLEANUP_CONFIRM, adapter: { inventoryExact: async () => (++calls === 1 ? r : []), deleteExactQdrant: async () => {}, deleteExactPostgres: async () => {}, postcheckExact: async () => [r[0]] } }), /POSTCHECK_CON_RESIDUOS/);
  assert.notEqual((await loadManifest(out.manifest_path)).cleanup.status, 'PASS');
});

await test('fuente no contiene endpoints ni secretos literales', async () => {
  const source = await readFile(new URL('./s03_fixture_documental.mjs', import.meta.url), 'utf8'); assert.doesNotMatch(source, /https?:\/\//); assert.doesNotMatch(source, /(?:sk-|gsk_)[A-Za-z0-9_-]{16,}/); assert.doesNotMatch(source, /password\s*[=:]/i);
});

process.stdout.write(`RESULT LOCAL_PASS=${passed}/8 E2_NOT_VERIFIED BLOCKED=MANAGEMENT_INVOKER network_calls=0\n`);
