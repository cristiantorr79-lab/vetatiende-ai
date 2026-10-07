import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const workflow = JSON.parse(await readFile(path.join(dir, 'workflow_temporal_cleanup_documento_e2.json'), 'utf8'));
const source = workflow.nodes.find(node => node.name === 'Responder POST_CHECK cleanup documental LAB-030')?.parameters?.jsCode;
assert.ok(source);
const run = new Function('$input', '$', source);
const expected = {
  clinic_id: 'clinica_piloto_001',
  name: 'LAB030_QA Clínica Piloto 001',
  status: 'active',
  created_at: '2026-10-01T19:53:44.611596+00:00',
  updated_at: '2026-10-01T19:53:44.611596+00:00',
};
const reordered = {
  updated_at: expected.updated_at,
  created_at: expected.created_at,
  clinic_id: expected.clinic_id,
  status: expected.status,
  name: expected.name,
};
const execute = clinic => run(
  { first: () => ({ json: { result: { points: [] } } }) },
  name => ({ first: () => ({ json: name.startsWith('Validar manifest')
    ? { clinic_snapshot: expected }
    : { documents_remaining: '0', versions_remaining: '0', events_remaining: '0', clinic_snapshot: clinic } }) }),
);
const result = execute(reordered);
assert.equal(result[0].json.ok, true);
assert.equal(result[0].json.clinic_preserved, true);
assert.throws(() => execute({ ...reordered, status: 'inactive' }), /LAB030_DOCUMENT_CLEANUP_POSTCHECK_FAILED/);
console.log(JSON.stringify({ ok: true, network_executed: false, reordered_snapshot: 'PASS', divergent_field: 'FAIL_CLOSED_PASS' }));
