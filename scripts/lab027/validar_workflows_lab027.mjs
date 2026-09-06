import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { construirWorkflow, workflowPath, construirAdaptador, adapterPath, construirIntegracionLab024, lab024Path,
  taskColumns, validarContratoRespuesta, schemas, LAB024_RUNTIME_WORKFLOW_ID } from './generar_workflows_lab027.mjs';
import { probarLogica } from './probar_logica_lab027.mjs';

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const lab024 = JSON.parse(fs.readFileSync(lab024Path, 'utf8'));
const lab026 = JSON.parse(fs.readFileSync(new URL('../../n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json',import.meta.url),'utf8'));
let checks = 1; // JSON parseado correctamente
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const expectedSchemas = {
  lab027_seguimientos: 'seguimiento_id clinic_id appointment_id appointment_version tipo_seguimiento categoria_atencion etapa fecha_objetivo estado instruccion_id envio_id enviado_at respuesta_tipo respuesta_at tarea_id created_at updated_at closed_at'.split(' '),
  lab027_instrucciones: 'instruccion_id clinic_id service_id categoria_atencion nombre_visible instrucciones recordatorio_72h recordatorio_48h recordatorio_24h activo created_at updated_at'.split(' '),
};
check(workflow.name === 'LAB-027 - Seguimientos, recordatorios y pendientes', 'nombre oficial');
check(workflow.active === false, 'export inactivo');
check(!Object.hasOwn(workflow, 'pinData'), 'sin pinData');
check(new Set(workflow.nodes.map(node => node.name)).size === workflow.nodes.length, 'nombres únicos');
check(new Set(workflow.nodes.map(node => node.id)).size === workflow.nodes.length, 'IDs únicos');
const names = new Set(workflow.nodes.map(node => node.name));
const allowedTypes = new Set(['manualTrigger', 'scheduleTrigger', 'dataTable', 'code', 'if', 'switch', 'executeWorkflow', 'executeWorkflowTrigger'].map(type => 'n8n-nodes-base.' + type));
for (const node of workflow.nodes) {
  check(allowedTypes.has(node.type), 'tipo permitido, sin Wait, Calendar, webhook, IA o proveedor: ' + node.name);
  check(!node.disabled, 'nodo habilitado: ' + node.name);
  check(!node.credentials, 'sin credenciales: ' + node.name);
  check(Boolean(node.id) && Boolean(node.name), 'identidad válida: ' + node.name);
  check(!node.onError || node.onError === 'stopWorkflow' || (['Invocar adaptador simulado LAB-027', 'Invocar adaptador para seguimiento clínico LAB-027', 'Invocar urgencias LAB-024', 'Persistir respuesta del tutor LAB-027', 'Insertar tarea humana LAB-027', 'Insertar tarea respuesta clínica LAB-027', 'Cerrar tarea por respuesta LAB-027'].includes(node.name) && node.onError === 'continueRegularOutput'), 'error controlado: ' + node.name);
  check(!node.retryOnFail, 'sin retry automático: ' + node.name);
  if (node.type === 'n8n-nodes-base.code') {
    new Function(node.parameters.jsCode); checks++;
    check(!/Math\.random|randomUUID|fetch\s*\(|require\s*\(|https?:\/\//.test(node.parameters.jsCode), 'Code sin aleatoriedad ni red');
    check(node.parameters.mode === 'runOnceForAllItems', 'Code agregado');
  }
  const serialized = JSON.stringify(node.parameters);
  for (const match of serialized.matchAll(/\$\(\\?"([^"\\]+)\\?"\)/g)) check(names.has(match[1]), 'referencia Code existente: ' + match[1]);
}
for (const [source, channels] of Object.entries(workflow.connections)) {
  check(names.has(source), 'origen existente: ' + source);
  for (const outputs of Object.values(channels)) for (const output of outputs) for (const target of output) {
    check(names.has(target.node), 'destino existente: ' + target.node);
    check(target.type === 'main' && target.index === 0, 'puerto válido');
  }
}
const reachable = new Set();
const queue = workflow.nodes.filter(node => /Trigger$/.test(node.type)).map(node => node.name);
while (queue.length) {
  const name = queue.shift(); if (reachable.has(name)) continue; reachable.add(name);
  for (const output of workflow.connections[name]?.main || []) for (const target of output) queue.push(target.node);
}
check(reachable.size === workflow.nodes.length, 'todos los nodos alcanzables');
const tables = workflow.nodes.filter(node => node.parameters.resource === 'table');
check(tables.length === 2, 'exactamente dos creaciones de tablas');
assert.deepEqual(tables.map(node => node.parameters.tableName).sort(), Object.keys(expectedSchemas).sort()); checks++;
for (const node of tables) {
  check(node.parameters.operation === 'create' && node.parameters.options.createIfNotExists === true, 'inicialización idempotente');
  const columns = node.parameters.columns.column;
  const expected = expectedSchemas[node.parameters.tableName].map(name => ({ name, type: name === 'appointment_version' ? 'number' : 'string' }));
  assert.deepEqual(columns, expected); checks++;
}
const seguimientoColumns = tables.find(node => node.parameters.tableName === 'lab027_seguimientos').parameters.columns.column;
for (const forbidden of ['nombre_tutor', 'nombre_mascota', 'telefono', 'telefono_normalizado', 'start_time', 'end_time', 'service_id', 'nombre_servicio']) {
  check(!seguimientoColumns.some(column => column.name === forbidden), 'sin campo canónico duplicado: ' + forbidden);
}
check(seguimientoColumns.some(column => column.name === 'appointment_version' && column.type === 'number'), 'versión de cita presente');
const schedulers = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.scheduleTrigger');
check(schedulers.length === 1, 'scheduler único');
assert.deepEqual(schedulers[0].parameters, { rule: { interval: [{ field: 'minutes', minutesInterval: 30 }] } }); checks++;
check(workflow.nodes.filter(node => node.type === 'n8n-nodes-base.manualTrigger').length === 1, 'inicializador único');
const operations = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.dataTable' && node.parameters.resource !== 'table');
for (const node of operations) {
  const p = node.parameters;
  check(['lab026_citas', 'lab025_tareas', 'lab025_auditoria_operaciones', ...Object.keys(expectedSchemas)].includes(p.dataTableId.value), 'fuente autorizada');
  check(p.dataTableId.mode === 'name', 'tabla por nombre');
  check(['get', 'upsert', 'update', 'insert'].includes(p.operation) || (p.dataTableId.value==='lab025_auditoria_operaciones'&&!p.operation), 'operación autorizada');
  if (p.dataTableId.value === 'lab025_tareas' && p.operation !== 'get') {
    const insert = ['Insertar tarea humana LAB-027','Insertar tarea respuesta clínica LAB-027'].includes(node.name);
    check(insert || node.name === 'Cerrar tarea por respuesta LAB-027', 'escritura LAB-025 conocida');
    check(p.operation === (insert ? 'insert' : 'update'), 'insertar sin upsert destructivo o cierre');
    const fields = insert ? taskColumns.filter(k => k !== 'fecha_cierre') : ['estado', 'fecha_actualizacion', 'fecha_cierre'];
    assert.deepEqual(Object.keys(p.columns.value), fields); checks++;
    assert.deepEqual(p.columns.schema.map(c => c.id), taskColumns); checks++;
    check(p.columns.schema.every(c => c.type === 'string' && c.removed === !fields.includes(c.id)), 'esquema LAB-025 reutilizado');
    if (!insert) {
      check(p.matchType === 'allConditions', 'cierre conjuntivo');
      assert.deepEqual(p.filters.conditions, ['task_id', 'clinic_id', 'estado', 'fecha_actualizacion'].map(keyName => ({ keyName, keyValue: '={{ $json.tarea.' + keyName + ' }}' }))); checks++;
    }
    continue;
  }
  if(p.dataTableId.value==='lab025_auditoria_operaciones'){
    check(['Insertar auditoría envío clínico LAB-027','Insertar auditoría respuesta clínica LAB-027'].includes(node.name)&&!p.operation,'auditoría clínica conocida por inserción');
    continue;
  }
  check(p.operation !== 'insert', 'inserción solo en tabla reutilizada');
  if (p.operation === 'get') check(p.returnAll === true && node.executeOnce === (node.name !== 'Releer cita canónica antes de envío LAB-027') && node.alwaysOutputData === true, 'lectura completa y granularidad correcta');
  else if (p.operation === 'upsert') {
    check(p.dataTableId.value === 'lab027_seguimientos', 'escritura solo en seguimientos');
    check(p.matchType === 'allConditions', 'persistencia conjuntiva');
    assert.deepEqual(p.filters.conditions, [{ keyName: 'seguimiento_id', keyValue: '={{ $json.seguimiento_id }}' }]); checks++;
    assert.deepEqual(Object.keys(p.columns.value), expectedSchemas.lab027_seguimientos); checks++;
    check(p.columns.value.estado === '={{ $json.estado }}', 'estado proviene de planificación');
  } else {
    check(p.dataTableId.value === 'lab027_seguimientos', 'Update nunca modifica cita ni catálogo');
    check(p.matchType === 'allConditions', 'CAS usa conjunción');
    check(Boolean(node.alwaysOutputData) === (node.name === 'Persistir respuesta del tutor LAB-027'), 'salida vacía solo para verificar respuesta sin éxito ficticio');
    const fields = {
      'Persistir enviando antes del adaptador LAB-027': ['estado', 'updated_at'],
      'Cerrar pendiente no vigente LAB-027': ['estado', 'updated_at', 'closed_at'],
      'Persistir resultado enviado LAB-027': ['estado', 'updated_at', 'enviado_at'],
      'Persistir fallo o incertidumbre LAB-027': ['estado', 'updated_at'],
      'Persistir respuesta del tutor LAB-027': ['estado', 'respuesta_tipo', 'respuesta_at', 'tarea_id', 'updated_at'],
      'Adquirir contacto LAB-027': ['estado', 'tarea_id', 'updated_at'],
      'Cerrar contacto no vigente LAB-027': ['estado', 'updated_at', 'closed_at'],
      'Enlazar tarea existente LAB-027': ['estado', 'tarea_id', 'updated_at'],
      'Persistir contacto humano LAB-027': ['estado', 'tarea_id', 'updated_at'],
      'Adquirir envío clínico LAB-027': ['estado','instruccion_id','envio_id','updated_at'],
      'Marcar revisión envío clínico LAB-027': ['estado','updated_at'],
      'Persistir resultado envío clínico LAB-027': ['estado','enviado_at','updated_at'],
    }[node.name];
    check(Boolean(fields), 'escritura de transición conocida');
    assert.deepEqual(Object.keys(p.columns.value), fields); checks++;
    if (node.name === 'Persistir respuesta del tutor LAB-027') {
      assert.deepEqual(p.filters.conditions, ['clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id',
        'appointment_version', 'tipo_seguimiento', 'estado', 'respuesta_tipo', 'respuesta_at', 'tarea_id', 'updated_at'].map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' })));
      checks++;
    } else if (['Adquirir contacto LAB-027', 'Cerrar contacto no vigente LAB-027', 'Enlazar tarea existente LAB-027', 'Persistir contacto humano LAB-027'].includes(node.name)) {
      assert.deepEqual(p.filters.conditions, ['clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id', 'appointment_version', 'tipo_seguimiento', 'etapa', 'estado', 'enviado_at', 'respuesta_tipo', 'respuesta_at', 'tarea_id', 'updated_at'].map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' }))); checks++;
    } else if(['Adquirir envío clínico LAB-027','Marcar revisión envío clínico LAB-027','Persistir resultado envío clínico LAB-027'].includes(node.name)) {
      assert.deepEqual(p.filters.conditions.map(c=>c.keyName),['seguimiento_id','clinic_id','appointment_id','appointment_version','tipo_seguimiento','etapa','estado','envio_id','enviado_at','updated_at']);checks++;
    } else {
      const fromState = node.name.startsWith('Persistir resultado') || node.name.startsWith('Persistir fallo') ? 'enviando' : 'pendiente_envio';
      assert.deepEqual(p.filters.conditions, [
        ...['seguimiento_id', 'clinic_id', 'envio_id', 'appointment_version', 'updated_at'].map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' })),
        { keyName: 'estado', keyValue: fromState },
      ]); checks++;
    }
    assert.deepEqual(p.columns.schema.filter(c => !c.removed).map(c => c.id).sort(), [...fields].sort()); checks++;
  }
}
const canonical = operations.filter(node => node.parameters.dataTableId.value === 'lab026_citas');
check(canonical.length === 6 && canonical.every(n => n.parameters.operation === 'get'), 'LAB-026 es fuente canónica de solo lectura con relecturas');
assert.deepEqual(canonical[0].parameters.filters.conditions, [{ keyName: 'estado', keyValue: 'confirmada' }]); checks++;
assert.deepEqual(canonical[1].parameters.filters.conditions, [
  { keyName: 'clinic_id', keyValue: '={{ $json.clinic_id }}' }, { keyName: 'appointment_id', keyValue: '={{ $json.appointment_id }}' },
]); checks++;
check(operations.filter(node => node.parameters.operation === 'upsert').length === 1, 'una sola escritura de seguimientos');
const serialized = JSON.stringify(workflow);
for (const pattern of [/"(?:access_token|client_secret|api_key|password)"\s*:\s*"[^"\s]+"/i,
  /-----BEGIN.*PRIVATE KEY/i, /Bearer\s+[a-z0-9._-]{16,}/i, /https?:\/\//i]) {
  check(!pattern.test(serialized), 'export sin secreto/URL: ' + pattern);
}
// Detecta divergencias del export, incluidas mutaciones de Code y de identidades.
assert.deepEqual(workflow, construirWorkflow()); checks++;
check(fs.existsSync(adapterPath), 'existe adaptador simulado');
const adapter = JSON.parse(fs.readFileSync(adapterPath, 'utf8')); checks++;
check(adapter.name === 'LAB-027 - Adaptador de canal simulado', 'nombre oficial adaptador');
check(adapter.active === false, 'adaptador inactivo');
check(!Object.hasOwn(adapter, 'pinData'), 'adaptador sin pinData');
check(adapter.nodes.length < 15, 'adaptador pequeño');
check(new Set(adapter.nodes.map(node => node.id)).size === adapter.nodes.length, 'IDs adaptador únicos');
check(new Set(adapter.nodes.map(node => node.name)).size === adapter.nodes.length, 'nombres adaptador únicos');
const adapterTypes = new Set(['n8n-nodes-base.webhook', 'n8n-nodes-base.code', 'n8n-nodes-base.respondToWebhook', 'n8n-nodes-base.executeWorkflowTrigger', 'n8n-nodes-base.if', 'n8n-nodes-base.executeWorkflow']);
for (const node of adapter.nodes) {
  check(adapterTypes.has(node.type), 'adaptador sin Data Tables, Calendar, Wait, IA ni proveedores: ' + node.name);
  check(!node.disabled && !node.credentials, 'adaptador habilitado sin credenciales');
  check(!node.retryOnFail, 'simulador no reintenta');
  if (node.type === 'n8n-nodes-base.code') {
    new Function(node.parameters.jsCode); checks++;
    check(!/Math\.random|randomUUID|fetch\s*\(|require\s*\(|\$getWorkflowStaticData/.test(node.parameters.jsCode), 'simulación sin azar, red ni persistencia');
    if (node.name !== 'Devolver contrato interno adaptador LAB-027') {
      for (const value of ['enviar', 'simular_respuesta', 'accepted', 'rejected', 'uncertain']) {
        check(node.parameters.jsCode.includes("'" + value + "'"), 'contrato explícito: ' + value);
      }
    }
  }
}
for(const name of ['Validar y simular contrato LAB-027','Simular contrato interno LAB-027']){
  const code=adapter.nodes.find(n=>n.name===name).parameters.jsCode;
  check(code.includes("[...common, 'appointment_version', 'respuesta_tipo', 'respuesta_texto', 'fecha_respuesta']"),'adaptador permite versión solo en respuesta: '+name);
  check(code.includes('Number.isSafeInteger(entrada.appointment_version)'),'adaptador valida versión numérica: '+name);
  check(code.includes('appointment_version: entrada.appointment_version'),'adaptador normaliza y transporta versión: '+name);
}
const hooks = adapter.nodes.filter(node => node.type === 'n8n-nodes-base.webhook');
check(hooks.length === 1 && hooks[0].parameters.path === 'vetatiende-lab027-canal-simulado', 'webhook específico único');
check(hooks[0].parameters.httpMethod === 'POST' && hooks[0].parameters.responseMode === 'responseNode', 'webhook POST con respuesta explícita');
check(!hooks[0].parameters.authentication, 'sin autenticación ficticia');
const adapterNames = new Set(adapter.nodes.map(node => node.name));
for (const [source, channels] of Object.entries(adapter.connections)) {
  check(adapterNames.has(source), 'origen adaptador válido');
  for (const outputs of Object.values(channels)) for (const output of outputs) for (const target of output) {
    check(adapterNames.has(target.node) && target.type === 'main' && target.index === 0, 'destino adaptador válido');
  }
}
check(!Object.hasOwn(adapter, 'staticData'), 'sin persistencia propia');
check(!JSON.stringify(workflow).includes('vetatiende-lab027-canal-simulado'), 'núcleo no depende del webhook técnico');
const calls = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.executeWorkflow');
const adapterCalls=calls.filter(n=>n.name!=='Invocar urgencias LAB-024'),urgencyCall=calls.find(n=>n.name==='Invocar urgencias LAB-024');
check(calls.length === 3&&adapterCalls.length===2&&Boolean(urgencyCall), 'tres invocaciones internas desacopladas');
check(adapterCalls.every(n=>n.parameters.workflowId.value === 'QhFSw6XCHqsS5cQC' && n.parameters.source === 'database'), 'destino runtime adaptador correcto');
check(urgencyCall.parameters.workflowId.value===LAB024_RUNTIME_WORKFLOW_ID&&urgencyCall.parameters.source==='database','destino runtime LAB-024 correcto');
check(calls.every(n=>n.parameters.options.waitForSubWorkflow === true && n.parameters.mode === 'each'), 'espera resultado interno por contrato');
check(calls.every(n=>n.alwaysOutputData === true && n.onError === 'continueRegularOutput'), 'resultado ausente o error se consolida sin retry');
const preCall=calls.find(n=>n.name==='Invocar adaptador simulado LAB-027');
check(adapter.nodes.filter(n => n.type === 'n8n-nodes-base.executeWorkflowTrigger').length === 1, 'trigger interno único');
check(!adapter.connections['Devolver contrato interno adaptador LAB-027'], 'rama interna termina sin respuesta HTTP');
const byName = new Map(workflow.nodes.map(n => [n.name, n]));
const pendingRead = byName.get('Leer pendientes de envío LAB-027');
assert.deepEqual(pendingRead.parameters.filters.conditions, [{ keyName: 'estado', keyValue: 'pendiente_envio' }]); checks++;
const canReachCallWithout = excluded => {
  const seen = new Set(); const queue = [schedulers[0].name];
  while (queue.length) {
    const name = queue.shift(); if (name === excluded || seen.has(name)) continue;
    if (name === preCall.name) return true;
    seen.add(name);
    for (const output of workflow.connections[name]?.main || []) for (const target of output) queue.push(target.node);
  }
  return false;
};
for (const required of ['Releer cita canónica antes de envío LAB-027', 'Validar vigencia antes de envío LAB-027',
  'Persistir enviando antes del adaptador LAB-027', 'Comprobar adquisición y preparar contrato LAB-027']) {
  check(!canReachCallWithout(required), 'invocación requiere paso previo: ' + required);
}
check(canReachCallWithout('nodo inexistente'), 'invocación alcanzable por ruta segura');
check(!byName.get('Persistir enviando antes del adaptador LAB-027').alwaysOutputData, 'claim perdido no habilita adaptador');
check(workflow.connections[preCall.name].main[0][0].node === 'Preparar persistencia resultado LAB-027', 'resultado pasa por consolidación');
check(!workflow.connections['Persistir resultado enviado LAB-027'] && !workflow.connections['Persistir fallo o incertidumbre LAB-027'], 'persistencia final termina sin bucle');
check(workflow.nodes.filter(n => n.type === 'n8n-nodes-base.executeWorkflowTrigger').length === 1, 'entrada interna única de respuestas');
const responseRead = byName.get('Releer seguimiento por respuesta LAB-027');
check(responseRead.parameters.matchType === 'allConditions', 'correlación de respuesta conjuntiva');
assert.deepEqual(responseRead.parameters.filters.conditions, ['clinic_id', 'seguimiento_id', 'envio_id'].map(keyName => ({ keyName, keyValue: '={{ $json.solicitud.' + keyName + ' }}' }))); checks++;
assert.deepEqual(byName.get('Releer cita para respuesta LAB-027').parameters.filters.conditions,
  ['clinic_id', 'appointment_id'].map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' }))); checks++;
const validationNodes=['Validar contrato de respuesta LAB-027','Resolver respuesta del tutor LAB-027'];
const validationCodes=validationNodes.map(name=>byName.get(name).parameters.jsCode);
for(const [index,code] of validationCodes.entries()){
  check(code.includes('const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;'),'tolerancia exacta en '+validationNodes[index]);
  check(code.includes('const now = instant(ahora);'),'reloj calculado una vez en '+validationNodes[index]);
  check(code.includes('date <= now + MAX_CLOCK_SKEW_MS'),'comparación tolerante en '+validationNodes[index]);
  check(!code.includes('date <= instant(ahora)'),'sin comparación estricta en '+validationNodes[index]);
  check(code.includes("['si', 'no', 'ambiguo', 'pregunta', 'sin_respuesta', 'normal', 'preocupante', 'posible_urgencia']"),'lista cerrada ampliada de forma controlada en '+validationNodes[index]);
  check(code.includes("const fields = ['clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id', 'appointment_version', 'respuesta_tipo', 'respuesta_texto', 'fecha_respuesta'];"),'ocho campos técnicos intactos en '+validationNodes[index]);
  check(code.includes("Number.isSafeInteger(respuesta.appointment_version)"),'versión técnica validada en '+validationNodes[index]);
}
const policySource=validarContratoRespuesta.toString();
check(validationCodes.every(code=>code.includes(policySource)),'ambos Code se generan desde la misma función temporal');
check(byName.get('Resolver respuesta del tutor LAB-027').parameters.jsCode.includes('Number(r.appointment_version) !== Number(s.appointment_version)'), 'versión externa se contrasta con seguimiento persistido');
const responseCalls = adapter.nodes.filter(n => n.type === 'n8n-nodes-base.executeWorkflow');
check(responseCalls.length === 2 && responseCalls.every(n => n.parameters.workflowId.value === 'aVs5LQiBrrRsyzcN' && n.parameters.source === 'database' && n.parameters.mode === 'each' && n.parameters.options.waitForSubWorkflow === true), 'adaptador entrega ambas vías al núcleo runtime internamente');
check(workflow.nodes.length === 96 && adapter.nodes.length === 10, 'conteos con integración real de urgencias');
check(workflow.nodes.filter(n => n.type === 'n8n-nodes-base.code').length === 33, 'núcleo contiene 33 nodos Code');
const clinicalResponseNames=['Respuesta clínica requiere tarea LAB-027','Buscar tarea respuesta clínica LAB-027','Preparar tarea respuesta clínica LAB-027','Debe insertar tarea clínica LAB-027','Extraer tarea clínica LAB-027','Insertar tarea respuesta clínica LAB-027','Verificar tarea respuesta clínica LAB-027','Tarea clínica verificada LAB-027','Respuesta clínica requiere auditoría LAB-027','Preparar auditoría respuesta clínica LAB-027','Insertar auditoría respuesta clínica LAB-027','Restaurar salida respuesta clínica LAB-027'];
for(const name of clinicalResponseNames)check(byName.has(name),'nodo respuesta clínica presente: '+name);
const responseResolverCode=byName.get('Resolver respuesta del tutor LAB-027').parameters.jsCode;
for(const fragment of ["'post_tratamiento'", "'post_cirugia'", "s.estado !== 'contactado'", "'respuesta_recibida'", "'requiere_revision_humana'", "'integracion_lab024_no_disponible'"])
  check(responseResolverCode.includes(fragment),'contrato clínico explícito: '+fragment);
check(!responseResolverCode.includes('respuesta_texto:'),'texto libre nunca forma parte del patch clínico');
const clinicalTaskCode=byName.get('Preparar tarea respuesta clínica LAB-027').parameters.jsCode;
check(clinicalTaskCode.includes("'revision_respuesta_clinica'"),'task_id clínico determinista');
check(!clinicalTaskCode.includes('respuesta_texto'),'tarea no copia texto clínico libre');
for(const name of ['Preparar tarea respuesta clínica LAB-027','Verificar persistencia de respuesta LAB-027','Restaurar decisión respuesta LAB-027']){
  const code=byName.get(name).parameters.jsCode;
  check(code.includes('$("Requiere persistir respuesta LAB-027").first().json'),'decisión post LAB-024 preservada: '+name);
  check(!code.includes('$("Resolver respuesta del tutor LAB-027").first().json'),'sin restaurar decisión previa a LAB-024: '+name);
}
const clinicalAuditCode=byName.get('Preparar auditoría respuesta clínica LAB-027').parameters.jsCode;
check(!clinicalAuditCode.includes('respuesta_texto'),'auditoría no copia texto clínico libre');
check(clinicalAuditCode.includes("accion:'procesar_respuesta_seguimiento_clinico'"),'acción de auditoría controlada');
for(const name of ['Es posible urgencia clínica LAB-027','Preparar contrato urgencia LAB-024','Invocar urgencias LAB-024','Resolver recepción urgencia LAB-024'])check(byName.has(name),'integración urgencia presente: '+name);
check(byName.get('Preparar contrato urgencia LAB-024').parameters.jsCode.includes("origen:'sistema_lab027'"),'origen interno controlado');
check(!byName.get('Preparar contrato urgencia LAB-024').parameters.jsCode.includes('respuesta_texto'),'contrato LAB-024 sin texto libre');
check(byName.get('Resolver recepción urgencia LAB-024').parameters.jsCode.includes('const prepararContratoUrgenciaLab024='),'resolver LAB-027 incluye dependencia de contrato en el sandbox Code');
check(workflow.connections['Es posible urgencia clínica LAB-027'].main[1][0].node==='Requiere persistir respuesta LAB-027','clasificaciones no urgentes conservan ruta');
for (const n of [...calls, ...responseCalls]) {
  check(n.typeVersion === 1.3, 'Execute Workflow 1.3, no legacy: ' + n.name);
  const target=responseCalls.includes(n)?'aVs5LQiBrrRsyzcN':n===urgencyCall?LAB024_RUNTIME_WORKFLOW_ID:'QhFSw6XCHqsS5cQC';
  assert.deepEqual(n.parameters.workflowId, { __rl: true, value: target, mode: 'id' }); checks++;
  check(!['LAB027VetAtiende','LAB027CanalSimulado'].includes(n.parameters.workflowId.value), 'sin placeholder ejecutable');
  assert.deepEqual(n.parameters.workflowInputs, { mappingMode:'defineBelow', value:{}, matchingColumns:[], schema:[], attemptToConvertTypes:false, convertFieldsToString:true }); checks++;
}
for (const receiver of [workflow, adapter]) {
  const trigger = receiver.nodes.find(n => n.type === 'n8n-nodes-base.executeWorkflowTrigger');
  check(trigger.typeVersion === 1 && Object.keys(trigger.parameters).length === 0, 'receptor passthrough v1 sin esquema');
}
for (const suffix of ['webhook', 'interno']) {
  const gate = adapter.nodes.find(n => n.name === 'Es respuesta normalizada ' + suffix + ' LAB-027');
  const source = suffix === 'webhook' ? 'Validar y simular contrato LAB-027' : 'Simular contrato interno LAB-027';
  const entry = suffix === 'webhook' ? 'Entrada técnica canal simulado LAB-027' : 'Entrada interna subworkflow LAB-027';
  const target = suffix === 'webhook' ? 'Devolver contrato simulado LAB-027' : 'Devolver contrato interno adaptador LAB-027';
  const call = 'Entregar respuesta al núcleo ' + suffix + ' LAB-027';
  const edge = node => ({ node, type:'main', index:0 });
  assert.deepEqual(adapter.connections[entry], {main:[[edge(source)]]}); checks++;
  assert.deepEqual(adapter.connections[source], {main:[[edge(gate.name)]]}); checks++;
  assert.deepEqual(adapter.connections[gate.name], {main:[[edge(call)],[edge(target)]]}); checks++;
  assert.deepEqual(adapter.connections[call], {main:[[edge(target)]]}); checks++;
  check(!adapter.connections[target], 'retorno terminal previsto: ' + suffix);
  check(gate.parameters.conditions.conditions[0].leftValue === '={{ typeof $json.respuesta_tipo === "string" }}', 'adaptador discrimina solo contrato, sin decisión de negocio');
  check(adapter.connections[gate.name].main[0][0].node === 'Entregar respuesta al núcleo ' + suffix + ' LAB-027', 'solo respuestas normalizadas llaman al núcleo');
  check(!adapter.connections[gate.name].main[1].some(c => responseCalls.some(n => n.name === c.node)), 'resultado de envío no recurre al núcleo');
}
check(adapter.nodes.length === 10 && adapter.nodes.filter(n => n.type === 'n8n-nodes-base.code').length === 3, 'adaptador conserva diez nodos y tres Code');
check(adapter.nodes.find(n => n.name === 'Devolver contrato simulado LAB-027').parameters.responseBody === '={{ $json }}', 'webhook devuelve contrato completo sin proyección');
const responseReachableWithout = excluded => {
  const queue = ['Recibir respuesta normalizada LAB-027']; const seen = new Set();
  while (queue.length) {
    const name = queue.shift(); if (name === excluded || seen.has(name)) continue;
    if (name === 'Persistir respuesta del tutor LAB-027') return true;
    seen.add(name);
    for (const output of workflow.connections[name]?.main || []) for (const target of output) queue.push(target.node);
  }
  return false;
};
for (const required of ['Validar contrato de respuesta LAB-027', 'Releer seguimiento por respuesta LAB-027',
  'Correlacionar seguimiento de respuesta LAB-027', 'Releer cita para respuesta LAB-027', 'Resolver respuesta del tutor LAB-027']) {
  check(!responseReachableWithout(required), 'persistencia de respuesta requiere: ' + required);
}
check(responseReachableWithout('ninguno'), 'ruta interna de persistencia alcanzable');
const resolverRespuesta = byName.get('Resolver respuesta del tutor LAB-027').parameters.jsCode;
for (const fragment of [
  "s.estado === 'confirmado' && r.respuesta_tipo === 'si'",
  "s.estado === 'derivado_cancelacion_reprogramacion' && r.respuesta_tipo === 'no'",
  "resultado: 'ya_registrada'",
  'Tu confirmación ya estaba registrada.',
  'Tu respuesta ya estaba registrada. La cita sigue vigente hasta completar la cancelación o reprogramación.',
]) check(resolverRespuesta.includes(fragment), 'idempotencia semántica explícita en Resolver: ' + fragment);
assert.deepEqual(workflow.connections['Requiere persistir respuesta LAB-027'].main[0],
  [{ node: 'Respuesta clínica requiere tarea LAB-027', type: 'main', index: 0 }]); checks++;
check(!workflow.connections['Requiere persistir respuesta LAB-027'].main[1]
  .some(edge => edge.node === 'Persistir respuesta del tutor LAB-027'), 'respuesta sin persistencia no alcanza escritura');
check(workflow.connections['Persistir respuesta del tutor LAB-027'].main[0][0].node === 'Verificar persistencia de respuesta LAB-027', 'persistencia se comprueba antes de publicar');
check(workflow.connections['Verificar persistencia de respuesta LAB-027'].main[0][0].node === 'Respuesta clínica requiere auditoría LAB-027', 'persistencia verificada decide auditoría clínica');
check(byName.get('Devolver respuesta pública LAB-027').parameters.jsCode === 'return $input.all().map(item => ({ json: item.json.salida }));', 'salida pública excluye contexto e IDs internos');
for (const pattern of [/"(?:access_token|client_secret|api_key|password)"\s*:\s*"[^"\s]+"/i,
  /-----BEGIN.*PRIVATE KEY-----/i, /Bearer\s+[a-z0-9._-]{16,}/i, /https?:\/\//i]) {
  check(!pattern.test(JSON.stringify(adapter)), 'adaptador sin secretos/URLs reales: ' + pattern);
}
assert.deepEqual(adapter, construirAdaptador()); checks++;
// LAB-025 es referencia de esquema, nunca destino de generación.
const lab025 = JSON.parse(fs.readFileSync(new URL('../../n8n/workflows/comercial/lab025_operacion_interna_protegida_rag_interno.json', import.meta.url), 'utf8'));
const original025 = JSON.parse(execFileSync('git', ['show', '2e95397:n8n/workflows/comercial/lab025_operacion_interna_protegida_rag_interno.json'], { cwd: new URL('../..', import.meta.url), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
check(lab025.active === false, 'LAB-025 inactivo durante construcción');
const internalNodes = new Map(lab025.nodes.map(n => [n.name, n]));
const resultadoNames = ['Leer cita para resultado LAB-027','Validar cita para resultado LAB-027','Leer resultado cita existente LAB-027','Decidir registro resultado cita LAB-027','¿Debe insertar resultado cita LAB-027?','Insertar resultado cita LAB-027','Preparar auditoría resultado cita LAB-027','Insertar auditoría resultado cita LAB-027','Responder registro resultado cita LAB-027'];
const clinicoNames=['Leer cita para seguimiento clínico LAB-027','Leer resultado para seguimiento clínico LAB-027','Validar programación clínica LAB-027','Leer seguimiento clínico existente LAB-027','Decidir programación clínica LAB-027','¿Debe insertar seguimiento clínico LAB-027?','Insertar seguimiento clínico LAB-027','Preparar auditoría programación clínica LAB-027','Insertar auditoría programación clínica LAB-027','Responder programación clínica LAB-027'];
const newNames = ['Buscar tareas seguimiento de la clínica', 'Consolidar tareas seguimiento visibles', 'Responder gestión tareas seguimiento', '¿Cierre humano de seguimiento verificado?', 'Verificar auditoría cierre seguimiento', ...resultadoNames,...clinicoNames];
assert.deepEqual(lab025.nodes.filter(n => !original025.nodes.some(o => o.id === n.id)).map(n => n.name), newNames); checks++;
check(new Set(lab025.nodes.map(n => n.id)).size === lab025.nodes.length && internalNodes.size === lab025.nodes.length, 'identidades LAB-025 únicas');
const guarded = ['Preparar actualización tarea','Consolidar tarea para actualización','Evaluar cambios tarea','Preparar escritura actualización tarea','Consolidar verificación tarea actualizada','Preparar auditoría actualización tarea'];
const responseChanges = ['Responder actualización tarea inválida','Responder tarea no encontrada para actualización','Responder transición tarea inválida','Responder fallo persistencia actualización tarea'];
for (const original of original025.nodes) {
  const current = structuredClone(internalNodes.get(original.name)); check(Boolean(current), 'regresión conserva ' + original.name);
  if (guarded.includes(original.name)) current.parameters.jsCode = current.parameters.jsCode.replace(/^\/\/ LAB027_1G_BEGIN\n[\s\S]*?\/\/ LAB027_1G_END\n/, '').replace('\n  cerrar_tarea_seguimiento: "tarea",', '');
  if (original.name === 'Normalizar solicitud interna LAB-025') current.parameters.jsCode = current.parameters.jsCode.replace('\nconst appointmentId = texto(body.appointment_id);\nconst resultadoAtencion = texto(body.resultado_atencion).toLowerCase();\nconst fechaObjetivo = texto(body.fecha_objetivo);\nconst tipoSeguimiento = texto(body.tipo_seguimiento).toLowerCase();','').replace('\n      appointment_id: appointmentId,\n      resultado_atencion: resultadoAtencion,\n      fecha_objetivo: fechaObjetivo,\n      tipo_seguimiento: tipoSeguimiento,','');
  if (original.name === 'Resolver permiso requerido por acción') current.parameters.jsCode = current.parameters.jsCode.replace('\n  ver_tareas_seguimiento: "seguimientos_ver",\n  cerrar_tarea_seguimiento: "seguimientos_operar",\n  registrar_resultado_cita: "seguimientos_operar",\n  programar_seguimiento_clinico: "seguimientos_clinicos_programar",', '');
  if (original.name === 'Enrutar acción interna autorizada') current.parameters.rules.values = current.parameters.rules.values.slice(0, original.parameters.rules.values.length);
  if (responseChanges.includes(original.name)) {
    // Solo las respuestas guardadas cambian; su contrato previo se evalúa abajo.
    current.parameters = structuredClone(original.parameters);
  }
  assert.deepEqual(current, original, 'regresión conserva implementación previa: ' + original.name); checks++;
}
for (const [name, connection] of Object.entries(original025.connections)) {
  if (name === 'Enrutar acción interna autorizada') assert.deepEqual(lab025.connections[name].main.slice(0, connection.main.length), connection.main);
  else if (name === '¿Persistencia actualización tarea confirmada?') {
    assert.deepEqual(lab025.connections[name].main[1], connection.main[1]);
    assert.deepEqual(lab025.connections['¿Cierre humano de seguimiento verificado?'].main[1], connection.main[0]);
  } else assert.deepEqual(lab025.connections[name], connection, 'regresión conexiones: ' + name);
  checks++;
}
for (const name of responseChanges) for (const sinCambios of [false,true]) {
  const context = { accion:'actualizar_tarea', actualizacion_tarea_sin_cambios:sinCambios, estado_tarea_actual:'en_proceso', estado_objetivo:'cerrada', error_actualizacion_tarea:'prueba' };
  const evaluate = value => typeof value === 'string' && value.startsWith('={{') ? new Function('$json', 'return (' + value.slice(3,-2) + ');')(context) : value;
  const before = original025.nodes.find(n => n.name === name).parameters, after = internalNodes.get(name).parameters;
  assert.deepEqual(evaluate(after.responseBody), evaluate(before.responseBody)); checks++;
  assert.deepEqual(evaluate(after.options.responseCode), evaluate(before.options.responseCode)); checks++;
}
for (const node of lab025.nodes.filter(n => n.type === 'n8n-nodes-base.code')) { new Function(node.parameters.jsCode); checks++; }
const internalRouter = internalNodes.get('Enrutar acción interna autorizada');
assert.deepEqual(internalRouter.parameters.rules.values.slice(-4).map(r => r.outputKey), ['ver_tareas_seguimiento','cerrar_tarea_seguimiento','registrar_resultado_cita','programar_seguimiento_clinico']); checks++;
for (const [action, permission] of [['ver_tareas_seguimiento','seguimientos_ver'],['cerrar_tarea_seguimiento','seguimientos_operar'],['registrar_resultado_cita','seguimientos_operar'],['programar_seguimiento_clinico','seguimientos_clinicos_programar']]) {
  const result = new Function('$input', internalNodes.get('Resolver permiso requerido por acción').parameters.jsCode)({ first: () => ({json:{accion:action}}) });
  check(result[0].json.permiso_requerido === permission, 'permiso explícito: ' + action);
}
const internalReach = (start, end, excluded) => {
  const queue=[start],seen=new Set();
  while(queue.length) { const name=queue.shift(); if(name===excluded || seen.has(name)) continue; if(name===end) return true; seen.add(name);
    for(const output of lab025.connections[name]?.main || []) for(const t of output) queue.push(t.node);
  } return false;
};
for (const target of ['Buscar tareas seguimiento de la clínica','Cerrar tarea']) for (const required of ['¿Identidad interna presente?','¿Usuario interno activo?','Consolidar permisos usuario interno','¿Usuario autorizado para la acción?']) {
  check(!internalReach('Entrada operación interna LAB-025', target, required), 'acción protegida por ' + required);
}
const readTasks = internalNodes.get('Buscar tareas seguimiento de la clínica').parameters;
check(readTasks.matchType === 'allConditions' && readTasks.returnAll === true, 'listado completo conjuntivo');
assert.deepEqual(readTasks.filters.conditions, [{keyName:'clinic_id',keyValue:'={{ $json.clinic_id }}'},{keyName:'creado_por',keyValue:'sistema_lab027'}]); checks++;
const closeTask = internalNodes.get('Cerrar tarea').parameters;
check(closeTask.matchType === 'allConditions', 'cierre humano conjuntivo');
assert.deepEqual(closeTask.filters.conditions.map(c => c.keyName), ['task_id','clinic_id','estado']); checks++;
check(internalNodes.get('Insertar auditoría actualización tarea').parameters.dataTableId.cachedResultName === 'lab025_auditoria_operaciones', 'auditoría existente');
check(lab025.connections['¿Cierre humano de seguimiento verificado?'].main[0][0].node === 'Preparar auditoría actualización tarea', 'nuevo éxito pasa por auditoría');
check(!internalReach('¿Cierre humano de seguimiento verificado?', 'Verificar auditoría cierre seguimiento', 'Insertar auditoría actualización tarea'), 'respuesta nueva requiere persistencia de auditoría');
for (const name of newNames) check(['n8n-nodes-base.code','n8n-nodes-base.if','n8n-nodes-base.dataTable','n8n-nodes-base.respondToWebhook'].includes(internalNodes.get(name).type), 'sin nueva IA/proveedor');
const readResultAppointment=internalNodes.get('Leer cita para resultado LAB-027').parameters;
assert.deepEqual(readResultAppointment.filters.conditions.map(c=>c.keyName),['clinic_id','appointment_id']); checks++;
check(readResultAppointment.dataTableId.value==='lab026_citas','resultado lee cita canónica LAB-026');
const insertResult=internalNodes.get('Insertar resultado cita LAB-027').parameters;
check(insertResult.dataTableId.value==='lab027_seguimientos' && !insertResult.operation,'resultado usa inserción independiente');
assert.deepEqual(insertResult.columns.schema.map(c=>c.id), schemas.lab027_seguimientos.map(c=>c[0])); checks++;
check(internalNodes.get('Insertar auditoría resultado cita LAB-027').parameters.dataTableId.cachedResultName==='lab025_auditoria_operaciones','resultado audita en LAB-025');
for(const fragment of ["c.estado!=='confirmada'","end>now+300000","'resultado_cita'","'post_cita'","rows.length>1","resultado_cita_ya_registrado"])
  check(internalNodes.get(fragment==="c.estado!=='confirmada'"||fragment==='end>now+300000'?'Validar cita para resultado LAB-027':'Decidir registro resultado cita LAB-027').parameters.jsCode.includes(fragment),'control resultado cita: '+fragment);
const validateResultCode=internalNodes.get('Validar cita para resultado LAB-027').parameters.jsCode;
const decideResultCode=internalNodes.get('Decidir registro resultado cita LAB-027').parameters.jsCode;
check(validateResultCode.includes('$("Enrutar acción interna autorizada").first().json'),'clínica procede del contexto autorizado');
check(!validateResultCode.includes('$("Normalizar solicitud interna LAB-025").first().json'),'resultado no vuelve al contexto preautenticación');
for(const fragment of ["if(!clinic)","text(c.clinic_id)!==clinic","JSON.stringify([clinic,appointment,version","id.includes('null')","id.includes('undefined')"])
  check(validateResultCode.includes(fragment),'barrera clínica previa: '+fragment);
for(const fragment of ['const safe=','p.seguimiento_id===expected',"text(r.clinic_id)!==text(p.clinic_id)","motivo:'contexto_clinica_invalido'"])
  check(decideResultCode.includes(fragment),'barrera clínica antes de insertar: '+fragment);
check(!internalReach('Cerrar tarea','Insertar resultado cita LAB-027'),'cerrar tarea no registra no_show');
check(!internalReach('Entrada operación interna LAB-025','Insertar resultado cita LAB-027','¿Debe insertar resultado cita LAB-027?'),'escritura resultado requiere decisión');
const clinicalCode=internalNodes.get('Validar programación clínica LAB-027').parameters.jsCode;
for(const fragment of ["rol).toLowerCase()!=='veterinario'","seguimientos_clinicos_programar","post_tratamiento","post_cirugia","target<=now||target<=end","resultado_cita_duplicado","resultado_no_show","atencion_realizada"])
  check(clinicalCode.includes(fragment),'precondición programación clínica: '+fragment);
const normalizerCode=internalNodes.get('Normalizar solicitud interna LAB-025').parameters.jsCode;
const normalizedClinical=new Function('$input',normalizerCode)({first:()=>({json:{body:{internal_session_id:'sesion',accion:'programar_seguimiento_clinico',appointment_id:'apt',tipo_seguimiento:'post_tratamiento',fecha_objetivo:'2026-09-05T12:00:00-04:00',tipo:'campo_generico_no_clinico'},headers:{}}})})[0].json;
assert.deepEqual([normalizedClinical.appointment_id,normalizedClinical.tipo_seguimiento,normalizedClinical.fecha_objetivo],['apt','post_tratamiento','2026-09-05T12:00:00-04:00']);checks++;
check(normalizedClinical.tipo==='campo_generico_no_clinico','tipo genérico permanece separado');
check(clinicalCode.includes('text(s.tipo_seguimiento).toLowerCase()'),'validación consume tipo_seguimiento normalizado');
check(!clinicalCode.includes('tipo=text(s.tipo).toLowerCase()'),'validación no consume tipo genérico');
const clinicalExisting=internalNodes.get('Leer seguimiento clínico existente LAB-027').parameters;
for(const field of ['clinic_id','appointment_id','appointment_version','tipo_seguimiento'])check(clinicalExisting.filters.conditions.some(c=>c.keyName===field&&String(c.keyValue).includes(field)),'campo preservado hasta decisión: '+field);
for(const field of ['clinic_id','appointment_id','appointment_version','tipo_seguimiento','fecha_objetivo'])check(internalNodes.get('Decidir programación clínica LAB-027').parameters.jsCode.includes('p.'+field),'decisión conserva campo obligatorio: '+field);
const clinicalDecision=internalNodes.get('Decidir programación clínica LAB-027').parameters.jsCode;
for(const fragment of ["'post_atencion'","rows.length>1","ya_programado","fecha_objetivo_en_conflicto"])
  check(clinicalDecision.includes(fragment),'idempotencia programación clínica: '+fragment);
check(!internalReach('Cerrar tarea','Insertar seguimiento clínico LAB-027'),'cierre de tarea no programa seguimiento clínico');
check(!internalReach('Entrada operación interna LAB-025','Insertar seguimiento clínico LAB-027','¿Debe insertar seguimiento clínico LAB-027?'),'programación requiere decisión explícita');
check(lab025.nodes.filter(n => n.parameters.resource === 'table').length === original025.nodes.filter(n => n.parameters.resource === 'table').length, 'cero nuevas tablas LAB-025');
assert.deepEqual(lab025.nodes.find(n => n.name === 'Insertar tarea').parameters.columns.schema.map(c => c.id), taskColumns); checks++;
check(lab025.nodes.find(n => n.name === 'Insertar tarea').parameters.columns.schema.every(c => c.type === 'string'), 'tipos de LAB-025 respetados');
check(operations.filter(n => n.parameters.dataTableId.value === 'lab025_tareas' && n.parameters.operation === 'insert').length === 2, 'dos inserciones de tareas conocidas sin upsert');
const reachesWithout = (start, end, excluded) => {
  const queue = [start], seen = new Set();
  while (queue.length) {
    const name = queue.shift(); if (name === excluded || seen.has(name)) continue;
    if (name === end) return true;
    seen.add(name);
    for (const output of workflow.connections[name]?.main || []) for (const target of output) queue.push(target.node);
  }
  return false;
};
for (const required of ['Releer seguimientos para contacto LAB-027', 'Releer citas para contacto LAB-027',
  'Buscar tareas existentes contacto LAB-027', 'Planificar contacto final LAB-027', 'Adquirir contacto LAB-027',
  'Verificar adquisición contacto LAB-027', 'Releer seguimiento adquirido contacto LAB-027',
  'Releer cita adquirida contacto LAB-027', 'Releer tareas antes de insertar LAB-027', 'Preparar inserción única tarea LAB-027']) {
  check(!reachesWithout(schedulers[0].name, 'Insertar tarea humana LAB-027', required), 'inserción exige ' + required);
}
check(reachesWithout(schedulers[0].name, 'Insertar tarea humana LAB-027', ''), 'tarea alcanzable desde scheduler');
check(!byName.get('Adquirir contacto LAB-027').alwaysOutputData, 'CAS perdido no permite insertar');
check(!reachesWithout('Insertar tarea humana LAB-027', 'Persistir contacto humano LAB-027', 'Verificar tareas persistidas LAB-027'), 'contacto humano requiere tarea comprobada');
check(!reachesWithout(schedulers[0].name, 'Enlazar tarea existente LAB-027', 'Buscar tareas existentes contacto LAB-027'), 'reutilización verifica existencia');
check(!reachesWithout('Recibir respuesta normalizada LAB-027', 'Cerrar tarea por respuesta LAB-027', 'Respuesta requiere cierre tarea LAB-027'), 'cierre solo después del filtro de respuesta clara');
check(byName.get('Respuesta requiere cierre tarea LAB-027').parameters.conditions.conditions[0].leftValue === '={{ ["si","no"].includes($json.patch.respuesta_tipo) && Boolean($json.seguimiento.tarea_id) }}', 'ambiguo y pregunta no cierran tarea');
check(!reachesWithout('Cerrar tarea por respuesta LAB-027', 'Persistir respuesta del tutor LAB-027', 'Verificar cierre tarea tardía LAB-027'), 'respuesta requiere verificar cierre');
for (const [field, expression] of [['task_id', '={{ $json.seguimiento.tarea_id }}'], ['clinic_id', '={{ $json.seguimiento.clinic_id }}']]) {
  check(byName.get('Buscar tarea respuesta tardía LAB-027').parameters.filters.conditions.some(c => c.keyName === field && c.keyValue === expression), 'cierre correlaciona ' + field);
}
check(!reachesWithout('Releer seguimientos para contacto LAB-027', calls[0].name, ''), 'falta de respuesta no envía segundo recordatorio');
const contactPlanner=byName.get('Planificar contacto final LAB-027').parameters.jsCode;
for(const fragment of ["s.etapa !== '24h'",'sent + 2 * 60 * 60 * 1000',"'sin_respuesta_24h'", "c.estado !== 'confirmada'"])
  check(contactPlanner.includes(fragment),'regla de contacto humano explícita: '+fragment);
check(!reachesWithout('Releer seguimientos para contacto LAB-027','Invocar adaptador simulado LAB-027',''),'ruta de contacto humano nunca alcanza adaptador');
check(operations.filter(n=>n.parameters.dataTableId.value==='lab025_tareas'&&n.parameters.operation==='insert').length===2,'inserciones de tarea limitadas a contacto y revisión clínica');
check(byName.get('Insertar tarea humana LAB-027').parameters.columns.value.clinic_id==='={{ $json.tarea.clinic_id }}','tarea conserva clinic_id planificado');
const clinicalNames=['Leer seguimientos clínicos pendientes LAB-027','Leer citas para envío clínico LAB-027','Leer instrucciones para envío clínico LAB-027','Planificar envío clínico LAB-027','Enrutar envío clínico LAB-027','Adquirir envío clínico LAB-027','Marcar revisión envío clínico LAB-027','Verificar adquisición envío clínico LAB-027','Invocar adaptador para seguimiento clínico LAB-027','Resolver resultado envío clínico LAB-027','Persistir resultado envío clínico LAB-027','Preparar auditoría envío clínico LAB-027','Insertar auditoría envío clínico LAB-027'];
for(const name of clinicalNames)check(names.has(name),'nodo envío clínico presente: '+name);
const clinicalPlanCode=byName.get('Planificar envío clínico LAB-027').parameters.jsCode;
for(const fragment of ['post_tratamiento','post_cirugia','post_atencion','requiere_revision_humana','envio_previo_sin_confirmacion','instruccion_no_disponible','instrucciones_duplicadas','seguimiento_clinico'])check(clinicalPlanCode.includes(fragment),'contrato envío clínico: '+fragment);
const clinicalResultCode=byName.get('Resolver resultado envío clínico LAB-027').parameters.jsCode;
for(const fragment of ['contactado','envio_aceptado','envio_rechazado','envio_incierto'])check(clinicalResultCode.includes(fragment),'resultado envío clínico: '+fragment);
check(workflow.connections['Planificar cada 30 minutos LAB-027'].main[0].some(e=>e.node==='Leer seguimientos clínicos pendientes LAB-027'),'scheduler único inicia rama clínica');
check(!reachesWithout('Planificar cada 30 minutos LAB-027','Invocar adaptador para seguimiento clínico LAB-027','Verificar adquisición envío clínico LAB-027'),'adaptador clínico exige adquisición verificada');
const clinicalAudit=byName.get('Insertar auditoría envío clínico LAB-027');
check(clinicalAudit.parameters.dataTableId.value==='lab025_auditoria_operaciones','auditoría clínica reutiliza LAB-025');
assert.deepEqual(lab024,construirIntegracionLab024(lab024));checks++;
const lab024IntegrationNames=new Set(['Entrada interna posible urgencia LAB-027','Validar contrato interno LAB-027 en LAB-024','Contrato interno LAB-027 válido','Rechazar contrato interno LAB-027','Buscar alerta interna LAB-027','Buscar historial interno LAB-027','Buscar alerta operativa interna LAB-027','Planificar recepción interna LAB-027','Enrutar recepción interna LAB-027','Devolver recepción interna existente LAB-027','Devolver recepción interna no aceptada LAB-027','Insertar alerta interna LAB-027','Insertar historial interno LAB-027','Insertar alerta operativa interna LAB-027','Verificar alerta interna LAB-027','Verificar historial interno LAB-027','Verificar alerta operativa interna LAB-027','Confirmar recepción interna LAB-027']);
check(lab024.nodes.length===18&&lab024.nodes.filter(n=>n.type==='n8n-nodes-base.code').length===6,'LAB-024 interno conserva conteo esperado 18/6');
check(lab024.active===true&&lab024.id===LAB024_RUNTIME_WORKFLOW_ID,'LAB-024 activo con ID runtime intacto');
check(new Set(lab024.nodes.map(n=>n.name)).size===lab024.nodes.length&&new Set(lab024.nodes.map(n=>n.id)).size===lab024.nodes.length,'LAB-024 nombres e IDs únicos');
const lab024Names=new Set(lab024.nodes.map(n=>n.name)),lab024Incoming=new Set();
for(const [source,c] of Object.entries(lab024.connections)){check(lab024Names.has(source),'origen LAB-024 existente');for(const outputs of Object.values(c))for(const output of outputs)for(const edge of output){check(lab024Names.has(edge.node),'destino LAB-024 existente');lab024Incoming.add(edge.node);}}
check(lab024.nodes.every(n=>n.type==='n8n-nodes-base.executeWorkflowTrigger'||lab024Incoming.has(n.name)),'LAB-024 interno sin nodos huérfanos');
for(const n of lab024.nodes.filter(n=>lab024IntegrationNames.has(n.name))){check(['n8n-nodes-base.executeWorkflowTrigger','n8n-nodes-base.code','n8n-nodes-base.if','n8n-nodes-base.switch','n8n-nodes-base.dataTable'].includes(n.type),'tipo interno LAB-024 controlado');check(n.type!=='n8n-nodes-base.wait'&&!n.credentials&&!n.retryOnFail,'integración LAB-024 sin Wait, credencial ni retry');if(n.type==='n8n-nodes-base.code'){new Function(n.parameters.jsCode);checks++;check(!/respuesta_texto|Math\.random|fetch\s*\(|require\s*\(/.test(n.parameters.jsCode),'Code interno LAB-024 sin texto libre, azar ni red');}}
check(lab024.nodes.every(n=>lab024IntegrationNames.has(n.name)),'LAB-024 runtime contiene solo recepción interna');
check(lab024.nodes.filter(n=>n.type==='n8n-nodes-base.webhook'||n.type==='n8n-nodes-base.n8nTrigger'||n.type==='n8n-nodes-base.wait').length===0,'LAB-024 interno sin webhook, inicio n8n ni Wait');
check(lab024.nodes.filter(n=>n.type==='n8n-nodes-base.executeWorkflowTrigger').length===1,'entrada interna LAB-024 única');
const internalTables=lab024.nodes.filter(n=>lab024IntegrationNames.has(n.name)&&n.type==='n8n-nodes-base.dataTable');
check(internalTables.every(n=>['lab024_alertas_urgencia','lab024_intentos_notificacion','lab025_alertas_operacion'].includes(n.parameters.dataTableId.cachedResultName)),'integración solo reutiliza tablas existentes');
check(internalTables.filter(n=>!n.parameters.operation).length===3&&internalTables.filter(n=>n.parameters.operation==='get').length===6,'tres inserciones y seis verificaciones internas');
check(crypto.createHash('sha256').update(fs.readFileSync(new URL('../../n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json',import.meta.url))).digest('hex')==='cf11e321b995438eb07fcb33f30e647d4e24e62447943fa92a835daafdd3239a','LAB-026 protegido intacto');
check(lab026.active===true&&lab026.nodes.length===303,'LAB-026 activo conserva workflow cerrado');
const lab026Hooks=lab026.nodes.filter(n=>n.type==='n8n-nodes-base.webhook');
check(lab026Hooks.length===1&&lab026Hooks[0].parameters.path==='vetatiende-comercial-chat-lab024','LAB-026 conserva único webhook público comercial');
for(const name of ['Evaluar reglas deterministas urgencia','Preparar episodio y alerta urgencia','Registrar alerta urgencia','Enviar alerta Telegram urgencia intento 1','Enviar alerta Telegram urgencia intento 2','Responder posible urgencia'])check(lab026.nodes.some(n=>n.name===name),'LAB-026 conserva autoridad pública de urgencias: '+name);
const simultaneous=[['LAB-026',lab026],['LAB-024 interno',lab024],['LAB-027 núcleo',workflow],['LAB-027 adaptador',adapter]],webhookOwners=new Map();
for(const [owner,w] of simultaneous)for(const hook of w.nodes.filter(n=>n.type==='n8n-nodes-base.webhook')){const key=(hook.parameters.httpMethod||'GET')+' /webhook/'+hook.parameters.path;check(!webhookOwners.has(key),'sin conflicto webhook '+key+' entre '+owner+' y '+(webhookOwners.get(key)||''));webhookOwners.set(key,owner);}
check(webhookOwners.get('POST /webhook/vetatiende-comercial-chat-lab024')==='LAB-026','LAB-026 es único propietario del webhook público');
check(JSON.stringify(lab024.nodes.filter(n=>lab024IntegrationNames.has(n.name))).includes('prioridad_inmediata'),'prioridad absoluta explícita en recepción interna');
check(JSON.stringify(lab024.nodes.filter(n=>lab024IntegrationNames.has(n.name))).includes("origen!=='sistema_lab027'"),'origen sistema LAB-027 validado');
for(const name of ['Planificar recepción interna LAB-027','Confirmar recepción interna LAB-027'])
  check(lab024.nodes.find(n=>n.name===name).parameters.jsCode.includes('const idsUrgenciaLab024='),'Code LAB-024 autocontenido incluye generador de IDs: '+name);
const logic = probarLogica();
checks += logic.checks;
console.log(JSON.stringify({ ok: true, nodes: workflow.nodes.length,
  code_nodes: workflow.nodes.filter(node => node.type === 'n8n-nodes-base.code').length,
  tables: tables.map(node => node.parameters.tableName), scheduler_minutes: 30,
  adapter_nodes: adapter.nodes.length, adapter_code_nodes: adapter.nodes.filter(node => node.type === 'n8n-nodes-base.code').length,
  lab024_nodes:lab024.nodes.length,lab024_code_nodes:lab024.nodes.filter(node=>node.type==='n8n-nodes-base.code').length,
  checks, logic_checks: logic.checks }, null, 2));
