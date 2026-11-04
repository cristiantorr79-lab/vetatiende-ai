import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = JSON.parse(await readFile(new URL('./s03_management_invoker_qa.json', import.meta.url), 'utf8'));
let passed = 0;
function test(name, fn) { fn(); passed += 1; process.stdout.write(`LOCAL_PASS ${name}\n`); }
const nodes = workflow.nodes;

test('JSON importable, inactivo y nombre temporal explícito', () => {
  assert.equal(workflow.active, false); assert.match(workflow.name, /LAB-031 TEMP QA/); assert.ok(Array.isArray(nodes)); assert.ok(workflow.connections);
});

test('solo existe Manual Trigger y no hay automatismos', () => {
  assert.equal(nodes.filter((n) => n.type === 'n8n-nodes-base.manualTrigger').length, 1);
  assert.equal(nodes.some((n) => /webhook|schedule|cron|interval/i.test(n.type)), false);
});

test('Execute Sub-workflow usa referencia configurable, no ID inventado', () => {
  const node = nodes.find((n) => n.type === 'n8n-nodes-base.executeWorkflow'); assert.ok(node); assert.equal(node.parameters.source, 'database'); assert.equal(node.parameters.workflowId.value, '={{ $json.management_workflow_id }}'); assert.equal(node.parameters.options.waitForSubWorkflow, true);
});

test('contrato Management contiene exactamente diez strings', () => {
  const node = nodes.find((n) => n.type === 'n8n-nodes-base.executeWorkflow');
  const expected = ['action','clinic_id','document_id','document_type','visibility','access_level','source_file','content_hash','document_content','target_version_id'];
  assert.deepEqual(Object.keys(node.parameters.workflowInputs.value), expected); assert.deepEqual(node.parameters.workflowInputs.schema.map((x) => x.id), expected); assert.ok(node.parameters.workflowInputs.schema.every((x) => x.type === 'string'));
});

test('fixture exacto y action ingest están fijados por barrera', () => {
  const code = nodes.find((n) => n.name === 'Validar evidencia y autorización S-03').parameters.jsCode;
  for (const value of ['PRECHECK_20261104A','clinica_piloto_001','LAB031_S03_PRECHECK_20261104A_DOC_INTERNAL','QA-S03-742',"action:'ingest'","visibility:'internal'"]) assert.ok(code.includes(value));
});

test('gates exigen bundle externo y verificador runtime', () => {
  const code = nodes.find((n) => n.name === 'Validar evidencia y autorización S-03').parameters.jsCode;
  for (const gate of ['external_gate_bundle_status','external_gate_bundle_digest','external_gate_runtime_verified','management_workflow_id']) assert.ok(code.includes(gate));
  assert.ok(code.includes('authorized:false')); assert.ok(code.includes('EXTERNAL_EVIDENCE_CANNOT_BE_VERIFIED'));
});

test('workflow no contiene PASS ni autorización simulada editable', () => {
  const values = Object.fromEntries(nodes.find((n) => n.name === 'Configurar gates bloqueados S-03').parameters.assignments.assignments.map((x) => [x.name, x.value]));
  assert.equal(values.external_gate_bundle_status, 'MISSING'); assert.equal(values.external_gate_runtime_verified, false); assert.equal(values.management_workflow_id, '');
  assert.equal('precreate_status' in values, false); assert.equal('cleanup_ready' in values, false); assert.equal('explicit_authorization' in values, false);
});

test('ningún camino conectado alcanza Execute aunque se editen los campos', () => {
  const incoming = Object.entries(workflow.connections).flatMap(([from, value]) => (value.main || []).flatMap((branch) => (branch || []).map((edge) => ({ from, to: edge.node })))).filter((edge) => edge.to === 'Invocar Management LAB-029 S-03');
  assert.deepEqual(incoming, []);
  const branches = workflow.connections['¿Gates completos S-03?'].main; assert.equal(branches[0][0].node, 'Detener invocador S-03 bloqueado'); assert.equal(branches[1][0].node, 'Detener invocador S-03 bloqueado');
});

test('salida marca recursos no acreditados e inventario posterior obligatorio', () => {
  const code = nodes.find((n) => n.name === 'Registrar retorno ambiguo Management S-03').parameters.jsCode; assert.ok(code.includes('resources_accredited:false')); assert.ok(code.includes('POST_CREATE_READONLY_INVENTORY'));
});

test('sin credenciales, endpoints, IPs ni secretos', () => {
  const serialized = JSON.stringify(workflow); assert.equal(nodes.some((n) => n.credentials), false); assert.doesNotMatch(serialized, /https?:\/\//); assert.doesNotMatch(serialized, /\b(?:\d{1,3}\.){3}\d{1,3}\b/); assert.doesNotMatch(serialized, /(?:password|token|api[_-]?key|secret)\s*[=:]/i);
});

process.stdout.write(`RESULT LOCAL_PASS=${passed}/10 N8N_RUNTIME_NOT_VERIFIED E2_NOT_EXECUTED\n`);
