import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, '../..');
const sourcePath = path.join(
  repoDir,
  'n8n/workflows/comercial/lab024_urgencias_medicas_alerta_interna.json',
);
const targetPath = path.join(
  repoDir,
  'n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json',
);

const workflow = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const uuid = (seed) => {
  const hex = crypto.createHash('sha256').update(`lab026:${seed}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
};

workflow.id = 'LAB026VetAtiende';
workflow.versionId = uuid('workflow-version');
workflow.name = 'LAB-026 - Cancelación y reprogramación segura de citas confirmadas';
workflow.active = false;
workflow.pinData = {};

const googleCredentials = {
  googleCalendarOAuth2Api: {
    id: 'LIhi8q3GO7McKPDB',
    name: 'Google Calendar comercial LAB-022',
  },
};

const schema = (definitions, included = null) =>
  definitions.map(([id, type]) => ({
    id,
    displayName: id,
    required: false,
    defaultMatch: false,
    display: true,
    type,
    readOnly: false,
    removed: included ? !included.includes(id) : false,
  }));

const citasColumns = [
  ['appointment_id', 'string'],
  ['clinic_id', 'string'],
  ['session_id_origen', 'string'],
  ['tipo_agenda', 'string'],
  ['service_id', 'string'],
  ['nombre_servicio', 'string'],
  ['calendar_id', 'string'],
  ['event_id', 'string'],
  ['nombre_tutor', 'string'],
  ['nombre_mascota', 'string'],
  ['telefono_normalizado', 'string'],
  ['start_time', 'string'],
  ['end_time', 'string'],
  ['duracion_minutos', 'number'],
  ['estado', 'string'],
  ['version', 'number'],
  ['last_operation_id', 'string'],
  ['detalles_json', 'string'],
  ['created_at', 'string'],
  ['updated_at', 'string'],
];

const operacionesColumns = [
  ['operation_key', 'string'],
  ['operation_id', 'string'],
  ['clinic_id', 'string'],
  ['session_id', 'string'],
  ['accion', 'string'],
  ['estado', 'string'],
  ['telefono_normalizado', 'string'],
  ['appointment_id', 'string'],
  ['cita_version', 'number'],
  ['cita_seleccionada_json', 'string'],
  ['opciones_citas_json', 'string'],
  ['opciones_horarios_json', 'string'],
  ['fecha_pendiente', 'string'],
  ['hora_pendiente', 'string'],
  ['nuevo_start_time', 'string'],
  ['nuevo_end_time', 'string'],
  ['intentos_verificacion', 'number'],
  ['error_code', 'string'],
  ['respuesta_publica', 'string'],
  ['created_at', 'string'],
  ['updated_at', 'string'],
  ['expires_at', 'string'],
];

const auditoriaColumns = [
  ['audit_id', 'string'],
  ['operation_id', 'string'],
  ['appointment_id', 'string'],
  ['clinic_id', 'string'],
  ['session_id', 'string'],
  ['accion', 'string'],
  ['resultado', 'string'],
  ['estado_anterior', 'string'],
  ['estado_nuevo', 'string'],
  ['start_time_anterior', 'string'],
  ['start_time_nuevo', 'string'],
  ['detalle_sanitizado', 'string'],
  ['fecha_hora', 'string'],
];

const pendientesColumns = [
  ['pending_id', 'string'],
  ['clinic_id', 'string'],
  ['tipo', 'string'],
  ['descripcion', 'string'],
  ['prioridad', 'string'],
  ['estado', 'string'],
  ['creado_por', 'string'],
  ['asignado_a', 'string'],
  ['fecha_creacion', 'string'],
  ['fecha_actualizacion', 'string'],
  ['fecha_resolucion', 'string'],
];

const nodeByName = (name) => {
  const node = workflow.nodes.find((item) => item.name === name);
  if (!node) throw new Error(`No existe el nodo base: ${name}`);
  return node;
};

const addNode = (name, type, typeVersion, parameters, position, extras = {}) => {
  if (workflow.nodes.some((node) => node.name === name)) {
    throw new Error(`Nodo duplicado: ${name}`);
  }
  const node = {
    parameters,
    type,
    typeVersion,
    position,
    id: uuid(name),
    name,
    ...extras,
  };
  workflow.nodes.push(node);
  return node;
};

const addCode = (name, jsCode, position, mode = 'runOnceForEachItem') =>
  addNode(
    name,
    'n8n-nodes-base.code',
    2,
    { mode, jsCode },
    position,
  );

const addIf = (name, expression, position) =>
  addNode(
    name,
    'n8n-nodes-base.if',
    2.3,
    {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'strict',
          version: 3,
        },
        conditions: [
          {
            id: uuid(`${name}:condition`),
            leftValue: expression,
            rightValue: '',
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    position,
  );

const addSwitch = (name, fieldExpression, values, position) =>
  addNode(
    name,
    'n8n-nodes-base.switch',
    3.4,
    {
      rules: {
        values: values.map((value) => ({
          conditions: {
            options: {
              caseSensitive: true,
              leftValue: '',
              typeValidation: 'strict',
              version: 3,
            },
            conditions: [
              {
                id: uuid(`${name}:${value}`),
                leftValue: fieldExpression,
                rightValue: value,
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
          renameOutput: true,
          outputKey: value,
        })),
      },
      options: {},
    },
    position,
  );

const dataTableLocator = (name) => ({ __rl: true, value: name, mode: 'name' });

const addTableCreate = (name, tableName, columns, position) =>
  addNode(
    name,
    'n8n-nodes-base.dataTable',
    1.1,
    {
      resource: 'table',
      operation: 'create',
      tableName,
      columns: { column: columns.map(([columnName, type]) => ({ name: columnName, type })) },
      options: { createIfNotExists: true },
    },
    position,
    { onError: 'continueErrorOutput' },
  );

const addDataGet = (name, tableName, conditions, position, extras = {}) =>
  addNode(
    name,
    'n8n-nodes-base.dataTable',
    1.1,
    {
      operation: 'get',
      dataTableId: dataTableLocator(tableName),
      matchType: 'allConditions',
      filters: {
        conditions: conditions.map(([keyName, keyValue]) => ({ keyName, keyValue })),
      },
      ...(extras.limit ? { limit: extras.limit } : {}),
    },
    position,
    {
      alwaysOutputData: extras.alwaysOutputData ?? true,
      onError: extras.onError ?? 'continueErrorOutput',
    },
  );

const addDataWrite = (
  name,
  operation,
  tableName,
  definitions,
  valueExpressions,
  position,
  filterConditions = [],
) => {
  const included = Object.keys(valueExpressions);
  const parameters = {
    operation,
    dataTableId: dataTableLocator(tableName),
    ...(filterConditions.length
      ? {
          matchType: 'allConditions',
          filters: {
            conditions: filterConditions.map(([keyName, keyValue]) => ({ keyName, keyValue })),
          },
        }
      : {}),
    columns: {
      mappingMode: 'defineBelow',
      value: valueExpressions,
      matchingColumns: [],
      schema: schema(definitions, included),
      attemptToConvertTypes: false,
      convertFieldsToString: false,
    },
    options: {},
  };
  return addNode(
    name,
    'n8n-nodes-base.dataTable',
    1.1,
    parameters,
    position,
    { onError: 'continueErrorOutput' },
  );
};

const addCalendar = (name, parameters, position, extras = {}) =>
  addNode(
    name,
    'n8n-nodes-base.googleCalendar',
    1.3,
    parameters,
    position,
    {
      credentials: googleCredentials,
      onError: extras.onError ?? 'continueErrorOutput',
      ...(extras.alwaysOutputData ? { alwaysOutputData: true } : {}),
    },
  );

const addRespond = (name, position) =>
  addNode(
    name,
    'n8n-nodes-base.respondToWebhook',
    1.5,
    {
      respondWith: 'json',
      responseBody:
        '={{ ({ ok: true, clinic_id: $json.clinic_id || "clinica_piloto_001", session_id: $json.session_id || "", reply: $json.respuesta_publica || "No fue posible completar la gestión de la cita." }) }}',
      options: {},
    },
    position,
  );

const ensureOutputs = (from, outputIndex) => {
  workflow.connections[from] ??= { main: [] };
  workflow.connections[from].main ??= [];
  while (workflow.connections[from].main.length <= outputIndex) {
    workflow.connections[from].main.push([]);
  }
};

const connect = (from, to, outputIndex = 0, inputIndex = 0) => {
  ensureOutputs(from, outputIndex);
  workflow.connections[from].main[outputIndex].push({
    node: to,
    type: 'main',
    index: inputIndex,
  });
};

const replaceOutput = (from, outputIndex, targets) => {
  ensureOutputs(from, outputIndex);
  workflow.connections[from].main[outputIndex] = targets.map((target) => ({
    node: target,
    type: 'main',
    index: 0,
  }));
};

const calendarIdExpression = (expression) => ({ __rl: true, value: expression, mode: 'id' });

// -----------------------------------------------------------------------------
// Inicialización idempotente de tablas
// -----------------------------------------------------------------------------

addNode(
  'Inicializar tablas LAB-026 (ejecutar una vez)',
  'n8n-nodes-base.manualTrigger',
  1,
  {},
  [-5200, 4384],
);
addTableCreate('Crear tabla lab026_citas', 'lab026_citas', citasColumns, [-4960, 4384]);
addTableCreate(
  'Crear tabla lab026_operaciones_cita',
  'lab026_operaciones_cita',
  operacionesColumns,
  [-4720, 4384],
);
addTableCreate(
  'Crear tabla lab026_auditoria_citas',
  'lab026_auditoria_citas',
  auditoriaColumns,
  [-4480, 4384],
);
addCode(
  'Confirmar inicialización LAB-026',
  `return { json: { ok: true, message: "Tablas LAB-026 disponibles", tabla_final: String($json.name || "") } };`,
  [-4240, 4384],
);
connect('Inicializar tablas LAB-026 (ejecutar una vez)', 'Crear tabla lab026_citas');
connect('Crear tabla lab026_citas', 'Crear tabla lab026_operaciones_cita');
connect('Crear tabla lab026_operaciones_cita', 'Crear tabla lab026_auditoria_citas');
connect('Crear tabla lab026_auditoria_citas', 'Confirmar inicialización LAB-026');

// -----------------------------------------------------------------------------
// Registro durable al crear citas médicas y de peluquería
// -----------------------------------------------------------------------------

const appointmentCode = `
const normalizarTelefono = (valor) => {
  let digitos = String(valor || "").replace(/\\D/g, "");
  if (digitos.startsWith("56") && digitos.length === 11) digitos = digitos.slice(2);
  if (digitos.length === 8) digitos = "9" + digitos;
  return /^9\\d{8}$/.test(digitos) ? "+56" + digitos : "";
};
const hash = (valor) => {
  let h = 2166136261;
  for (const caracter of String(valor || "")) {
    h ^= caracter.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
};
`;

addCode(
  'Preparar registro durable cita médica LAB-026',
  `${appointmentCode}
const origen = $json;
const evento = origen.eventoCreado || {};
const estado = origen.estadoAgenda || {};
const calendarId = String(origen.agendaConfig?.calendar_id || "").trim();
const eventId = String(evento.id || "").trim();
if (!eventId || !calendarId) throw new Error("La cita médica no entregó identificadores persistibles.");
const ahora = new Date().toISOString();
const appointmentId = "apt_" + hash([origen.clinic_id, calendarId, eventId].join("::"));
return { json: { ...origen, registroCitaLab026: {
  appointment_id: appointmentId,
  clinic_id: String(origen.clinic_id || estado.clinic_id || "").trim(),
  session_id_origen: String(origen.session_id || "").trim(),
  tipo_agenda: "medica",
  service_id: String(estado.service_id || origen.agendaConfig?.service_id || "consulta_general"),
  nombre_servicio: "Consulta veterinaria",
  calendar_id: calendarId,
  event_id: eventId,
  nombre_tutor: String(estado.nombre_tutor || "").trim(),
  nombre_mascota: String(estado.nombre_mascota || "").trim(),
  telefono_normalizado: normalizarTelefono(estado.telefono),
  start_time: String(origen.startTime || estado.start_time || ""),
  end_time: String(origen.endTime || ""),
  duracion_minutos: Number(origen.agendaConfig?.duracion_minutos || 30),
  estado: "confirmada",
  version: 1,
  last_operation_id: "",
  detalles_json: JSON.stringify({ origen: "lab026", tipo: "medica" }),
  created_at: ahora,
  updated_at: ahora
} } };`,
  [2960, 2096],
);

const citaValueExpressions = Object.fromEntries(
  citasColumns.map(([field]) => [field, `={{ $json.registroCitaLab026.${field} }}`]),
);
addDataWrite(
  'Persistir cita médica canónica LAB-026',
  'upsert',
  'lab026_citas',
  citasColumns,
  citaValueExpressions,
  [3184, 2096],
  [['appointment_id', '={{ $json.registroCitaLab026.appointment_id }}']],
);
addDataGet(
  'Verificar cita médica canónica LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $("Preparar registro durable cita médica LAB-026").first().json.registroCitaLab026.appointment_id }}'],
    ['clinic_id', '={{ $("Preparar registro durable cita médica LAB-026").first().json.registroCitaLab026.clinic_id }}'],
  ],
  [3408, 2096],
  { limit: 1 },
);
addCode(
  'Consolidar verificación cita médica LAB-026',
  `const origen = $("Preparar registro durable cita médica LAB-026").first().json;
const esperado = origen.registroCitaLab026;
const fila = $json || {};
const persistida = String(fila.appointment_id || "") === esperado.appointment_id
  && String(fila.event_id || "") === esperado.event_id
  && String(fila.clinic_id || "") === esperado.clinic_id
  && String(fila.estado || "") === "confirmada";
return { json: { ...origen, registroCitaLab026: esperado, citaLab026Persistida: persistida,
  lab026FailureCode: persistida ? "" : "persistencia_cita_medica_no_verificada" } };`,
  [3632, 2096],
);
addIf(
  'Cita médica LAB-026 persistida',
  '={{ $json.citaLab026Persistida === true }}',
  [3856, 2096],
);

replaceOutput('Consolidar cita médica creada', 0, ['Preparar registro durable cita médica LAB-026']);
connect('Preparar registro durable cita médica LAB-026', 'Persistir cita médica canónica LAB-026');
connect('Persistir cita médica canónica LAB-026', 'Verificar cita médica canónica LAB-026', 0);
connect('Persistir cita médica canónica LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Verificar cita médica canónica LAB-026', 'Consolidar verificación cita médica LAB-026', 0);
connect('Verificar cita médica canónica LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar verificación cita médica LAB-026', 'Cita médica LAB-026 persistida');
connect('Cita médica LAB-026 persistida', 'Guardar estado cita confirmada', 0);
connect('Cita médica LAB-026 persistida', 'Preparar revisión humana LAB-026', 1);

addCode(
  'Preparar registro durable cita peluquería LAB-026',
  `${appointmentCode}
const origen = $json;
const cita = origen.citaPeluqueria || {};
const evento = origen.eventoCreadoPeluqueria || {};
const calendarId = String(cita.calendar_id || origen.peluqueriaConfig?.calendar_id || "").trim();
const eventId = String(evento.event_id || "").trim();
if (!eventId || !calendarId) throw new Error("La cita de peluquería no entregó identificadores persistibles.");
const ahora = new Date().toISOString();
const appointmentId = "apt_" + hash([cita.clinic_id, calendarId, eventId].join("::"));
return { json: { ...origen, registroCitaLab026: {
  appointment_id: appointmentId,
  clinic_id: String(cita.clinic_id || origen.clinic_id || "").trim(),
  session_id_origen: String(cita.session_id || origen.session_id || "").trim(),
  tipo_agenda: "peluqueria",
  service_id: String(cita.service_id || ""),
  nombre_servicio: String(cita.nombre_servicio || "Peluquería"),
  calendar_id: calendarId,
  event_id: eventId,
  nombre_tutor: String(cita.nombre_tutor || "").trim(),
  nombre_mascota: String(cita.nombre_mascota || "").trim(),
  telefono_normalizado: normalizarTelefono(cita.telefono),
  start_time: String(evento.start_time || cita.start_time || ""),
  end_time: String(evento.end_time || cita.end_time || ""),
  duracion_minutos: Number(cita.duracion_minutos || 0),
  estado: "confirmada",
  version: 1,
  last_operation_id: "",
  detalles_json: JSON.stringify({ especie: cita.especie || "", tamano: cita.tamano || "", tipo_pelaje: cita.tipo_pelaje || "" }),
  created_at: ahora,
  updated_at: ahora
} } };`,
  [3312, 512],
);
addDataWrite(
  'Persistir cita peluquería canónica LAB-026',
  'upsert',
  'lab026_citas',
  citasColumns,
  citaValueExpressions,
  [3536, 512],
  [['appointment_id', '={{ $json.registroCitaLab026.appointment_id }}']],
);
addDataGet(
  'Verificar cita peluquería canónica LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $("Preparar registro durable cita peluquería LAB-026").first().json.registroCitaLab026.appointment_id }}'],
    ['clinic_id', '={{ $("Preparar registro durable cita peluquería LAB-026").first().json.registroCitaLab026.clinic_id }}'],
  ],
  [3760, 512],
  { limit: 1 },
);
addCode(
  'Consolidar verificación cita peluquería LAB-026',
  `const origen = $("Preparar registro durable cita peluquería LAB-026").first().json;
const esperado = origen.registroCitaLab026;
const fila = $json || {};
const persistida = String(fila.appointment_id || "") === esperado.appointment_id
  && String(fila.event_id || "") === esperado.event_id
  && String(fila.clinic_id || "") === esperado.clinic_id
  && String(fila.estado || "") === "confirmada";
return { json: { ...origen, registroCitaLab026: esperado, citaLab026Persistida: persistida,
  lab026FailureCode: persistida ? "" : "persistencia_cita_peluqueria_no_verificada" } };`,
  [3984, 512],
);
addIf(
  'Cita peluquería LAB-026 persistida',
  '={{ $json.citaLab026Persistida === true }}',
  [4208, 512],
);

replaceOutput('Cita peluquería creada correctamente', 0, [
  'Preparar registro durable cita peluquería LAB-026',
]);
connect('Preparar registro durable cita peluquería LAB-026', 'Persistir cita peluquería canónica LAB-026');
connect('Persistir cita peluquería canónica LAB-026', 'Verificar cita peluquería canónica LAB-026', 0);
connect('Persistir cita peluquería canónica LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Verificar cita peluquería canónica LAB-026', 'Consolidar verificación cita peluquería LAB-026', 0);
connect('Verificar cita peluquería canónica LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar verificación cita peluquería LAB-026', 'Cita peluquería LAB-026 persistida');
connect('Cita peluquería LAB-026 persistida', 'Preparar estado peluquería confirmado', 0);
connect('Cita peluquería LAB-026 persistida', 'Preparar revisión humana LAB-026', 1);

// -----------------------------------------------------------------------------
// Entrada y estado conversacional de gestión de citas
// -----------------------------------------------------------------------------

addCode(
  'Preparar clave gestión cita LAB-026',
  `const clinicId = String($json.clinic_id || "").trim();
const sessionId = String($json.session_id || "").trim();
return { json: { ...$json, operation_key_lab026: [clinicId, sessionId].join("::") } };`,
  [-672, 4464],
);
addDataGet(
  'Leer operación de cita LAB-026',
  'lab026_operaciones_cita',
  [['operation_key', '={{ $json.operation_key_lab026 }}']],
  [-448, 4464],
  { limit: 1 },
);

addCode(
  'Consolidar intención gestión cita LAB-026',
  `const entrada = $("Preparar clave gestión cita LAB-026").first().json;
const fila = $json || {};
const normalizar = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, " ").trim();
const texto = normalizar(entrada.message);
const normalizarTelefono = (valor) => {
  let d = String(valor || "").replace(/\\D/g, "");
  if (d.startsWith("56") && d.length === 11) d = d.slice(2);
  if (d.length === 8) d = "9" + d;
  return /^9\\d{8}$/.test(d) ? "+56" + d : "";
};
const extraerTelefono = (valor) => {
  const candidatos = String(valor || "").match(/(?:\\+?56[\\s.-]*)?9(?:[\\s.-]*\\d){8}/g) || [];
  for (const candidato of candidatos) {
    const telefono = normalizarTelefono(candidato);
    if (telefono) return telefono;
  }
  return "";
};
const hash = (valor) => {
  let h = 2166136261;
  for (const c of String(valor || "")) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
};
const patronesCancelar = [
  /\\b(?:cancelar|anular|suspender)\\s+(?:la|una|mi)?\\s*(?:cita|hora|reserva|turno)\\b/,
  /\\b(?:cita|hora|reserva|turno)\\s+(?:confirmada\\s+)?(?:que\\s+)?(?:quiero|necesito)\\s+(?:cancelar|anular)\\b/
];
const patronesReprogramar = [
  /\\b(?:reprogramar|cambiar|mover|postergar)\\s+(?:la|una|mi)?\\s*(?:cita|hora|reserva|turno)\\b/,
  /\\b(?:cita|hora|reserva|turno)\\s+(?:que\\s+)?(?:quiero|necesito)\\s+(?:reprogramar|cambiar|mover)\\b/
];
const esControlSolicitudAbierta = /\\bcancelar\\s+(?:la|esta)?\\s*(?:solicitud|agenda|proceso)\\b/.test(texto);
const solicitaCancelar = !esControlSolicitudAbierta && patronesCancelar.some((p) => p.test(texto));
const solicitaReprogramar = patronesReprogramar.some((p) => p.test(texto));
const accionExplicita = solicitaReprogramar ? "reprogramar" : solicitaCancelar ? "cancelar" : "";
const ahora = new Date();
const filaExpira = fila.expires_at ? new Date(fila.expires_at) : null;
const estadosAbiertos = ["esperando_telefono", "esperando_seleccion_cita", "esperando_confirmacion_cancelacion", "esperando_nuevo_horario", "esperando_seleccion_horario", "esperando_confirmacion_reprogramacion", "ejecutando"];
const operacionVigente = Boolean(fila.operation_key) && estadosAbiertos.includes(String(fila.estado || "")) && filaExpira && filaExpira > ahora;
const esGestionCita = Boolean(accionExplicita || operacionVigente);
if (!esGestionCita) return { json: { ...entrada, esGestionCitaLab026: false, pasoLab026: "continuar_flujo" } };

const esNueva = Boolean(accionExplicita) && (!operacionVigente || accionExplicita !== fila.accion);
const accion = esNueva ? accionExplicita : String(fila.accion || accionExplicita);
const operationId = esNueva
  ? "op_" + hash([entrada.operation_key_lab026, accion, String($execution.id || ahora.getTime())].join("::"))
  : String(fila.operation_id || "");
const telefonoMensaje = extraerTelefono(entrada.message);
const base = esNueva ? {
  operation_key: entrada.operation_key_lab026,
  operation_id: operationId,
  clinic_id: entrada.clinic_id,
  session_id: entrada.session_id,
  accion,
  estado: "esperando_telefono",
  telefono_normalizado: "",
  appointment_id: "",
  cita_version: 0,
  cita_seleccionada_json: "{}",
  opciones_citas_json: "[]",
  opciones_horarios_json: "[]",
  fecha_pendiente: "",
  hora_pendiente: "",
  nuevo_start_time: "",
  nuevo_end_time: "",
  intentos_verificacion: 0,
  error_code: "",
  respuesta_publica: "",
  created_at: ahora.toISOString(),
  updated_at: ahora.toISOString(),
  expires_at: new Date(ahora.getTime() + 30 * 60 * 1000).toISOString()
} : { ...fila };
base.updated_at = ahora.toISOString();
base.expires_at = new Date(ahora.getTime() + 30 * 60 * 1000).toISOString();

const afirmativo = /^(?:si|confirmo|de acuerdo|correcto|confirmar)(?:\\b|$)/.test(texto);
const negativo = /^(?:no|mejor no|dejalo|volver)(?:\\b|$)/.test(texto);
const seleccionarNumero = () => {
  const ordinales = { primera: 1, primero: 1, segunda: 2, segundo: 2, tercera: 3, tercero: 3, cuarta: 4, cuarto: 4, quinta: 5, quinto: 5 };
  const numero = texto.match(/(?:cita|horario|opcion|alternativa)?\\s*(\\d{1,2})\\b/);
  if (numero) return Number(numero[1]);
  for (const [palabra, valor] of Object.entries(ordinales)) if (new RegExp("\\\\b" + palabra + "\\\\b").test(texto)) return valor;
  return 0;
};

let paso = "responder_estado";
if (esNueva) {
  if (telefonoMensaje) { base.telefono_normalizado = telefonoMensaje; paso = "buscar_citas"; }
  else { base.respuesta_publica = "Claro. Indícame el teléfono que utilizaste al reservar."; paso = "guardar_responder"; }
} else if (base.estado === "esperando_telefono") {
  if (telefonoMensaje) { base.telefono_normalizado = telefonoMensaje; paso = "buscar_citas"; }
  else { base.respuesta_publica = "Necesito el teléfono asociado a la reserva para buscar la cita correcta."; paso = "guardar_responder"; }
} else if (base.estado === "esperando_seleccion_cita") {
  const numero = seleccionarNumero();
  if (numero) { paso = "seleccionar_cita"; }
  else { base.respuesta_publica = "Indícame el número de la cita que quieres gestionar, por ejemplo: Cita 2."; paso = "guardar_responder"; }
  base.seleccion_numero = numero;
} else if (base.estado === "esperando_confirmacion_cancelacion") {
  if (afirmativo) paso = "ejecutar_cancelacion";
  else if (negativo) { base.estado = "cancelada_usuario"; base.respuesta_publica = "Entendido. La cita se mantiene sin cambios."; paso = "guardar_responder"; }
  else { base.respuesta_publica = "Para proteger la cita, confírmame con “sí” si deseas cancelarla o “no” si quieres mantenerla."; paso = "guardar_responder"; }
} else if (base.estado === "esperando_nuevo_horario") {
  paso = "preparar_reprogramacion";
} else if (base.estado === "esperando_seleccion_horario") {
  const numero = seleccionarNumero();
  if (numero) paso = "seleccionar_horario";
  else { base.respuesta_publica = "Indícame el número del horario que prefieres, por ejemplo: Horario 2."; paso = "guardar_responder"; }
  base.seleccion_numero = numero;
} else if (base.estado === "esperando_confirmacion_reprogramacion") {
  if (afirmativo) paso = "ejecutar_reprogramacion";
  else if (negativo) { base.estado = "cancelada_usuario"; base.respuesta_publica = "Entendido. La cita conserva su horario original."; paso = "guardar_responder"; }
  else { base.respuesta_publica = "Confírmame con “sí” si deseas cambiar la cita a ese horario o “no” si prefieres conservarla."; paso = "guardar_responder"; }
} else {
  base.respuesta_publica = fila.respuesta_publica || "La gestión de esta cita ya no está abierta. Puedes iniciar una nueva solicitud.";
  paso = "guardar_responder";
}

return { json: { ...entrada, esGestionCitaLab026: true, pasoLab026: paso, operacionLab026: base } };`,
  [-224, 4464],
);
addIf(
  'Es gestión de cita LAB-026',
  '={{ $json.esGestionCitaLab026 === true }}',
  [0, 4464],
);

replaceOutput('Recuperar flujo comercial tras contexto urgencia', 0, ['Preparar clave gestión cita LAB-026']);
connect('Preparar clave gestión cita LAB-026', 'Leer operación de cita LAB-026');
connect('Leer operación de cita LAB-026', 'Consolidar intención gestión cita LAB-026', 0);
connect('Leer operación de cita LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar intención gestión cita LAB-026', 'Es gestión de cita LAB-026');
connect('Es gestión de cita LAB-026', 'Enrutar paso gestión cita LAB-026', 0);
connect('Es gestión de cita LAB-026', 'Cargar configuración agenda médica', 1);

const pasos = [
  'guardar_responder',
  'buscar_citas',
  'seleccionar_cita',
  'preparar_reprogramacion',
  'seleccionar_horario',
  'ejecutar_cancelacion',
  'ejecutar_reprogramacion',
];
addSwitch(
  'Enrutar paso gestión cita LAB-026',
  '={{ $json.pasoLab026 }}',
  pasos,
  [224, 4464],
);

const operacionValues = Object.fromEntries(
  operacionesColumns.map(([field]) => [field, `={{ $json.operacionLab026.${field} }}`]),
);
addDataWrite(
  'Guardar operación y respuesta LAB-026',
  'upsert',
  'lab026_operaciones_cita',
  operacionesColumns,
  operacionValues,
  [672, 4240],
  [['operation_key', '={{ $json.operacionLab026.operation_key }}']],
);
addRespond('Responder gestión cita LAB-026', [896, 4240]);
connect('Enrutar paso gestión cita LAB-026', 'Guardar operación y respuesta LAB-026', 0);
connect('Guardar operación y respuesta LAB-026', 'Responder gestión cita LAB-026', 0);
connect('Guardar operación y respuesta LAB-026', 'Preparar revisión humana LAB-026', 1);

// Buscar citas por clínica + teléfono + estado. El filtrado de futuro se reafirma en Code.
addDataGet(
  'Buscar citas confirmadas por teléfono LAB-026',
  'lab026_citas',
  [
    ['clinic_id', '={{ $json.operacionLab026.clinic_id }}'],
    ['telefono_normalizado', '={{ $json.operacionLab026.telefono_normalizado }}'],
    ['estado', 'confirmada'],
  ],
  [672, 4464],
);
connect('Enrutar paso gestión cita LAB-026', 'Buscar citas confirmadas por teléfono LAB-026', 1);

addCode(
  'Preparar opciones de citas LAB-026',
  `const origen = $("Consolidar intención gestión cita LAB-026").first().json;
const op = { ...origen.operacionLab026 };
const ahora = Date.now();
const filas = $input.all().map((i) => i.json || {}).filter((fila) =>
  fila.appointment_id && fila.clinic_id === op.clinic_id && fila.telefono_normalizado === op.telefono_normalizado
  && fila.estado === "confirmada" && new Date(fila.start_time).getTime() > ahora
).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
const zona = "America/Santiago";
const formatear = (iso) => new Intl.DateTimeFormat("es-CL", { timeZone: zona, dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
const opciones = filas.map((fila, indice) => ({
  numero: indice + 1,
  appointment_id: fila.appointment_id,
  version: Number(fila.version || 0),
  tipo_agenda: fila.tipo_agenda,
  service_id: fila.service_id,
  nombre_servicio: fila.nombre_servicio,
  nombre_mascota: fila.nombre_mascota,
  start_time: fila.start_time,
  end_time: fila.end_time,
  duracion_minutos: Number(fila.duracion_minutos || 0),
  calendar_id: fila.calendar_id,
  event_id: fila.event_id
}));
op.opciones_citas_json = JSON.stringify(opciones);
op.updated_at = new Date().toISOString();
if (!opciones.length) {
  op.estado = "completada";
  op.respuesta_publica = "No encontré una cita futura confirmada asociada a ese teléfono en esta clínica. Si crees que existe, el equipo puede revisarlo contigo.";
} else if (opciones.length === 1) {
  const cita = opciones[0];
  op.appointment_id = cita.appointment_id;
  op.cita_version = cita.version;
  op.cita_seleccionada_json = JSON.stringify(cita);
  if (op.accion === "cancelar") {
    op.estado = "esperando_confirmacion_cancelacion";
    op.respuesta_publica = "Encontré una cita para " + cita.nombre_mascota + ", " + cita.nombre_servicio + ", el " + formatear(cita.start_time) + ". ¿Quieres cancelar esta cita?";
  } else {
    op.estado = "esperando_nuevo_horario";
    op.respuesta_publica = "Encontré una cita para " + cita.nombre_mascota + ", " + cita.nombre_servicio + ", el " + formatear(cita.start_time) + ". ¿Para qué fecha y hora deseas cambiarla?";
  }
} else {
  op.estado = "esperando_seleccion_cita";
  const lista = opciones.map((cita) => "Cita " + cita.numero + ": " + cita.nombre_mascota + " — " + cita.nombre_servicio + " — " + formatear(cita.start_time)).join("\\n");
  op.respuesta_publica = "Encontré más de una cita:\\n" + lista + "\\n¿Cuál de estas citas quieres " + (op.accion === "cancelar" ? "cancelar" : "reprogramar") + "?";
}
return { json: { ...origen, operacionLab026: op } };`,
  [896, 4464],
  'runOnceForAllItems',
);
connect('Buscar citas confirmadas por teléfono LAB-026', 'Preparar opciones de citas LAB-026', 0);
connect('Buscar citas confirmadas por teléfono LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Preparar opciones de citas LAB-026', 'Guardar operación y respuesta LAB-026');

addCode(
  'Resolver selección de cita LAB-026',
  `const origen = $json;
const op = { ...origen.operacionLab026 };
let opciones = [];
try { opciones = JSON.parse(op.opciones_citas_json || "[]"); } catch {}
const numero = Number(op.seleccion_numero || 0);
const cita = opciones.find((item) => Number(item.numero) === numero);
if (!cita) {
  op.respuesta_publica = "Esa opción no corresponde a una cita de la lista. Indícame un número válido.";
} else {
  op.appointment_id = cita.appointment_id;
  op.cita_version = Number(cita.version || 0);
  op.cita_seleccionada_json = JSON.stringify(cita);
  const fecha = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "long", timeStyle: "short" }).format(new Date(cita.start_time));
  if (op.accion === "cancelar") {
    op.estado = "esperando_confirmacion_cancelacion";
    op.respuesta_publica = "Seleccionaste la cita de " + cita.nombre_mascota + ", " + cita.nombre_servicio + ", el " + fecha + ". ¿Confirmas que deseas cancelarla?";
  } else {
    op.estado = "esperando_nuevo_horario";
    op.respuesta_publica = "Seleccionaste la cita de " + cita.nombre_mascota + ", " + cita.nombre_servicio + ", el " + fecha + ". ¿Para qué fecha y hora deseas cambiarla?";
  }
}
op.updated_at = new Date().toISOString();
return { json: { ...origen, operacionLab026: op } };`,
  [672, 4688],
);
connect('Enrutar paso gestión cita LAB-026', 'Resolver selección de cita LAB-026', 2);
connect('Resolver selección de cita LAB-026', 'Guardar operación y respuesta LAB-026');

// -----------------------------------------------------------------------------
// Cancelación segura
// -----------------------------------------------------------------------------

addDataGet(
  'Releer cita para cancelar LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $json.operacionLab026.appointment_id }}'],
    ['clinic_id', '={{ $json.operacionLab026.clinic_id }}'],
  ],
  [672, 5360],
  { limit: 1 },
);
connect('Enrutar paso gestión cita LAB-026', 'Releer cita para cancelar LAB-026', 5);
addCode(
  'Preparar bloqueo cancelación LAB-026',
  `const origen = $("Consolidar intención gestión cita LAB-026").first().json;
const op = { ...origen.operacionLab026 };
const cita = $json || {};
const valida = cita.appointment_id === op.appointment_id && cita.clinic_id === op.clinic_id
  && cita.estado === "confirmada" && Number(cita.version || 0) === Number(op.cita_version || 0)
  && cita.event_id && cita.calendar_id && new Date(cita.start_time) > new Date();
return { json: { ...origen, operacionLab026: op, citaLab026: cita, bloqueoPreparadoLab026: valida,
  lab026FailureCode: valida ? "" : "cita_cancelacion_no_modificable",
  versionBloqueoLab026: Number(cita.version || 0) + 1, updatedAtLab026: new Date().toISOString() } };`,
  [896, 5360],
);
addIf('Puede bloquear cancelación LAB-026', '={{ $json.bloqueoPreparadoLab026 === true }}', [1120, 5360]);
connect('Releer cita para cancelar LAB-026', 'Preparar bloqueo cancelación LAB-026', 0);
connect('Releer cita para cancelar LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Preparar bloqueo cancelación LAB-026', 'Puede bloquear cancelación LAB-026');

addDataWrite(
  'Adquirir bloqueo cancelación LAB-026',
  'update',
  'lab026_citas',
  citasColumns,
  {
    estado: 'cancelacion_en_curso',
    version: '={{ $json.versionBloqueoLab026 }}',
    last_operation_id: '={{ $json.operacionLab026.operation_id }}',
    updated_at: '={{ $json.updatedAtLab026 }}',
  },
  [1344, 5280],
  [
    ['appointment_id', '={{ $json.citaLab026.appointment_id }}'],
    ['clinic_id', '={{ $json.citaLab026.clinic_id }}'],
    ['estado', 'confirmada'],
    ['version', '={{ $json.citaLab026.version }}'],
  ],
);
connect('Puede bloquear cancelación LAB-026', 'Adquirir bloqueo cancelación LAB-026', 0);
connect('Puede bloquear cancelación LAB-026', 'Preparar revisión humana LAB-026', 1);
addDataGet(
  'Verificar bloqueo cancelación LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $("Preparar bloqueo cancelación LAB-026").first().json.citaLab026.appointment_id }}'],
    ['clinic_id', '={{ $("Preparar bloqueo cancelación LAB-026").first().json.citaLab026.clinic_id }}'],
  ],
  [1568, 5280],
  { limit: 1 },
);
connect('Adquirir bloqueo cancelación LAB-026', 'Verificar bloqueo cancelación LAB-026', 0);
connect('Adquirir bloqueo cancelación LAB-026', 'Preparar revisión humana LAB-026', 1);
addCode(
  'Consolidar bloqueo cancelación LAB-026',
  `const origen = $("Preparar bloqueo cancelación LAB-026").first().json;
const fila = $json || {};
const ok = fila.estado === "cancelacion_en_curso" && fila.last_operation_id === origen.operacionLab026.operation_id
  && Number(fila.version || 0) === Number(origen.versionBloqueoLab026);
return { json: { ...origen, citaBloqueadaLab026: fila, bloqueoCancelacionValidoLab026: ok,
  lab026FailureCode: ok ? "" : "bloqueo_cancelacion_no_adquirido" } };`,
  [1792, 5280],
);
addIf('Bloqueo cancelación válido LAB-026', '={{ $json.bloqueoCancelacionValidoLab026 === true }}', [2016, 5280]);
connect('Verificar bloqueo cancelación LAB-026', 'Consolidar bloqueo cancelación LAB-026', 0);
connect('Verificar bloqueo cancelación LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar bloqueo cancelación LAB-026', 'Bloqueo cancelación válido LAB-026');
connect('Bloqueo cancelación válido LAB-026', 'Obtener evento antes de cancelar LAB-026', 0);
connect('Bloqueo cancelación válido LAB-026', 'Preparar revisión humana LAB-026', 1);

addCalendar(
  'Obtener evento antes de cancelar LAB-026',
  {
    operation: 'get',
    calendar: calendarIdExpression('={{ $json.citaBloqueadaLab026.calendar_id }}'),
    eventId: '={{ $json.citaBloqueadaLab026.event_id }}',
    options: {
      timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' },
    },
  },
  [2240, 5200],
);
connect('Obtener evento antes de cancelar LAB-026', 'Consolidar evento antes de cancelar LAB-026', 0);
connect('Obtener evento antes de cancelar LAB-026', 'Preparar revisión humana LAB-026', 1);
addCode(
  'Consolidar evento antes de cancelar LAB-026',
  `const origen = $("Consolidar bloqueo cancelación LAB-026").first().json;
const evento = $json || {};
const mismoInstante = (a, b) => a && b && new Date(a).getTime() === new Date(b).getTime();
const valido = String(evento.id || "") === String(origen.citaBloqueadaLab026.event_id || "")
  && evento.status !== "cancelled"
  && mismoInstante(evento.start?.dateTime || "", origen.citaBloqueadaLab026.start_time)
  && mismoInstante(evento.end?.dateTime || "", origen.citaBloqueadaLab026.end_time);
return { json: { ...origen, eventoOriginalCancelacionLab026: evento, eventoOriginalCancelacionValidoLab026: valido,
  lab026FailureCode: valido ? "" : "evento_calendar_no_coincide_con_cita" } };`,
  [2464, 4992],
);
addIf(
  'Evento original cancelación válido LAB-026',
  '={{ $json.eventoOriginalCancelacionValidoLab026 === true }}',
  [2688, 4992],
);
connect('Consolidar evento antes de cancelar LAB-026', 'Evento original cancelación válido LAB-026');
connect('Evento original cancelación válido LAB-026', 'Eliminar evento confirmado LAB-026', 0);
connect('Evento original cancelación válido LAB-026', 'Preparar revisión humana LAB-026', 1);
addCalendar(
  'Eliminar evento confirmado LAB-026',
  {
    operation: 'delete',
    calendar: calendarIdExpression(
      '={{ $("Consolidar bloqueo cancelación LAB-026").first().json.citaBloqueadaLab026.calendar_id }}',
    ),
    eventId:
      '={{ $("Consolidar bloqueo cancelación LAB-026").first().json.citaBloqueadaLab026.event_id }}',
    options: { sendUpdates: 'none' },
  },
  [2464, 5200],
);
connect('Eliminar evento confirmado LAB-026', 'Verificar ausencia evento cancelado LAB-026', 0);
connect('Eliminar evento confirmado LAB-026', 'Preparar revisión humana LAB-026', 1);
addCalendar(
  'Verificar ausencia evento cancelado LAB-026',
  {
    operation: 'getAll',
    calendar: calendarIdExpression(
      '={{ $("Consolidar bloqueo cancelación LAB-026").first().json.citaBloqueadaLab026.calendar_id }}',
    ),
    returnAll: true,
    timeMin:
      '={{ DateTime.fromISO($("Consolidar bloqueo cancelación LAB-026").first().json.citaBloqueadaLab026.start_time).minus({ minutes: 1 }).toISO() }}',
    timeMax:
      '={{ DateTime.fromISO($("Consolidar bloqueo cancelación LAB-026").first().json.citaBloqueadaLab026.end_time).plus({ minutes: 1 }).toISO() }}',
    options: {
      timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' },
    },
  },
  [2688, 5200],
  { alwaysOutputData: true },
);
addCode(
  'Consolidar ausencia evento cancelado LAB-026',
  `const origen = $("Consolidar bloqueo cancelación LAB-026").first().json;
const eventId = origen.citaBloqueadaLab026.event_id;
const existe = $input.all().some((item) => String(item.json?.id || "") === eventId && item.json?.status !== "cancelled");
return { json: { ...origen, eventoCanceladoVerificadoLab026: !existe,
  lab026FailureCode: existe ? "evento_cancelado_aun_presente" : "" } };`,
  [2912, 5200],
  'runOnceForAllItems',
);
addIf('Evento cancelado ausente LAB-026', '={{ $json.eventoCanceladoVerificadoLab026 === true }}', [3136, 5200]);
connect('Verificar ausencia evento cancelado LAB-026', 'Consolidar ausencia evento cancelado LAB-026', 0);
connect('Verificar ausencia evento cancelado LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar ausencia evento cancelado LAB-026', 'Evento cancelado ausente LAB-026');
connect('Evento cancelado ausente LAB-026', 'Persistir cita cancelada LAB-026', 0);
connect('Evento cancelado ausente LAB-026', 'Preparar revisión humana LAB-026', 1);

addDataWrite(
  'Persistir cita cancelada LAB-026',
  'update',
  'lab026_citas',
  citasColumns,
  {
    estado: 'cancelada',
    version: '={{ Number($json.citaBloqueadaLab026.version || 0) + 1 }}',
    last_operation_id: '={{ $json.operacionLab026.operation_id }}',
    updated_at: '={{ new Date().toISOString() }}',
  },
  [3360, 5120],
  [
    ['appointment_id', '={{ $json.citaBloqueadaLab026.appointment_id }}'],
    ['clinic_id', '={{ $json.citaBloqueadaLab026.clinic_id }}'],
    ['estado', 'cancelacion_en_curso'],
    ['version', '={{ $json.citaBloqueadaLab026.version }}'],
  ],
);
addDataGet(
  'Verificar cita cancelada persistida LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $("Consolidar bloqueo cancelación LAB-026").first().json.citaBloqueadaLab026.appointment_id }}'],
    ['clinic_id', '={{ $("Consolidar bloqueo cancelación LAB-026").first().json.citaBloqueadaLab026.clinic_id }}'],
  ],
  [3584, 5120],
  { limit: 1 },
);
connect('Persistir cita cancelada LAB-026', 'Verificar cita cancelada persistida LAB-026', 0);
connect('Persistir cita cancelada LAB-026', 'Preparar revisión humana LAB-026', 1);
addCode(
  'Cerrar cancelación LAB-026',
  `const origen = $("Consolidar bloqueo cancelación LAB-026").first().json;
const cita = $json || {};
const ok = cita.estado === "cancelada" && cita.last_operation_id === origen.operacionLab026.operation_id;
const op = { ...origen.operacionLab026 };
op.estado = ok ? "completada" : "requiere_revision";
op.respuesta_publica = ok
  ? "La cita fue cancelada correctamente y el horario quedó liberado."
  : "No pude verificar completamente la cancelación. La clínica revisará la solicitud.";
op.updated_at = new Date().toISOString();
return { json: { ...origen, citaLab026: cita, operacionLab026: op, cancelacionCompletadaLab026: ok,
  auditoriaLab026: { audit_id: "aud_" + op.operation_id + "_cancelar_ok", operation_id: op.operation_id,
    appointment_id: op.appointment_id, clinic_id: op.clinic_id, session_id: op.session_id,
    accion: "cancelar", resultado: ok ? "completada" : "fallida", estado_anterior: "confirmada",
    estado_nuevo: ok ? "cancelada" : "requiere_revision", start_time_anterior: origen.citaLab026.start_time || "",
    start_time_nuevo: "", detalle_sanitizado: ok ? "Calendar y persistencia verificados" : "Persistencia final no verificada",
    fecha_hora: new Date().toISOString() } } };`,
  [3808, 5120],
);
connect('Verificar cita cancelada persistida LAB-026', 'Cerrar cancelación LAB-026', 0);
connect('Verificar cita cancelada persistida LAB-026', 'Preparar revisión humana LAB-026', 1);

const auditoriaValues = Object.fromEntries(
  auditoriaColumns.map(([field]) => [field, `={{ $json.auditoriaLab026.${field} }}`]),
);
addDataWrite(
  'Registrar auditoría exitosa LAB-026',
  'upsert',
  'lab026_auditoria_citas',
  auditoriaColumns,
  auditoriaValues,
  [4032, 5120],
  [['audit_id', '={{ $json.auditoriaLab026.audit_id }}']],
);
connect('Cerrar cancelación LAB-026', 'Registrar auditoría exitosa LAB-026');
addCode(
  'Recuperar operación completada LAB-026',
  `const candidatos = ["Cerrar cancelación LAB-026", "Cerrar reprogramación LAB-026"];
for (const nombre of candidatos) {
  try { const ref = $(nombre); if (ref.isExecuted) return { json: ref.first().json }; } catch {}
}
throw new Error("No fue posible recuperar la operación completada.");`,
  [4256, 5120],
);
connect('Registrar auditoría exitosa LAB-026', 'Recuperar operación completada LAB-026', 0);
connect('Registrar auditoría exitosa LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Recuperar operación completada LAB-026', 'Guardar operación y respuesta LAB-026');

// -----------------------------------------------------------------------------
// Preparación y alternativas de reprogramación
// -----------------------------------------------------------------------------

addCode(
  'Interpretar nuevo horario LAB-026',
  `const origen = $json;
const op = { ...origen.operacionLab026 };
let cita = {};
try { cita = JSON.parse(op.cita_seleccionada_json || "{}"); } catch {}
const DateTime = $now.constructor;
const zona = "America/Santiago";
const ahora = $now.setZone(zona);
const normalizar = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[,.;]/g, " ").replace(/\\s+/g, " ").trim();
const texto = normalizar(origen.message);
const meses = { enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6, julio:7, agosto:8, septiembre:9, setiembre:9, octubre:10, noviembre:11, diciembre:12 };
const dias = { lunes:1, martes:2, miercoles:3, jueves:4, viernes:5, sabado:6, domingo:7 };
let fecha = String(op.fecha_pendiente || "");
let hora = String(op.hora_pendiente || "");
if (/\\bpasado manana\\b/.test(texto)) fecha = ahora.plus({ days: 2 }).toISODate();
else if (/\\bmanana\\b/.test(texto)) fecha = ahora.plus({ days: 1 }).toISODate();
else if (/\\bhoy\\b/.test(texto)) fecha = ahora.toISODate();
const explicita = texto.match(/\\b(\\d{1,2})[\\/-](\\d{1,2})(?:[\\/-](\\d{2,4}))?\\b/);
if (explicita) {
  let ano = explicita[3] ? Number(explicita[3]) : ahora.year;
  if (ano < 100) ano += 2000;
  const f = DateTime.fromObject({ year: ano, month: Number(explicita[2]), day: Number(explicita[1]) }, { zone: zona });
  if (f.isValid) fecha = f.toISODate();
}
const textual = texto.match(/\\b(\\d{1,2})\\s+de\\s+([a-z]+)(?:\\s+de\\s+(\\d{4}))?\\b/);
if (textual && meses[textual[2]]) {
  let ano = textual[3] ? Number(textual[3]) : ahora.year;
  let f = DateTime.fromObject({ year: ano, month: meses[textual[2]], day: Number(textual[1]) }, { zone: zona });
  if (f < ahora.startOf("day") && !textual[3]) f = f.plus({ years: 1 });
  if (f.isValid) fecha = f.toISODate();
}
for (const [nombre, weekday] of Object.entries(dias)) {
  if (new RegExp("\\\\b" + nombre + "\\\\b").test(texto)) {
    let delta = (weekday - ahora.weekday + 7) % 7;
    if (delta === 0) delta = 7;
    fecha = ahora.plus({ days: delta }).toISODate();
    break;
  }
}
let hm = texto.match(/\\b(?:a|para)?\\s*las?\\s*(\\d{1,2})(?::(\\d{2}))?(?:\\s*(am|pm)|\\s+de\\s+la\\s+(manana|tarde|noche))?\\b/);
if (!hm) hm = texto.match(/\\b(\\d{1,2}):(\\d{2})\\b/);
if (hm) {
  let h = Number(hm[1]); const m = Number(hm[2] || 0); const periodo = hm[3] || hm[4] || "";
  if ((periodo === "pm" || periodo === "tarde" || periodo === "noche") && h < 12) h += 12;
  if ((periodo === "am" || periodo === "manana") && h === 12) h = 0;
  if (h <= 23 && m <= 59) hora = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
op.fecha_pendiente = fecha;
op.hora_pendiente = hora;
op.updated_at = new Date().toISOString();
let completo = false;
if (fecha && hora) {
  const [hour, minute] = hora.split(":").map(Number);
  const inicio = DateTime.fromISO(fecha, { zone: zona }).set({ hour, minute, second: 0, millisecond: 0 });
  const duracion = Number(cita.duracion_minutos || 30);
  if (inicio.isValid && inicio > ahora) {
    op.nuevo_start_time = inicio.toISO();
    op.nuevo_end_time = inicio.plus({ minutes: duracion }).toISO();
    completo = true;
  } else {
    op.respuesta_publica = "El nuevo horario debe ser una fecha y hora futura. Indícame otra opción.";
  }
}
if (!completo && !op.respuesta_publica) {
  op.respuesta_publica = !fecha ? "¿Para qué fecha deseas cambiar la cita?" : "¿A qué hora deseas cambiar la cita?";
}
op.estado = "esperando_nuevo_horario";
return { json: { ...origen, operacionLab026: op, nuevoHorarioCompletoLab026: completo } };`,
  [672, 4912],
);
addIf('Nuevo horario completo LAB-026', '={{ $json.nuevoHorarioCompletoLab026 === true }}', [896, 4912]);
connect('Enrutar paso gestión cita LAB-026', 'Interpretar nuevo horario LAB-026', 3);
connect('Interpretar nuevo horario LAB-026', 'Nuevo horario completo LAB-026');
connect('Nuevo horario completo LAB-026', 'Buscar eventos para reprogramar LAB-026', 0);
connect('Nuevo horario completo LAB-026', 'Guardar operación y respuesta LAB-026', 1);

addCalendar(
  'Buscar eventos para reprogramar LAB-026',
  {
    operation: 'getAll',
    calendar: calendarIdExpression(
      '={{ JSON.parse($json.operacionLab026.cita_seleccionada_json || "{}").calendar_id }}',
    ),
    returnAll: true,
    timeMin: '={{ DateTime.fromISO($json.operacionLab026.nuevo_start_time).startOf("day").toISO() }}',
    timeMax:
      '={{ DateTime.fromISO($json.operacionLab026.nuevo_start_time).startOf("day").plus({ days: 7 }).toISO() }}',
    options: {
      timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' },
    },
  },
  [1120, 4832],
  { alwaysOutputData: true },
);
connect('Buscar eventos para reprogramar LAB-026', 'Generar alternativas reprogramación LAB-026', 0);
connect('Buscar eventos para reprogramar LAB-026', 'Preparar revisión humana LAB-026', 1);

addCode(
  'Generar alternativas reprogramación LAB-026',
  `const origen = $("Interpretar nuevo horario LAB-026").first().json;
const op = { ...origen.operacionLab026 };
let cita = {}; try { cita = JSON.parse(op.cita_seleccionada_json || "{}"); } catch {}
const DateTime = $now.constructor; const zona = "America/Santiago";
const eventos = $input.all().map((i) => i.json || {}).filter((e) => e.id && e.id !== cita.event_id && e.status !== "cancelled").map((e) => ({
  inicio: DateTime.fromISO(e.start?.dateTime || e.start?.date || "", { zone: zona }),
  fin: DateTime.fromISO(e.end?.dateTime || e.end?.date || "", { zone: zona })
})).filter((e) => e.inicio.isValid && e.fin.isValid);
const horarios = { 1:["09:00","18:30"], 2:["09:00","18:30"], 3:["09:00","18:30"], 4:["09:00","18:30"], 5:["09:00","18:30"], 6:["10:00","14:00"] };
const duracion = Number(cita.duracion_minutos || 30); const intervalo = 30;
const deseado = DateTime.fromISO(op.nuevo_start_time, { zone: zona });
const colisiona = (inicio, fin) => eventos.some((e) => inicio < e.fin && fin > e.inicio);
const dentroJornada = (inicio, fin) => {
  const jornada = horarios[inicio.weekday]; if (!jornada) return false;
  const [ah, am] = jornada[0].split(":").map(Number); const [ch, cm] = jornada[1].split(":").map(Number);
  const apertura = inicio.startOf("day").set({ hour: ah, minute: am }); const cierre = inicio.startOf("day").set({ hour: ch, minute: cm });
  return inicio >= apertura && fin <= cierre && inicio.minute % intervalo === 0;
};
const opciones = [];
let cursor = deseado;
for (let intentos = 0; intentos < 7 * 48 && opciones.length < 3; intentos += 1) {
  const fin = cursor.plus({ minutes: duracion });
  if (cursor > $now.setZone(zona) && dentroJornada(cursor, fin) && !colisiona(cursor, fin)) {
    opciones.push({ numero: opciones.length + 1, inicio: cursor.toISO(), fin: fin.toISO() });
  }
  cursor = cursor.plus({ minutes: intervalo });
}
op.opciones_horarios_json = JSON.stringify(opciones);
op.updated_at = new Date().toISOString();
const formato = (iso) => new Intl.DateTimeFormat("es-CL", { timeZone: zona, dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
const deseadoDisponible = opciones.length && opciones[0].inicio === deseado.toISO();
if (deseadoDisponible) {
  op.nuevo_start_time = opciones[0].inicio; op.nuevo_end_time = opciones[0].fin;
  op.estado = "esperando_confirmacion_reprogramacion";
  op.respuesta_publica = "El horario del " + formato(op.nuevo_start_time) + " está disponible. ¿Confirmas que deseas cambiar la cita a ese horario?";
} else if (opciones.length) {
  op.estado = "esperando_seleccion_horario";
  const lista = opciones.map((o) => "Horario " + o.numero + ": " + formato(o.inicio)).join("\\n");
  op.respuesta_publica = "Ese horario no está disponible. Encontré estas alternativas:\\n" + lista + "\\n¿Cuál prefieres?";
} else {
  op.estado = "esperando_nuevo_horario";
  op.respuesta_publica = "No encontré horarios disponibles en los próximos días desde esa fecha. Indícame otra fecha u hora.";
}
return { json: { ...origen, operacionLab026: op } };`,
  [1344, 4832],
  'runOnceForAllItems',
);
connect('Generar alternativas reprogramación LAB-026', 'Guardar operación y respuesta LAB-026');

addCode(
  'Resolver selección horario LAB-026',
  `const origen = $json; const op = { ...origen.operacionLab026 };
let opciones = []; try { opciones = JSON.parse(op.opciones_horarios_json || "[]"); } catch {}
const numero = Number(op.seleccion_numero || 0); const opcion = opciones.find((o) => Number(o.numero) === numero);
if (!opcion) {
  op.respuesta_publica = "Esa opción no corresponde a un horario de la lista. Indícame un número válido.";
} else {
  op.nuevo_start_time = opcion.inicio; op.nuevo_end_time = opcion.fin; op.estado = "esperando_confirmacion_reprogramacion";
  const fecha = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "long", timeStyle: "short" }).format(new Date(opcion.inicio));
  op.respuesta_publica = "¿Confirmas que deseas cambiar la cita al " + fecha + "?";
}
op.updated_at = new Date().toISOString();
return { json: { ...origen, operacionLab026: op } };`,
  [672, 5136],
);
connect('Enrutar paso gestión cita LAB-026', 'Resolver selección horario LAB-026', 4);
connect('Resolver selección horario LAB-026', 'Guardar operación y respuesta LAB-026');

// -----------------------------------------------------------------------------
// Reprogramación: revalidar, bloquear, reservar temporalmente y actualizar evento
// -----------------------------------------------------------------------------

addDataGet(
  'Releer cita para reprogramar LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $json.operacionLab026.appointment_id }}'],
    ['clinic_id', '={{ $json.operacionLab026.clinic_id }}'],
  ],
  [672, 5808],
  { limit: 1 },
);
connect('Enrutar paso gestión cita LAB-026', 'Releer cita para reprogramar LAB-026', 6);
addCode(
  'Preparar revalidación reprogramación LAB-026',
  `const origen = $("Consolidar intención gestión cita LAB-026").first().json;
const op = { ...origen.operacionLab026 }; const cita = $json || {};
const valida = cita.appointment_id === op.appointment_id && cita.clinic_id === op.clinic_id && cita.estado === "confirmada"
  && Number(cita.version || 0) === Number(op.cita_version || 0) && cita.event_id && cita.calendar_id
  && op.nuevo_start_time && op.nuevo_end_time && new Date(op.nuevo_start_time) > new Date();
return { json: { ...origen, operacionLab026: op, citaLab026: cita, reprogramacionPreparadaLab026: valida,
  lab026FailureCode: valida ? "" : "cita_reprogramacion_no_modificable" } };`,
  [896, 5808],
);
addIf('Puede revalidar reprogramación LAB-026', '={{ $json.reprogramacionPreparadaLab026 === true }}', [1120, 5808]);
connect('Releer cita para reprogramar LAB-026', 'Preparar revalidación reprogramación LAB-026', 0);
connect('Releer cita para reprogramar LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Preparar revalidación reprogramación LAB-026', 'Puede revalidar reprogramación LAB-026');
connect('Puede revalidar reprogramación LAB-026', 'Revalidar eventos nuevo horario LAB-026', 0);
connect('Puede revalidar reprogramación LAB-026', 'Preparar revisión humana LAB-026', 1);

addCalendar(
  'Revalidar eventos nuevo horario LAB-026',
  {
    operation: 'getAll',
    calendar: calendarIdExpression('={{ $json.citaLab026.calendar_id }}'),
    returnAll: true,
    timeMin: '={{ $json.operacionLab026.nuevo_start_time }}',
    timeMax: '={{ $json.operacionLab026.nuevo_end_time }}',
    options: { timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' } },
  },
  [1344, 5728],
  { alwaysOutputData: true },
);
addCode(
  'Consolidar revalidación reprogramación LAB-026',
  `const origen = $("Preparar revalidación reprogramación LAB-026").first().json;
const originalId = origen.citaLab026.event_id;
const conflicto = $input.all().some((i) => i.json?.id && i.json.id !== originalId && i.json.status !== "cancelled");
const op = { ...origen.operacionLab026 };
if (conflicto) {
  op.estado = "esperando_nuevo_horario";
  op.respuesta_publica = "Ese horario acaba de ocuparse. La cita original se mantiene sin cambios; indícame otra fecha u hora.";
  op.updated_at = new Date().toISOString();
}
return { json: { ...origen, operacionLab026: op, nuevoHorarioLibreLab026: !conflicto } };`,
  [1568, 5728],
  'runOnceForAllItems',
);
addIf('Nuevo horario sigue libre LAB-026', '={{ $json.nuevoHorarioLibreLab026 === true }}', [1792, 5728]);
connect('Revalidar eventos nuevo horario LAB-026', 'Consolidar revalidación reprogramación LAB-026', 0);
connect('Revalidar eventos nuevo horario LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar revalidación reprogramación LAB-026', 'Nuevo horario sigue libre LAB-026');
connect('Nuevo horario sigue libre LAB-026', 'Adquirir bloqueo reprogramación LAB-026', 0);
connect('Nuevo horario sigue libre LAB-026', 'Guardar operación y respuesta LAB-026', 1);

addDataWrite(
  'Adquirir bloqueo reprogramación LAB-026',
  'update',
  'lab026_citas',
  citasColumns,
  {
    estado: 'reprogramacion_en_curso',
    version: '={{ Number($json.citaLab026.version || 0) + 1 }}',
    last_operation_id: '={{ $json.operacionLab026.operation_id }}',
    updated_at: '={{ new Date().toISOString() }}',
  },
  [2016, 5648],
  [
    ['appointment_id', '={{ $json.citaLab026.appointment_id }}'],
    ['clinic_id', '={{ $json.citaLab026.clinic_id }}'],
    ['estado', 'confirmada'],
    ['version', '={{ $json.citaLab026.version }}'],
  ],
);
addDataGet(
  'Verificar bloqueo reprogramación LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $("Preparar revalidación reprogramación LAB-026").first().json.citaLab026.appointment_id }}'],
    ['clinic_id', '={{ $("Preparar revalidación reprogramación LAB-026").first().json.citaLab026.clinic_id }}'],
  ],
  [2240, 5648],
  { limit: 1 },
);
connect('Adquirir bloqueo reprogramación LAB-026', 'Verificar bloqueo reprogramación LAB-026', 0);
connect('Adquirir bloqueo reprogramación LAB-026', 'Preparar revisión humana LAB-026', 1);
addCode(
  'Consolidar bloqueo reprogramación LAB-026',
  `const origen = $("Preparar revalidación reprogramación LAB-026").first().json; const fila = $json || {};
const versionEsperada = Number(origen.citaLab026.version || 0) + 1;
const ok = fila.estado === "reprogramacion_en_curso" && fila.last_operation_id === origen.operacionLab026.operation_id
  && Number(fila.version || 0) === versionEsperada;
return { json: { ...origen, citaBloqueadaLab026: fila, bloqueoReprogramacionValidoLab026: ok,
  lab026FailureCode: ok ? "" : "bloqueo_reprogramacion_no_adquirido" } };`,
  [2464, 5648],
);
addIf('Bloqueo reprogramación válido LAB-026', '={{ $json.bloqueoReprogramacionValidoLab026 === true }}', [2688, 5648]);
connect('Verificar bloqueo reprogramación LAB-026', 'Consolidar bloqueo reprogramación LAB-026', 0);
connect('Verificar bloqueo reprogramación LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar bloqueo reprogramación LAB-026', 'Bloqueo reprogramación válido LAB-026');
connect('Bloqueo reprogramación válido LAB-026', 'Obtener evento original antes de reprogramar LAB-026', 0);
connect('Bloqueo reprogramación válido LAB-026', 'Preparar revisión humana LAB-026', 1);

addCalendar(
  'Obtener evento original antes de reprogramar LAB-026',
  {
    operation: 'get',
    calendar: calendarIdExpression('={{ $json.citaBloqueadaLab026.calendar_id }}'),
    eventId: '={{ $json.citaBloqueadaLab026.event_id }}',
    options: { timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' } },
  },
  [2912, 5792],
);
addCode(
  'Consolidar evento original reprogramación LAB-026',
  `const origen = $("Consolidar bloqueo reprogramación LAB-026").first().json;
const evento = $json || {};
const mismoInstante = (a, b) => a && b && new Date(a).getTime() === new Date(b).getTime();
const valido = String(evento.id || "") === String(origen.citaBloqueadaLab026.event_id || "")
  && evento.status !== "cancelled"
  && mismoInstante(evento.start?.dateTime || "", origen.citaBloqueadaLab026.start_time)
  && mismoInstante(evento.end?.dateTime || "", origen.citaBloqueadaLab026.end_time);
return { json: { ...origen, eventoOriginalReprogramacionLab026: evento, eventoOriginalReprogramacionValidoLab026: valido,
  lab026FailureCode: valido ? "" : "evento_calendar_no_coincide_con_cita" } };`,
  [3136, 5792],
);
addIf(
  'Evento original reprogramación válido LAB-026',
  '={{ $json.eventoOriginalReprogramacionValidoLab026 === true }}',
  [3360, 5792],
);
connect('Obtener evento original antes de reprogramar LAB-026', 'Consolidar evento original reprogramación LAB-026', 0);
connect('Obtener evento original antes de reprogramar LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar evento original reprogramación LAB-026', 'Evento original reprogramación válido LAB-026');
connect('Evento original reprogramación válido LAB-026', 'Crear bloqueo temporal reprogramación LAB-026', 0);
connect('Evento original reprogramación válido LAB-026', 'Preparar revisión humana LAB-026', 1);

addCalendar(
  'Crear bloqueo temporal reprogramación LAB-026',
  {
    calendar: calendarIdExpression('={{ $json.citaBloqueadaLab026.calendar_id }}'),
    start: '={{ $json.operacionLab026.nuevo_start_time }}',
    end: '={{ $json.operacionLab026.nuevo_end_time }}',
    useDefaultReminders: false,
    additionalFields: {
      summary: 'Bloqueo temporal VetAtiende LAB-026',
      description: 'Bloqueo técnico temporal sin datos personales. Se elimina al completar la reprogramación.',
      showMeAs: 'opaque',
    },
  },
  [2912, 5568],
);
addCode(
  'Consolidar bloqueo temporal LAB-026',
  `const origen = $("Consolidar bloqueo reprogramación LAB-026").first().json;
const holdId = String($json.id || "").trim();
return { json: { ...origen, holdEventIdLab026: holdId, holdCreadoLab026: Boolean(holdId),
  lab026FailureCode: holdId ? "" : "bloqueo_temporal_sin_id" } };`,
  [3136, 5568],
);
addIf('Bloqueo temporal creado LAB-026', '={{ $json.holdCreadoLab026 === true }}', [3360, 5568]);
connect('Crear bloqueo temporal reprogramación LAB-026', 'Consolidar bloqueo temporal LAB-026', 0);
connect('Crear bloqueo temporal reprogramación LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar bloqueo temporal LAB-026', 'Bloqueo temporal creado LAB-026');
connect('Bloqueo temporal creado LAB-026', 'Verificar bloqueo temporal LAB-026', 0);
connect('Bloqueo temporal creado LAB-026', 'Preparar revisión humana LAB-026', 1);
addCalendar(
  'Verificar bloqueo temporal LAB-026',
  {
    operation: 'get',
    calendar: calendarIdExpression('={{ $json.citaBloqueadaLab026.calendar_id }}'),
    eventId: '={{ $json.holdEventIdLab026 }}',
    options: { timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' } },
  },
  [3584, 5568],
);
connect('Verificar bloqueo temporal LAB-026', 'Actualizar evento original LAB-026', 0);
connect('Verificar bloqueo temporal LAB-026', 'Preparar revisión humana LAB-026', 1);

addCalendar(
  'Actualizar evento original LAB-026',
  {
    operation: 'update',
    calendar: calendarIdExpression(
      '={{ $("Consolidar bloqueo temporal LAB-026").first().json.citaBloqueadaLab026.calendar_id }}',
    ),
    eventId:
      '={{ $("Consolidar bloqueo temporal LAB-026").first().json.citaBloqueadaLab026.event_id }}',
    useDefaultReminders: true,
    updateFields: {
      start:
        '={{ $("Consolidar bloqueo temporal LAB-026").first().json.operacionLab026.nuevo_start_time }}',
      end: '={{ $("Consolidar bloqueo temporal LAB-026").first().json.operacionLab026.nuevo_end_time }}',
      timezone: 'America/Santiago',
      sendUpdates: 'none',
    },
  },
  [3808, 5568],
);
connect('Actualizar evento original LAB-026', 'Verificar evento reprogramado LAB-026', 0);
connect('Actualizar evento original LAB-026', 'Eliminar bloqueo tras fallo actualización LAB-026', 1);
addCalendar(
  'Eliminar bloqueo tras fallo actualización LAB-026',
  {
    operation: 'delete',
    calendar: calendarIdExpression(
      '={{ $("Consolidar bloqueo temporal LAB-026").first().json.citaBloqueadaLab026.calendar_id }}',
    ),
    eventId: '={{ $("Consolidar bloqueo temporal LAB-026").first().json.holdEventIdLab026 }}',
    options: { sendUpdates: 'none' },
  },
  [4032, 5792],
  { onError: 'continueRegularOutput' },
);
connect('Eliminar bloqueo tras fallo actualización LAB-026', 'Preparar revisión humana LAB-026');

addCalendar(
  'Verificar evento reprogramado LAB-026',
  {
    operation: 'get',
    calendar: calendarIdExpression(
      '={{ $("Consolidar bloqueo temporal LAB-026").first().json.citaBloqueadaLab026.calendar_id }}',
    ),
    eventId:
      '={{ $("Consolidar bloqueo temporal LAB-026").first().json.citaBloqueadaLab026.event_id }}',
    options: { timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' } },
  },
  [4032, 5488],
);
addCode(
  'Consolidar evento reprogramado LAB-026',
  `const origen = $("Consolidar bloqueo temporal LAB-026").first().json;
const inicio = String($json.start?.dateTime || ""); const fin = String($json.end?.dateTime || "");
const mismoInstante = (a, b) => a && b && new Date(a).getTime() === new Date(b).getTime();
const ok = String($json.id || "") === origen.citaBloqueadaLab026.event_id
  && mismoInstante(inicio, origen.operacionLab026.nuevo_start_time)
  && mismoInstante(fin, origen.operacionLab026.nuevo_end_time);
return { json: { ...origen, eventoReprogramadoLab026: $json, eventoReprogramadoVerificadoLab026: ok,
  lab026FailureCode: ok ? "" : "evento_reprogramado_no_verificado" } };`,
  [4256, 5488],
);
addIf('Evento reprogramado válido LAB-026', '={{ $json.eventoReprogramadoVerificadoLab026 === true }}', [4480, 5488]);
connect('Verificar evento reprogramado LAB-026', 'Consolidar evento reprogramado LAB-026', 0);
connect('Verificar evento reprogramado LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar evento reprogramado LAB-026', 'Evento reprogramado válido LAB-026');
connect('Evento reprogramado válido LAB-026', 'Eliminar bloqueo temporal LAB-026', 0);
connect('Evento reprogramado válido LAB-026', 'Preparar revisión humana LAB-026', 1);

addCalendar(
  'Eliminar bloqueo temporal LAB-026',
  {
    operation: 'delete',
    calendar: calendarIdExpression('={{ $json.citaBloqueadaLab026.calendar_id }}'),
    eventId: '={{ $json.holdEventIdLab026 }}',
    options: { sendUpdates: 'none' },
  },
  [4704, 5408],
);
connect('Eliminar bloqueo temporal LAB-026', 'Verificar ausencia bloqueo temporal LAB-026', 0);
connect('Eliminar bloqueo temporal LAB-026', 'Preparar revisión humana LAB-026', 1);
addCalendar(
  'Verificar ausencia bloqueo temporal LAB-026',
  {
    operation: 'getAll',
    calendar: calendarIdExpression(
      '={{ $("Consolidar evento reprogramado LAB-026").first().json.citaBloqueadaLab026.calendar_id }}',
    ),
    returnAll: true,
    timeMin:
      '={{ $("Consolidar evento reprogramado LAB-026").first().json.operacionLab026.nuevo_start_time }}',
    timeMax: '={{ $("Consolidar evento reprogramado LAB-026").first().json.operacionLab026.nuevo_end_time }}',
    options: { timeZone: { __rl: true, value: 'America/Santiago', mode: 'id' } },
  },
  [4928, 5408],
  { alwaysOutputData: true },
);
addCode(
  'Consolidar ausencia bloqueo temporal LAB-026',
  `const origen = $("Consolidar evento reprogramado LAB-026").first().json;
const existeHold = $input.all().some((i) => String(i.json?.id || "") === origen.holdEventIdLab026 && i.json?.status !== "cancelled");
return { json: { ...origen, holdEliminadoVerificadoLab026: !existeHold,
  lab026FailureCode: existeHold ? "bloqueo_temporal_no_eliminado" : "" } };`,
  [5152, 5408],
  'runOnceForAllItems',
);
addIf('Bloqueo temporal ausente LAB-026', '={{ $json.holdEliminadoVerificadoLab026 === true }}', [5376, 5408]);
connect('Verificar ausencia bloqueo temporal LAB-026', 'Consolidar ausencia bloqueo temporal LAB-026', 0);
connect('Verificar ausencia bloqueo temporal LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Consolidar ausencia bloqueo temporal LAB-026', 'Bloqueo temporal ausente LAB-026');
connect('Bloqueo temporal ausente LAB-026', 'Persistir cita reprogramada LAB-026', 0);
connect('Bloqueo temporal ausente LAB-026', 'Preparar revisión humana LAB-026', 1);

addDataWrite(
  'Persistir cita reprogramada LAB-026',
  'update',
  'lab026_citas',
  citasColumns,
  {
    estado: 'confirmada',
    start_time: '={{ $json.operacionLab026.nuevo_start_time }}',
    end_time: '={{ $json.operacionLab026.nuevo_end_time }}',
    version: '={{ Number($json.citaBloqueadaLab026.version || 0) + 1 }}',
    last_operation_id: '={{ $json.operacionLab026.operation_id }}',
    updated_at: '={{ new Date().toISOString() }}',
  },
  [5600, 5328],
  [
    ['appointment_id', '={{ $json.citaBloqueadaLab026.appointment_id }}'],
    ['clinic_id', '={{ $json.citaBloqueadaLab026.clinic_id }}'],
    ['estado', 'reprogramacion_en_curso'],
    ['version', '={{ $json.citaBloqueadaLab026.version }}'],
  ],
);
addDataGet(
  'Verificar cita reprogramada persistida LAB-026',
  'lab026_citas',
  [
    ['appointment_id', '={{ $("Consolidar evento reprogramado LAB-026").first().json.citaBloqueadaLab026.appointment_id }}'],
    ['clinic_id', '={{ $("Consolidar evento reprogramado LAB-026").first().json.citaBloqueadaLab026.clinic_id }}'],
  ],
  [5824, 5328],
  { limit: 1 },
);
connect('Persistir cita reprogramada LAB-026', 'Verificar cita reprogramada persistida LAB-026', 0);
connect('Persistir cita reprogramada LAB-026', 'Preparar revisión humana LAB-026', 1);
addCode(
  'Cerrar reprogramación LAB-026',
  `const origen = $("Consolidar evento reprogramado LAB-026").first().json; const cita = $json || {};
const op = { ...origen.operacionLab026 };
const ok = cita.estado === "confirmada" && cita.last_operation_id === op.operation_id
  && new Date(cita.start_time).getTime() === new Date(op.nuevo_start_time).getTime()
  && cita.event_id === origen.citaBloqueadaLab026.event_id;
op.estado = ok ? "completada" : "requiere_revision";
const fecha = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", dateStyle: "long", timeStyle: "short" }).format(new Date(op.nuevo_start_time));
op.respuesta_publica = ok ? "La cita fue reprogramada correctamente para el " + fecha + "." : "No pude verificar completamente el cambio. La clínica revisará la solicitud.";
op.updated_at = new Date().toISOString();
return { json: { ...origen, citaLab026: cita, operacionLab026: op, reprogramacionCompletadaLab026: ok,
  auditoriaLab026: { audit_id: "aud_" + op.operation_id + "_reprogramar_ok", operation_id: op.operation_id,
    appointment_id: op.appointment_id, clinic_id: op.clinic_id, session_id: op.session_id,
    accion: "reprogramar", resultado: ok ? "completada" : "fallida", estado_anterior: "confirmada",
    estado_nuevo: ok ? "confirmada" : "requiere_revision", start_time_anterior: origen.citaLab026.start_time || "",
    start_time_nuevo: op.nuevo_start_time, detalle_sanitizado: ok ? "Mismo event_id y persistencia verificados" : "Persistencia final no verificada",
    fecha_hora: new Date().toISOString() } } };`,
  [6048, 5328],
);
connect('Verificar cita reprogramada persistida LAB-026', 'Cerrar reprogramación LAB-026', 0);
connect('Verificar cita reprogramada persistida LAB-026', 'Preparar revisión humana LAB-026', 1);
connect('Cerrar reprogramación LAB-026', 'Registrar auditoría exitosa LAB-026');

// -----------------------------------------------------------------------------
// Reconciliación y revisión humana LAB-025
// -----------------------------------------------------------------------------

addCode(
  'Preparar revisión humana LAB-026',
  `const sanitizar = (v) => String(v || "").replace(/https?:\\/\\/\\S+/gi, "[URL_REDACTADA]").replace(/\\b(?:bearer\\s+)?[a-z0-9_-]{32,}\\b/gi, "[VALOR_REDACTADO]").replace(/\\s+/g, " ").trim().slice(0, 240);
const candidatos = [
  "Cerrar reprogramación LAB-026", "Consolidar evento reprogramado LAB-026", "Consolidar evento original reprogramación LAB-026", "Consolidar bloqueo temporal LAB-026",
  "Consolidar bloqueo reprogramación LAB-026", "Preparar revalidación reprogramación LAB-026",
  "Cerrar cancelación LAB-026", "Consolidar ausencia evento cancelado LAB-026", "Consolidar evento antes de cancelar LAB-026", "Consolidar bloqueo cancelación LAB-026",
  "Preparar bloqueo cancelación LAB-026", "Consolidar verificación cita médica LAB-026",
  "Preparar registro durable cita médica LAB-026", "Consolidar verificación cita peluquería LAB-026",
  "Preparar registro durable cita peluquería LAB-026", "Consolidar intención gestión cita LAB-026"
];
let contexto = {};
for (const nombre of candidatos) {
  try { const ref = $(nombre); if (ref.isExecuted) { contexto = { ...contexto, ...ref.first().json }; break; } } catch {}
}
const opOrigen = contexto.operacionLab026 || {};
const cita = contexto.citaBloqueadaLab026 || contexto.citaLab026 || contexto.registroCitaLab026 || {};
const clinicId = String(opOrigen.clinic_id || cita.clinic_id || contexto.clinic_id || "clinica_piloto_001");
const sessionId = String(opOrigen.session_id || contexto.session_id || "");
const operationId = String(opOrigen.operation_id || ("op_revision_" + String($execution.id || Date.now())));
const operationKey = String(opOrigen.operation_key || [clinicId, sessionId || operationId].join("::"));
const errorCrudo = $json?.error?.message || $json?.error_message || contexto.lab026FailureCode || "resultado_no_verificado";
const errorCode = sanitizar(errorCrudo) || "resultado_no_verificado";
const ahora = new Date().toISOString();
const op = {
  operation_key: operationKey, operation_id: operationId, clinic_id: clinicId, session_id: sessionId,
  accion: String(opOrigen.accion || (contexto.registroCitaLab026 ? "crear_cita" : "gestionar_cita")),
  estado: "requiere_revision", telefono_normalizado: String(opOrigen.telefono_normalizado || ""),
  appointment_id: String(opOrigen.appointment_id || cita.appointment_id || ""), cita_version: Number(opOrigen.cita_version || cita.version || 0),
  cita_seleccionada_json: String(opOrigen.cita_seleccionada_json || "{}"), opciones_citas_json: String(opOrigen.opciones_citas_json || "[]"),
  opciones_horarios_json: String(opOrigen.opciones_horarios_json || "[]"), fecha_pendiente: String(opOrigen.fecha_pendiente || ""),
  hora_pendiente: String(opOrigen.hora_pendiente || ""), nuevo_start_time: String(opOrigen.nuevo_start_time || ""),
  nuevo_end_time: String(opOrigen.nuevo_end_time || ""), intentos_verificacion: Number(opOrigen.intentos_verificacion || 0) + 1,
  error_code: errorCode, respuesta_publica: "No pude verificar completamente esta gestión. La clínica revisará tu solicitud sin modificar nada adicional automáticamente.",
  created_at: String(opOrigen.created_at || ahora), updated_at: ahora, expires_at: ahora
};
const pendingId = "pend_lab026_" + operationId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
return { json: { ...contexto, operacionLab026: op, tieneCitaRevisionLab026: Boolean(op.appointment_id),
  citaRevisionLab026: { appointment_id: op.appointment_id, clinic_id: clinicId, estado: "requiere_revision", last_operation_id: operationId, updated_at: ahora },
  pendienteLab025: { pending_id: pendingId, clinic_id: clinicId, tipo: "gestion_cita_lab026",
    descripcion: "Revisar operación " + op.accion + " LAB-026. Correlación: " + operationId + ". Resultado: " + errorCode + ".", prioridad: "alta",
    estado: "pendiente", creado_por: "sistema_lab026", asignado_a: "", fecha_creacion: ahora, fecha_actualizacion: ahora, fecha_resolucion: "" },
  auditoriaLab026: { audit_id: "aud_" + operationId + "_revision", operation_id: operationId, appointment_id: op.appointment_id,
    clinic_id: clinicId, session_id: sessionId, accion: op.accion, resultado: "requiere_revision",
    estado_anterior: String(cita.estado || ""), estado_nuevo: "requiere_revision", start_time_anterior: String(cita.start_time || ""),
    start_time_nuevo: String(op.nuevo_start_time || ""), detalle_sanitizado: errorCode, fecha_hora: ahora } } };`,
  [4480, 6272],
);
addIf('Existe cita para marcar revisión LAB-026', '={{ $json.tieneCitaRevisionLab026 === true }}', [4704, 6272]);
connect('Preparar revisión humana LAB-026', 'Existe cita para marcar revisión LAB-026');
addDataWrite(
  'Marcar cita requiere revisión LAB-026',
  'update',
  'lab026_citas',
  citasColumns,
  {
    estado: 'requiere_revision',
    last_operation_id: '={{ $json.citaRevisionLab026.last_operation_id }}',
    updated_at: '={{ $json.citaRevisionLab026.updated_at }}',
  },
  [4928, 6176],
  [
    ['appointment_id', '={{ $json.citaRevisionLab026.appointment_id }}'],
    ['clinic_id', '={{ $json.citaRevisionLab026.clinic_id }}'],
  ],
);
connect('Existe cita para marcar revisión LAB-026', 'Marcar cita requiere revisión LAB-026', 0);
connect('Existe cita para marcar revisión LAB-026', 'Guardar operación revisión LAB-026', 1);
connect('Marcar cita requiere revisión LAB-026', 'Guardar operación revisión LAB-026', 0);
connect('Marcar cita requiere revisión LAB-026', 'Guardar operación revisión LAB-026', 1);
addDataWrite(
  'Guardar operación revisión LAB-026',
  'upsert',
  'lab026_operaciones_cita',
  operacionesColumns,
  Object.fromEntries(
    operacionesColumns.map(([field]) => [
      field,
      `={{ $("Preparar revisión humana LAB-026").first().json.operacionLab026.${field} }}`,
    ]),
  ),
  [5152, 6272],
  [[
    'operation_key',
    '={{ $("Preparar revisión humana LAB-026").first().json.operacionLab026.operation_key }}',
  ]],
);
addDataWrite(
  'Crear pendiente humano LAB-025 desde LAB-026',
  'upsert',
  'lab025_pendientes',
  pendientesColumns,
  Object.fromEntries(
    pendientesColumns.map(([field]) => [
      field,
      `={{ $("Preparar revisión humana LAB-026").first().json.pendienteLab025.${field} }}`,
    ]),
  ),
  [5376, 6272],
  [[
    'pending_id',
    '={{ $("Preparar revisión humana LAB-026").first().json.pendienteLab025.pending_id }}',
  ]],
);
connect('Guardar operación revisión LAB-026', 'Crear pendiente humano LAB-025 desde LAB-026', 0);
connect('Guardar operación revisión LAB-026', 'Crear pendiente humano LAB-025 desde LAB-026', 1);
addDataWrite(
  'Registrar auditoría revisión LAB-026',
  'upsert',
  'lab026_auditoria_citas',
  auditoriaColumns,
  Object.fromEntries(
    auditoriaColumns.map(([field]) => [
      field,
      `={{ $("Preparar revisión humana LAB-026").first().json.auditoriaLab026.${field} }}`,
    ]),
  ),
  [5600, 6272],
  [[
    'audit_id',
    '={{ $("Preparar revisión humana LAB-026").first().json.auditoriaLab026.audit_id }}',
  ]],
);
connect('Crear pendiente humano LAB-025 desde LAB-026', 'Registrar auditoría revisión LAB-026', 0);
connect('Crear pendiente humano LAB-025 desde LAB-026', 'Registrar auditoría revisión LAB-026', 1);
addCode(
  'Recuperar respuesta revisión LAB-026',
  `const origen = $("Preparar revisión humana LAB-026").first().json;
return { json: { ...origen.operacionLab026 } };`,
  [5824, 6272],
);
connect('Registrar auditoría revisión LAB-026', 'Recuperar respuesta revisión LAB-026', 0);
connect('Registrar auditoría revisión LAB-026', 'Recuperar respuesta revisión LAB-026', 1);
connect('Recuperar respuesta revisión LAB-026', 'Responder gestión cita LAB-026');

// -----------------------------------------------------------------------------
// Ajustes de experiencia conversacional aprobados durante las pruebas
// -----------------------------------------------------------------------------

const respuestaDatosServicioPeluqueria = nodeByName(
  'Preparar respuesta datos servicio peluquería',
);
const asignacionRespuestaDatosServicio =
  respuestaDatosServicioPeluqueria.parameters.assignments.assignments.find(
    (assignment) => assignment.name === 'reply',
  );

if (!asignacionRespuestaDatosServicio) {
  throw new Error('No existe la respuesta de datos de servicio de peluquería');
}

asignacionRespuestaDatosServicio.value = `={{ (() => {
  const origen =
    $("Preparar estado servicio peluquería pendiente")
      .first()
      .json;

  const faltantes =
    Array.isArray(origen.datosFaltantesServicio)
      ? origen.datosFaltantesServicio
      : [];

  const preguntas = [];

  if (faltantes.includes("servicio")) {
    preguntas.push(
      "¿Qué servicio necesitas: baño, corte o baño y corte?"
    );
  }

  if (faltantes.includes("tamano")) {
    preguntas.push(
      "¿Tu perro es pequeño, mediano o grande?"
    );
  }

  if (faltantes.includes("tipo_pelaje")) {
    preguntas.push(
      "¿Su pelaje es corto, largo, rizado o de doble capa?"
    );
  }

  const estado =
    origen.estadoPeluqueriaGuardar || {};

  const datosReservaFaltantes = [];

  if (!String(estado.nombre_tutor || "").trim()) {
    datosReservaFaltantes.push("nombre del tutor");
  }

  if (!String(estado.nombre_mascota || "").trim()) {
    datosReservaFaltantes.push("nombre de la mascota");
  }

  if (!String(estado.telefono || "").trim()) {
    datosReservaFaltantes.push("teléfono móvil chileno");
  }

  if (datosReservaFaltantes.length > 0) {
    preguntas.push(
      "Para avanzar más rápido, indícame también " +
      datosReservaFaltantes.join(", ") +
      "."
    );
  }

  return preguntas.join(" ") ||
    "Necesito un dato adicional para continuar con la reserva de peluquería.";
})() }}`;

const respuestaCitaMedicaConfirmada = nodeByName(
  'Preparar respuesta cita confirmada',
);
const asignacionRespuestaCitaMedica =
  respuestaCitaMedicaConfirmada.parameters.assignments.assignments.find(
    (assignment) => assignment.name === 'reply',
  );

if (!asignacionRespuestaCitaMedica) {
  throw new Error('No existe la respuesta de cita médica confirmada');
}

asignacionRespuestaCitaMedica.value = `={{ (() => {
  const datos =
    $("Consolidar cita médica creada").first().json;

  const mascota =
    datos.estadoAgenda?.nombre_mascota ||
    "tu mascota";

  const servicio =
    datos.estadoAgenda?.service_id === "consulta_general"
      ? "consulta veterinaria general"
      : datos.estadoAgenda?.service_id ||
        "atención veterinaria";

  const fechaHora =
    String(datos.fechaHoraTexto || "")
      .trim()
      .replace(/[.\\s]+$/, "");

  return (
    \`La \${servicio} para \${mascota} quedó confirmada \` +
    \`para el \${fechaHora}.\`
  );
})() }}`;

// -----------------------------------------------------------------------------
// Ajustes visuales mínimos de nodos históricos desplazados por la persistencia
// -----------------------------------------------------------------------------

for (const [name, deltaX] of [
  ['Guardar estado cita confirmada', 1120],
  ['Preparar respuesta cita confirmada', 1120],
  ['Responder cita confirmada', 1120],
  ['Responder cita creada con error de estado', 1120],
  ['Preparar estado peluquería confirmado', 1280],
  ['Guardar estado peluquería confirmado', 1280],
  ['Preparar respuesta cita peluquería confirmada', 1280],
  ['Responder cita peluquería confirmada', 1280],
  ['Responder error guardado confirmación peluquería', 1280],
]) {
  const node = nodeByName(name);
  node.position = [node.position[0] + deltaX, node.position[1]];
}

// Validaciones estructurales antes de escribir.
const names = new Set();
const ids = new Set();
for (const node of workflow.nodes) {
  if (names.has(node.name)) throw new Error(`Nombre de nodo duplicado: ${node.name}`);
  if (ids.has(node.id)) throw new Error(`ID de nodo duplicado: ${node.id}`);
  names.add(node.name);
  ids.add(node.id);
}
for (const [source, connection] of Object.entries(workflow.connections)) {
  if (!names.has(source)) throw new Error(`Conexión con origen inexistente: ${source}`);
  for (const output of connection.main || []) {
    for (const target of output || []) {
      if (!names.has(target.node)) {
        throw new Error(`Conexión ${source} -> ${target.node} apunta a un nodo inexistente`);
      }
    }
  }
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      source: path.relative(repoDir, sourcePath),
      target: path.relative(repoDir, targetPath),
      nodes: workflow.nodes.length,
      active: workflow.active,
      name: workflow.name,
    },
    null,
    2,
  ),
);
