import { pathToFileURL } from 'node:url';

const REQUIRED_ENV = Object.freeze([
  'LAB031_INTERNAL_BASE_URL',
  'LAB031_INTERNAL_WEBHOOK_PATH',
  'LAB031_INTERNAL_HEADER_NAME',
  'LAB031_INTERNAL_HEADER_VALUE',
  'LAB031_IDENTITY_PROVIDER',
  'LAB031_IDENTITY_SUBJECT',
  'LAB031_QA_CLINIC_A',
  'LAB031_QA_CLINIC_B',
]);
const CLINIC_RE = /^[a-z0-9][a-z0-9_-]{5,63}$/;
const REDACT = '[REDACTED]';

const fail = (reason) => { throw new Error(`LAB031_ADAPTER_${reason}`); };
const text = (value) => String(value ?? '').trim();
const clone = (value) => JSON.parse(JSON.stringify(value));

export function sanitize(value) {
  return text(value)
    .replace(/https?:\/\/\S+/gi, '[URL]')
    .replace(/(?:authorization|password|token|api[_-]?key|secret|header)\s*[=:]\s*\S+/gi, (match) => `${match.split(/[=:]/)[0]}=${REDACT}`)
    .replace(/[A-Za-z0-9+/_-]{32,}={0,2}/g, REDACT)
    .slice(0, 240);
}

export function preflight(env = process.env) {
  const missing = REQUIRED_ENV.filter((name) => !text(env[name]));
  if (missing.length) return { ok: false, missing, network_used: false };
  let base;
  try { base = new URL(text(env.LAB031_INTERNAL_BASE_URL)); } catch { return { ok: false, missing: [], invalid: ['LAB031_INTERNAL_BASE_URL'], network_used: false }; }
  const invalid = [];
  if (!['http:', 'https:'].includes(base.protocol)) invalid.push('LAB031_INTERNAL_BASE_URL');
  if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{2,127}$/.test(text(env.LAB031_INTERNAL_WEBHOOK_PATH).replace(/^\/+/, ''))) invalid.push('LAB031_INTERNAL_WEBHOOK_PATH');
  if (!/^[A-Za-z0-9-]{2,80}$/.test(text(env.LAB031_INTERNAL_HEADER_NAME))) invalid.push('LAB031_INTERNAL_HEADER_NAME');
  for (const name of ['LAB031_QA_CLINIC_A', 'LAB031_QA_CLINIC_B']) if (!CLINIC_RE.test(text(env[name]))) invalid.push(name);
  if (env.LAB031_QA_CLINIC_A === env.LAB031_QA_CLINIC_B) invalid.push('LAB031_QA_CLINIC_B');
  return { ok: invalid.length === 0, missing: [], invalid, network_used: false };
}

function config(env) {
  const checked = preflight(env);
  if (!checked.ok) fail(`PREFLIGHT_${[...checked.missing, ...(checked.invalid || [])].join(',')}`);
  const root = new URL(text(env.LAB031_INTERNAL_BASE_URL));
  root.pathname = `${root.pathname.replace(/\/$/, '')}/webhook/${text(env.LAB031_INTERNAL_WEBHOOK_PATH).replace(/^\/+/, '').replace(/^webhook\//, '')}`;
  return {
    endpoint: root.href,
    headerName: text(env.LAB031_INTERNAL_HEADER_NAME),
    headerValue: text(env.LAB031_INTERNAL_HEADER_VALUE),
    provider: text(env.LAB031_IDENTITY_PROVIDER),
    subject: text(env.LAB031_IDENTITY_SUBJECT),
    clinicA: text(env.LAB031_QA_CLINIC_A),
    clinicB: text(env.LAB031_QA_CLINIC_B),
    expectedWorkflowId: text(env.LAB031_EXPECTED_INTERNAL_WORKFLOW_ID),
    expectedWorkflowName: text(env.LAB031_EXPECTED_INTERNAL_WORKFLOW_NAME),
  };
}

function safeEvidence(response) {
  const get = (name) => text(response?.headers?.get?.(name));
  return {
    execution_id: get('x-n8n-execution-id') || null,
    workflow_id: get('x-n8n-workflow-id') || null,
    workflow_name: get('x-n8n-workflow-name') || null,
  };
}

function validateResponse(body, action) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(`${action}_RESPUESTA_INVALIDA`);
  if (body.ok !== true || text(body.action) !== action) fail(`${action}_CONTRATO_INVALIDO`);
  const serialized = JSON.stringify(body).toLowerCase();
  if (/(credential|postgres|qdrant|cohere|groq).{0,30}(error|fail|invalid|missing)/i.test(serialized)) fail(`${action}_ERROR_TECNICO`);
}

export function createAdapter({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') fail('FETCH_INVALIDO');
  let networkCalls = 0;

  async function request(action, payload = {}) {
    const cfg = config(env);
    networkCalls += 1;
    let response;
    try {
      response = await fetchImpl(cfg.endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          [cfg.headerName]: cfg.headerValue,
          'x-vetatiende-identity-provider': cfg.provider,
          'x-vetatiende-identity-subject': cfg.subject,
        },
        body: JSON.stringify({ internal_session_id: payload.sessionId, accion: action, ...payload.body }),
        signal: AbortSignal.timeout(45000),
      });
    } catch (error) { fail(`RED_${sanitize(error?.message) || 'FALLO'}`); }
    if (!response?.ok) fail(`HTTP_${Number(response?.status) || 0}`);
    let body;
    try { body = await response.json(); } catch { fail('JSON_INVALIDO'); }
    validateResponse(body, action);
    return { body, evidence: safeEvidence(response) };
  }

  async function runInternalSmoke({ runId = `SMOKE_${Date.now()}`, question = '¿Existe información interna sintética disponible para esta clínica?' } = {}) {
    const cfg = config(env);
    const sessionId = `LAB031_SMOKE_${text(runId).replace(/[^A-Za-z0-9_-]/g, '_')}`;
    const result = { ok: false, cases: {}, cleanup: 'N/A', created_resources: [], network_calls: 0 };
    try {
      const tasks = await request('ver_tareas_seguimiento', { sessionId });
      result.cases['S-01'] = { status: 'PASS', evidence: tasks.evidence };
      const taskBody = tasks.body;
      if (text(taskBody.clinic_id) !== cfg.clinicA) fail('S02_CLINIC_ID_INVALIDO');
      if (!Array.isArray(taskBody.tareas) || !Number.isInteger(taskBody.cantidad_tareas)) fail('S02_ESTRUCTURA_INVALIDA');
      if (JSON.stringify(taskBody).includes(cfg.clinicB)) fail('S02_FUGA_CLINICA_B');
      result.cases['S-02'] = { status: 'PASS', cantidad_tareas: taskBody.cantidad_tareas };

      const rag = await request('consulta_rag_interno', { sessionId, body: { message: text(question) } });
      if (!text(rag.body.message) || !rag.body.data || typeof rag.body.data !== 'object') fail('S03_ESTRUCTURA_INVALIDA');
      if (JSON.stringify(rag.body).includes(cfg.clinicB)) fail('S03_FUGA_CLINICA_B');
      result.cases['S-03'] = { status: 'PASS', fallback_seguro: rag.body.data.requiere_revision_humana === true, fuentes_count: Array.isArray(rag.body.data.fuentes) ? rag.body.data.fuentes.length : 0 };

      const evidence = rag.evidence.workflow_id || rag.evidence.workflow_name ? rag.evidence : tasks.evidence;
      const attributable = Boolean(evidence.workflow_id || evidence.workflow_name);
      const matchesId = !cfg.expectedWorkflowId || evidence.workflow_id === cfg.expectedWorkflowId;
      const matchesName = !cfg.expectedWorkflowName || evidence.workflow_name === cfg.expectedWorkflowName;
      result.cases['S-04'] = { status: attributable && matchesId && matchesName ? 'PASS' : 'NOT_VERIFIED', evidence };
      result.ok = ['S-01', 'S-02', 'S-03'].every((id) => result.cases[id]?.status === 'PASS') && result.cases['S-04'].status !== 'FAIL';
      result.network_calls = networkCalls;
      return result;
    } catch (error) {
      result.network_calls = networkCalls;
      result.error = sanitize(error?.message);
      const next = ['S-01', 'S-02', 'S-03', 'S-04'].find((id) => !result.cases[id]);
      if (next) result.cases[next] = { status: 'FAIL' };
      for (const id of ['S-01', 'S-02', 'S-03', 'S-04']) if (!result.cases[id]) result.cases[id] = { status: 'NOT_RUN' };
      return result;
    }
  }

  async function inventory(manifest) {
    if (!manifest?.run_id || !Array.isArray(manifest.cleanup_expected)) fail('MANIFEST_INVALIDO');
    if (manifest.cleanup_expected.length) fail('QA07_E2_OPERATION_NOT_IMPLEMENTED');
    return { run_id: manifest.run_id, resources: [] };
  }
  async function runCase() { fail('QA07_E2_OPERATION_NOT_IMPLEMENTED'); }
  async function deleteExact(expected) {
    if (!Array.isArray(expected) || expected.length) fail('QA07_E2_OPERATION_NOT_IMPLEMENTED');
    return { ok: true, deleted: 0 };
  }
  async function postcheck(manifest) { return inventory(manifest); }

  return Object.freeze({ preflight: () => preflight(env), runInternalSmoke, inventory, runCase, deleteExact, postcheck, getNetworkCalls: () => networkCalls });
}

export const adapter = createAdapter();
export default adapter;

function parseArgs(argv) { return Object.fromEntries(argv.filter((arg) => arg.startsWith('--')).map((arg) => { const [key, ...value] = arg.slice(2).split('='); return [key, value.join('=')]; })); }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const instance = createAdapter();
  const output = args.mode === 'smoke'
    ? await instance.runInternalSmoke({ runId: args['run-id'], question: args.question })
    : instance.preflight();
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.ok) process.exitCode = 1;
}
