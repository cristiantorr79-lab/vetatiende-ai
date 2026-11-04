import { EXPECTED_ANSWER, CLINIC_ID, validateManifest } from './s03_fixture_documental.mjs';

const fail = (reason) => { throw new Error(`S03_INTEGRATION_${reason}`); };
const text = (value) => String(value ?? '').trim();
const clone = (value) => structuredClone(value);
const PROVIDER = 'prueba_oidc';
const SUBJECT = 'usuario_veterinario_001';

export function managementPayload(manifest) {
  validateManifest(manifest);
  const f = manifest.fixture;
  if (manifest.clinic_id !== CLINIC_ID || !f.synthetic || f.visibility !== 'internal' || f.content !== 'El código de inventario del material de demostración es QA-S03-742.') fail('FIXTURE_INVALIDO');
  return Object.freeze({ action: 'ingest', clinic_id: manifest.clinic_id, document_id: f.document_id, document_type: f.document_type, visibility: 'internal', access_level: f.access_level, source_file: f.source_file, content_hash: f.content_hash, document_content: f.content, target_version_id: '' });
}

function internalConfig(env) {
  const required = ['LAB031_INTERNAL_BASE_URL', 'LAB031_INTERNAL_WEBHOOK_PATH', 'LAB031_INTERNAL_HEADER_NAME', 'LAB031_INTERNAL_HEADER_VALUE'];
  if (required.some((name) => !text(env?.[name]))) fail('ENDPOINT_NO_CONFIGURADO');
  let root; try { root = new URL(text(env.LAB031_INTERNAL_BASE_URL)); } catch { fail('ENDPOINT_INVALIDO'); }
  if (!['http:', 'https:'].includes(root.protocol) || !/^[A-Za-z0-9-]{2,80}$/.test(text(env.LAB031_INTERNAL_HEADER_NAME))) fail('ENDPOINT_INVALIDO');
  const path = text(env.LAB031_INTERNAL_WEBHOOK_PATH).replace(/^\/+/, '').replace(/^webhook\//, '');
  if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{2,127}$/.test(path)) fail('ENDPOINT_INVALIDO');
  root.pathname = `${root.pathname.replace(/\/$/, '')}/webhook/${path}`;
  return { endpoint: root.href, headerName: text(env.LAB031_INTERNAL_HEADER_NAME), headerValue: text(env.LAB031_INTERNAL_HEADER_VALUE) };
}

export function evaluateExecutionGates({ manifest, managementInvoke, inventoryAdapter, deleteExactPostgres, deleteExactQdrant, env = {} } = {}) {
  const blocked = [];
  try { validateManifest(manifest); } catch { blocked.push('MANIFEST_INVALIDO'); }
  if (typeof managementInvoke !== 'function') blocked.push('MANAGEMENT_INVOKER_AUSENTE');
  if (typeof inventoryAdapter?.inventoryExact !== 'function') blocked.push('INVENTARIO_AUSENTE');
  if (typeof deleteExactPostgres !== 'function' || typeof deleteExactQdrant !== 'function') blocked.push('CLEANUP_EXACTO_AUSENTE');
  try { internalConfig(env); } catch { blocked.push('WEBHOOK_INTERNO_NO_CONFIGURADO'); }
  return { ok: blocked.length === 0, status: blocked.length ? 'BLOCKED' : 'READY_FOR_EXPLICIT_AUTHORIZATION', blocked };
}

export function createS03IntegrationAdapter({ env = process.env, fetchImpl = globalThis.fetch, managementInvoke, inventoryAdapter, deleteExactPostgres: deletePostgresImpl, deleteExactQdrant: deleteQdrantImpl, timeoutMs = 60000 } = {}) {
  if (typeof fetchImpl !== 'function') fail('FETCH_INVALIDO');
  const timeout = Number(timeoutMs);
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120000) fail('TIMEOUT_INVALIDO');

  async function inventoryExact(manifest, options) {
    if (typeof inventoryAdapter?.inventoryExact !== 'function') fail('INVENTARIO_AUSENTE');
    return inventoryAdapter.inventoryExact(clone(manifest), options);
  }

  async function createViaManagement(manifest) {
    if (typeof managementInvoke !== 'function') fail('MANAGEMENT_INVOKER_AUSENTE');
    const payload = managementPayload(manifest);
    let result;
    try { result = await managementInvoke(clone(payload), { signal: AbortSignal.timeout(timeout), timeoutMs: timeout, readOnly: false }); }
    catch { fail('MANAGEMENT_ERROR'); }
    if (!result || typeof result !== 'object' || result.ok !== true) fail('MANAGEMENT_RESPUESTA_INCOMPLETA');
    return { ok: true }; // Los IDs se acreditan exclusivamente con inventoryExact POST_CREATE.
  }

  async function queryInternal(manifest) {
    validateManifest(manifest); const cfg = internalConfig(env);
    const body = { internal_session_id: `${manifest.prefix}_INTERNAL_SESSION`, accion: 'consulta_rag_interno', message: manifest.fixture.query };
    let response;
    try { response = await fetchImpl(cfg.endpoint, { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json', [cfg.headerName]: cfg.headerValue, 'x-vetatiende-identity-provider': PROVIDER, 'x-vetatiende-identity-subject': SUBJECT }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) }); }
    catch { fail('RAG_ERROR_RED'); }
    if (!response?.ok || Number(response.status) !== 200) fail('RAG_HTTP_ERROR');
    let json; try { json = await response.json(); } catch { fail('RAG_JSON_INVALIDO'); }
    if (json?.ok !== true || text(json.action) !== 'consulta_rag_interno' || !json.data || !Array.isArray(json.data.fuentes)) fail('RAG_RESPUESTA_INCOMPLETA');
    const answer = text(json.message), sources = json.data.fuentes.map(text).filter(Boolean);
    return { http_status: 200, answer, fallback: json.data.requiere_revision_humana === true, clinic_id: manifest.clinic_id, sources };
  }

  async function deleteExactQdrant(resources, manifest) {
    if (typeof deleteQdrantImpl !== 'function') fail('CLEANUP_QDRANT_AUSENTE');
    if (!Array.isArray(resources) || resources.some((x) => x.store !== 'qdrant' || x.type !== 'point' || x.collection !== 'vetatiende_interno' || x.clinic_id !== manifest.clinic_id || !x.id)) fail('CLEANUP_QDRANT_INVALIDO');
    return deleteQdrantImpl(clone(resources), clone(manifest));
  }

  async function deleteExactPostgres(resources, manifest) {
    if (typeof deletePostgresImpl !== 'function') fail('CLEANUP_POSTGRES_AUSENTE');
    if (!Array.isArray(resources) || resources.some((x) => x.store !== 'postgres' || !['document', 'version', 'event'].includes(x.type) || x.clinic_id !== manifest.clinic_id || !x.id)) fail('CLEANUP_POSTGRES_INVALIDO');
    return deletePostgresImpl(clone(resources), clone(manifest));
  }

  async function postcheckExact(manifest) { return inventoryExact(manifest, { mode: 'RECOVERY_CLEANUP' }); }

  return Object.freeze({ inventoryExact, createViaManagement, queryInternal, deleteExactQdrant, deleteExactPostgres, postcheckExact, gates: (manifest) => evaluateExecutionGates({ manifest, managementInvoke, inventoryAdapter, deleteExactPostgres: deletePostgresImpl, deleteExactQdrant: deleteQdrantImpl, env }) });
}

export const S03_EXPECTED_ANSWER = EXPECTED_ANSWER;
