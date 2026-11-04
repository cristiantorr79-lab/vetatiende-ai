import assert from 'node:assert/strict';
import adapter, { createAdapter, preflight, sanitize } from './qa07_adapter_e2.mjs';
import { createManifest, validateInventory } from './qa07_multiclinica.mjs';

let passed = 0;
const test = async (name, fn) => { await fn(); passed += 1; process.stdout.write(`PASS ${name}\n`); };
const values = {
  LAB031_INTERNAL_BASE_URL: 'https://example.invalid', LAB031_INTERNAL_WEBHOOK_PATH: 'vetatiende-interno-lab025',
  LAB031_INTERNAL_HEADER_NAME: 'x-test-auth', LAB031_INTERNAL_HEADER_VALUE: 'secret-never-output',
  LAB031_IDENTITY_PROVIDER: 'qa_provider', LAB031_IDENTITY_SUBJECT: 'qa_subject',
  LAB031_QA_CLINIC_A: 'lab031_qa_clinic_a', LAB031_QA_CLINIC_B: 'lab031_qa_clinic_b',
};

await test('preflight lista nombres faltantes sin valores', async () => {
  const out = preflight({ LAB031_INTERNAL_HEADER_VALUE: 'do-not-print' });
  assert.equal(out.ok, false); assert.ok(out.missing.includes('LAB031_INTERNAL_BASE_URL'));
  assert.equal(JSON.stringify(out).includes('do-not-print'), false);
});

await test('preflight incompleto no usa red', async () => {
  let calls = 0; const instance = createAdapter({ env: {}, fetchImpl: async () => { calls += 1; } });
  assert.equal(instance.preflight().ok, false); assert.equal(calls, 0);
});

await test('adaptador exporta contrato completo', async () => {
  for (const method of ['inventory', 'runCase', 'deleteExact', 'postcheck']) assert.equal(typeof adapter[method], 'function');
});

await test('sanitización oculta URL, token y secreto largo', async () => {
  const out = sanitize('fetch https://private.invalid/path token=abc123456789012345678901234567890123');
  assert.equal(out.includes('private.invalid'), false); assert.equal(out.includes('abc123'), false);
});

await test('cleanup rechaza IDs inventariados no implementados', async () => {
  const instance = createAdapter({ env: values, fetchImpl: async () => { throw new Error('no network'); } });
  await assert.rejects(() => instance.deleteExact([{ id: 'foreign' }]), /QA07_E2_OPERATION_NOT_IMPLEMENTED/);
});

await test('inventory vacío es compatible con core QA-07', async () => {
  const instance = createAdapter({ env: values, fetchImpl: async () => { throw new Error('no network'); } });
  const manifest = createManifest({ runId: 'ADAPTER_TEST_001', environment: 'local_test' });
  const inventory = await instance.inventory(manifest);
  assert.equal(validateInventory(manifest, inventory).ok, true);
});

await test('smoke mock valida lectura y registra propietario no verificable', async () => {
  let calls = 0;
  const fetchImpl = async (_url, options) => {
    calls += 1; const body = JSON.parse(options.body);
    const payload = body.accion === 'ver_tareas_seguimiento'
      ? { ok: true, action: body.accion, clinic_id: values.LAB031_QA_CLINIC_A, tareas: [], cantidad_tareas: 0 }
      : { ok: true, action: body.accion, message: 'No encontré información interna suficiente.', data: { requiere_revision_humana: true } };
    return { ok: true, status: 200, headers: { get: () => '' }, json: async () => payload };
  };
  const result = await createAdapter({ env: values, fetchImpl }).runInternalSmoke({ runId: 'LOCAL_MOCK' });
  assert.equal(result.ok, true); assert.equal(result.cases['S-03'].fallback_seguro, true);
  assert.equal(result.cases['S-04'].status, 'NOT_VERIFIED'); assert.equal(calls, 2);
});

process.stdout.write(`RESULT PASS ${passed}/7 network_calls=0_real mock_calls=2\n`);
