import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CLINICS, CASE_IDS, addResource, cleanupMode, createManifest, manifestPathFor,
  executeMode, prepareManifest, precheckLocal, validateInventory, validateManifest,
} from './qa07_multiclinica.mjs';

let passed = 0;
const test = async (name, fn) => {
  await fn(); passed += 1; process.stdout.write(`PASS ${name}\n`);
};
const rejects = async (fn, pattern) => assert.rejects(fn, pattern);
const root = await mkdtemp(join(tmpdir(), 'lab031-qa07-'));
const runId = 'LOCAL_TEST_0001';
const base = { runId, environment: 'local_test', runtimeRoot: root, repoRoot: process.cwd() };
let networkCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { networkCalls += 1; throw new Error('network_forbidden'); };

try {
  await test('genera run_id/prefix y ruta privada', async () => {
    const manifest = createManifest({ runId, environment: 'local_test' });
    assert.equal(manifest.qa_prefix, `LAB031_QA_${runId}`);
    assert.match(manifestPathFor(root, runId).replaceAll('\\', '/'), /private-storage\/lab031\/LOCAL_TEST_0001\/manifest\.json$/);
  });

  await test('manifest válido contiene siete casos y separación A/B', async () => {
    const manifest = createManifest({ runId, environment: 'local_test' });
    assert.equal(validateManifest(manifest), true);
    assert.deepEqual(Object.keys(manifest.cases), CASE_IDS);
    assert.notEqual(manifest.clinic_a.clinic_id, manifest.clinic_b.clinic_id);
  });

  await test('rechaza clinic_id inválido o cruzado', async () => {
    const invalid = createManifest({ runId, environment: 'local_test' });
    invalid.clinic_b.clinic_id = 'INVALID CLINIC';
    assert.throws(() => validateManifest(invalid), /CLINICAS_INVALIDAS|MANIFEST_CLINICAS_AJENAS/);
    const manifest = createManifest({ runId, environment: 'local_test' });
    assert.throws(() => addResource(manifest, 'a', 'persistent_ids', { id: 'x1', clinic_id: CLINICS.b, store: 'lab025_tareas' }), /RECURSO_INVALIDO/);
  });

  await test('inventory acepta IDs exactos y falla cerrado ante faltantes/inesperados/cruzados', async () => {
    const manifest = createManifest({ runId, environment: 'local_test' });
    addResource(manifest, 'a', 'persistent_ids', { id: 'task_a', clinic_id: CLINICS.a, store: 'lab025_tareas', type: 'task' });
    const exact = { run_id: runId, resources: [{ id: 'task_a', clinic_id: CLINICS.a, store: 'lab025_tareas', type: 'task' }] };
    assert.equal(validateInventory(manifest, exact).ok, true);
    assert.throws(() => validateInventory(manifest, { run_id: runId, resources: [] }), /RECURSO_FALTANTE/);
    assert.throws(() => validateInventory(manifest, { run_id: runId, resources: [...exact.resources, { id: 'foreign', clinic_id: CLINICS.b, store: 'lab025_tareas', type: 'task' }] }), /RECURSO_INESPERADO/);
    assert.throws(() => validateInventory(manifest, { run_id: runId, resources: [{ ...exact.resources[0], clinic_id: CLINICS.b }] }), /CLINICA_AJENA/);
  });

  await test('cleanup rechaza IDs no inventariados sin invocar delete', async () => {
    const prepared = await prepareManifest({ ...base, runId: 'LOCAL_TEST_0002' });
    let deletes = 0;
    const adapter = { inventory: async () => ({ run_id: 'LOCAL_TEST_0002', resources: [] }), deleteExact: async () => { deletes += 1; }, postcheck: async () => ({ run_id: 'LOCAL_TEST_0002', resources: [] }) };
    await rejects(() => cleanupMode({ manifestPath: prepared.manifestPath, adapter, confirm: 'LAB031_QA_CLEANUP' }), /IDS_NO_INVENTARIADOS/);
    assert.equal(deletes, 0);
  });

  await test('cleanup no borra si inventory difiere del manifest', async () => {
    const localRun = 'LOCAL_TEST_0003';
    const prepared = await prepareManifest({ ...base, runId: localRun });
    const manifest = prepared.manifest;
    addResource(manifest, 'a', 'persistent_ids', { id: 'owned_a', clinic_id: CLINICS.a, store: 'lab025_tareas', type: 'task' });
    await import('node:fs/promises').then(({ writeFile }) => writeFile(prepared.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`));
    let deletes = 0;
    const adapter = { inventory: async () => ({ run_id: localRun, resources: [{ id: 'foreign', clinic_id: CLINICS.b, store: 'lab025_tareas', type: 'task' }] }), deleteExact: async () => { deletes += 1; }, postcheck: async () => ({ run_id: localRun, resources: [] }) };
    await rejects(() => cleanupMode({ manifestPath: prepared.manifestPath, adapter, confirm: 'LAB031_QA_CLEANUP' }), /RECURSO_INESPERADO/);
    assert.equal(deletes, 0);
  });

  await test('PRECHECK_LOCAL y PREPARE_MANIFEST son sin red y no exponen secretos', async () => {
    const check = await precheckLocal({ ...base, runId: 'LOCAL_TEST_0004' });
    assert.equal(check.network_used, false);
    const prepared = await prepareManifest({ ...base, runId: 'LOCAL_TEST_0005' });
    const text = await readFile(prepared.manifestPath, 'utf8');
    assert.equal(/token|password|authorization|api[_-]?key/i.test(text), false);
    assert.equal(networkCalls, 0);
  });

  await test('EXECUTE registra IDs creados antes del siguiente caso', async () => {
    const localRun = 'LOCAL_TEST_0006';
    const prepared = await prepareManifest({ ...base, runId: localRun });
    const adapter = {
      inventory: async () => ({ run_id: localRun, resources: [] }),
      deleteExact: async () => {},
      postcheck: async () => ({ run_id: localRun, resources: [] }),
      runCase: async () => ({ ok: true, evidence_refs: ['local:case'], created_resources: [{ side: 'a', group: 'persistent_ids', id: 'task_from_case', clinic_id: CLINICS.a, store: 'lab025_tareas', type: 'task' }] }),
    };
    await executeMode({ manifestPath: prepared.manifestPath, adapter, selectedCases: ['M-02'], confirm: 'LAB031_QA_E2' });
    const stored = JSON.parse(await readFile(prepared.manifestPath, 'utf8'));
    assert.equal(stored.cleanup_expected[0].id, 'task_from_case');
    assert.equal(stored.cases['M-02'].result, 'PASS');
  });

  process.stdout.write(`RESULT PASS ${passed}/8 network_calls=${networkCalls}\n`);
} finally {
  globalThis.fetch = originalFetch;
  await rm(root, { recursive: true, force: true });
}
