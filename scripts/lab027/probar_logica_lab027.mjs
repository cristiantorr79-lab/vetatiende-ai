import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirWorkflow, planificarSeguimientos, schemas, simularCanal, construirAdaptador, prepararEnvio, resolverResultado,
  validarContratoRespuesta, procesarRespuesta, comprobarRespuestaPersistida, planificarContacto, tareaId, prepararCierreTarea,
  registrarResultadoCita, programarSeguimientoClinico, planificarEnvioClinico, resolverEnvioClinico, tareaRespuestaClinicaId,
  prepararTareaRespuestaClinica, prepararContratoUrgenciaLab024, resolverDerivacionUrgenciaLab024,
  validarContratoUrgenciaLab024, planificarRecepcionUrgenciaLab024, idsUrgenciaLab024, construirIntegracionLab024, lab024Path,
  CORE_RUNTIME_WORKFLOW_ID, ADAPTER_RUNTIME_WORKFLOW_ID, LAB024_RUNTIME_WORKFLOW_ID } from './generar_workflows_lab027.mjs';

export function probarLogica() {
  let checks = 0;
  const check = (name, test) => { test(); checks++; };
  const ahora = '2026-09-01T12:00:00.000Z';
  const cita = { clinic_id: 'clinica_piloto_001', appointment_id: 'apt_lab027_test_001', version: 1,
    estado: 'confirmada', service_id: 'servicio_prueba', start_time: '2026-09-05T12:00:00.000Z',
    nombre_tutor: 'Tutor Prueba', nombre_mascota: 'Mascota Prueba', telefono_normalizado: '+56911111111' };
  const config = { clinic_id: cita.clinic_id, service_id: cita.service_id, instruccion_id: 'ins_lab027_test_001',
    categoria_atencion: 'rutina', activo: 'true', instrucciones: 'Texto ficticio autorizado para prueba técnica; sin indicaciones clínicas.',
    recordatorio_72h: 'true', recordatorio_48h: 'true', recordatorio_24h: 'true' };
  const input = (overrides = {}) => ({ citas: [cita], instrucciones: [config], existentes: [], ahora, ...overrides });
  const base = planificarSeguimientos(input());
  for (const [category, hours] of [['rutina', [24]], ['examen_procedimiento', [48, 24]], ['cirugia', [72, 24]]]) {
    check(category + ': etapas exactas y fechas', () => {
      const result = planificarSeguimientos(input({ instrucciones: [{ ...config, categoria_atencion: category }] }));
      assert.deepEqual(result.seguimientos.map(row => row.etapa).sort(), hours.map(h => h + 'h').sort());
      for (const row of result.seguimientos) {
        assert.equal(Date.parse(row.fecha_objetivo), Date.parse(cita.start_time) - Number(row.etapa.slice(0, -1)) * 3600000);
        assert.equal(row.estado, 'pendiente_envio');
        assert.equal(row.tipo_seguimiento, 'pre_cita');
      }
    });
  }
  check('repetición conserva identidades y salida', () => assert.deepEqual(planificarSeguimientos(input()), base));
  check('reloj no forma parte de la identidad', () => {
    const row = planificarSeguimientos(input({ ahora: '2026-09-01T12:30:00.000Z' })).seguimientos[0];
    assert.equal(row.seguimiento_id, base.seguimientos[0].seguimiento_id);
    assert.equal(row.envio_id, base.seguimientos[0].envio_id);
  });
  check('repetición con filas persistidas no crea filas ni modifica existentes', () => {
    for (const estado of ['pendiente_envio', 'enviando', 'enviado', 'confirmado', 'cerrado', 'resultado_incierto']) {
      const rows = [{ ...base.seguimientos[0], estado }];
      const before = structuredClone(rows);
      assert.equal(planificarSeguimientos(input({ existentes: rows })).seguimientos.length, 0);
      assert.deepEqual(rows, before);
    }
  });
  check('nueva versión cambia seguimiento y envío; propone invalidación futura', () => {
    const result = planificarSeguimientos(input({ citas: [{ ...cita, version: 2 }], existentes: base.seguimientos }));
    assert.notEqual(result.seguimientos[0].seguimiento_id, base.seguimientos[0].seguimiento_id);
    assert.notEqual(result.seguimientos[0].envio_id, base.seguimientos[0].envio_id);
    assert.equal(result.invalidaciones[0].motivo, 'version_obsoleta');
    assert.equal(result.invalidaciones[0].seguimiento_id, base.seguimientos[0].seguimiento_id);
  });
  check('no invalida envíos inciertos ni objetivos pasados', () => {
    for (const row of [{ ...base.seguimientos[0], estado: 'enviando' },
      { ...base.seguimientos[0], fecha_objetivo: '2026-08-31T00:00:00Z' }]) {
      assert.equal(planificarSeguimientos(input({ citas: [{ ...cita, version: 2 }], existentes: [row] })).invalidaciones.length, 0);
    }
  });
  check('cita no confirmada no genera; solo propone cierre', () => {
    for (const estado of ['cancelada', 'reprogramacion_en_curso', 'requiere_revision', '']) {
      const result = planificarSeguimientos(input({ citas: [{ ...cita, estado }], existentes: base.seguimientos }));
      assert.equal(result.seguimientos.length, 0);
      assert.equal(result.invalidaciones[0].motivo, 'cita_no_confirmada');
    }
  });
  check('servicio desconocido no infiere por nombre', () => {
    const result = planificarSeguimientos(input({ citas: [{ ...cita, service_id: 'desconocido', nombre_servicio: 'Cirugía' }] }));
    assert.equal(result.seguimientos.length, 0);
    assert.equal(result.revision[0].motivo, 'servicio_sin_configuracion_activa');
    assert.equal(Object.hasOwn(result.revision[0], 'categoria_atencion'), false);
  });
  check('activo requiere string true explícito', () => {
    for (const activo of ['false', '', 'sí', true]) {
      assert.equal(planificarSeguimientos(input({ instrucciones: [{ ...config, activo }] })).seguimientos.length, 0);
    }
  });
  check('clínica cambia identidad y aísla catálogo', () => {
    const other = { ...cita, clinic_id: 'clinica_piloto_002' };
    assert.equal(planificarSeguimientos(input({ citas: [other] })).seguimientos.length, 0);
    const row = planificarSeguimientos(input({ citas: [other], instrucciones: [{ ...config, clinic_id: other.clinic_id }] })).seguimientos[0];
    assert.notEqual(row.seguimiento_id, base.seguimientos[0].seguimiento_id);
    assert.notEqual(row.envio_id, base.seguimientos[0].envio_id);
  });
  check('identidad codifica la tupla completa sin colisiones por separadores', () => {
    const row = base.seguimientos[0];
    const parts = [cita.clinic_id, cita.appointment_id, 1, 'pre_cita', '24h'];
    assert.deepEqual(JSON.parse(decodeURIComponent(row.seguimiento_id.slice('seg_lab027_'.length))), parts);
    assert.deepEqual(JSON.parse(decodeURIComponent(row.envio_id.slice('env_lab027_'.length))), parts);
    const make = (clinic, appointment) => planificarSeguimientos(input({
      citas: [{ ...cita, clinic_id: clinic, appointment_id: appointment }],
      instrucciones: [{ ...config, clinic_id: clinic }],
    })).seguimientos[0].seguimiento_id;
    assert.notEqual(make('a::b', 'c'), make('a', 'b::c'));
  });
  check('sin PII ni copia de campos canónicos', () => {
    const forbidden = ['nombre_tutor', 'nombre_mascota', 'telefono', 'telefono_normalizado', 'start_time', 'end_time', 'service_id', 'nombre_servicio'];
    for (const field of forbidden) {
      assert.equal(schemas.lab027_seguimientos.some(([name]) => name === field), false);
      assert.equal(Object.hasOwn(base.seguimientos[0], field), false);
    }
    for (const value of ['Tutor Prueba', 'Mascota Prueba', '+56911111111']) assert.equal(JSON.stringify(base).includes(value), false);
  });
  check('no inventa instrucciones ni categoría', () => {
    for (const override of [{ instrucciones: '' }, { categoria_atencion: 'otra' }, { instruccion_id: '' }]) {
      assert.equal(planificarSeguimientos(input({ instrucciones: [{ ...config, ...override }] })).seguimientos.length, 0);
    }
  });
  check('catálogo activo ambiguo bloquea generación', () => {
    const result = planificarSeguimientos(input({ instrucciones: [config, { ...config, instruccion_id: 'otra' }] }));
    assert.equal(result.seguimientos.length, 0);
    assert.equal(result.revision[0].motivo, 'configuracion_activa_ambigua');
  });
  check('banderas solo restringen política base', () => {
    assert.equal(base.seguimientos.length, 1); // rutina ignora 48h y 72h aunque estén habilitados
    assert.equal(planificarSeguimientos(input({ instrucciones: [{ ...config, recordatorio_24h: 'false' }] })).seguimientos.length, 0);
  });
  check('no acumula etapas vencidas', () => {
    const result = planificarSeguimientos(input({ ahora: '2026-09-05T00:00:00Z' }));
    assert.equal(result.seguimientos.length, 0);
    assert.equal(result.revision[0].motivo, 'etapa_vencida');
  });
  check('cita y versión inválidas no habilitan recordatorios', () => {
    for (const override of [{ version: 0 }, { version: 1.5 }, { version: true }, { start_time: 'inválida' }, { start_time: '2026-09-05T12:00:00' }]) {
      assert.equal(planificarSeguimientos(input({ citas: [{ ...cita, ...override }] })).seguimientos.length, 0);
    }
    assert.throws(() => planificarSeguimientos(input({ ahora: 'inválido' })), /Reloj/);
  });
  check('citas canónicas duplicadas bloquean generación', () => assert.equal(planificarSeguimientos(input({ citas: [cita, cita] })).seguimientos.length, 0));
  check('entradas vacías no producen filas', () => assert.deepEqual(planificarSeguimientos({ ahora, citas: [{}], instrucciones: [{}], existentes: [{}] }), { seguimientos: [], revision: [], invalidaciones: [] }));
  check('función no modifica sus entradas', () => {
    const data = input(); const before = structuredClone(data); planificarSeguimientos(data); assert.deepEqual(data, before);
  });
  check('Code node ejecutable reproduce función pura', () => {
    const workflow = construirWorkflow();
    const code = workflow.nodes.find(node => node.name === 'Calcular plan determinista LAB-027').parameters.jsCode;
    const result = new Function('$', '$input', '$now', code)(
      name => ({ all: () => (name === 'Leer citas confirmadas LAB-026' ? [cita] : [config]).map(json => ({ json })) }),
      { all: () => [] }, { toISO: () => ahora },
    );
    assert.deepEqual(result[0].json, base);
    const flatten = workflow.nodes.find(node => node.name === 'Preparar filas nuevas LAB-027').parameters.jsCode;
    assert.deepEqual(new Function('$input', flatten)({ first: () => result[0] }), base.seguimientos.map(json => ({ json })));
  });
  const envio = { accion: 'enviar', clinic_id: 'clinica_piloto_001', seguimiento_id: 'seg_lab027_test_001',
    envio_id: 'env_lab027_test_001', appointment_id: 'apt_lab027_test_001', destino: 'destino_ficticio_001',
    tipo_comunicacion: 'recordatorio_pre_cita', contenido: 'Recordatorio ficticio de prueba. ¿Confirmas tu asistencia?', fecha_envio: ahora };
  const sendKeys = ['ok', 'status', 'envio_id', 'message_id', 'fecha_resultado', 'error_code'].sort();
  for (const status of ['accepted', 'rejected', 'uncertain']) {
    check('simulador conserva ' + status, () => {
      const result = simularCanal({ ...envio, modo_resultado: status }, ahora);
      assert.equal(result.status, status);
      assert.equal(result.ok, status === 'accepted');
      assert.equal(result.error_code, status === 'accepted' ? '' : 'simulado_' + status);
      assert.deepEqual(Object.keys(result).sort(), sendKeys);
    });
  }
  check('simulador accepted predeterminado sin session_id', () => assert.equal(simularCanal(envio, ahora).status, 'accepted'));
  check('message_id estable por clínica y envío incluso con otro reloj o modo', () => {
    const result = simularCanal(envio, ahora);
    for (const modo_resultado of ['accepted', 'rejected', 'uncertain']) {
      assert.equal(simularCanal({ ...envio, modo_resultado }, '2026-09-01T13:00:00Z').message_id, result.message_id);
    }
    assert.deepEqual(JSON.parse(decodeURIComponent(result.message_id.slice('sim_lab027_'.length))), [envio.clinic_id, envio.envio_id]);
  });
  check('distinto envio_id cambia message_id', () => assert.notEqual(simularCanal({ ...envio, envio_id: 'env_lab027_test_002' }, ahora).message_id, simularCanal(envio, ahora).message_id));
  check('distinta clínica cambia message_id', () => assert.notEqual(simularCanal({ ...envio, clinic_id: 'clinica_piloto_002' }, ahora).message_id, simularCanal(envio, ahora).message_id));
  check('ausencias y campos vacíos producen rechazo controlado', () => {
    for (const field of ['clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id', 'destino', 'tipo_comunicacion', 'contenido', 'fecha_envio']) {
      for (const value of [undefined, '']) {
        const request = { ...envio }; if (value === undefined) delete request[field]; else request[field] = value;
        const result = simularCanal(request, ahora);
        assert.equal(result.status, 'rejected'); assert.equal(result.ok, false);
        assert.deepEqual(Object.keys(result).sort(), sendKeys);
      }
    }
  });
  const response = { accion: 'simular_respuesta', clinic_id: envio.clinic_id, seguimiento_id: envio.seguimiento_id,
    envio_id: envio.envio_id, appointment_id: envio.appointment_id, appointment_version: 1 };
  for (const [declared, normalized] of [[' Sí ', 'si'], ['NO', 'no'], ['ambiguo', 'ambiguo'], ['pregunta', 'pregunta'], ['sin_respuesta', 'sin_respuesta']]) {
    check('normaliza respuesta explícita: ' + declared, () => {
      const result = simularCanal({ ...response, respuesta_tipo: declared }, ahora);
      assert.deepEqual(result, { clinic_id: envio.clinic_id, seguimiento_id: envio.seguimiento_id, envio_id: envio.envio_id,
        appointment_id: envio.appointment_id, appointment_version: 1,
        respuesta_tipo: normalized, respuesta_texto: '', fecha_respuesta: ahora });
    });
  }
  check('respuesta no interpreta síntomas ni reclasifica texto', () => {
    const text = 'Texto ficticio: no puede respirar. No confirmar.';
    const result = simularCanal({ ...response, respuesta_tipo: 'pregunta', respuesta_texto: text }, ahora);
    assert.equal(result.respuesta_tipo, 'pregunta'); assert.equal(result.respuesta_texto, text);
    assert.equal(Object.hasOwn(result, 'prioridad'), false);
    assert.equal(simularCanal({ ...response, respuesta_tipo: 'urgencia', respuesta_texto: text }, ahora).status, 'rejected');
  });
  check('rechaza session_id y campos clínicos o secretos adicionales', () => {
    for (const field of ['session_id', 'diagnostico', 'medicacion', 'historia_clinica', 'access_token', 'authorization']) {
      assert.equal(simularCanal({ ...envio, [field]: 'valor_ficticio' }, ahora).error_code, 'campo_no_permitido');
    }
  });
  check('rechaza patrones de secretos sin reflejarlos', () => {
    for (const content of ['Bearer token_ficticio_no_real', 'api_key=credencial_ficticia', 'password=ficticio', '-----BEGIN PRIVATE KEY-----']) {
      const result = simularCanal({ ...envio, contenido: content }, ahora);
      assert.equal(result.error_code, 'secreto_no_permitido'); assert.equal(JSON.stringify(result).includes(content), false);
    }
    assert.equal(simularCanal({ ...response, respuesta_tipo: 'pregunta', respuesta_texto: 'access_token=ficticio' }, ahora).status, 'rejected');
  });
  check('no presenta appointment_id en contenido de cliente', () => assert.equal(simularCanal({ ...envio, contenido: 'Escribe ' + envio.appointment_id }, ahora).error_code, 'identificador_en_contenido'));
  check('rechaza acciones, modos, fechas y tipos inválidos', () => {
    for (const request of [null, [], {}, { ...envio, accion: 'otro' }, { ...envio, modo_resultado: 'éxito' },
      { ...envio, destino: {} }, { ...envio, fecha_envio: 'sin fecha' }, { ...response, respuesta_tipo: 'tal vez' },
      { ...response, respuesta_tipo: 'sin_respuesta', respuesta_texto: 'Sí' }]) {
      assert.equal(simularCanal(request, ahora).status, 'rejected');
    }
    assert.throws(() => simularCanal(envio, 'sin reloj'), /Reloj/);
  });
  check('adaptador no muta entradas ni mantiene estado entre llamadas', () => {
    const before = structuredClone(envio);
    const first = simularCanal(envio, ahora); simularCanal({ ...envio, modo_resultado: 'uncertain' }, ahora);
    assert.deepEqual(simularCanal(envio, ahora), first); assert.deepEqual(envio, before);
    assert.equal(/Math\.random|randomUUID|\$getWorkflowStaticData/.test(simularCanal.toString()), false);
  });
  check('Code del adaptador respeta body y contratos de ambas acciones', () => {
    const code = construirAdaptador().nodes.find(node => node.type === 'n8n-nodes-base.code').parameters.jsCode;
    const run = new Function('$json', '$now', code);
    for (const body of [envio, { ...envio, modo_resultado: 'uncertain' }, { ...response, respuesta_tipo: 'si' }]) {
      assert.deepEqual(run({ body }, { toISO: () => ahora }).json, simularCanal(body, ahora));
    }
    assert.equal(run({ query: envio }, { toISO: () => ahora }).json.status, 'rejected');
  });
  const due = '2026-09-04T12:00:00.000Z';
  const pending = base.seguimientos[0];
  const prepare = (seguimiento = pending, citas = [cita], instrucciones = [config]) => prepararEnvio({ seguimiento, citas, instrucciones, ahora: due });
  // Modelo de persistencia en memoria con el mismo contrato CAS de los nodos Update.
  const workflowD = construirWorkflow();
  const byName = new Map(workflowD.nodes.map(n => [n.name, n]));
  const cas = (row, plan, name) => {
    const params = byName.get(name).parameters;
    assert.equal(params.matchType, 'allConditions');
    const values = params.filters.conditions.map(f => [f.keyName,
      f.keyValue.startsWith('={{') ? plan.seguimiento[f.keyValue.match(/seguimiento\.(\w+)/)[1]] : f.keyValue]);
    if (!values.every(([k, v]) => row[k] === v)) return false;
    for (const field of Object.keys(params.columns.value)) row[field] = plan.patch[field];
    return true;
  };
  const cycle = (row, mode = 'accepted', citas = [cita], instrucciones = [config], intervene = () => {}) => {
    const events = [];
    const plan = prepare(structuredClone(row), citas, instrucciones);
    if (plan.accion === 'omitir') return events;
    if (plan.accion === 'cerrar') { cas(row, plan, 'Cerrar pendiente no vigente LAB-027'); return events; }
    intervene(row);
    if (!cas(row, plan, 'Persistir enviando antes del adaptador LAB-027')) return events;
    events.push('persistir_enviando');
    assert.equal(row.estado, 'enviando');
    const claimed = structuredClone(row);
    events.push('adaptador');
    const result = simularCanal({ ...plan.contrato, modo_resultado: mode }, due);
    const patch = resolverResultado(claimed, result, due);
    assert.equal(result.envio_id, row.envio_id);
    const updated = cas(row, { seguimiento: claimed, patch }, patch.estado === 'enviado' ? 'Persistir resultado enviado LAB-027' : 'Persistir fallo o incertidumbre LAB-027');
    assert.equal(updated, true);
    events.push('persistir_resultado');
    return events;
  };
  for (const [status, state] of [['accepted', 'enviado'], ['rejected', 'fallido'], ['uncertain', 'resultado_incierto']]) {
    check('ciclo integrado ' + status + ' → ' + state, () => {
      const row = structuredClone(pending);
      assert.deepEqual(cycle(row, status), ['persistir_enviando', 'adaptador', 'persistir_resultado']);
      assert.equal(row.estado, state); assert.equal(row.envio_id, pending.envio_id);
      assert.equal(row.updated_at, due); assert.equal(row.enviado_at, status === 'accepted' ? due : '');
      assert.deepEqual(cycle(row, status), []); // repetición del scheduler
      assert.equal(row.estado, state);
    });
  }
  for (const estado of ['resultado_incierto', 'enviado', 'fallido', 'enviando', 'confirmado', 'cerrado']) {
    check('ningún reenvío automático desde ' + estado, () => {
      const row = { ...pending, estado }; const before = structuredClone(row);
      assert.deepEqual(cycle(row), []); assert.deepEqual(row, before);
    });
  }
  check('versión antigua se cierra sin envío y la nueva tiene otra identidad', () => {
    const row = structuredClone(pending);
    assert.deepEqual(cycle(row, 'accepted', [{ ...cita, version: 2 }]), []);
    assert.equal(row.estado, 'cerrado'); assert.equal(row.closed_at, due);
    assert.notEqual(planificarSeguimientos(input({ citas: [{ ...cita, version: 2 }] })).seguimientos[0].seguimiento_id, row.seguimiento_id);
  });
  check('cancelación y cita no confirmada cierran sin modificar la cita', () => {
    for (const estado of ['cancelada', 'reprogramacion_en_curso', 'requiere_revision']) {
      const current = { ...cita, estado }; const before = structuredClone(current); const row = structuredClone(pending);
      assert.deepEqual(cycle(row, 'accepted', [current]), []);
      assert.equal(row.estado, 'cerrado'); assert.deepEqual(current, before);
    }
  });
  check('clínica/appointment ajenos no habilitan comunicación', () => {
    for (const override of [{ clinic_id: 'clinica_piloto_002' }, { appointment_id: 'apt_otro' }]) {
      const row = structuredClone(pending); assert.deepEqual(cycle(row, 'accepted', [{ ...cita, ...override }]), []);
      assert.equal(row.estado, 'pendiente_envio');
    }
  });
  check('instrucción activa vigente obligatoria', () => {
    for (const override of [{ activo: 'false' }, { instruccion_id: 'ins_otra' }, { instrucciones: '' },
      { categoria_atencion: 'cirugia' }, { recordatorio_24h: 'false' }]) {
      assert.equal(prepare(pending, [cita], [{ ...config, ...override }]).accion, 'omitir');
    }
    assert.equal(prepare(pending, [cita], []).accion, 'omitir');
  });
  check('identidad manipulada se rechaza antes de adquisición', () => {
    for (const override of [{ seguimiento_id: 'otro' }, { envio_id: 'otro' }, { etapa: '48h' }]) {
      assert.equal(prepare({ ...pending, ...override }).accion, 'omitir');
    }
  });
  check('fecha objetivo debe corresponder a la cita y estar vencida', () => {
    assert.equal(prepare({ ...pending, fecha_objetivo: '2026-09-03T12:00:00Z' }).accion, 'omitir');
    assert.equal(prepararEnvio({ seguimiento: pending, citas: [cita], instrucciones: [config], ahora }).accion, 'omitir');
  });
  check('contenido determinista solo autorizado y sin IDs visibles', () => {
    const p = prepare(); assert.equal(p.accion, 'enviar');
    assert.equal(p.contrato.destino, cita.telefono_normalizado);
    assert.equal(p.contrato.envio_id, pending.envio_id);
    assert.ok(p.contrato.contenido.includes('Mascota Prueba'));
    assert.ok(p.contrato.contenido.includes(config.instrucciones));
    for (const id of [pending.appointment_id, pending.seguimiento_id, pending.envio_id]) assert.equal(p.contrato.contenido.includes(id), false);
    assert.equal(prepare(pending, [cita], [{ ...config, instrucciones: 'Escribe ' + pending.appointment_id }]).accion, 'omitir');
    assert.deepEqual(prepare(), p);
  });
  check('persistencia nunca añade PII ni contenido', () => {
    const row = structuredClone(pending); cycle(row);
    assert.deepEqual(Object.keys(row).sort(), schemas.lab027_seguimientos.map(([key]) => key).sort());
    assert.equal(JSON.stringify(row).includes(cita.telefono_normalizado), false);
    assert.equal(JSON.stringify(row).includes(cita.nombre_mascota), false);
    assert.equal(JSON.stringify(row).includes(config.instrucciones), false);
  });
  check('adquisición perdida no llega al adaptador', () => {
    for (const override of [{ estado: 'enviando' }, { updated_at: due }, { envio_id: 'otro' }]) {
      const row = structuredClone(pending);
      assert.deepEqual(cycle(row, 'accepted', [cita], [config], r => Object.assign(r, override)), []);
    }
  });
  check('excepción, respuesta vacía o incoherente quedan inciertas', () => {
    const claim = { ...pending, estado: 'enviando', updated_at: due };
    const accepted = simularCanal(prepare().contrato, due);
    for (const result of [null, { error: 'fallo ficticio' }, { ...accepted, envio_id: 'otro' },
      { ...accepted, ok: false }, { ...accepted, message_id: '' }, { ...accepted, fecha_resultado: 'inválida' }]) {
      assert.equal(resolverResultado(claim, result, due).estado, 'resultado_incierto');
    }
    assert.throws(() => resolverResultado(pending, accepted, due), /adquisición/);
  });
  check('persistencia de resultado no pisa un estado posterior', () => {
    const claim = { ...pending, estado: 'enviando', updated_at: due };
    const current = { ...claim, estado: 'cerrado' };
    assert.equal(cas(current, { seguimiento: claim, patch: { estado: 'enviado', updated_at: due, enviado_at: due } }, 'Persistir resultado enviado LAB-027'), false);
    assert.equal(current.estado, 'cerrado');
  });
  check('Code de adquisición exige retorno real de la persistencia', () => {
    const plan = prepare(); const code = byName.get('Comprobar adquisición y preparar contrato LAB-027').parameters.jsCode;
    const run = rows => new Function('$', '$input', code)(() => ({ all: () => [{ json: plan }] }), { all: () => rows.map(json => ({ json })) });
    assert.deepEqual(run([]), []); assert.deepEqual(run([pending]), []);
    const acquired = { ...pending, ...plan.patch };
    assert.deepEqual(run([acquired]), [{ json: plan.contrato }]);
    assert.deepEqual(run([acquired, acquired]), []);
  });
  check('entrada interna del adaptador no necesita webhook', () => {
    const code = construirAdaptador().nodes.find(n => n.name === 'Simular contrato interno LAB-027').parameters.jsCode;
    const contract = prepare().contrato;
    assert.deepEqual(new Function('$json', '$now', code)(contract, { toISO: () => due }).json, simularCanal(contract, due));
  });
  check('Code de vigencia conserva correspondencia con cita releída', () => {
    const code = byName.get('Validar vigencia antes de envío LAB-027').parameters.jsCode;
    const run = rows => new Function('$', '$input', '$now', code)(
      name => ({ all: () => (name === 'Releer catálogo antes de envío LAB-027' ? [config] : [pending]).map(json => ({ json })) }),
      { all: () => rows.map(json => ({ json })) }, { toISO: () => due },
    );
    assert.deepEqual(run([cita, cita]), [{ json: prepare() }]);
    assert.equal(run([{ ...cita, version: 2 }])[0].json.accion, 'cerrar');
    assert.deepEqual(run([{ ...cita, clinic_id: 'otra' }]), []);
  });
  check('Code de resultados no atribuye aceptación a otro envío del lote', () => {
    const secondCita = { ...cita, appointment_id: 'apt_lab027_test_002' };
    const secondPending = planificarSeguimientos(input({ citas: [secondCita] })).seguimientos[0];
    const plans = [prepare(), prepararEnvio({ seguimiento: secondPending, citas: [secondCita], instrucciones: [config], ahora: due })];
    const claims = plans.map(p => ({ ...p.seguimiento, ...p.patch }));
    const accepted = simularCanal(plans[0].contrato, due);
    const code = byName.get('Preparar persistencia resultado LAB-027').parameters.jsCode;
    const results = new Function('$', '$input', '$now', code)(
      name => ({ all: () => (name === 'Comprobar adquisición y preparar contrato LAB-027' ? plans.map(p => p.contrato) : claims).map(json => ({ json })) }),
      { all: () => [{ json: accepted }, { json: { error: 'fallo ficticio sin correlación' } }] }, { toISO: () => due },
    );
    assert.equal(results[0].json.patch.estado, 'enviado');
    assert.equal(results[1].json.patch.estado, 'resultado_incierto');
    assert.equal(results[1].json.seguimiento.envio_id, secondPending.envio_id);
  });
  const replyClock = '2026-09-04T13:00:00.000Z';
  const sent = { ...pending, estado: 'enviado', enviado_at: due, updated_at: due };
  const tutorReply = type => simularCanal({ accion: 'simular_respuesta', clinic_id: sent.clinic_id,
    seguimiento_id: sent.seguimiento_id, envio_id: sent.envio_id, appointment_id: sent.appointment_id,
    appointment_version: sent.appointment_version, respuesta_tipo: type, respuesta_texto: '', fecha_respuesta: '2026-09-04T12:30:00.000Z' }, replyClock);
  const atOffset = ms => new Date(Date.parse(replyClock) + ms).toISOString();
  for (const [label, offset, valid] of [['ahora',0,true],['+1s',1000,true],['+4m59s',299000,true],['+5m',300000,true],['+5m+1ms',300001,false],['+10m',600000,false],['pasada',-86400000,true]]) {
    check('tolerancia de reloj ' + label, () => assert.equal(validarContratoRespuesta({ ...tutorReply('no'), fecha_respuesta: atOffset(offset) }, replyClock), valid));
  }
  for (const type of ['si','no','ambiguo','pregunta','sin_respuesta']) check('contrato mantiene tipo permitido ' + type, () => {
    assert.equal(validarContratoRespuesta({ ...tutorReply(type), fecha_respuesta: atOffset(1000) }, replyClock), true);
  });
  check('clock skew no relaja contrato cerrado', () => {
    const base={...tutorReply('no'),fecha_respuesta:atOffset(1000)};
    assert.equal(validarContratoRespuesta({...base,extra:'x'},replyClock),false);
    assert.equal(validarContratoRespuesta({...base,clinic_id:'clínica inválida'},replyClock),false);
    assert.equal(validarContratoRespuesta({...base,respuesta_tipo:'quizas'},replyClock),false);
    assert.equal(validarContratoRespuesta({...base,fecha_respuesta:'sin fecha'},replyClock),false);
    assert.equal(validarContratoRespuesta({...base,respuesta_tipo:'sin_respuesta',respuesta_texto:'texto'},replyClock),false);
  });
  const replyDecision = (row, type, override = {}, citas = [cita]) => procesarRespuesta({
    respuesta: { ...tutorReply(type), ...override }, seguimientos: [structuredClone(row)], citas, ahora: replyClock,
  });
  check('ambos Code aplican la misma política temporal', () => {
    const validatorCode=construirWorkflow().nodes.find(n=>n.name==='Validar contrato de respuesta LAB-027').parameters.jsCode;
    const resolverCode=construirWorkflow().nodes.find(n=>n.name==='Resolver respuesta del tutor LAB-027').parameters.jsCode;
    const cases=[['si',1000,true],['no',299000,true],['no',300001,false],['desconocida',1000,false],['sin_respuesta',1000,true]];
    for(const [type,offset,expected] of cases){
      const solicitud={...tutorReply(type==='desconocida'?'si':type),respuesta_tipo:type,fecha_respuesta:atOffset(offset)};
      const first=new Function('$input','$now',validatorCode)({all:()=>[{json:solicitud}]},{toISO:()=>replyClock})[0].json.valida;
      const resolved=new Function('$','$input','$now',resolverCode)(
        ()=>({first:()=>({json:{solicitud,seguimiento:sent}})}),{all:()=>[{json:cita}]},{toISO:()=>replyClock})[0].json;
      const second=resolved.salida?.resultado!=='rechazada';
      assert.equal(first,expected);assert.equal(second,expected);assert.equal(first,second);
    }
  });
  check('enviado + no dentro del skew llega al resolver y se registra', () => {
    const before=structuredClone(cita),d=replyDecision(sent,'no',{fecha_respuesta:atOffset(299000)});
    assert.equal(d.persistir,true);assert.equal(d.salida.resultado,'registrada');assert.equal(d.patch.estado,'derivado_cancelacion_reprogramacion');
    assert.equal(d.patch.respuesta_tipo,'no');assert.equal(d.patch.respuesta_at,atOffset(299000));assert.deepEqual(cita,before);
  });
  const persistReply = (row, decision) => {
    if (!decision.persistir) return decision.salida;
    const node = construirWorkflow().nodes.find(n => n.name === 'Persistir respuesta del tutor LAB-027');
    assert.equal(node.parameters.matchType, 'allConditions');
    const matches = node.parameters.filters.conditions.every(f => row[f.keyName] === decision.seguimiento[f.keyName]);
    if (matches) for (const key of Object.keys(node.parameters.columns.value)) row[key] = decision.patch[key];
    return comprobarRespuestaPersistida(decision, matches ? [row] : [{}]);
  };
  for (const [type, state] of [['si', 'confirmado'], ['no', 'derivado_cancelacion_reprogramacion']]) {
    check('respuesta enviado + ' + type + ' → ' + state, () => {
      const row = structuredClone(sent); const decision = replyDecision(row, type);
      assert.equal(decision.persistir, true);
      assert.equal(persistReply(row, decision).resultado, 'registrada');
      assert.equal(row.estado, state); assert.equal(row.respuesta_tipo, type);
      assert.equal(row.respuesta_at, tutorReply(type).fecha_respuesta);
      assert.equal(row.updated_at, row.respuesta_at);
    });
    check('respuesta ' + type + ' no cambia cita ni añade campos', () => {
      const before = structuredClone(cita); const row = structuredClone(sent);
      persistReply(row, replyDecision(row, type)); assert.deepEqual(cita, before);
      assert.deepEqual(Object.keys(row).sort(), Object.keys(sent).sort());
    });
    check('idempotencia terminal de ' + type, () => {
      const row = structuredClone(sent); persistReply(row, replyDecision(row, type));
      const before = structuredClone(row);
      const repeated = replyDecision(row, type, { fecha_respuesta: '2026-09-04T12:45:00.000Z' });
      assert.equal(repeated.persistir, false); assert.equal(repeated.salida.resultado, 'ya_registrada'); assert.equal(repeated.salida.ok, true);
      assert.equal(repeated.salida.reply, type === 'si'
        ? 'Tu confirmación ya estaba registrada.'
        : 'Tu respuesta ya estaba registrada. La cita sigue vigente hasta completar la cancelación o reprogramación.');
      assert.deepEqual(Object.keys(repeated.salida).sort(), ['ok', 'reply', 'resultado']);
      persistReply(row, repeated); assert.deepEqual(row, before);
      for (const field of ['enviado_at', 'respuesta_at', 'updated_at', 'closed_at', 'tarea_id']) assert.equal(row[field], before[field]);
    });
    check('contradicción terminal después de ' + type + ' no sobrescribe', () => {
      const row = structuredClone(sent); persistReply(row, replyDecision(row, type)); const before = structuredClone(row);
      const contrary = replyDecision(row, type === 'si' ? 'no' : 'si');
      assert.equal(contrary.persistir, false); assert.equal(contrary.salida.resultado, 'rechazada');
      persistReply(row, contrary); assert.deepEqual(row, before);
    });
  }
  check('ambiguo conserva espera y exige Sí/No', () => {
    const row = structuredClone(sent); const d = replyDecision(row, 'ambiguo');
    assert.equal(d.patch.estado, 'enviado'); assert.equal(d.patch.respuesta_tipo, 'ambiguo');
    assert.equal(persistReply(row, d).reply, '¿Confirmas que asistirás? Responde Sí o No.');
  });
  check('pregunta no decide sobre clínica ni interpreta síntomas', () => {
    const row = structuredClone(sent); const before = structuredClone(cita);
    const d = replyDecision(row, 'pregunta', { respuesta_texto: 'Texto ficticio: no puede respirar. ¿Suspendo medicamentos? Sí.' });
    assert.equal(d.patch.estado, 'enviado'); assert.equal(d.patch.respuesta_tipo, 'pregunta');
    assert.equal(d.salida.reply, 'Recibí tu consulta. Para confirmar tu asistencia responde Sí o No. Si necesitas resolver una duda sobre preparación o atención, la clínica podrá revisarla.');
    persistReply(row, d); assert.deepEqual(cita, before); assert.equal(Object.hasOwn(row, 'respuesta_texto'), false);
  });
  check('sin_respuesta es solo evento técnico sin mutación', () => {
    const row = structuredClone(sent); const before = structuredClone(row); const d = replyDecision(row, 'sin_respuesta');
    assert.equal(d.persistir, false); assert.equal(d.salida.resultado, 'evento_tecnico');
    persistReply(row, d); assert.deepEqual(row, before);
  });
  for (const [field, value] of [['clinic_id', 'clinica_piloto_002'], ['seguimiento_id', 'seg_otro'], ['envio_id', 'env_otro'], ['appointment_id', 'apt_otro']]) {
    check('respuesta no correlaciona con ' + field + ' incorrecto', () => {
      const row = structuredClone(sent); const before = structuredClone(row); const d = replyDecision(row, 'si', { [field]: value });
      assert.equal(d.persistir, false); assert.equal(d.salida.ok, false); persistReply(row, d); assert.deepEqual(row, before);
    });
  }
  check('respuesta sobre versión antigua no se acepta como vigente', () => {
    const d = replyDecision(sent, 'si', {}, [{ ...cita, version: 2 }]);
    assert.equal(d.persistir, false); assert.equal(d.salida.resultado, 'rechazada');
  });
  check('seguimiento cerrado no acepta nueva respuesta', () => {
    const d = replyDecision({ ...sent, estado: 'cerrado' }, 'si');
    assert.equal(d.persistir, false); assert.equal(d.salida.ok, false);
  });
  for (const estado of ['sin_respuesta', 'pendiente_contacto_humano']) for (const type of ['si', 'no']) {
    check('respuesta tardía ' + estado + ' + ' + type, () => {
      const row = { ...sent, estado, tarea_id: 'tarea_ficticia_sin_integracion' };
      const publicResult = persistReply(row, replyDecision(row, type));
      assert.equal(publicResult.resultado, 'registrada');
      assert.equal(row.estado, type === 'si' ? 'confirmado' : 'derivado_cancelacion_reprogramacion');
      assert.equal(row.tarea_id, 'tarea_ficticia_sin_integracion');
    });
  }
  for (const key of ['appointment_id', 'seguimiento_id', 'envio_id']) {
    check('respuesta pública nunca contiene ' + key, () => {
      for (const type of ['si', 'no', 'ambiguo', 'pregunta']) {
        const d = replyDecision(sent, type, { respuesta_texto: sent[key] });
        assert.equal(JSON.stringify(d.salida).includes(sent[key]), false);
        assert.deepEqual(Object.keys(d.salida).sort(), ['ok', 'reply', 'resultado']);
      }
    });
  }
  check('respuesta no confía en session_id ni en coincidencia parcial', () => {
    assert.equal(validarContratoRespuesta({ ...tutorReply('si'), session_id: 'ficticia' }, replyClock), false);
    assert.equal(replyDecision(sent, 'si', {}, [{ ...cita, clinic_id: 'otra' }]).persistir, false);
    assert.equal(procesarRespuesta({ respuesta: tutorReply('si'), seguimientos: [sent, sent], citas: [cita], ahora: replyClock }).persistir, false);
  });
  check('respuesta rechaza otros tipos, estados y citas no vigentes', () => {
    for (const estado of ['pendiente_envio', 'enviando', 'resultado_incierto', 'fallido']) assert.equal(replyDecision({ ...sent, estado }, 'si').persistir, false);
    assert.equal(replyDecision({ ...sent, tipo_seguimiento: 'post_cirugia' }, 'si').persistir, false);
    assert.equal(replyDecision(sent, 'si', {}, [{ ...cita, estado: 'cancelada' }]).persistir, false);
    assert.equal(replyDecision(sent, 'si', {}, [{ ...cita, start_time: ahora }]).persistir, false);
  });
  check('fecha de respuesta inválida, futura o anterior al envío no muta', () => {
    for (const fecha_respuesta of ['sin fecha', '2026-09-06T00:00:00Z', '2026-09-03T00:00:00Z']) {
      assert.equal(replyDecision(sent, 'si', { fecha_respuesta }).persistir, false);
    }
  });
  check('respuesta nueva no sobrescribe un resultado adquirido por otra ejecución', () => {
    const row = structuredClone(sent); const decision = replyDecision(row, 'si');
    row.estado = 'derivado_cancelacion_reprogramacion'; row.respuesta_tipo = 'no';
    const before = structuredClone(row); const result = persistReply(row, decision);
    assert.equal(result.ok, false); assert.equal(result.resultado, 'no_verificada'); assert.deepEqual(row, before);
  });
  check('no anunciar éxito sin fila persistida comprobable', () => {
    const d = replyDecision(sent, 'si');
    for (const rows of [[], [{}], [{ error: 'error ficticio' }], [sent], [{ ...sent, ...d.patch }, { ...sent, ...d.patch }]]) {
      assert.equal(comprobarRespuestaPersistida(d, rows).ok, false);
    }
  });
  check('Code del núcleo procesa contrato normalizado de la bandeja', () => {
    const code = construirWorkflow().nodes.find(n => n.name === 'Resolver respuesta del tutor LAB-027').parameters.jsCode;
    const r = tutorReply('no');
    const result = new Function('$', '$input', '$now', code)(
      () => ({ first: () => ({ json: { solicitud: r, seguimiento: sent } }) }),
      { all: () => [{ json: cita }] }, { toISO: () => replyClock },
    );
    assert.deepEqual(result[0].json, replyDecision(sent, 'no'));
  });
  // Intérprete local acotado: ejecuta Code, IF y filtros/mapeos reales del export.
  const contactWorkflow = construirWorkflow();
  const tickAt = '2026-09-04T14:00:00.000Z';
  const database = () => ({ lab027_seguimientos: [structuredClone(sent)], lab026_citas: [structuredClone(cita)], lab025_tareas: [] });
  const runRoute = (db, start, initial, clock, failInsert = false, failClose = false) => {
    const context = new Map(), events = [], queue = [[start, initial.map(json => ({ json }))]];
    const lookup = name => ({ all: () => context.get(name) || [], first: () => context.get(name)?.[0] });
    const evaluate = (value, json) => typeof value === 'string' && value.startsWith('={{')
      ? new Function('$json', '$', '$now', 'return (' + value.slice(3, -2) + ');')(json, lookup, { toISO: () => clock }) : value;
    let steps = 0;
    while (queue.length) {
      assert.ok(++steps < 200, 'sin bucle');
      const [name, inputItems] = queue.shift();
      if (!inputItems.length) continue;
      const n = contactWorkflow.nodes.find(x => x.name === name), p = n.parameters;
      let output = [], port = 0;
      if (n.type.endsWith('.code')) output = new Function('$', '$input', '$now', p.jsCode)(lookup,
        { all: () => inputItems, first: () => inputItems[0] }, { toISO: () => clock });
      else if (n.type.endsWith('.if')) { port = evaluate(p.conditions.conditions[0].leftValue, inputItems[0].json) ? 0 : 1; output = inputItems; }
      else if (n.type.endsWith('.dataTable')) {
        const table = db[p.dataTableId.value]; assert.ok(table);
        for (const item of n.executeOnce ? inputItems.slice(0, 1) : inputItems) {
          const matches = row => (p.filters?.conditions || []).every(f => row[f.keyName] === evaluate(f.keyValue, item.json));
          if (p.operation === 'get') output.push(...table.filter(matches).map(json => ({ json: structuredClone(json) })));
          else {
            const patch = Object.fromEntries(Object.entries(p.columns.value).map(([k,v]) => [k, evaluate(v, item.json)]));
            if (p.operation === 'insert') {
              if (!failInsert) { table.push(structuredClone(patch)); output.push({ json: structuredClone(patch) }); events.push(['insert', p.dataTableId.value]); }
            } else if (p.operation === 'update') {
              if (failClose && name === 'Cerrar tarea por respuesta LAB-027') continue;
              for (const row of table.filter(matches)) { Object.assign(row, patch); output.push({ json: structuredClone(row) }); events.push(['update', p.dataTableId.value, name]); }
            } else assert.fail('operación inesperada en ruta 1F');
          }
        }
        if (!output.length && n.alwaysOutputData) output = [{ json: {} }];
      } else assert.fail('tipo inesperado ' + n.type);
      context.set(name, output);
      for (const target of contactWorkflow.connections[name]?.main[port] || []) queue.push([target.node, output]);
    }
    return { context, events };
  };
  const tick = (db, clock = tickAt, fail = false) => runRoute(db, 'Releer seguimientos para contacto LAB-027', [{}], clock, fail);
  const late = (db, type, failClose = false) => runRoute(db, 'Validar contrato de respuesta LAB-027',
    [{ ...tutorReply(type), fecha_respuesta: '2026-09-04T14:05:00.000Z' }], '2026-09-04T14:06:00.000Z', false, failClose);
  check('24h menos de 2h no crea tarea ni altera cita o seguimiento', () => {
    const db = database(),before=structuredClone(db);const result=tick(db,'2026-09-04T13:59:59.999Z');
    assert.equal(db.lab025_tareas.length,0);assert.deepEqual(db,before);assert.equal(result.events.length,0);
  });
  for (const clock of [tickAt, '2026-09-04T14:30:00.000Z']) check('24h umbral cumplido ' + clock, () => {
    const db = database(); tick(db, clock); assert.equal(db.lab025_tareas.length, 1);
    assert.equal(db.lab027_seguimientos[0].estado, 'pendiente_contacto_humano');
    assert.equal(db.lab027_seguimientos[0].tarea_id, db.lab025_tareas[0].task_id);
    assert.equal(db.lab025_tareas[0].fecha_limite, tickAt);
    assert.equal(db.lab025_tareas[0].clinic_id, sent.clinic_id);
    const taskTuple=JSON.parse(decodeURIComponent(db.lab025_tareas[0].task_id.slice('task_lab027_'.length)));
    const followTuple=JSON.parse(decodeURIComponent(taskTuple[1].slice('seg_lab027_'.length)));
    assert.deepEqual(taskTuple,[sent.clinic_id,sent.seguimiento_id,'sin_respuesta_24h']);
    assert.equal(followTuple[0],sent.clinic_id);assert.equal(followTuple[1],sent.appointment_id);
    assert.equal(db.lab026_citas[0].estado,'confirmada');assert.equal(db.lab026_citas[0].start_time,cita.start_time);
    assert.equal(db.lab026_citas[0].end_time,cita.end_time);assert.equal(db.lab026_citas[0].version,cita.version);
  });
  for (const etapa of ['48h', '72h']) check(etapa + ' no genera contacto humano', () => {
    const db = database(); db.lab027_seguimientos[0].etapa = etapa; tick(db); assert.equal(db.lab025_tareas.length, 0);
  });
  check('identidad de tarea determinista e incluye clínica y seguimiento', () => {
    assert.equal(tareaId(sent), tareaId(structuredClone(sent)));
    assert.notEqual(tareaId(sent), tareaId({ ...sent, clinic_id: 'otra' }));
    assert.notEqual(tareaId(sent), tareaId({ ...sent, seguimiento_id: 'otro' }));
  });
  check('scheduler repetido crea exactamente una tarea sin actualizarla', () => {
    const db = database(); tick(db); const original = structuredClone(db),envioId=db.lab027_seguimientos[0].envio_id;
    for (let i = 0; i < 4; i++) {const result=tick(db,'2026-09-04T14:30:00.000Z');assert.equal(result.events.length,0);}
    assert.deepEqual(db, original);assert.equal(db.lab027_seguimientos[0].envio_id,envioId);
  });
  for (const change of [{ estado: 'cancelada' }, { version: 2 }]) check('cita no vigente invalida seguimiento sin tarea ' + JSON.stringify(change), () => {
    const db = database(); Object.assign(db.lab026_citas[0], change); const snapshot = structuredClone(db.lab026_citas);
    tick(db); assert.equal(db.lab025_tareas.length, 0); assert.equal(db.lab027_seguimientos[0].estado, 'cerrado'); assert.deepEqual(db.lab026_citas, snapshot);
  });
  for (const type of ['si', 'no']) check('respuesta ' + type + ' antes del tick impide tarea', () => {
    const db = database(); Object.assign(db.lab027_seguimientos[0], replyDecision(sent, type).patch);
    tick(db); assert.equal(db.lab025_tareas.length, 0);
  });
  check('fallo de inserción deja reserva verificable sin éxito ni reinserción ciega', () => {
    const db = database(); tick(db, tickAt, true);
    assert.equal(db.lab027_seguimientos[0].estado, 'sin_respuesta'); assert.ok(db.lab027_seguimientos[0].tarea_id);
    tick(db, '2026-09-04T14:30:00.000Z'); assert.equal(db.lab025_tareas.length, 0);
    assert.equal(db.lab027_seguimientos[0].estado, 'sin_respuesta');
  });
  check('reserva con tarea persistida se recupera sin insertar ni sobrescribir tarea', () => {
    const db = database(); const p = planificarContacto({ seguimiento: db.lab027_seguimientos[0], citas: db.lab026_citas, tareas: [], ahora: tickAt });
    Object.assign(db.lab027_seguimientos[0], p.patch); db.lab025_tareas.push(p.tarea);
    const task = structuredClone(p.tarea); tick(db);
    assert.deepEqual(db.lab025_tareas, [task]); assert.equal(db.lab027_seguimientos[0].estado, 'pendiente_contacto_humano');
  });
  for (const [type, state] of [['si', 'confirmado'], ['no', 'derivado_cancelacion_reprogramacion']]) {
    check('respuesta tardía ' + type + ' cierra tarea antes del seguimiento y es idempotente', () => {
      const db = database(); tick(db); const result = late(db, type);
      assert.equal(db.lab025_tareas[0].estado, 'cerrada'); assert.equal(db.lab025_tareas[0].fecha_cierre, '2026-09-04T14:05:00.000Z');
      assert.equal(db.lab027_seguimientos[0].estado, state); assert.deepEqual(db.lab026_citas, [cita]);
      assert.equal(db.lab026_citas[0].estado,'confirmada');
      const updates = result.events.filter(e => e[0] === 'update');
      assert.equal(updates[0][1], 'lab025_tareas'); assert.equal(updates[1][1], 'lab027_seguimientos');
      const snapshot = structuredClone(db); const repeat = late(db, type);
      assert.deepEqual(db, snapshot); assert.equal(repeat.events.length, 0);
      assert.deepEqual(repeat.context.get('Devolver respuesta pública LAB-027')[0].json, {
        ok: true,
        resultado: 'ya_registrada',
        reply: type === 'si' ? 'Tu confirmación ya estaba registrada.'
          : 'Tu respuesta ya estaba registrada. La cita sigue vigente hasta completar la cancelación o reprogramación.',
      });
    });
  }
  for (const type of ['ambiguo', 'pregunta']) check('respuesta tardía ' + type + ' conserva tarea abierta', () => {
    const db = database(); tick(db); const task = structuredClone(db.lab025_tareas[0]); late(db, type);
    assert.deepEqual(db.lab025_tareas[0], task); assert.equal(db.lab027_seguimientos[0].estado, 'pendiente_contacto_humano');
  });
  check('fallo de cierre no anuncia confirmación y permite reintento', () => {
    const db = database(); tick(db); const result = late(db, 'si', true);
    assert.equal(db.lab027_seguimientos[0].estado, 'pendiente_contacto_humano');
    assert.equal(result.context.get('Devolver respuesta pública LAB-027')[0].json.ok, false);
    late(db, 'si'); assert.equal(db.lab027_seguimientos[0].estado, 'confirmado');
  });
  check('tarea ausente o de otra clínica bloquea cierre y transición', () => {
    const db = database(); tick(db); db.lab025_tareas[0].clinic_id = 'otra'; late(db, 'si');
    assert.equal(db.lab025_tareas[0].estado, 'pendiente'); assert.equal(db.lab027_seguimientos[0].estado, 'pendiente_contacto_humano');
  });
  check('dos adquisiciones del mismo snapshot solo una puede insertar', () => {
    const db = database(); const p = planificarContacto({ seguimiento: structuredClone(sent), citas: [cita], tareas: [], ahora: tickAt });
    const n = contactWorkflow.nodes.find(n => n.name === 'Adquirir contacto LAB-027');
    assert.equal(n.parameters.matchType, 'allConditions');
    const matches = () => n.parameters.filters.conditions.every(f => db.lab027_seguimientos[0][f.keyName] === p.seguimiento[f.keyName]);
    assert.equal(matches(), true); Object.assign(db.lab027_seguimientos[0], p.patch);
    assert.equal(matches(), false); // Incluso dos relojes exactamente iguales pierden por estado/tarea_id.
  });
  check('sin_respuesta técnico no crea tarea antes de umbral', () => {
    const db = database(); runRoute(db, 'Validar contrato de respuesta LAB-027', [tutorReply('sin_respuesta')], replyClock);
    tick(db, replyClock); assert.equal(db.lab025_tareas.length, 0); assert.equal(db.lab027_seguimientos[0].estado, 'enviado');
  });
  check('relectura antes de insertar detecta respuesta concurrente o cambio de cita', () => {
    const p = planificarContacto({ seguimiento: structuredClone(sent), citas: [cita], tareas: [], ahora: tickAt });
    const claim = { ...p, seguimiento: { ...sent, ...p.patch } };
    const code = contactWorkflow.nodes.find(n => n.name === 'Preparar inserción única tarea LAB-027').parameters.jsCode;
    for (const [row, current] of [
      [{ ...claim.seguimiento, estado: 'confirmado', respuesta_tipo: 'si' }, cita],
      [claim.seguimiento, { ...cita, estado: 'cancelada' }],
      [claim.seguimiento, { ...cita, version: 2 }],
    ]) {
      const values = { 'Verificar adquisición contacto LAB-027': [claim], 'Releer seguimiento adquirido contacto LAB-027': [row], 'Releer cita adquirida contacto LAB-027': [current] };
      const output = new Function('$', '$input', '$now', code)(name => ({ all: () => values[name].map(json => ({ json })) }), { all: () => [] }, { toISO: () => tickAt });
      assert.equal(output[0].json.insertar.length, 0);
    }
  });
  check('tareas duplicadas o ajenas nunca se enlazan', () => {
    const db = database(); const p = planificarContacto({ seguimiento: sent, citas: [cita], tareas: [], ahora: tickAt });
    for (const tareas of [[p.tarea, structuredClone(p.tarea)], [{ ...p.tarea, creado_por: 'otro_sistema' }]]) {
      assert.equal(planificarContacto({ seguimiento: sent, citas: [cita], tareas, ahora: tickAt }).accion, 'omitir');
    }
  });
  check('dos seguimientos de clínicas diferentes crean dos tareas aisladas', () => {
    const db = database(); db.lab027_seguimientos.push({ ...sent, clinic_id: 'otra_clinica' }); db.lab026_citas.push({ ...cita, clinic_id: 'otra_clinica' });
    tick(db); assert.equal(db.lab025_tareas.length, 2); assert.equal(new Set(db.lab025_tareas.map(t => t.task_id)).size, 2);
    assert.ok(db.lab027_seguimientos.every(s => s.estado === 'pendiente_contacto_humano' && db.lab025_tareas.some(t => t.task_id === s.tarea_id && t.clinic_id === s.clinic_id)));
  });
  check('tarea ya cerrada se conserva sin repetir fecha de cierre', () => {
    const db = database(); tick(db); Object.assign(db.lab025_tareas[0], { estado: 'cerrada', fecha_cierre: tickAt });
    const original = structuredClone(db.lab025_tareas); late(db, 'no');
    assert.deepEqual(db.lab025_tareas, original); assert.equal(db.lab027_seguimientos[0].estado, 'derivado_cancelacion_reprogramacion');
  });
  check('sin PII nueva en seguimiento, sin tablas nuevas, Wait, scheduler extra o segundo envío', () => {
    const db = database(); tick(db); assert.deepEqual(Object.keys(db.lab027_seguimientos[0]).sort(), Object.keys(sent).sort());
    assert.equal(contactWorkflow.nodes.filter(n => n.parameters.resource === 'table').length, 2);
    assert.equal(contactWorkflow.nodes.filter(n => n.type.endsWith('.scheduleTrigger')).length, 1);
    assert.equal(contactWorkflow.nodes.filter(n => n.type.endsWith('.wait')).length, 0);
    assert.equal(contactWorkflow.nodes.filter(n => n.type.endsWith('.executeWorkflow')).length, 3);
  });
  check('IDs runtime distintos de placeholders', () => {
    assert.equal(CORE_RUNTIME_WORKFLOW_ID, 'aVs5LQiBrrRsyzcN');
    assert.equal(ADAPTER_RUNTIME_WORKFLOW_ID, 'QhFSw6XCHqsS5cQC');
    assert.notEqual(CORE_RUNTIME_WORKFLOW_ID, construirWorkflow().id);
    assert.notEqual(ADAPTER_RUNTIME_WORKFLOW_ID, construirAdaptador().id);
  });
  for (const [name, factory, destination] of [
    ['Invocar adaptador simulado LAB-027', construirWorkflow, ADAPTER_RUNTIME_WORKFLOW_ID],
    ['Invocar urgencias LAB-024', construirWorkflow, LAB024_RUNTIME_WORKFLOW_ID],
    ['Entregar respuesta al núcleo webhook LAB-027', construirAdaptador, CORE_RUNTIME_WORKFLOW_ID],
    ['Entregar respuesta al núcleo interno LAB-027', construirAdaptador, CORE_RUNTIME_WORKFLOW_ID],
  ]) check('binding runtime y generación repetida: ' + name, () => {
    const n = factory().nodes.find(n => n.name === name);
    assert.equal(n.typeVersion, 1.3);
    assert.deepEqual(n.parameters, { source:'database', workflowId:{__rl:true,value:destination,mode:'id'},
      workflowInputs:{mappingMode:'defineBelow',value:{},matchingColumns:[],schema:[],attemptToConvertTypes:false,convertFieldsToString:true},
      mode:'each',options:{waitForSubWorkflow:true} });
    assert.deepEqual(n, factory().nodes.find(n => n.name === name));
  });
  // Recorre el export real: Code e IF ejecutados; llamada al núcleo sustituida por un doble local.
  const adapterExport = JSON.parse(fs.readFileSync(new URL('../../n8n/workflows/comercial/lab027_adaptador_canal_simulado.json', import.meta.url), 'utf8'));
  const recorrerAdaptador = (channel, request) => {
    let name = channel === 'webhook' ? 'Entrada técnica canal simulado LAB-027' : 'Entrada interna subworkflow LAB-027';
    let json = channel === 'webhook' ? { body: request } : request;
    const visited = [], calls = [];
    while (name) {
      assert.ok(!visited.includes(name), 'sin ciclo en adaptador'); visited.push(name);
      const n = adapterExport.nodes.find(n => n.name === name); assert.ok(n);
      let port = 0;
      if (n.type === 'n8n-nodes-base.code') {
        const result = new Function('$json', '$input', '$now', n.parameters.jsCode)(json,
          { all: () => [{ json }], first: () => ({ json }) }, { toISO: () => ahora });
        json = (Array.isArray(result) ? result[0] : result).json;
      } else if (n.type === 'n8n-nodes-base.if') {
        const c = n.parameters.conditions.conditions[0];
        const value = new Function('$json', 'return (' + c.leftValue.slice(3,-2) + ');')(json);
        port = value === true ? 0 : 1;
      } else if (n.type === 'n8n-nodes-base.executeWorkflow') {
        calls.push({ name, input: structuredClone(json) });
        json = { ok: true, resultado: 'doble_local', reply: 'Respuesta ficticia del núcleo' };
      } else if (n.type === 'n8n-nodes-base.respondToWebhook') {
        json = new Function('$json', 'return (' + n.parameters.responseBody.slice(3,-2) + ');')(json);
      }
      const edges = adapterExport.connections[name]?.main[port] || [];
      assert.ok(edges.length <= 1); name = edges[0]?.node;
    }
    return { json, visited, calls };
  };
  for (const channel of ['webhook','interno']) {
    const terminal = channel === 'webhook' ? 'Devolver contrato simulado LAB-027' : 'Devolver contrato interno adaptador LAB-027';
    for (const status of ['accepted','rejected','uncertain']) check(channel + ' enviar ' + status + ' retorna contrato íntegro sin núcleo', () => {
      const request = { ...envio, modo_resultado: status };
      const result = recorrerAdaptador(channel, request);
      assert.equal(result.visited.at(-1), terminal);
      assert.deepEqual(result.calls, []);
      assert.deepEqual(result.json, simularCanal(request, ahora));
      assert.deepEqual(Object.keys(result.json).sort(), sendKeys);
      assert.equal(result.json.status, status); assert.equal(result.json.ok, status === 'accepted');
      assert.equal(result.json.envio_id, envio.envio_id);
      assert.equal(result.json.message_id, recorrerAdaptador(channel, request).json.message_id);
    });
    check(channel + ' simular_respuesta pasa por núcleo y retorna su resultado', () => {
      const request = { ...response, respuesta_tipo: 'si' }, result = recorrerAdaptador(channel, request);
      assert.equal(result.visited.at(-1), terminal);
      assert.equal(result.calls.length, 1);
      assert.equal(result.calls[0].name, 'Entregar respuesta al núcleo ' + channel + ' LAB-027');
      assert.deepEqual(result.calls[0].input, simularCanal(request, ahora));
      assert.deepEqual(result.json, { ok:true, resultado:'doble_local', reply:'Respuesta ficticia del núcleo' });
    });
  }
  check('checkpoint 2 no añade nodos ni Code al adaptador', () => {
    assert.equal(adapterExport.nodes.length, 10);
    assert.equal(adapterExport.nodes.filter(n => n.type === 'n8n-nodes-base.code').length, 3);
  });
  checks += probarGestionHumana().checks;
  return { ok: true, checks, clock: ahora, fixtures: 'exclusivamente ficticios' };
}


export function probarGestionHumana() {
  const w = JSON.parse(fs.readFileSync(new URL('../../n8n/workflows/comercial/lab025_operacion_interna_protegida_rag_interno.json', import.meta.url), 'utf8'));
  const byName = new Map(w.nodes.map(n => [n.name, n]));
  let checks = 0;
  const check = (name, fn) => { try { fn(); checks++; } catch (e) { e.message = name + ': ' + e.message; throw e; } };
  const clock = '2026-09-04T15:00:00.000Z';
  const task = { task_id: tareaId({ clinic_id: 'clinica_test', seguimiento_id: 'seg_test' }), clinic_id: 'clinica_test',
    titulo: 'Contactar tutor por confirmación de cita', descripcion: 'Contacto ficticio', prioridad: 'media', estado: 'pendiente', creado_por: 'sistema_lab027', asignado_a: '', fecha_creacion: clock, fecha_limite: clock, fecha_actualizacion: clock, fecha_cierre: '' };
  const setup = (role = 'recepcion', permissions = ['seguimientos_ver', 'seguimientos_operar']) => ({
    lab025_tareas: [structuredClone(task)], lab025_auditoria_operaciones: [],
    lab025_usuarios_internos: [{ user_id: 'actor_test', clinic_id: 'clinica_test', nombre: 'Personal ficticio', rol: role, estado: 'activo', identity_provider: 'oidc_test', identity_subject: 'sub_test' }],
    lab025_permisos_roles: permissions.map(permiso => ({ clinic_id: 'clinica_test', rol: role, estado: 'activo', permiso })),
  });
  const execute = (db, action, options = {}) => {
    const context = new Map(), replies = [], events = [];
    const input = { body: { internal_session_id: 'sesion_ficticia', accion: action, recurso_id: options.id ?? task.task_id, ...options.body },
      headers: options.headers ?? { 'x-vetatiende-identity-provider': 'oidc_test', 'x-vetatiende-identity-subject': 'sub_test' } };
    const queue = [['Normalizar solicitud interna LAB-025', [{ json: input }]]];
    const lookup = name => ({ all: () => context.get(name) || [], first: () => context.get(name)?.[0] });
    const evalValue = (v, json) => typeof v === 'string' && v.startsWith('={{')
      ? new Function('$json', '$', '$now', 'return (' + v.slice(3, -2) + ');')(json, lookup, { toISO: () => clock }) : v;
    const condition = (c, json) => c.operator.operation === 'true' ? evalValue(c.leftValue, json) === true : evalValue(c.leftValue, json) === evalValue(c.rightValue, json);
    let steps = 0;
    while (queue.length) {
      assert.ok(++steps < 120, 'ruta sin bucles');
      const [name, items] = queue.shift(); if (!items.length) continue;
      const n = byName.get(name), p = n.parameters; let out = [], port = 0;
      if (n.type.endsWith('.code')) {
        const result = new Function('$', '$input', '$json', '$now', p.jsCode)(lookup, { all: () => items, first: () => items[0] }, items[0].json, { toISO: () => clock });
        out = Array.isArray(result) ? result : [result];
      } else if (n.type.endsWith('.if')) { port = p.conditions.conditions.every(c => condition(c, items[0].json)) ? 0 : 1; out = items; }
      else if (n.type.endsWith('.switch')) { port = p.rules.values.findIndex(r => r.conditions.conditions.every(c => condition(c, items[0].json))); out = items; }
      else if (n.type.endsWith('.respondToWebhook')) { replies.push(evalValue(p.responseBody, items[0].json)); events.push(['reply', name]); }
      else if (n.type.endsWith('.dataTable')) {
        const tableName = p.dataTableId.cachedResultName, table = db[tableName]; assert.ok(table, 'tabla permitida ' + tableName);
        const conditions = p.filters?.conditions || [];
        const matches = row => p.matchType === 'allConditions' ? conditions.every(f => row[f.keyName] === evalValue(f.keyValue, items[0].json))
          : !conditions.length || conditions.some(f => row[f.keyName] === evalValue(f.keyValue, items[0].json));
        if (p.operation === 'get') out = table.filter(matches).map(json => ({ json: structuredClone(json) }));
        else {
          const patch = Object.fromEntries(Object.entries(p.columns.value).map(([k,v]) => [k, evalValue(v, items[0].json)]));
          if (p.operation === 'update') {
            if (options.concurrentClose) for (const row of table) { row.estado = 'cerrada'; row.fecha_cierre = '2026-09-04T14:59:00Z'; }
            if (!options.failWrite) for (const row of table.filter(matches)) { Object.assign(row, patch); out.push({ json: structuredClone(row) }); events.push(['update', tableName]); }
          } else {
            assert.equal(tableName, 'lab025_auditoria_operaciones');
            if (!options.failAudit) { table.push(patch); out = [{ json: structuredClone(patch) }]; events.push(['audit', patch.accion]); }
          }
        }
        if (!out.length && n.alwaysOutputData) out = [{ json: {} }];
      } else assert.fail('ruta nueva alcanzó tipo fuera de alcance ' + n.type);
      context.set(name, out);
      for (const next of w.connections[name]?.main[port] || []) queue.push([next.node, out]);
    }
    return { replies, events, context };
  };
  for (const role of ['recepcion', 'veterinario', 'administrador']) {
    check(role + ' ve tareas con permiso explícito', () => {
      const r = execute(setup(role), 'ver_tareas_seguimiento'); assert.equal(r.replies[0].data.cantidad_tareas, 1); assert.equal(r.replies[0].ok, true);
    });
    check(role + ' cierra con permiso y audita antes de responder', () => {
      const db = setup(role), r = execute(db, 'cerrar_tarea_seguimiento');
      assert.equal(r.replies[0].ok, true); assert.equal(db.lab025_tareas[0].estado, 'cerrada'); assert.equal(db.lab025_tareas[0].fecha_cierre, clock);
      const audit = db.lab025_auditoria_operaciones[0]; assert.equal(db.lab025_auditoria_operaciones.length, 1);
      for (const [k,v] of Object.entries({ clinic_id: 'clinica_test', actor_user_id: 'actor_test', accion: 'cerrar_tarea_seguimiento', recurso_tipo: 'tarea', recurso_id: task.task_id, resultado: 'exito', estado_anterior: 'pendiente', estado_nuevo: 'cerrada' })) assert.equal(audit[k], v);
      assert.ok(Number.isFinite(Date.parse(audit.fecha_hora))); assert.ok(r.events.findIndex(e => e[0] === 'audit') < r.events.findIndex(e => e[0] === 'reply'));
    });
    for (const action of ['ver_tareas_seguimiento', 'cerrar_tarea_seguimiento']) check(role + ' sin permiso denegado ' + action, () => {
      const db = setup(role, ['tareas_actualizar']), r = execute(db, action); assert.equal(r.replies[0].ok, false); assert.deepEqual(db.lab025_tareas, [task]);
    });
  }
  check('listado excluye otra clínica, genéricas y cerradas', () => {
    const db = setup(); db.lab025_tareas.push({ ...task, clinic_id: 'otra' }, { ...task, task_id: 'generic' }, { ...task, creado_por: 'otro' }, { ...task, estado: 'cerrada' });
    const data = execute(db, 'ver_tareas_seguimiento').replies[0].data; assert.equal(data.cantidad_tareas, 1); assert.equal(data.tareas[0].task_id, task.task_id);
    assert.deepEqual(Object.keys(data.tareas[0]), ['task_id','titulo','descripcion','prioridad','estado','asignado_a','fecha_creacion','fecha_limite','fecha_actualizacion']);
  });
  check('identidad ausente o usuario inactivo no alcanzan gestión', () => {
    for (const action of ['ver_tareas_seguimiento','cerrar_tarea_seguimiento']) {
      const db = setup(); assert.equal(execute(db, action, { headers: {} }).replies[0].ok, false);
      db.lab025_usuarios_internos[0].estado = 'inactivo'; assert.equal(execute(db, action).replies[0].ok, false);
    }
  });
  check('otra clínica no cierra aunque el body intente suplantarla', () => {
    const db = setup(); db.lab025_tareas[0].clinic_id = 'otra'; const before = structuredClone(db.lab025_tareas);
    assert.equal(execute(db, 'cerrar_tarea_seguimiento', { body: { clinic_id: 'otra' } }).replies[0].ok, false); assert.deepEqual(db.lab025_tareas, before);
  });
  for (const id of ['', 'inexistente']) check('recurso inválido ' + id, () => {
    const db = setup(); assert.equal(execute(db, 'cerrar_tarea_seguimiento', { id }).replies[0].ok, false); assert.deepEqual(db.lab025_tareas, [task]);
  });
  check('tarea genérica o duplicada no puede cerrarse', () => {
    for (const duplicate of [false, true]) {
      const db = setup(); if (duplicate) db.lab025_tareas.push(structuredClone(task)); else db.lab025_tareas[0].creado_por = 'otro';
      assert.equal(execute(db, 'cerrar_tarea_seguimiento').replies[0].ok, false); assert.ok(db.lab025_tareas.every(t => t.estado === 'pendiente'));
    }
  });
  check('cierre automático previo y repetición humana no mutan ni auditan', () => {
    const db = setup(); Object.assign(db.lab025_tareas[0], { estado: 'cerrada', fecha_cierre: '2026-09-04T14:00:00Z' }); const before = structuredClone(db);
    const r = execute(db, 'cerrar_tarea_seguimiento'); assert.equal(r.replies[0].ok, true); assert.match(r.replies[0].message, /ya no/); assert.deepEqual(db, before);
  });
  check('fallo de escritura no comunica éxito ni audita mutación', () => {
    const db = setup(); const r = execute(db, 'cerrar_tarea_seguimiento', { failWrite: true }); assert.equal(r.replies[0].ok, false); assert.equal(db.lab025_auditoria_operaciones.length, 0); assert.deepEqual(db.lab025_tareas, [task]);
  });
  check('fallo de auditoría nunca comunica éxito', () => {
    const db = setup(); const r = execute(db, 'cerrar_tarea_seguimiento', { failAudit: true }); assert.ok(!r.replies.some(r => r.ok));
  });
  check('cierre concurrente pierde CAS sin atribuirse ni auditar otra mutación', () => {
    const db = setup(), r = execute(db, 'cerrar_tarea_seguimiento', { concurrentClose: true });
    assert.equal(r.replies[0].ok, false); assert.equal(db.lab025_tareas[0].fecha_cierre, '2026-09-04T14:59:00Z');
    assert.equal(db.lab025_auditoria_operaciones.length, 0);
  });
  check('tarea en_proceso también permite cierre humano', () => {
    const db = setup(); db.lab025_tareas[0].estado = 'en_proceso';
    assert.equal(execute(db, 'cerrar_tarea_seguimiento').replies[0].ok, true);
    assert.equal(db.lab025_auditoria_operaciones[0].estado_anterior, 'en_proceso');
  });
  check('cierre ignora cambios de contenido y no escribe citas ni seguimientos', () => {
    const db = setup(); const r = execute(db, 'cerrar_tarea_seguimiento', { body: { titulo: 'alterado', prioridad: 'alta', estado_objetivo: 'en_proceso' } });
    assert.equal(db.lab025_tareas[0].titulo, task.titulo); assert.equal(db.lab025_tareas[0].prioridad, task.prioridad);
    assert.ok(r.events.filter(e => e[0] === 'update').every(e => e[1] === 'lab025_tareas'));
  });
  const citaFinalizada={clinic_id:'clinica_piloto_001',appointment_id:'apt_resultado_001',version:3,estado:'confirmada',service_id:'consulta',start_time:'2026-09-04T10:00:00.000Z',end_time:'2026-09-04T10:30:00.000Z'};
  const solicitudResultado={appointment_id:citaFinalizada.appointment_id,resultado_atencion:'atencion_realizada'};
  const authResultado={clinic_id:citaFinalizada.clinic_id};
  const decidirResultado=(overrides={})=>registrarResultadoCita({solicitud:solicitudResultado,autenticacion:authResultado,citas:[citaFinalizada],existentes:[],ahora:'2026-09-04T11:00:00.000Z',...overrides});
  check('resultado válido conserva exactamente clínica autenticada',()=>{const r=decidirResultado();assert.equal(r.accion,'insertar');assert.equal(r.fila.estado,'atencion_realizada');assert.equal(r.fila.clinic_id,authResultado.clinic_id);assert.equal(r.fila.appointment_version,3);assert.equal(r.fila.fecha_objetivo,citaFinalizada.end_time);assert.deepEqual(JSON.parse(decodeURIComponent(r.seguimiento_id.slice('seg_lab027_'.length))),[authResultado.clinic_id,citaFinalizada.appointment_id,3,'resultado_cita','post_cita']);});
  check('resultado no_show exige acción humana explícita',()=>{const r=decidirResultado({solicitud:{...solicitudResultado,resultado_atencion:'no_show'}});assert.equal(r.accion,'insertar');assert.equal(r.fila.estado,'no_show');});
  check('resultado antes del fin se rechaza sin fila',()=>{const r=decidirResultado({ahora:'2026-09-04T10:20:00.000Z'});assert.equal(r.motivo,'cita_aun_no_finalizada');assert.equal(r.fila,undefined);});
  check('cita cancelada se rechaza',()=>assert.equal(decidirResultado({citas:[{...citaFinalizada,estado:'cancelada'}]}).motivo,'cita_cancelada'));
  check('otra clínica e inexistente no producen fila',()=>{for(const citas of [[{...citaFinalizada,clinic_id:'otra'}],[]])assert.equal(decidirResultado({citas}).accion,'rechazar');});
  check('clinic_id del body no sustituye clínica autenticada',()=>{const r=decidirResultado({solicitud:{...solicitudResultado,clinic_id:'clinica_atacante'}});assert.equal(r.fila.clinic_id,authResultado.clinic_id);assert.equal(r.seguimiento_id.includes('clinica_atacante'),false);});
  check('pérdida de clínica autenticada impide toda fila',()=>{for(const clinic_id of [null,undefined,'']){const r=decidirResultado({autenticacion:{clinic_id}});assert.equal(r.accion,'rechazar');assert.equal(r.fila,undefined);assert.equal(r.seguimiento_id,undefined);}});
  check('identidad nunca contiene clínica nula vacía o undefined',()=>{const r=decidirResultado();assert.equal(/null|undefined|%22%22/.test(r.seguimiento_id),false);assert.equal(r.fila.clinic_id.length>0,true);});
  check('resultado repetido encuentra misma fila por clínica cita y versión',()=>{const first=decidirResultado(),row=structuredClone(first.fila),r=decidirResultado({existentes:[row,{...row,clinic_id:'otra_clinica'}],ahora:'2026-09-04T12:00:00.000Z'});assert.equal(r.accion,'ya_registrado');assert.deepEqual(r.fila,row);});
  check('resultado contrario devuelve conflicto sin escritura',()=>{const row=decidirResultado().fila,r=decidirResultado({solicitud:{...solicitudResultado,resultado_atencion:'no_show'},existentes:[row]});assert.equal(r.http_status,409);assert.equal(r.accion,'rechazar');assert.equal(r.fila,undefined);});
  check('duplicado estructural detiene resultado',()=>{const row=decidirResultado().fila,r=decidirResultado({existentes:[row,{...row}]});assert.equal(r.motivo,'resultado_cita_duplicado');});
  check('identidad usa versión vigente y excluye resultado',()=>{const a=decidirResultado(),b=decidirResultado({solicitud:{...solicitudResultado,resultado_atencion:'no_show'}}),c=decidirResultado({citas:[{...citaFinalizada,version:4}]});assert.equal(a.seguimiento_id,b.seguimiento_id);assert.notEqual(a.seguimiento_id,c.seguimiento_id);});
  check('reprogramación usa horario vigente',()=>{const moved={...citaFinalizada,version:4,end_time:'2026-09-04T12:30:00.000Z'};assert.equal(decidirResultado({citas:[moved],ahora:'2026-09-04T11:00:00.000Z'}).motivo,'cita_aun_no_finalizada');});
  check('datos inválidos se rechazan',()=>{for(const resultado_atencion of ['','quizas'])assert.equal(decidirResultado({solicitud:{...solicitudResultado,resultado_atencion}}).http_status,400);});
  check('resultado no muta cita ni filas existentes',()=>{const citas=[structuredClone(citaFinalizada)],existentes=[],before=structuredClone({citas,existentes});decidirResultado({citas,existentes});assert.deepEqual({citas,existentes},before);});
  check('resultado queda desacoplado de tareas scheduler y postseguimiento',()=>{const r=decidirResultado({solicitud:{...solicitudResultado,resultado_atencion:'no_show'}});assert.equal(r.fila.tipo_seguimiento,'resultado_cita');assert.equal(r.fila.etapa,'post_cita');assert.equal(r.fila.tarea_id,'');assert.equal(r.fila.instruccion_id,'');});
  const authClinica={clinic_id:'clinica_piloto_001',rol:'veterinario',permisos:['seguimientos_clinicos_programar']},solClinica={appointment_id:citaFinalizada.appointment_id,tipo_seguimiento:'post_tratamiento',fecha_objetivo:'2026-09-05T10:00:00.000Z'},resultadoReal=decidirResultado().fila;
  const programar=(o={})=>programarSeguimientoClinico({solicitud:solClinica,autenticacion:authClinica,citas:[citaFinalizada],resultados:[resultadoReal],existentes:[],ahora:'2026-09-04T11:00:00.000Z',...o});
  check('veterinario programa post tratamiento',()=>{const r=programar();assert.equal(r.accion,'insertar');assert.equal(r.fila.estado,'pendiente');assert.equal(r.fila.tipo_seguimiento,'post_tratamiento');});
  check('veterinario programa post cirugía',()=>assert.equal(programar({solicitud:{...solClinica,tipo_seguimiento:'post_cirugia'}}).fila.tipo_seguimiento,'post_cirugia'));
  check('tipos clínicos sobreviven completos hasta la fila',()=>{for(const tipo_seguimiento of ['post_tratamiento','post_cirugia']){const r=programar({solicitud:{...solClinica,tipo_seguimiento}});assert.equal(r.fila.tipo_seguimiento,tipo_seguimiento);assert.equal(r.fila.appointment_id,solClinica.appointment_id);assert.equal(r.fila.fecha_objetivo,solClinica.fecha_objetivo);}});
  check('tipo clínico ausente se rechaza aunque sobrevivan cita y fecha',()=>{const r=programar({solicitud:{appointment_id:solClinica.appointment_id,fecha_objetivo:solClinica.fecha_objetivo}});assert.equal(r.motivo,'datos_programacion_invalidos');assert.equal(r.appointment_id,solClinica.appointment_id);assert.equal(r.fecha_objetivo,solClinica.fecha_objetivo);});
  check('versión se deriva de cita e ignora body',()=>{const r=programar({solicitud:{...solClinica,appointment_version:999}});assert.equal(r.appointment_version,citaFinalizada.version);assert.equal(r.fila.appointment_version,citaFinalizada.version);});
  check('recepción y administrador no autorizan clínica',()=>{for(const rol of ['recepcion','administrador'])assert.equal(programar({autenticacion:{...authClinica,rol}}).motivo,'rol_clinico_no_autorizado');});
  check('veterinario sin permiso rechazado',()=>assert.equal(programar({autenticacion:{...authClinica,permisos:[]}}).motivo,'permiso_clinico_requerido'));
  check('otra clínica cita inexistente y cancelada rechazadas',()=>{assert.equal(programar({autenticacion:{...authClinica,clinic_id:'otra'}}).accion,'rechazar');assert.equal(programar({citas:[]}).motivo,'cita_no_encontrada');assert.equal(programar({citas:[{...citaFinalizada,estado:'cancelada'}]}).motivo,'cita_cancelada');});
  check('requiere resultado atencion realizada único',()=>{assert.equal(programar({resultados:[]}).motivo,'atencion_realizada_requerida');assert.equal(programar({resultados:[{...resultadoReal,estado:'no_show'}]}).motivo,'resultado_no_show');assert.equal(programar({resultados:[resultadoReal,{...resultadoReal}]}).motivo,'resultado_cita_duplicado');});
  check('fecha inválida o anticipada rechazada',()=>{for(const fecha_objetivo of ['x',citaFinalizada.end_time,'2026-09-04T10:45:00.000Z'])assert.equal(programar({solicitud:{...solClinica,fecha_objetivo}}).accion,'rechazar');});
  check('programación idempotente conserva fila',()=>{const first=programar(),row=structuredClone(first.fila),r=programar({existentes:[row]});assert.equal(r.accion,'ya_programado');assert.deepEqual(r.fila,row);});
  check('misma identidad con fecha distinta conflictúa',()=>{const row=programar().fila,r=programar({solicitud:{...solClinica,fecha_objetivo:'2026-09-06T10:00:00.000Z'},existentes:[row]});assert.equal(r.http_status,409);assert.equal(r.fila,undefined);});
  check('duplicado clínico detiene escritura',()=>{const row=programar().fila;assert.equal(programar({existentes:[row,{...row}]}).motivo,'seguimiento_clinico_duplicado');});
  check('clínica de body se ignora y LAB026 no muta',()=>{const citas=[structuredClone(citaFinalizada)],before=structuredClone(citas),r=programar({solicitud:{...solClinica,clinic_id:'otra'},citas});assert.equal(r.fila.clinic_id,authClinica.clinic_id);assert.deepEqual(citas,before);});
  const seguimientoClinico=programar().fila,citaEnvio={...citaFinalizada,nombre_mascota:'Mascota prueba',telefono_normalizado:'+56911111111'},instruccionClinica={instruccion_id:'instr_post_test',clinic_id:seguimientoClinico.clinic_id,service_id:citaFinalizada.service_id,categoria_atencion:'post_tratamiento',instrucciones:'Observa a tu mascota y contacta a la clínica si necesitas orientación.',recordatorio_72h:'false',recordatorio_48h:'false',recordatorio_24h:'false',activo:'true'},ahoraClinico='2026-09-05T11:00:00.000Z';
  const planEnvio=(o={})=>planificarEnvioClinico({seguimiento:{...seguimientoClinico,fecha_objetivo:'2026-09-05T10:00:00.000Z'},citas:[citaEnvio],instrucciones:[instruccionClinica],ahora:ahoraClinico,...o});
  check('post tratamiento exigible adquiere texto autorizado',()=>{const p=planEnvio();assert.equal(p.accion,'adquirir');assert.equal(p.patch.estado,'pendiente');assert.equal(p.patch.instruccion_id,instruccionClinica.instruccion_id);assert.equal(p.contrato.contenido.includes(instruccionClinica.instrucciones),true);});
  check('post cirugía equivalente',()=>{const s={...seguimientoClinico,tipo_seguimiento:'post_cirugia',seguimiento_id:'seg_cirugia'},i={...instruccionClinica,categoria_atencion:'post_cirugia'};assert.equal(planEnvio({seguimiento:{...s,fecha_objetivo:'2026-09-05T10:00:00.000Z'},instrucciones:[i]}).accion,'adquirir');});
  check('antes del objetivo y scheduler no crean clínico',()=>{assert.equal(planEnvio({seguimiento:{...seguimientoClinico,fecha_objetivo:'2026-09-06T10:00:00.000Z'}}).accion,'omitir');});
  check('cita inválida o cambiada requiere revisión',()=>{for(const citas of [[],[{...citaFinalizada,clinic_id:'otra'}],[{...citaFinalizada,version:2}],[{...citaFinalizada,estado:'cancelada'}]])assert.equal(planEnvio({citas}).accion,'revision');});
  check('instrucción ausente inactiva o duplicada revisa',()=>{assert.equal(planEnvio({instrucciones:[]}).motivo,'instruccion_no_disponible');assert.equal(planEnvio({instrucciones:[{...instruccionClinica,activo:'false'}]}).motivo,'instruccion_no_disponible');assert.equal(planEnvio({instrucciones:[instruccionClinica,{...instruccionClinica,instruccion_id:'otra'}]}).motivo,'instrucciones_duplicadas');});
  check('envio id determinista y sin ids en texto',()=>{const a=planEnvio(),b=planEnvio();assert.equal(a.patch.envio_id,b.patch.envio_id);for(const id of [a.seguimiento.appointment_id,a.seguimiento.seguimiento_id,a.patch.envio_id])assert.equal(a.contrato.contenido.includes(id),false);});
  check('adquisición previa sin confirmación nunca reenvía',()=>{const p=planEnvio(),r=planEnvio({seguimiento:{...seguimientoClinico,fecha_objetivo:'2026-09-05T10:00:00.000Z',envio_id:p.patch.envio_id,instruccion_id:p.patch.instruccion_id}});assert.equal(r.accion,'revision');assert.equal(r.motivo,'envio_previo_sin_confirmacion');});
  check('accepted contacta y conserva respuesta vacía',()=>{const p=planEnvio(),s={...p.seguimiento,...p.patch},r=resolverEnvioClinico(s,{ok:true,status:'accepted',envio_id:s.envio_id,message_id:'sim_1',fecha_resultado:ahoraClinico,error_code:''},ahoraClinico);assert.equal(r.patch.estado,'contactado');assert.ok(r.patch.enviado_at);assert.equal(s.respuesta_tipo,'');});
  check('rejected e uncertain requieren revisión',()=>{const p=planEnvio(),s={...p.seguimiento,...p.patch},result=status=>({ok:false,status,envio_id:s.envio_id,message_id:'',fecha_resultado:ahoraClinico,error_code:'simulado_'+status});assert.equal(resolverEnvioClinico(s,result('rejected'),ahoraClinico).motivo,'envio_rechazado');assert.equal(resolverEnvioClinico(s,result('uncertain'),ahoraClinico).motivo,'envio_incierto');});
  check('plan de envío no muta cita seguimiento ni instrucción',()=>{const data={seguimiento:{...seguimientoClinico,fecha_objetivo:'2026-09-05T10:00:00.000Z'},citas:[structuredClone(citaFinalizada)],instrucciones:[structuredClone(instruccionClinica)],ahora:ahoraClinico},before=structuredClone(data);planificarEnvioClinico(data);assert.deepEqual(data,before);});
  const contacto={...seguimientoClinico,estado:'contactado',envio_id:'envio_clinico_1',enviado_at:'2026-09-05T11:00:00.000Z',updated_at:'2026-09-05T11:00:00.000Z'};
  const respuestaClinica=(tipo,overrides={})=>({clinic_id:contacto.clinic_id,seguimiento_id:contacto.seguimiento_id,envio_id:contacto.envio_id,appointment_id:contacto.appointment_id,appointment_version:contacto.appointment_version,respuesta_tipo:tipo,respuesta_texto:'texto no persistible',fecha_respuesta:'2026-09-05T11:30:00.000Z',...overrides});
  const procesarClinica=(tipo,o={})=>procesarRespuesta({respuesta:respuestaClinica(tipo,o.respuesta),seguimientos:o.seguimientos||[contacto],citas:o.citas||[citaFinalizada],ahora:'2026-09-05T12:00:00.000Z'});
  check('respuesta clínica normal se registra sin texto libre ni tarea',()=>{const r=procesarClinica('normal');assert.equal(r.patch.estado,'respuesta_recibida');assert.equal(r.crear_tarea,false);assert.equal(Object.hasOwn(r.patch,'respuesta_texto'),false);});
  check('respuesta preocupante requiere tarea humana',()=>{const r=procesarClinica('preocupante');assert.equal(r.patch.estado,'requiere_revision_humana');assert.equal(r.crear_tarea,true);assert.equal(r.auditoria.motivo,'respuesta_preocupante_revision_humana');});
  check('respuesta ambigua requiere tarea humana',()=>assert.equal(procesarClinica('ambiguo').crear_tarea,true));
  check('posible urgencia exige confirmación LAB024 antes de derivar',()=>{const r=procesarClinica('posible_urgencia');assert.equal(r.requiere_derivacion_urgencia,true);assert.equal(r.patch.estado,'requiere_revision_humana');assert.notEqual(r.patch.estado,'derivado_urgencia');});
  const decisionUrgencia=procesarClinica('posible_urgencia'),contratoUrgencia=prepararContratoUrgenciaLab024(decisionUrgencia),idsUrgencia=idsUrgenciaLab024(contratoUrgencia);
  const respuestaLab024=(status,overrides={})=>({ok:status==='accepted',status,derivacion_id:contratoUrgencia.derivacion_id,alert_id:idsUrgencia.alert_id,episode_id:idsUrgencia.episode_id,resultado:status==='accepted'?'registrada':'rechazada',motivo:status==='accepted'?'recepcion_confirmada':'contrato_invalido',...overrides});
  check('contrato LAB024 es mínimo determinista y sin texto libre',()=>{assert.deepEqual(Object.keys(contratoUrgencia),['origen','derivacion_id','clinic_id','seguimiento_id','envio_id','appointment_id','appointment_version','fecha_evento']);assert.equal(contratoUrgencia.origen,'sistema_lab027');assert.equal(JSON.stringify(contratoUrgencia).includes('texto no persistible'),false);assert.equal(validarContratoUrgenciaLab024(contratoUrgencia,'2026-09-05T12:00:00.000Z'),true);});
  check('LAB024 rechaza contratos manipulados',()=>{for(const patch of [{origen:'externo'},{clinic_id:'otra'},{appointment_version:0},{extra:'x'}]){const value={...contratoUrgencia,...patch};assert.equal(validarContratoUrgenciaLab024(value,'2026-09-05T12:00:00.000Z'),false);}});
  check('recepción LAB024 nueva prepara tres efectos deterministas',()=>{const p=planificarRecepcionUrgenciaLab024(contratoUrgencia);assert.equal(p.accion,'insertar');assert.equal(p.alerta.prioridad,'prioridad_inmediata');assert.equal(p.alerta.mensaje_actual,'');assert.equal(p.intento.estado_envio,'recibido');assert.equal(p.operativa.estado_operacion,'pendiente');});
  check('recepción LAB024 repetida no reescribe',()=>{const p=planificarRecepcionUrgenciaLab024(contratoUrgencia),r=planificarRecepcionUrgenciaLab024(contratoUrgencia,[p.alerta],[p.intento],[p.operativa]);assert.equal(r.accion,'aceptar');assert.equal(r.respuesta.resultado,'ya_registrada');assert.deepEqual(r.alerta,p.alerta);});
  check('LAB024 diferencia conflicto y persistencia parcial',()=>{const p=planificarRecepcionUrgenciaLab024(contratoUrgencia);assert.equal(planificarRecepcionUrgenciaLab024(contratoUrgencia,[{...p.alerta,session_id:'otro'}],[],[]).respuesta.status,'rejected');assert.equal(planificarRecepcionUrgenciaLab024(contratoUrgencia,[{...p.alerta,created_at:'2026-09-05T10:00:00.000Z'}],[],[]).respuesta.status,'uncertain');});
  check('accepted deriva sin tarea y con auditoría controlada',()=>{const r=resolverDerivacionUrgenciaLab024(decisionUrgencia,respuestaLab024('accepted'));assert.equal(r.patch.estado,'derivado_urgencia');assert.equal(r.crear_tarea,false);assert.equal(r.auditoria.motivo,'derivacion_lab024_confirmada');assert.equal(r.salida.resultado,'derivado_urgencia');});
  check('rejected e uncertain conservan fallback urgente',()=>{for(const status of ['rejected','uncertain']){const r=resolverDerivacionUrgenciaLab024(decisionUrgencia,respuestaLab024(status,{resultado:'no_verificada'}));assert.equal(r.patch.estado,'requiere_revision_humana');assert.equal(r.crear_tarea,true);assert.equal(r.auditoria.motivo,status==='rejected'?'integracion_lab024_rechazada':'integracion_lab024_incierta');}});
  check('respuesta LAB024 ausente o correlación inválida nunca deriva',()=>{for(const value of [null,{...respuestaLab024('accepted'),derivacion_id:'otra'}])assert.notEqual(resolverDerivacionUrgenciaLab024(decisionUrgencia,value).patch.estado,'derivado_urgencia');});
  check('runtime IDs enlazan LAB024 oficial',()=>{assert.equal(LAB024_RUNTIME_WORKFLOW_ID,'XKP0MTWoAxCPaWqb');assert.equal(CORE_RUNTIME_WORKFLOW_ID,'aVs5LQiBrrRsyzcN');assert.equal(ADAPTER_RUNTIME_WORKFLOW_ID,'QhFSw6XCHqsS5cQC');});
  check('LAB024 runtime es interno publicable y su generación es idempotente',()=>{const w=JSON.parse(fs.readFileSync(lab024Path,'utf8'));assert.equal(w.nodes.length,18);assert.equal(w.nodes.filter(n=>n.type.endsWith('.executeWorkflowTrigger')).length,1);assert.equal(w.nodes.some(n=>/webhook|\.wait$|\.n8nTrigger$/.test(n.type)),false);assert.deepEqual(construirIntegracionLab024(w),w);});
  const lab024Generado=construirIntegracionLab024(JSON.parse(fs.readFileSync(lab024Path,'utf8')));
  const ejecutarCode=(workflow,name,values,input=[])=>new Function('$','$input','$now',workflow.nodes.find(n=>n.name===name).parameters.jsCode)(
    nodeName=>({first:()=>({json:(values[nodeName]||[])[0]}),all:()=> (values[nodeName]||[]).map(json=>({json}))}),
    {all:()=>input.map(json=>({json}))},{toISO:()=> '2026-09-05T12:00:00.000Z'});
  check('Code planificador LAB024 ejecuta sus dependencias dentro del sandbox n8n',()=>{
    const expected=planificarRecepcionUrgenciaLab024(contratoUrgencia),base={'Validar contrato interno LAB-027 en LAB-024':[{contrato:contratoUrgencia}]};
    const run=(alertas=[],historial=[],operativas=[])=>ejecutarCode(lab024Generado,'Planificar recepción interna LAB-027',{
      ...base,'Buscar alerta interna LAB-027':alertas,'Buscar historial interno LAB-027':historial},operativas)[0].json;
    assert.equal(run().accion,'insertar');
    assert.equal(run([{...expected.alerta,session_id:'conflicto_controlado'}]).respuesta.status,'rejected');
    assert.equal(run([expected.alerta]).respuesta.status,'uncertain');
  });
  check('Code confirmador LAB024 verifica los tres efectos sin referencia global',()=>{
    const expected=planificarRecepcionUrgenciaLab024(contratoUrgencia),result=ejecutarCode(lab024Generado,'Confirmar recepción interna LAB-027',{
      'Validar contrato interno LAB-027 en LAB-024':[{contrato:contratoUrgencia}],
      'Verificar alerta interna LAB-027':[expected.alerta],
      'Verificar historial interno LAB-027':[expected.intento]},[expected.operativa])[0].json;
    assert.equal(result.status,'accepted');assert.equal(result.resultado,'registrada');assert.equal(result.motivo,'recepcion_confirmada');
  });
  check('Code resolver LAB027 ejecuta accepted rejected uncertain con contrato autocontenido',()=>{
    const core=construirWorkflow(),run=respuesta=>ejecutarCode(core,'Resolver recepción urgencia LAB-024',{'Resolver respuesta del tutor LAB-027':[decisionUrgencia]},[respuesta])[0].json;
    assert.equal(run(respuestaLab024('accepted')).patch.estado,'derivado_urgencia');
    assert.equal(run(respuestaLab024('rejected',{resultado:'no_verificada'})).auditoria.motivo,'integracion_lab024_rechazada');
    assert.equal(run(respuestaLab024('uncertain',{resultado:'no_verificada'})).auditoria.motivo,'integracion_lab024_incierta');
  });
  check('Code de tarea usa la decisión posterior a LAB024',()=>{
    const core=construirWorkflow();
    for(const status of ['rejected','uncertain']){
      const decision=resolverDerivacionUrgenciaLab024(decisionUrgencia,respuestaLab024(status,{resultado:'no_verificada'}));
      const result=ejecutarCode(core,'Preparar tarea respuesta clínica LAB-027',{'Requiere persistir respuesta LAB-027':[decision]},[])[0].json;
      assert.equal(result.accion,'insertar');assert.equal(result.decision.auditoria.motivo,status==='rejected'?'integracion_lab024_rechazada':'integracion_lab024_incierta');
    }
  });
  check('Code de verificación conserva salida y auditoría posteriores a LAB024',()=>{
    const core=construirWorkflow();
    for(const status of ['accepted','rejected','uncertain']){
      const decision=resolverDerivacionUrgenciaLab024(decisionUrgencia,respuestaLab024(status,{resultado:status==='accepted'?'registrada':'no_verificada'}));
      const patch=decision.crear_tarea?{...decision.patch,tarea_id:tareaRespuestaClinicaId(decision.seguimiento)}:decision.patch;
      const row={...decision.seguimiento,...patch};
      const result=ejecutarCode(core,'Verificar persistencia de respuesta LAB-027',{'Requiere persistir respuesta LAB-027':[decision]},[row])[0].json;
      assert.equal(result.salida.resultado,status==='accepted'?'derivado_urgencia':'revision_humana');
      assert.equal(result.decision.auditoria.motivo,status==='accepted'?'derivacion_lab024_confirmada':status==='rejected'?'integracion_lab024_rechazada':'integracion_lab024_incierta');
    }
  });
  check('Code de restauración nunca vuelve a la decisión previa a LAB024',()=>{
    const core=construirWorkflow(),decision=resolverDerivacionUrgenciaLab024(decisionUrgencia,respuestaLab024('accepted'));
    assert.deepEqual(ejecutarCode(core,'Restaurar decisión respuesta LAB-027',{'Requiere persistir respuesta LAB-027':[decision]})[0].json,decision);
  });
  check('respuesta clínica repetida es idempotente',()=>{for(const tipo of ['normal','preocupante','posible_urgencia','ambiguo']){const s={...contacto,estado:tipo==='normal'?'respuesta_recibida':'requiere_revision_humana',respuesta_tipo:tipo,respuesta_at:'2026-09-05T11:30:00.000Z'};const r=procesarRespuesta({respuesta:respuestaClinica(tipo),seguimientos:[s],citas:[citaFinalizada],ahora:'2026-09-05T12:00:00.000Z'});assert.equal(r.persistir,false);assert.equal(r.salida.resultado,'ya_registrada');}});
  check('seguimiento inexistente no contactado o incompatible se rechaza',()=>{assert.equal(procesarClinica('normal',{seguimientos:[]}).persistir,false);assert.equal(procesarClinica('normal',{seguimientos:[{...contacto,estado:'pendiente'}]}).persistir,false);assert.equal(procesarClinica('normal',{citas:[{...citaFinalizada,version:99}]}).persistir,false);});
  check('clínica e identificadores de correlación no pueden sustituirse',()=>{for(const respuesta of [{clinic_id:'otra'},{appointment_id:'otra'},{envio_id:'otro'}])assert.equal(procesarClinica('normal',{respuesta}).persistir,false);});
  check('tarea clínica es determinista y aislada por clínica',()=>{const d=procesarClinica('preocupante'),a=prepararTareaRespuestaClinica(d,[],'2026-09-05T12:00:00.000Z'),b=prepararTareaRespuestaClinica(d,[],'2026-09-05T12:01:00.000Z');assert.equal(a.tarea.task_id,b.tarea.task_id);assert.equal(a.tarea.clinic_id,contacto.clinic_id);assert.equal(a.tarea.task_id,tareaRespuestaClinicaId(contacto));});
  check('tarea existente se reutiliza y duplicados bloquean',()=>{const d=procesarClinica('ambiguo'),t=prepararTareaRespuestaClinica(d,[],'2026-09-05T12:00:00.000Z').tarea;assert.equal(prepararTareaRespuestaClinica(d,[t],'2026-09-05T12:01:00.000Z').accion,'reutilizar');assert.equal(prepararTareaRespuestaClinica(d,[t,{...t}],'2026-09-05T12:01:00.000Z').accion,'bloquear');});
  check('clasificación clínica es lista cerrada declarada',()=>{assert.equal(validarContratoRespuesta(respuestaClinica('normal'),'2026-09-05T12:00:00.000Z'),true);assert.equal(validarContratoRespuesta(respuestaClinica('diagnostico'),'2026-09-05T12:00:00.000Z'),false);});
  check('contrato técnico exige versión y acepta evento completo',()=>{const e=respuestaClinica('normal');assert.equal(validarContratoRespuesta(e,'2026-09-05T12:00:00.000Z'),true);const sin={...e};delete sin.appointment_version;assert.equal(validarContratoRespuesta(sin,'2026-09-05T12:00:00.000Z'),false);});
  check('adaptador rechaza versión ausente o inválida y conserva campos inesperados cerrados',()=>{const base={accion:'simular_respuesta',...respuestaClinica('normal')};for(const appointment_version of [undefined,0,-1,1.5,'1']){const e={...base};if(appointment_version===undefined)delete e.appointment_version;else e.appointment_version=appointment_version;assert.equal(simularCanal(e,'2026-09-05T12:00:00.000Z').status,'rejected');}assert.equal(simularCanal({...base,extra:'x'},'2026-09-05T12:00:00.000Z').error_code,'campo_no_permitido');});
  check('versión externa incorrecta falla al contrastar seguimiento y cita',()=>{const r=procesarClinica('normal',{respuesta:{appointment_version:99}});assert.equal(r.persistir,false);assert.equal(r.salida.resultado,'rechazada');});
  return { checks };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(probarLogica(), null, 2));
}
