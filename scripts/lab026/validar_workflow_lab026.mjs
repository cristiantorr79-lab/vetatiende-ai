import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, '../..');
const workflowPath = path.join(
  repoDir,
  'n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json',
);
const composePath = path.join(repoDir, 'infra/comercial/compose.yaml');

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const errors = [];
const assertions = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
  else assertions.push(message);
};

const nodesByName = new Map(workflow.nodes.map((node) => [node.name, node]));
assert(nodesByName.size === workflow.nodes.length, 'nombres de nodos únicos');
assert(new Set(workflow.nodes.map((node) => node.id)).size === workflow.nodes.length, 'IDs de nodos únicos');
assert(workflow.active === false, 'workflow exportado inactivo');
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
  'Crear pendiente humano LAB-025 desde LAB-026',
  'Responder gestión cita LAB-026',
];
for (const nodeName of requiredNodes) {
  assert(nodesByName.has(nodeName), `nodo crítico presente: ${nodeName}`);
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
const warmTimeouts = compose.match(/N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT:\s*"300"/g) || [];
assert(warmTimeouts.length === 2, 'runner JS permanece caliente cinco minutos en ambos servicios');
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
