import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, '../..');
const workflowPath = path.join(
  repoDir,
  'n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json',
);
const composePath = path.join(repoDir, 'infra/comercial/compose.yaml');

const official = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
// --stdin valida el JSON recibido sin crear archivos temporales.
const workflow = process.argv.includes('--stdin')
  ? JSON.parse(fs.readFileSync(0, 'utf8'))
  : official;
const errors = [];
const assertions = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
  else assertions.push(message);
};

const nodesByName = new Map(workflow.nodes.map((node) => [node.name, node]));
assert(nodesByName.size === workflow.nodes.length, 'nombres de nodos únicos');
assert(new Set(workflow.nodes.map((node) => node.id)).size === workflow.nodes.length, 'IDs de nodos únicos');
assert(typeof workflow.active === 'boolean', 'estado active booleano: activo o inactivo permitido');
assert(workflow.nodes.length === 303, 'export cerrado LAB-026 con 303 nodos');
assert(workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.code').length === 102, '102 Code nodes LAB-026');
assert(workflow.name.startsWith('LAB-026'), 'nombre oficial LAB-026');

for (const [source, connection] of Object.entries(workflow.connections)) {
  assert(nodesByName.has(source), `origen de conexión existente: ${source}`);
  for (const output of connection.main || []) {
    for (const target of output || []) {
      assert(nodesByName.has(target.node), `destino de conexión existente: ${source} -> ${target.node}`);
    }
  }
}

const nodeReferences = [];
for (const node of workflow.nodes) {
  const serialized = JSON.stringify(node.parameters || {});
  for (const pattern of [/\$\(["']([^"']+)["']\)/g, /\$node\[["']([^"']+)["']\]/g]) {
    let match;
    while ((match = pattern.exec(serialized))) {
      nodeReferences.push({ source: node.name, target: match[1] });
    }
  }
}
for (const reference of nodeReferences) {
  assert(
    nodesByName.has(reference.target),
    `referencia de nodo existente: ${reference.source} -> ${reference.target}`,
  );
}

for (const node of workflow.nodes.filter((item) => item.type === 'n8n-nodes-base.code')) {
  try {
    new Function(node.parameters.jsCode);
    assertions.push(`sintaxis Code válida: ${node.name}`);
  } catch (error) {
    errors.push(`sintaxis Code inválida en ${node.name}: ${error.message}`);
  }
}

const requiredTables = new Set([
  'lab026_citas',
  'lab026_operaciones_cita',
  'lab026_auditoria_citas',
]);
const createdTables = new Set(
  workflow.nodes
    .filter(
      (node) =>
        node.type === 'n8n-nodes-base.dataTable' &&
        node.parameters.resource === 'table' &&
        node.parameters.operation === 'create',
    )
    .map((node) => node.parameters.tableName),
);
for (const table of requiredTables) {
  assert(createdTables.has(table), `tabla inicializable: ${table}`);
}

const requiredNodes = [
  'Inicializar tablas LAB-026 (ejecutar una vez)',
  'Persistir cita médica canónica LAB-026',
  'Persistir cita peluquería canónica LAB-026',
  'Es gestión de cita LAB-026',
  'Buscar citas confirmadas por teléfono LAB-026',
  'Eliminar evento confirmado LAB-026',
  'Actualizar evento original LAB-026',
  'Crear bloqueo temporal reprogramación LAB-026',
  'Consolidar seguridad bloqueo temporal LAB-026',
  'Bloqueo temporal seguro LAB-026',
  'Crear pendiente humano LAB-025 desde LAB-026',
  'Responder gestión cita LAB-026',
];
for (const nodeName of requiredNodes) {
  assert(nodesByName.has(nodeName), `nodo crítico presente: ${nodeName}`);
}


// Contrato de escritura del hotfix; independiente de la comparación con el export.
const expectedUrgencyFilters = [
  { keyName: 'state_key', keyValue: '={{ $json.state_key }}' },
  { keyName: 'episode_id_activo', keyValue: '={{ $json.episode_id_esperado }}' },
  { keyName: 'estado_episodio', keyValue: '={{ $json.estado_episodio_esperado }}' },
  { keyName: 'alert_id_ultimo', keyValue: '={{ $json.alert_id_esperado }}' },
];
const urgencyContract = (node) => {
  const p = node?.parameters || {};
  return {
    update: p.operation === 'update',
    conjunction: p.matchType === 'allConditions',
    filters: isDeepStrictEqual(p.filters?.conditions, expectedUrgencyFilters),
    mapping: p.columns?.mappingMode === 'defineBelow',
    fields: isDeepStrictEqual(p.columns?.value, {
      ultima_notificacion_at: '={{ $json.ultima_notificacion_at }}',
    }),
    schema: isDeepStrictEqual(
      p.columns?.schema?.filter((column) => !column.removed).map((column) => column.id),
      ['ultima_notificacion_at'],
    ),
    output: node?.alwaysOutputData === true,
  };
};
const urgencyNode = nodesByName.get('Guardar estado urgencia final');
for (const [check, ok] of Object.entries(urgencyContract(urgencyNode))) {
  assert(ok, 'contrato Guardar estado urgencia final: ' + check);
}
// Regresión explícita: quitar matchType o usar OR debe invalidar el contrato.
for (const matchType of [undefined, 'anyCondition']) {
  const mutant = structuredClone(urgencyNode);
  if (matchType === undefined) delete mutant.parameters.matchType;
  else mutant.parameters.matchType = matchType;
  assert(!urgencyContract(mutant).conjunction, 'rechaza concurrencia sin allConditions: ' + matchType);
}

// Generación real solo por stdout. Nunca se escribe sobre el export oficial.
const generatedRaw = execFileSync(process.execPath, [
  path.join(scriptDir, 'generar_workflow_lab026.mjs'), '--stdout',
], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const generated = JSON.parse(generatedRaw);
const protectedSha = 'cf11e321b995438eb07fcb33f30e647d4e24e62447943fa92a835daafdd3239a';
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
assert(sha256(generatedRaw) === protectedSha, 'generador reproduce SHA-256 protegido');
assert(sha256(fs.readFileSync(path.join(scriptDir, 'canon_lab026_cerrado.json'))) === protectedSha,
  'artefacto canónico conserva SHA-256 protegido');
const generatorBase = JSON.parse(fs.readFileSync(path.join(scriptDir, 'base_lab024_para_lab026.json'), 'utf8'));
assert(generatorBase.nodes.length === 216, 'base canónica conserva 216 nodos heredados');
const formattingOnlyNodes = new Set([
  'Preparar clave gestión cita LAB-026',
  'Consolidar bloqueo reprogramación LAB-026',
  'Consolidar evento original reprogramación LAB-026',
]);
const functionalNode = (node) => {
  const copy = structuredClone(node);
  delete copy.id;
  delete copy.position;
  if (copy.type === 'n8n-nodes-base.code') {
    copy.parameters.mode ??= 'runOnceForAllItems';
    if (formattingOnlyNodes.has(copy.name)) {
      // Preservar los literales; solo estos tres nodos difieren en formato.
      copy.parameters.jsCode = copy.parameters.jsCode.replace(
        /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\s+/g,
        (match, literal) => literal || '',
      );
    }
  }
  if (copy.type === 'n8n-nodes-base.dataTable' && copy.parameters.operation === 'create') {
    for (const column of copy.parameters.columns.column) column.type ??= 'string';
  }
  return copy;
};
for (const [label, candidate] of [['entrada', workflow], ['generado', generated]]) {
  assert(candidate.nodes.length === 303, label + ': 303 nodos');
  assert(candidate.nodes.filter((node) => node.type === 'n8n-nodes-base.code').length === 102, label + ': 102 Code nodes');
  assert(new Set(candidate.nodes.map((node) => node.id)).size === 303, label + ': IDs únicos');
  assert(isDeepStrictEqual(candidate.nodes.map((node) => node.name).sort(), official.nodes.map((node) => node.name).sort()), label + ': nombres equivalentes al export');
  assert(isDeepStrictEqual(candidate.connections, official.connections), label + ': todas las conexiones equivalentes');
  const byName = new Map(candidate.nodes.map((node) => [node.name, node]));
  for (const reference of official.nodes) {
    const node = byName.get(reference.name);
    assert(Boolean(node) && isDeepStrictEqual(functionalNode(node), functionalNode(reference)), label + ': parámetros funcionales equivalentes: ' + reference.name);
  }
  for (const [check, ok] of Object.entries(urgencyContract(byName.get('Guardar estado urgencia final')))) {
    assert(ok, label + ': contrato urgencia ' + check);
  }
}

const groomingReply = nodesByName
  .get('Preparar respuesta datos servicio peluquería')
  ?.parameters?.assignments?.assignments
  ?.find((assignment) => assignment.name === 'reply')
  ?.value || '';
assert(groomingReply.includes('nombre del tutor'), 'peluquería solicita tutor junto con datos de servicio');
assert(groomingReply.includes('nombre de la mascota'), 'peluquería solicita mascota junto con datos de servicio');
assert(groomingReply.includes('teléfono móvil chileno'), 'peluquería solicita teléfono junto con datos de servicio');

const medicalConfirmationReply = nodesByName
  .get('Preparar respuesta cita confirmada')
  ?.parameters?.assignments?.assignments
  ?.find((assignment) => assignment.name === 'reply')
  ?.value || '';
assert(
  medicalConfirmationReply.includes('replace(/[.\\s]+$/, "")'),
  'confirmación médica normaliza el punto final de la hora',
);

const compose = fs.readFileSync(composePath, 'utf8');
// Comprobar cada servicio evita aceptar dos coincidencias en el mismo bloque.
for (const service of ['n8n', 'task-runners']) {
  const block = compose.match(new RegExp('^  ' + service + ':\\r?\\n([\\s\\S]*?)(?=^  \\S|^\\S|(?![\\s\\S]))', 'm'))?.[1] || '';
  const timeouts = [...block.matchAll(/^      N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT:\s*([^\r\n]+)$/gm)];
  assert(
    timeouts.length === 1 && timeouts[0][1].trim() === '"0"',
    'runner sin apagado automático por inactividad en ' + service,
  );
}

assert(
  !/N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT:\s*"15"/.test(compose),
  'se elimina el apagado del runner a los 15 segundos',
);

const triggerTypes = new Set([
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.n8nTrigger',
  'n8n-nodes-base.manualTrigger',
]);
const queue = workflow.nodes.filter((node) => triggerTypes.has(node.type)).map((node) => node.name);
const reachable = new Set();
while (queue.length) {
  const current = queue.shift();
  if (reachable.has(current)) continue;
  reachable.add(current);
  for (const output of workflow.connections[current]?.main || []) {
    for (const target of output || []) queue.push(target.node);
  }
}
for (const node of workflow.nodes.filter((item) => item.name.includes('LAB-026'))) {
  assert(reachable.has(node.name), `nodo LAB-026 alcanzable: ${node.name}`);
}

const runCode = (nodeName, environment) => {
  const code = nodesByName.get(nodeName)?.parameters?.jsCode;
  if (!code) throw new Error(`No se encontró Code node ${nodeName}`);
  const names = Object.keys(environment);
  const values = Object.values(environment);
  return new Function(...names, code)(...values);
};

const intentNode = 'Consolidar intención gestión cita LAB-026';
const runIntent = (message, row = {}) => {
  const entry = {
    clinic_id: 'clinica_piloto_001',
    session_id: 'sesion_prueba_lab026',
    operation_key_lab026: 'clinica_piloto_001::sesion_prueba_lab026',
    message,
  };
  const dollar = (name) => ({
    first: () => ({ json: name === 'Preparar clave gestión cita LAB-026' ? entry : {} }),
  });
  return runCode(intentNode, {
    $: dollar,
    $json: row,
    $execution: { id: 'execution-test-001' },
  }).json;
};

assert(runIntent('¿Cuánto cuesta una consulta?').esGestionCitaLab026 === false, 'consulta RAG no entra a LAB-026');
assert(runIntent('Quiero cancelar la solicitud').esGestionCitaLab026 === false, 'cancelar solicitud abierta no cancela cita');

const cancelIntent = runIntent('Quiero cancelar mi cita');
assert(cancelIntent.esGestionCitaLab026 === true, 'detecta cancelación de cita confirmada');
assert(cancelIntent.pasoLab026 === 'guardar_responder', 'cancelación sin teléfono solicita verificación');
assert(cancelIntent.operacionLab026.estado === 'esperando_telefono', 'estado esperando teléfono');

const rescheduleIntent = runIntent('Quiero cambiar mi cita. Mi teléfono es 987654321');
assert(rescheduleIntent.pasoLab026 === 'buscar_citas', 'reprogramación con teléfono busca citas');
assert(
  rescheduleIntent.operacionLab026.telefono_normalizado === '+56987654321',
  'normalización de teléfono chileno',
);

const future = new Date(Date.now() + 20 * 60 * 1000).toISOString();
const selectRow = {
  operation_key: 'clinica_piloto_001::sesion_prueba_lab026',
  operation_id: 'op_test_001',
  clinic_id: 'clinica_piloto_001',
  session_id: 'sesion_prueba_lab026',
  accion: 'cancelar',
  estado: 'esperando_seleccion_cita',
  opciones_citas_json: '[]',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expires_at: future,
};
const selectIntent = runIntent('Cita 2', selectRow);
assert(selectIntent.pasoLab026 === 'seleccionar_cita', 'selección Cita 2 reconocida');
assert(selectIntent.operacionLab026.seleccion_numero === 2, 'numeración conversacional conservada');

const confirmationRow = {
  ...selectRow,
  estado: 'esperando_confirmacion_cancelacion',
  appointment_id: 'apt_test_001',
  cita_version: 1,
};
assert(runIntent('Sí', confirmationRow).pasoLab026 === 'ejecutar_cancelacion', 'confirmación explícita habilita cancelación');
assert(runIntent('No', confirmationRow).operacionLab026.estado === 'cancelada_usuario', 'rechazo conserva la cita');

const selectionResult = runCode('Resolver selección de cita LAB-026', {
  $json: {
    message: 'Cita 2',
    operacionLab026: {
      ...selectRow,
      seleccion_numero: 2,
      opciones_citas_json: JSON.stringify([
        {
          numero: 1,
          appointment_id: 'apt_1',
          version: 1,
          nombre_mascota: 'Max',
          nombre_servicio: 'Consulta veterinaria',
          start_time: new Date(Date.now() + 86_400_000).toISOString(),
        },
        {
          numero: 2,
          appointment_id: 'apt_2',
          version: 3,
          nombre_mascota: 'Luna',
          nombre_servicio: 'Baño',
          start_time: new Date(Date.now() + 172_800_000).toISOString(),
        },
      ]),
    },
  },
}).json;
assert(selectionResult.operacionLab026.appointment_id === 'apt_2', 'Cita 2 se vincula al appointment_id correcto');
assert(selectionResult.operacionLab026.cita_version === 3, 'selección conserva versión interna');
assert(
  !selectionResult.operacionLab026.respuesta_publica.includes('apt_2'),
  'respuesta pública no expone appointment_id',
);


// Regresiones de comportamiento de los Code nodes trasladados del export.
for (const [message, expected] of [
  ['Quiero cambiar mi cita', 'sin_prioridad'],
  ['Mi perro no puede respirar', 'prioridad_inmediata'],
]) {
  const result = runCode('Evaluar reglas deterministas urgencia', {
    $json: {
      message,
      contextoUrgenciaTexto: 'Mi perro no puede respirar',
      estadoUrgencia: { estado_episodio: 'atencion_reportada' },
    },
  }).json;
  assert(result.prioridadDeterminista === expected, 'urgencia atendida evalúa mensaje actual: ' + message);
}

const oldUrgency = {
  state_key: 'clinic::session', episode_id_activo: 'episode-1',
  estado_episodio: 'activo_inmediato', alert_id_ultimo: 'alert-1',
  ultima_notificacion_at: '2026-01-01T00:00:00.000Z',
  mensajes_recientes_json: '["contexto anterior"]',
};
const prepareUrgency = (success, row = oldUrgency) => runCode('Preparar estado urgencia final', {
  $: () => ({ first: () => ({ json: {
    estadoUrgenciaFinal: row, envioTelegramFinalExitoso: success,
    fechaNotificacionExitosa: '2026-01-02T00:00:00.000Z',
  } }) }),
}).json;
const preparedUrgency = prepareUrgency(true);
assert(isDeepStrictEqual(preparedUrgency, {
  state_key: 'clinic::session', episode_id_esperado: 'episode-1',
  estado_episodio_esperado: 'activo_inmediato', alert_id_esperado: 'alert-1',
  ultima_notificacion_at: '2026-01-02T00:00:00.000Z',
}), 'preparación urgencia acota salida y conserva valores esperados');
assert(prepareUrgency(false).ultima_notificacion_at === oldUrgency.ultima_notificacion_at, 'Telegram fallido conserva fecha anterior');
let rejectsMissingKey = false;
try { prepareUrgency(true, { ...oldUrgency, state_key: '' }); }
catch { rejectsMissingKey = true; }
assert(rejectsMissingKey, 'urgencia rechaza state_key vacío');

// Modelo en memoria del predicado AND autorizado, sin simular una base n8n real.
const matchesUrgency = (row) => expectedUrgencyFilters.every(({ keyName, keyValue }) => {
  const field = keyValue.match(/\$json\.(\w+)/)[1];
  return row[keyName] === preparedUrgency[field];
});
assert(matchesUrgency(oldUrgency), 'concurrencia acepta coincidencia de los cuatro campos');
for (const { keyName } of expectedUrgencyFilters) {
  assert(!matchesUrgency({ ...oldUrgency, [keyName]: 'changed' }), 'concurrencia rechaza cambio de ' + keyName);
}
const concurrentRow = { ...oldUrgency, episode_id_activo: 'episode-2' };
const updateInMemory = (row) => matchesUrgency(row)
  ? { ...row, ultima_notificacion_at: preparedUrgency.ultima_notificacion_at }
  : { ...row };
assert(isDeepStrictEqual(updateInMemory(concurrentRow), concurrentRow), 'ejecución antigua no cambia episodio nuevo');
assert(isDeepStrictEqual(updateInMemory(oldUrgency), {
  ...oldUrgency, ultima_notificacion_at: preparedUrgency.ultima_notificacion_at,
}), 'actualización coincidente modifica únicamente ultima_notificacion_at');

for (const [message, action] of [['Cancélala', 'cancelar'], ['Cambiarla', 'reprogramar']]) {
  assert(runIntent(message).operacionLab026?.accion === action, 'reconoce intención ampliada: ' + message);
}
for (const estado of ['completada', 'requiere_revision']) {
  const terminal = { ...selectRow, estado, respuesta_publica: 'Resultado ya guardado' };
  const retry = runIntent('Sí', terminal);
  assert(retry.pasoLab026 === 'guardar_responder' && isDeepStrictEqual(retry.operacionLab026, terminal), 'reintento terminal conserva respuesta, ID y TTL: ' + estado);
}
const expired = { ...confirmationRow, expires_at: '2000-01-01T00:00:00.000Z' };
assert(runIntent('Sí', expired).pasoLab026 === 'continuar_flujo', 'confirmación expirada no ejecuta cancelación');
const restarted = runIntent('Quiero cancelar mi cita', expired);
assert(restarted.operacionExpiradaLab026 === true && restarted.operacionLab026.operation_id !== expired.operation_id, 'intención explícita tras expiración crea nueva operación');

// Fixture de fecha civil para probar precedencia, no zona horaria/DST de Luxon.
// No se entrega hora: este caso no construye instantes de Calendar.
class CivilDateFixture {
  constructor(year, month, day) {
    this.date = new Date(Date.UTC(year, month - 1, day));
    this.year = year;
    this.weekday = this.date.getUTCDay() || 7;
    this.isValid = this.date.getUTCFullYear() === year && this.date.getUTCMonth() === month - 1 && this.date.getUTCDate() === day;
  }
  static fromObject({ year, month, day }) { return new CivilDateFixture(year, month, day); }
  setZone() { return this; }
  startOf() { return this; }
  valueOf() { return this.date.getTime(); }
  toISODate() { return this.date.toISOString().slice(0, 10); }
  plus({ days = 0, years = 0 }) {
    const date = new Date(this.date);
    date.setUTCFullYear(date.getUTCFullYear() + years);
    date.setUTCDate(date.getUTCDate() + days);
    return new CivilDateFixture(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }
}
for (const [message, expectedDate] of [
  ['miércoles 16 de septiembre', '2026-09-16'],
  ['miércoles 16/09/2026', '2026-09-16'],
  ['mañana miércoles', '2026-09-04'],
  ['miércoles', '2026-09-09'],
]) {
  const result = runCode('Interpretar nuevo horario LAB-026', {
    $json: { message, operacionLab026: {} }, $now: new CivilDateFixture(2026, 9, 3),
  }).json;
  assert(result.operacionLab026.fecha_pendiente === expectedDate, 'precedencia de fecha: ' + message);
}

const holdContext = {
  holdEventIdLab026: 'hold', citaBloqueadaLab026: { event_id: 'original' },
  operacionLab026: {},
};
for (const [events, safe] of [
  [[{ id: 'hold' }], true],
  [[{ id: 'hold' }, { id: 'original' }], true],
  [[{ id: 'hold' }, { id: 'other' }], false],
  [[], false],
]) {
  const result = runCode('Consolidar seguridad bloqueo temporal LAB-026', {
    $: () => ({ first: () => ({ json: holdContext }) }),
    $input: { all: () => events.map((json) => ({ json })) },
  }).json;
  assert(result.bloqueoTemporalSeguroLab026 === safe, 'seguridad previa: ' + JSON.stringify(events));
}
const finalCondition = nodesByName.get('Bloqueo temporal ausente LAB-026').parameters.conditions.conditions[0].leftValue;
for (const [events, safe, error] of [
  [[{ id: 'original' }], true, ''],
  [[{ id: 'original' }, { id: 'other' }], false, 'conflicto_final_reprogramacion'],
  [[{ id: 'hold' }], false, 'bloqueo_temporal_no_eliminado'],
  [[{ id: 'original' }, { id: 'other', status: 'cancelled' }], true, ''],
]) {
  const result = runCode('Consolidar ausencia bloqueo temporal LAB-026', {
    $: () => ({ first: () => ({ json: holdContext }) }),
    $input: { all: () => events.map((json) => ({ json })) },
  }).json;
  assert(result.seguridadFinalReprogramacionLab026 === safe && result.lab026FailureCode === error, 'seguridad final: ' + JSON.stringify(events));
  const branch = new Function('$json', 'return (' + finalCondition.slice(3, -2).trim() + ');')(result);
  assert(branch === safe, 'IF final exige ausencia de bloqueo y conflicto: ' + JSON.stringify(events));
}

const serialized = JSON.stringify(workflow);
for (const pattern of [
  /"client_secret"\s*:\s*"[^"\s]+"/i,
  /"access_token"\s*:\s*"[^"\s]+"/i,
  /"private_key"\s*:\s*"-----BEGIN/i,
  /authorization:\s*bearer\s+[a-z0-9._-]{20,}/i,
]) {
  assert(!pattern.test(serialized), `export sin secreto que coincida con ${pattern}`);
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors, assertions: assertions.length }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      workflow: path.relative(repoDir, workflowPath),
      nodes: workflow.nodes.length,
      code_nodes: workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.code').length,
      assertions: assertions.length,
    },
    null,
    2,
  ),
);
