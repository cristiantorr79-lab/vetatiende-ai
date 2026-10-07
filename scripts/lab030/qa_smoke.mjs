import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { verificarRuntime } from '../lab029/verificar_runtime_lab029.mjs';

export const STATUS = Object.freeze({
  PASS: 'PASS',
  WARN: 'WARN',
  FAIL: 'FAIL',
  CRITICAL_FAIL: 'CRITICAL_FAIL',
  NOT_RUN: 'NOT_RUN',
  NOT_REQUIRED: 'NOT_REQUIRED',
});

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, '..', '..');
const startedAt = new Date();
const MODE = Object.freeze({ LOCAL: 'LOCAL', E2_HEALTH: 'E2_HEALTH', E2_PUBLIC_RAG: 'E2_PUBLIC_RAG' });

const PUBLIC_RAG_CASE = Object.freeze({
  id: 'LAB030-RAG-PUBLIC-01',
  source: 'LAB-029 P-01',
  clinicId: 'clinica_piloto_001',
  channel: 'qa_smoke',
  message: '¿Qué día y a qué hora atiende la clínica?',
  semanticExpectation: 'La respuesta informa un día de atención y una hora, sin exigir texto literal completo.',
});

const PUBLIC_RAG_CLEANUP = Object.freeze({
  ready: false,
  locallyPrepared: true,
  idClassification: 'B_ID_NO_CONFIRMADO_CLAVE_EXACTA_SOPORTADA',
  workflowFile: 'scripts/lab030/workflow_temporal_cleanup_rag_publico.json',
  selectedOption: 'B_VIA_EXISTENTE_REQUIERE_ADAPTACION_MINIMA',
  mechanism: 'workflow_temporal_protegido_derivado_del_precheck_cleanup_lab029',
  sourceMechanisms: Object.freeze([
    'scripts/lab029/crear_workflow_precheck_cleanup_lab029.mjs',
    'scripts/lab029/crear_workflow_cleanup_execute_lab029.mjs',
    'scripts/lab029/ejecutar_cleanup_runtime_lab029.mjs',
  ]),
  requiredConfiguration: Object.freeze([
    'LAB029_N8N_WEBHOOK_BASE_URL',
    'LAB029_INTERNAL_HEADER_NAME',
    'LAB029_INTERNAL_HEADER_VALUE',
  ]),
  writes: Object.freeze([
    Object.freeze({
      store: 'n8n_data_table',
      table: 'lab024_estado_urgencia',
      tableId: 'WYCc8CjBsmZij4Wn',
      operation: 'upsert',
      locator: 'state_key',
      locatorValue: 'clinic_id::session_id',
      ownIdExpectedFromInventory: true,
    }),
  ]),
  readOnlyStores: Object.freeze(['postgresql', 'qdrant']),
  inventory: 'get exacto por state_key; capturar row_id solo si el nodo lo expone',
  deletion: 'deleteRows por igualdad exacta de state_key después de comparar snapshot',
  postCheck: 'get exacto por state_key debe devolver cero filas',
  requiredSafeAccess: 'conexión Data Tables existente dentro de n8n',
  guards: Object.freeze([
    'header_auth_existente',
    'clinic_id_qa_exacto',
    'session_id_lab030_exacto',
    'state_key_igual_clinic_id_doble_dos_puntos_session_id',
    'tabla_fija_lab024_estado_urgencia',
    'inventario_cardinalidad_uno',
    'row_id_presente_y_coincidente_con_snapshot_sellado',
    'sin_prefijos_ni_wildcards',
  ]),
  cause: 'cleanup_public_rag_endpoint_protegido_pendiente',
});

const PUBLIC_RAG_LIFECYCLE = Object.freeze([
  'A_generar_run_y_session_sinteticos',
  'B_ejecutar_una_peticion_publica',
  'C_inventariar_fila_por_state_key_exacto',
  'D_registrar_state_key_exacto_y_row_id_si_expuesto_en_created_ids',
  'E_borrar_exclusivamente_state_key_exacto_tras_snapshot',
  'F_postcheck_state_key_cero_filas',
  'G_cerrar_evidencia_sanitizada',
]);

const EXPECTED_E2_WORKFLOWS = Object.freeze([
  { id: 's0NoyEyVtO9AgJUk', label: 'gestion', expectedActive: true },
  { id: 'BCUJ8lHHFZHj9yld', label: 'publico', expectedActive: false },
  { id: 'RR555uwDbQ4kTyaZ', label: 'interno', expectedActive: false },
]);

const REQUIRED_FILES = Object.freeze([
  'docs/comercial/lab030/QA_AUDITORIA_INICIAL.md',
  'docs/comercial/lab030/QA_DISENO_FASE2.md',
  'docs/comercial/lab030/HANDOFF_CODEX.md',
  'n8n/workflows/comercial/lab029_publico_rag_persistente.json',
  'n8n/workflows/comercial/lab029_interno_rag_persistente.json',
  'n8n/workflows/comercial/lab029_gestion_rag_persistente.json',
  'scripts/lab027/probar_logica_lab027.mjs',
  'scripts/lab028/probar_runtime_real_lab028.mjs',
  'scripts/lab029/ejecutar_runtime_lab029.mjs',
  'scripts/lab029/limpiar_runtime_lab029.mjs',
  'scripts/lab029/validar_inventario_cleanup_lab029.mjs',
  'scripts/lab029/validar_lab029.mjs',
  'scripts/lab029/verificar_runtime_lab029.mjs',
  'scripts/lab030/workflow_temporal_cleanup_rag_publico.json',
  'scripts/lab030/fixtures/rag_publico_clinica_piloto_001.txt',
  'scripts/lab030/preparar_documento_rag_publico.mjs',
  'scripts/lab030/cleanup_documento_rag_publico.mjs',
]);

const WORKFLOWS = Object.freeze([
  {
    id: 'publico',
    file: 'n8n/workflows/comercial/lab029_publico_rag_persistente.json',
    requiredNodeNames: [
      'Validar clínica pública PostgreSQL LAB-029',
      'Restaurar contexto clínica pública LAB-029',
      'Clinic_id permitido',
      'Buscar información pública de la clínica',
      'Detectar intención agenda médica',
      'Evaluar reglas deterministas urgencia',
      'Responder posible urgencia',
    ],
    contractNodeNames: ['Responder consulta pública comercial', 'Responder clinic_id no permitido'],
    forbiddenReferences: ['clinica_piloto_001', 'LAB029_TEST'],
    requireWebhook: true,
    requireWebhookResponse: true,
  },
  {
    id: 'interno',
    file: 'n8n/workflows/comercial/lab029_interno_rag_persistente.json',
    requiredNodeNames: [
      'Entrada operación interna LAB-025',
      '¿Identidad interna presente?',
      'Buscar usuario interno por identidad',
      'Cargar permisos del rol interno',
      '¿Usuario autorizado para la acción?',
      'Preparar consulta RAG interno autorizada',
      'Buscar conocimiento RAG interno',
      'Leer versiones internas activas LAB-029',
    ],
    contractNodeNames: [],
    forbiddenReferences: ['LAB029_TEST'],
    requireWebhook: true,
    requireWebhookResponse: true,
  },
  {
    id: 'gestion',
    file: 'n8n/workflows/comercial/lab029_gestion_rag_persistente.json',
    requiredNodeNames: [
      'Entrada interna gestión documental LAB-029',
      'Validar contrato documental LAB-029',
      '¿Es rollback LAB-029?',
      'Crear versión staging PostgreSQL LAB-029',
      'Activar versión validada PostgreSQL LAB-029',
      'Ejecutar rollback PostgreSQL LAB-029',
    ],
    contractNodeNames: [],
    forbiddenReferences: ['LAB029_TEST'],
    requireWebhook: false,
    requireWebhookResponse: false,
  },
]);

// Presence is recorded without reading or printing values. These variables are
// not required by LOCAL mode and never trigger a connection in this version.
const CONFIG_REQUIREMENTS = Object.freeze([
  { name: 'workspace_files', class: 'LOCAL_REQUIRED' },
  { name: 'git_head', class: 'OPTIONAL' },
  { name: 'LAB028_N8N_BASE_URL', class: 'E2_HEALTH_N8N_URL_OPTION' },
  { name: 'N8N_EDITOR_BASE_URL', class: 'E2_HEALTH_N8N_URL_OPTION' },
  { name: 'N8N_PROTOCOL', class: 'E2_HEALTH_N8N_URL_OPTION' },
  { name: 'N8N_HOST', class: 'E2_HEALTH_N8N_URL_OPTION' },
  { name: 'LAB028_N8N_API_TOKEN', class: 'E2_HEALTH_OPTIONAL' },
  { name: 'LAB029_POSTGRES_URI', class: 'E2_HEALTH_OPTIONAL' },
  { name: 'LAB029_QDRANT_URL', class: 'E2_HEALTH_REQUIRED' },
  { name: 'LAB029_QDRANT_API_KEY', class: 'E2_HEALTH_QDRANT_KEY_OPTION' },
  { name: 'QDRANT_API_KEY', class: 'E2_HEALTH_QDRANT_KEY_OPTION' },
  { name: 'N8N_PUBLIC_WEBHOOK_URL', class: 'E2_PUBLIC_RAG_REQUIRED' },
  { name: 'LAB029_N8N_WEBHOOK_BASE_URL', class: 'PHASE_D_FUTURE' },
  { name: 'LAB029_INTERNAL_HEADER_NAME', class: 'PHASE_D_FUTURE' },
  { name: 'LAB029_INTERNAL_HEADER_VALUE', class: 'PHASE_D_FUTURE' },
]);

const placeholderPattern = /\b(?:TODO|FIXME|CHANGE_ME|REPLACE_ME|YOUR_(?:TOKEN|KEY|SECRET))\b/i;
const embeddedSecretPatterns = Object.freeze([
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/i,
  /(?:postgres(?:ql)?|https?):\/\/[^\s/"']+:[^\s@"']+@/i,
  /\b(?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{25,})\b/,
  /\bBearer\s+[A-Za-z0-9._~-]{20,}\b/i,
]);

const publicContractFields = Object.freeze(['ok', 'clinic_id', 'session_id', 'reply']);
const forbiddenPublicFields = Object.freeze([
  'alert_id', 'appointment_id', 'audit_id', 'document_id', 'episode_id',
  'event_id', 'internal_error', 'node_name', 'stack', 'version_id',
]);

const durationMs = start => Math.round((performance.now() - start) * 100) / 100;
const safeCause = value => String(value || 'fallo_sin_detalle')
  .replace(/https?:\/\/\S+/gi, '[URL]')
  .replace(/(?:password|token|secret|key)\s*[=:]\s*\S+/gi, '$1=[REDACTED]')
  .replace(/[\r\n]+/g, ' ')
  .slice(0, 240);

function createRunId(date = new Date()) {
  const stamp = date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `LAB030_QA_${stamp}_${randomBytes(4).toString('hex')}`;
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch {
    return null;
  }
}

function phase(status, duration = 0, tests = [], cause = '') {
  return { status, duration_ms: duration, tests, ...(cause ? { cause: safeCause(cause) } : {}) };
}

function assertLocal(condition, message) {
  if (!condition) throw new Error(message);
}

function parseMode(args) {
  if (args.length === 0) return MODE.LOCAL;
  if (args.length === 1 && args[0] === '--e2-health') return MODE.E2_HEALTH;
  if (args.length === 1 && args[0] === '--e2-public-rag') return MODE.E2_PUBLIC_RAG;
  throw new Error('modo_no_soportado');
}

function hasEnv(name) {
  return Object.hasOwn(process.env, name) && String(process.env[name] || '').trim().length > 0;
}

function envValue(name) {
  return hasEnv(name) ? String(process.env[name]).trim() : null;
}

function validBaseUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label}_url_invalida`);
  }
  assertLocal(['http:', 'https:'].includes(url.protocol), `${label}_protocolo_invalido`);
  assertLocal(!url.username && !url.password, `${label}_credenciales_incrustadas`);
  return url.href.replace(/\/$/, '');
}

function resolveN8nBaseUrl() {
  const explicit = envValue('LAB028_N8N_BASE_URL');
  if (explicit) return validBaseUrl(explicit, 'n8n_base_url');

  const editor = envValue('N8N_EDITOR_BASE_URL');
  if (editor) return validBaseUrl(editor, 'n8n_editor_base_url');

  const protocol = envValue('N8N_PROTOCOL');
  const host = envValue('N8N_HOST');
  assertLocal(protocol && host, 'n8n_base_url_no_determinable');
  const normalizedProtocol = protocol.endsWith(':') ? protocol.slice(0, -1) : protocol;
  assertLocal(['http', 'https'].includes(normalizedProtocol), 'n8n_protocol_invalido');
  return validBaseUrl(`${normalizedProtocol}://${host}`, 'n8n_protocol_host');
}

function e2Config() {
  const qdrantUrl = envValue('LAB029_QDRANT_URL');
  const qdrantApiKey = envValue('LAB029_QDRANT_API_KEY') || envValue('QDRANT_API_KEY');
  assertLocal(qdrantUrl, 'qdrant_url_ausente');
  assertLocal(qdrantApiKey, 'qdrant_api_key_ausente');
  return {
    n8nBaseUrl: resolveN8nBaseUrl(),
    n8nApiToken: envValue('LAB028_N8N_API_TOKEN'),
    postgresUri: envValue('LAB029_POSTGRES_URI'),
    qdrantUrl,
    qdrantApiKey,
  };
}

function publicRagConfig() {
  const endpoint = envValue('N8N_PUBLIC_WEBHOOK_URL');
  assertLocal(endpoint, 'n8n_public_webhook_url_ausente');
  return { endpoint: validBaseUrl(endpoint, 'n8n_public_webhook_url') };
}

function isSafeRelativePath(relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) return false;
  const normalized = path.posix.normalize(relative.replace(/\\/g, '/'));
  return normalized === relative.replace(/\\/g, '/') && normalized !== '..' && !normalized.startsWith('../');
}

function validateConnections(workflow, names, spec) {
  const known = new Set(names);
  for (const [source, kinds] of Object.entries(workflow.connections)) {
    assertLocal(known.has(source), `workflow_conexion_origen_desconocido:${spec.id}:${source}`);
    assertLocal(kinds && typeof kinds === 'object' && !Array.isArray(kinds), `workflow_conexion_forma_invalida:${spec.id}:${source}`);
    for (const outputs of Object.values(kinds)) {
      assertLocal(Array.isArray(outputs), `workflow_salidas_invalidas:${spec.id}:${source}`);
      for (const branch of outputs) {
        assertLocal(Array.isArray(branch), `workflow_rama_invalida:${spec.id}:${source}`);
        for (const edge of branch) {
          assertLocal(edge && typeof edge.node === 'string' && known.has(edge.node), `workflow_conexion_destino_desconocido:${spec.id}:${source}`);
        }
      }
    }
  }
}

function validatePublicContract(workflow, spec) {
  for (const nodeName of spec.contractNodeNames) {
    const node = workflow.nodes.find(candidate => candidate.name === nodeName);
    assertLocal(node, `workflow_respuesta_contractual_ausente:${nodeName}`);
    const parameters = JSON.stringify(node.parameters || {});
    for (const field of publicContractFields) {
      assertLocal(new RegExp(`\\b${field}\\b`).test(parameters), `workflow_contrato_publico_campo_ausente:${nodeName}:${field}`);
    }
    for (const field of forbiddenPublicFields) {
      const keyPattern = new RegExp(`(?:["']${field}["']|\\b${field}\\b)\\s*:`, 'i');
      assertLocal(!keyPattern.test(parameters), `workflow_contrato_publico_campo_interno:${nodeName}:${field}`);
    }
  }
}

function validateWorkflow(spec) {
  const absolute = path.join(repoDir, spec.file);
  const source = readFileSync(absolute, 'utf8');
  let workflow;
  try {
    workflow = JSON.parse(source);
  } catch {
    throw new Error(`workflow_json_invalido:${spec.id}`);
  }

  assertLocal(workflow && typeof workflow === 'object' && !Array.isArray(workflow), `workflow_forma_invalida:${spec.id}`);
  assertLocal(typeof workflow.name === 'string' && workflow.name.trim(), `workflow_nombre_ausente:${spec.id}`);
  assertLocal(Array.isArray(workflow.nodes) && workflow.nodes.length > 0, `workflow_nodos_ausentes:${spec.id}`);
  assertLocal(workflow.connections && typeof workflow.connections === 'object' && !Array.isArray(workflow.connections), `workflow_conexiones_invalidas:${spec.id}`);

  const names = workflow.nodes.map(node => String(node?.name || ''));
  const ids = workflow.nodes.map(node => String(node?.id || ''));
  assertLocal(names.every(Boolean), `workflow_nodo_sin_nombre:${spec.id}`);
  assertLocal(ids.every(Boolean), `workflow_nodo_sin_id:${spec.id}`);
  assertLocal(new Set(names).size === names.length, `workflow_nombres_duplicados:${spec.id}`);
  assertLocal(new Set(ids).size === ids.length, `workflow_ids_duplicados:${spec.id}`);
  validateConnections(workflow, names, spec);

  const types = workflow.nodes.map(node => String(node?.type || ''));
  assertLocal(types.some(type => /(?:trigger|webhook)$/i.test(type) && !type.endsWith('.respondToWebhook')), `workflow_trigger_ausente:${spec.id}`);
  if (spec.requireWebhook) assertLocal(types.some(type => type.endsWith('.webhook')), `workflow_webhook_ausente:${spec.id}`);
  if (spec.requireWebhookResponse) assertLocal(types.some(type => type.endsWith('.respondToWebhook')), `workflow_respuesta_webhook_ausente:${spec.id}`);
  for (const name of spec.requiredNodeNames) assertLocal(names.includes(name), `workflow_nodo_critico_ausente:${spec.id}:${name}`);
  if (spec.id === 'publico') validatePublicContract(workflow, spec);
  if (spec.id === 'interno') {
    assertLocal(source.includes('clinic_id'), 'workflow_control_clinica_ausente:interno');
  }
  for (const reference of spec.forbiddenReferences) assertLocal(!source.includes(reference), `workflow_referencia_prohibida:${spec.id}:${reference}`);
  assertLocal(!placeholderPattern.test(source), `workflow_placeholder_critico:${spec.id}`);
  for (const pattern of embeddedSecretPatterns) assertLocal(!pattern.test(source), `workflow_secreto_incrustado:${spec.id}`);

  return {
    id: spec.id,
    name: workflow.name,
    nodes: workflow.nodes.length,
    checks: ['json', 'shape', 'unique_names', 'unique_ids', 'connections', 'trigger', 'webhook', 'response', 'critical_nodes', 'public_contract', 'clinic_control', 'forbidden_references', 'placeholders', 'embedded_secrets'],
  };
}

function validatePublicRagCleanupWorkflow() {
  const absolute = path.join(repoDir, PUBLIC_RAG_CLEANUP.workflowFile);
  const workflow = JSON.parse(readFileSync(absolute, 'utf8'));
  assertLocal(workflow.active === false, 'cleanup_rag_workflow_debe_estar_inactivo');
  assertLocal(Array.isArray(workflow.nodes) && workflow.nodes.length > 0, 'cleanup_rag_workflow_sin_nodos');
  const webhooks = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.webhook');
  assertLocal(webhooks.length === 3, 'cleanup_rag_webhooks_incompletos');
  assertLocal(webhooks.every(node => node.parameters?.authentication === 'headerAuth'), 'cleanup_rag_sin_header_auth');
  const dataTables = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.dataTable');
  assertLocal(dataTables.length === 4, 'cleanup_rag_datatable_nodos_incompletos');
  assertLocal(dataTables.every(node => node.parameters?.dataTableId?.value === 'WYCc8CjBsmZij4Wn'), 'cleanup_rag_tabla_no_fija');
  assertLocal(dataTables.every(node => node.parameters?.filters?.conditions?.length === 1
    && node.parameters.filters.conditions[0].keyName === 'state_key'), 'cleanup_rag_filtro_no_exacto');
  const deletes = dataTables.filter(node => node.parameters?.operation === 'deleteRows');
  assertLocal(deletes.length === 1, 'cleanup_rag_borrado_no_unico');
  const serialized = JSON.stringify(workflow);
  assertLocal(!/LIKE|startsWith|includes\(|wildcard|prefix/i.test(serialized), 'cleanup_rag_filtro_amplio_detectado');
  assertLocal(serialized.includes('inventario_lab030_cardinalidad_invalida'), 'cleanup_rag_sin_guarda_cardinalidad');
  assertLocal(serialized.includes('borrado_lab030_snapshot_difiere'), 'cleanup_rag_sin_comparacion_snapshot');
  assertLocal(serialized.includes('postcheck_lab030_residuo_detectado'), 'cleanup_rag_sin_postcheck_cero');
  return { id: 'cleanup_rag_publico_temporal', nodes: workflow.nodes.length, id_classification: PUBLIC_RAG_CLEANUP.idClassification };
}

function runPreflight(manifest, mode) {
  const start = performance.now();
  const tests = [];
  try {
    assertLocal(path.basename(repoDir).toLowerCase() === 'vetatiendeai', 'repositorio_inesperado');
    tests.push('repo_path');
    for (const relative of REQUIRED_FILES) {
      assertLocal(isSafeRelativePath(relative), `ruta_requerida_insegura:${relative}`);
      assertLocal(existsSync(path.join(repoDir, relative)), `archivo_requerido_ausente:${relative}`);
    }
    tests.push('required_files');
    assertLocal(/^LAB030_QA_[0-9]{14}_[a-f0-9]{8}$/.test(manifest.run_id), 'run_id_invalido');
    tests.push('run_id');
    manifest.configuration_requirements = CONFIG_REQUIREMENTS.map(requirement => ({
      ...requirement,
      present: requirement.class === 'LOCAL_REQUIRED'
        ? true
        : requirement.name === 'git_head'
          ? Boolean(manifest.git_head)
          : hasEnv(requirement.name),
    }));
    assertLocal(manifest.configuration_requirements.some(item => item.class === 'LOCAL_REQUIRED' && item.present), 'configuracion_local_ausente');
    assertLocal(manifest.configuration_requirements.filter(item => item.class === 'E2_HEALTH_REQUIRED').length === 1, 'registro_configuracion_e2_health_requerida_incompleto');
    assertLocal(manifest.configuration_requirements.filter(item => item.class === 'E2_HEALTH_N8N_URL_OPTION').length === 4, 'registro_alias_n8n_incompleto');
    assertLocal(manifest.configuration_requirements.filter(item => item.class === 'E2_HEALTH_QDRANT_KEY_OPTION').length === 2, 'registro_alias_qdrant_incompleto');
    assertLocal(manifest.configuration_requirements.filter(item => item.class === 'E2_PUBLIC_RAG_REQUIRED').length === 1, 'registro_configuracion_rag_publico_incompleto');
    assertLocal(manifest.configuration_requirements.filter(item => item.class === 'PHASE_D_FUTURE').length === 3, 'registro_configuracion_fase_d_incompleto');
    if (mode === MODE.E2_HEALTH) {
      e2Config();
    }
    if (mode === MODE.E2_PUBLIC_RAG) {
      publicRagConfig();
      assertLocal(PUBLIC_RAG_CLEANUP.ready, PUBLIC_RAG_CLEANUP.cause);
    }
    tests.push('configuration_classes_without_values');
    return phase(STATUS.PASS, durationMs(start), tests);
  } catch (error) {
    return phase(STATUS.CRITICAL_FAIL, durationMs(start), tests, error.message);
  }
}

function runLocalContracts(manifest) {
  const start = performance.now();
  const tests = [];
  try {
    manifest.local_workflows = WORKFLOWS.map(spec => {
      const result = validateWorkflow(spec);
      tests.push(`workflow_${spec.id}`);
      return result;
    });
    manifest.public_rag_cleanup_workflow = validatePublicRagCleanupWorkflow();
    tests.push('workflow_cleanup_rag_publico_temporal');
    return phase(STATUS.PASS, durationMs(start), tests);
  } catch (error) {
    return phase(STATUS.CRITICAL_FAIL, durationMs(start), tests, error.message);
  }
}

function healthItem(status, duration = 0, cause = '', detail = {}) {
  return { status, duration_ms: duration, ...detail, ...(cause ? { cause: safeCause(cause) } : {}) };
}

async function fetchReadOnly(url, options = {}) {
  return fetch(url, {
    method: 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    ...options,
  });
}

async function executePublicRag(manifest) {
  const start = performance.now();
  try {
    const config = publicRagConfig();
    const requestBody = {
      clinic_id: PUBLIC_RAG_CASE.clinicId,
      session_id: manifest.run_id,
      channel: PUBLIC_RAG_CASE.channel,
      message: PUBLIC_RAG_CASE.message,
    };
    const response = await fetch(config.endpoint, {
      method: 'POST',
      redirect: 'error',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(90000),
    });
    assertLocal(response.ok, `rag_publico_http_${response.status}`);
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error('rag_publico_json_invalido');
    }
    assertLocal(body && typeof body === 'object' && !Array.isArray(body), 'rag_publico_body_invalido');
    assertLocal(body.ok === true, 'rag_publico_ok_invalido');
    assertLocal(body.clinic_id === requestBody.clinic_id, 'rag_publico_clinic_id_invalido');
    assertLocal(body.session_id === requestBody.session_id, 'rag_publico_session_id_invalido');
    assertLocal(typeof body.reply === 'string' && body.reply.trim(), 'rag_publico_reply_ausente');
    const serialized = JSON.stringify(body);
    for (const field of forbiddenPublicFields) {
      assertLocal(!new RegExp(`"${field}"\\s*:`, 'i').test(serialized), `rag_publico_campo_interno:${field}`);
    }
    const normalizedReply = body.reply.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    assertLocal(/lunes|martes|miercoles|jueves|viernes|sabado|domingo/.test(normalizedReply), 'rag_publico_dia_no_recuperado');
    assertLocal(/\b(?:[01]?\d|2[0-3])(?::|\.)[0-5]\d\b/.test(normalizedReply), 'rag_publico_hora_no_recuperada');
    return phase(STATUS.PASS, durationMs(start), ['http', 'json', 'contract', 'semantic_schedule']);
  } catch (error) {
    return phase(STATUS.CRITICAL_FAIL, durationMs(start), [], error.message);
  }
}

async function checkN8n(config) {
  const start = performance.now();
  try {
    const response = await fetchReadOnly(`${config.n8nBaseUrl}/healthz`, {
      headers: { Accept: 'application/json' },
    });
    assertLocal(response.ok, `n8n_health_http_${response.status}`);
    return healthItem(STATUS.PASS, durationMs(start));
  } catch (error) {
    return healthItem(STATUS.CRITICAL_FAIL, durationMs(start), error.message || 'n8n_no_disponible');
  }
}

async function checkWorkflowStates(config) {
  const start = performance.now();
  const observed = [];
  if (!config.n8nApiToken) {
    return healthItem(STATUS.WARN, durationMs(start), 'n8n_api_token_no_expuesto;workflow_api_no_ejecutada', { workflows: observed });
  }
  try {
    for (const expected of EXPECTED_E2_WORKFLOWS) {
      const response = await fetchReadOnly(`${config.n8nBaseUrl}/api/v1/workflows/${encodeURIComponent(expected.id)}`, {
        headers: { Accept: 'application/json', 'X-N8N-API-KEY': config.n8nApiToken },
      });
      assertLocal(response.status !== 404, `workflow_no_encontrado:${expected.label}`);
      assertLocal(response.ok, `workflow_api_http_${response.status}:${expected.label}`);
      const body = await response.json();
      const workflow = body?.data && !Array.isArray(body.data) ? body.data : body;
      assertLocal(workflow && String(workflow.id || '') === expected.id, `workflow_respuesta_invalida:${expected.label}`);
      assertLocal(typeof workflow.active === 'boolean', `workflow_estado_ausente:${expected.label}`);
      observed.push({
        id: expected.id,
        label: expected.label,
        found: true,
        active: workflow.active,
        expected_active: expected.expectedActive,
      });
    }
    const mismatch = observed.filter(item => item.active !== item.expected_active).map(item => item.label);
    return healthItem(
      mismatch.length ? STATUS.WARN : STATUS.PASS,
      durationMs(start),
      mismatch.length ? `workflow_estado_distinto_historico:${mismatch.join(',')}` : '',
      { workflows: observed },
    );
  } catch (error) {
    return healthItem(STATUS.CRITICAL_FAIL, durationMs(start), error.message || 'workflow_api_no_disponible', { workflows: observed });
  }
}

const qdrantOkMock = async url => {
  const isRoot = String(url).replace(/\/$/, '').endsWith('/collections');
  return {
    ok: true,
    status: 200,
    json: async () => isRoot
      ? { result: { collections: [{ name: 'vetatiende_publico' }, { name: 'vetatiende_interno' }] } }
      : { result: { config: { params: { vectors: { size: 1024, distance: 'Cosine' } } } } },
  };
};

async function checkPostgres(config) {
  const start = performance.now();
  if (!config.postgresUri) {
    return healthItem(STATUS.WARN, durationMs(start), 'postgres_uri_no_expuesta;health_directo_no_ejecutado');
  }
  const result = await verificarRuntime({
    postgresUri: config.postgresUri,
    qdrantUrl: 'https://local-health.invalid',
    qdrantApiKey: 'local-health-placeholder',
    fetchImpl: qdrantOkMock,
  });
  return result.postgres === 'PASS'
    ? healthItem(STATUS.PASS, durationMs(start))
    : healthItem(STATUS.CRITICAL_FAIL, durationMs(start), result.causa || 'postgres_no_disponible');
}

async function checkQdrant(config) {
  const start = performance.now();
  const result = await verificarRuntime({
    postgresUri: 'postgres://local-health.invalid',
    qdrantUrl: config.qdrantUrl,
    qdrantApiKey: config.qdrantApiKey,
    runPsql: () => ({ status: 0, stdout: '1\n' }),
  });
  return result.qdrant === 'PASS'
    ? healthItem(STATUS.PASS, durationMs(start))
    : healthItem(STATUS.CRITICAL_FAIL, durationMs(start), result.causa || 'qdrant_no_disponible');
}

async function runE2Health(manifest) {
  const start = performance.now();
  const checks = {
    n8n: healthItem(STATUS.NOT_RUN),
    workflows: healthItem(STATUS.NOT_RUN),
    postgres: healthItem(STATUS.NOT_RUN),
    qdrant: healthItem(STATUS.NOT_RUN),
  };
  manifest.health_checks = checks;
  let config;
  try {
    config = e2Config();
  } catch (error) {
    return phase(STATUS.CRITICAL_FAIL, durationMs(start), [], error.message);
  }

  checks.n8n = await checkN8n(config);
  if (checks.n8n.status === STATUS.CRITICAL_FAIL) return phase(STATUS.CRITICAL_FAIL, durationMs(start), ['n8n'], checks.n8n.cause);

  checks.workflows = await checkWorkflowStates(config);
  if (checks.workflows.status === STATUS.CRITICAL_FAIL) return phase(STATUS.CRITICAL_FAIL, durationMs(start), ['n8n', 'workflows'], checks.workflows.cause);

  checks.postgres = await checkPostgres(config);
  if (checks.postgres.status === STATUS.CRITICAL_FAIL) return phase(STATUS.CRITICAL_FAIL, durationMs(start), ['n8n', 'workflows', 'postgres'], checks.postgres.cause);

  checks.qdrant = await checkQdrant(config);
  if (checks.qdrant.status === STATUS.CRITICAL_FAIL) return phase(STATUS.CRITICAL_FAIL, durationMs(start), ['n8n', 'workflows', 'postgres', 'qdrant'], checks.qdrant.cause);

  const warnedChecks = Object.entries(checks).filter(([, item]) => item.status === STATUS.WARN);
  const status = warnedChecks.length ? STATUS.WARN : STATUS.PASS;
  const cause = warnedChecks.map(([name, item]) => `${name}:${item.cause}`).join(';');
  return phase(status, durationMs(start), ['n8n', 'workflows', 'postgres', 'qdrant'], cause);
}

function printSummary(manifest) {
  const rows = [
    ['Preflight', manifest.phases.A],
    ['Salud entorno', manifest.phases.B],
    ['Contratos', manifest.phases.C],
    ['Funcional E2', manifest.phases.D],
    ['Cleanup', manifest.phases.E],
  ];
  process.stdout.write('QA-SMOKE LAB-030\n');
  for (const [label, item] of rows) {
    const dots = '.'.repeat(Math.max(2, 18 - label.length));
    process.stdout.write(`${label} ${dots} ${item.status}   ${(item.duration_ms / 1000).toFixed(3)} s\n`);
    if (item.cause && [STATUS.FAIL, STATUS.CRITICAL_FAIL].includes(item.status)) {
      process.stdout.write(`  Causa: ${item.cause}\n`);
    }
  }
  if (manifest.health_checks) {
    process.stdout.write('\nSalud E2 (solo lectura)\n');
    for (const [label, key] of [['n8n', 'n8n'], ['Workflows', 'workflows'], ['PostgreSQL', 'postgres'], ['Qdrant', 'qdrant']]) {
      const item = manifest.health_checks[key];
      const dots = '.'.repeat(Math.max(2, 18 - label.length));
      process.stdout.write(`${label} ${dots} ${item.status}   ${(item.duration_ms / 1000).toFixed(3)} s\n`);
      if (item.cause && [STATUS.WARN, STATUS.FAIL, STATUS.CRITICAL_FAIL].includes(item.status)) {
        process.stdout.write(`  Causa: ${item.cause}\n`);
      }
    }
  }
  process.stdout.write(`\nTiempo total: ${(manifest.duration_total_ms / 1000).toFixed(3)} s\n`);
  const scopeLabel = manifest.scope === 'LOCAL_ONLY'
    ? 'local'
    : manifest.scope === 'E2_HEALTH_READ_ONLY'
      ? 'health E2'
      : 'RAG público E2';
  process.stdout.write(`Resultado ${scopeLabel}: ${manifest.global_result}\n`);
  process.stdout.write('Aptitud para piloto: NO DETERMINADA\n');
}

function createManifest(mode) {
  return {
    schema_version: 1,
    run_id: createRunId(startedAt),
    timestamp: startedAt.toISOString(),
    environment: mode,
    scope: mode === MODE.LOCAL
      ? 'LOCAL_ONLY'
      : mode === MODE.E2_HEALTH
        ? 'E2_HEALTH_READ_ONLY'
        : 'E2_PUBLIC_RAG_SINGLE_CASE',
    git_head: gitHead(),
    tests_executed: [],
    phases: {},
    created_ids: [],
    cleanup_expected: [],
    cleanup_actual: [],
    ...(mode === MODE.E2_PUBLIC_RAG ? {
      public_rag_case: PUBLIC_RAG_CASE,
      persistent_footprint: PUBLIC_RAG_CLEANUP.writes,
      read_only_stores: PUBLIC_RAG_CLEANUP.readOnlyStores,
      cleanup_plan: {
        locally_prepared: PUBLIC_RAG_CLEANUP.locallyPrepared,
        id_classification: PUBLIC_RAG_CLEANUP.idClassification,
        workflow_file: PUBLIC_RAG_CLEANUP.workflowFile,
        selected_option: PUBLIC_RAG_CLEANUP.selectedOption,
        mechanism: PUBLIC_RAG_CLEANUP.mechanism,
        source_mechanisms: PUBLIC_RAG_CLEANUP.sourceMechanisms,
        required_configuration: PUBLIC_RAG_CLEANUP.requiredConfiguration,
        inventory: PUBLIC_RAG_CLEANUP.inventory,
        deletion: PUBLIC_RAG_CLEANUP.deletion,
        post_check: PUBLIC_RAG_CLEANUP.postCheck,
        required_safe_access: PUBLIC_RAG_CLEANUP.requiredSafeAccess,
        guards: PUBLIC_RAG_CLEANUP.guards,
      },
      lifecycle: PUBLIC_RAG_LIFECYCLE,
      cleanup_ready: PUBLIC_RAG_CLEANUP.ready,
    } : {}),
    global_result: STATUS.NOT_RUN,
    pilot_eligibility: 'NOT_DETERMINED',
  };
}

function finishManifest(manifest, totalStart, candidates) {
  const failed = candidates.some(item => [STATUS.FAIL, STATUS.CRITICAL_FAIL].includes(item.status));
  const warned = candidates.some(item => item.status === STATUS.WARN);
  manifest.global_result = failed ? STATUS.FAIL : warned ? STATUS.WARN : STATUS.PASS;
  manifest.duration_total_ms = durationMs(totalStart);
  manifest.phases.F = phase(STATUS.PASS, 0, ['summary_in_memory']);
  manifest.finished_at = new Date().toISOString();
  return manifest;
}

export function runLocalSmoke() {
  const totalStart = performance.now();
  const manifest = createManifest(MODE.LOCAL);

  manifest.phases.A = runPreflight(manifest, MODE.LOCAL);
  manifest.tests_executed.push(...manifest.phases.A.tests);
  manifest.phases.B = phase(STATUS.NOT_RUN, 0, [], 'modo_local_sin_conexiones_remotas');

  if (manifest.phases.A.status === STATUS.PASS) {
    manifest.phases.C = runLocalContracts(manifest);
    manifest.tests_executed.push(...manifest.phases.C.tests);
  } else {
    manifest.phases.C = phase(STATUS.NOT_RUN, 0, [], 'preflight_critico_fallido');
  }

  manifest.phases.D = phase(STATUS.NOT_RUN, 0, [], 'modo_local_sin_ejecucion_e2');
  manifest.phases.E = phase(STATUS.NOT_REQUIRED, 0, [], 'sin_datos_creados');

  return finishManifest(manifest, totalStart, [manifest.phases.A, manifest.phases.C]);
}

export async function runE2HealthSmoke() {
  const totalStart = performance.now();
  const manifest = createManifest(MODE.E2_HEALTH);
  manifest.phases.A = runPreflight(manifest, MODE.E2_HEALTH);
  manifest.tests_executed.push(...manifest.phases.A.tests);

  if (manifest.phases.A.status === STATUS.PASS) {
    manifest.phases.B = await runE2Health(manifest);
    manifest.tests_executed.push(...manifest.phases.B.tests);
  } else {
    manifest.phases.B = phase(STATUS.NOT_RUN, 0, [], 'preflight_e2_critico_fallido');
  }

  manifest.phases.C = phase(STATUS.NOT_RUN, 0, [], 'modo_e2_health_solo_salud');
  manifest.phases.D = phase(STATUS.NOT_RUN, 0, [], 'modo_e2_health_sin_escenarios_funcionales');
  manifest.phases.E = phase(STATUS.NOT_REQUIRED, 0, [], 'sin_datos_creados');
  return finishManifest(manifest, totalStart, [manifest.phases.A, manifest.phases.B]);
}

export async function runE2PublicRagSmoke() {
  const totalStart = performance.now();
  const manifest = createManifest(MODE.E2_PUBLIC_RAG);
  manifest.phases.A = runPreflight(manifest, MODE.E2_PUBLIC_RAG);
  manifest.tests_executed.push(...manifest.phases.A.tests);
  manifest.phases.B = phase(STATUS.NOT_RUN, 0, [], 'modo_rag_publico_sin_health');
  manifest.phases.C = phase(STATUS.NOT_RUN, 0, [], 'contratos_locales_validados_en_modo_local');

  if (manifest.phases.A.status === STATUS.PASS) {
    manifest.phases.D = await executePublicRag(manifest);
    manifest.tests_executed.push(...manifest.phases.D.tests);
  } else {
    manifest.phases.D = phase(STATUS.NOT_RUN, 0, [], 'preflight_rag_publico_critico_fallido');
  }

  manifest.phases.E = phase(STATUS.NOT_REQUIRED, 0, [], 'sin_peticion_e2_sin_datos_creados');
  return finishManifest(manifest, totalStart, [manifest.phases.A, manifest.phases.D]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = parseMode(process.argv.slice(2));
    const manifest = mode === MODE.LOCAL
      ? runLocalSmoke()
      : mode === MODE.E2_HEALTH
        ? await runE2HealthSmoke()
        : await runE2PublicRagSmoke();
    printSummary(manifest);
    if (![STATUS.PASS, STATUS.WARN].includes(manifest.global_result)) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`QA-SMOKE LAB-030\nResultado: CRITICAL_FAIL\nCausa: ${safeCause(error.message)}\n`);
    process.exitCode = 1;
  }
}
