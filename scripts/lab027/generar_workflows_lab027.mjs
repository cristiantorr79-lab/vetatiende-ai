import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
// Bindings de la instancia piloto; una nueva importación requiere volver a enlazarlos.
export const CORE_RUNTIME_WORKFLOW_ID = 'aVs5LQiBrrRsyzcN';
export const ADAPTER_RUNTIME_WORKFLOW_ID = 'QhFSw6XCHqsS5cQC';
export const LAB024_RUNTIME_WORKFLOW_ID = 'XKP0MTWoAxCPaWqb';
const subworkflowParameters = value => ({
  source: 'database', workflowId: { __rl: true, value, mode: 'id' },
  workflowInputs: { mappingMode: 'defineBelow', value: {}, matchingColumns: [], schema: [],
    attemptToConvertTypes: false, convertFieldsToString: true },
  mode: 'each', options: { waitForSubWorkflow: true },
});
export const workflowPath = path.resolve(path.dirname(scriptPath), '../../n8n/workflows/comercial/lab027_seguimientos_recordatorios_pendientes.json');
export const adapterPath = path.join(path.dirname(workflowPath), 'lab027_adaptador_canal_simulado.json');
export const lab024Path = path.join(path.dirname(workflowPath), 'lab024_urgencias_medicas_alerta_interna.json');
export const schemas = {
  lab027_seguimientos: [
    ['seguimiento_id', 'string'], ['clinic_id', 'string'], ['appointment_id', 'string'],
    ['appointment_version', 'number'], ['tipo_seguimiento', 'string'], ['categoria_atencion', 'string'],
    ['etapa', 'string'], ['fecha_objetivo', 'string'], ['estado', 'string'], ['instruccion_id', 'string'],
    ['envio_id', 'string'], ['enviado_at', 'string'], ['respuesta_tipo', 'string'], ['respuesta_at', 'string'],
    ['tarea_id', 'string'], ['created_at', 'string'], ['updated_at', 'string'], ['closed_at', 'string'],
  ],
  lab027_instrucciones: [
    ['instruccion_id', 'string'], ['clinic_id', 'string'], ['service_id', 'string'],
    ['categoria_atencion', 'string'], ['nombre_visible', 'string'], ['instrucciones', 'string'],
    ['recordatorio_72h', 'string'], ['recordatorio_48h', 'string'], ['recordatorio_24h', 'string'],
    ['activo', 'string'], ['created_at', 'string'], ['updated_at', 'string'],
  ],
};

// Decisión pura del registro humano posterior a la cita. Solo propone una
// inserción; la cita canónica recibida nunca se modifica.
export function registrarResultadoCita({ solicitud = {}, autenticacion = {}, citas = [], existentes = [], ahora }) {
  const text = value => typeof value === 'string' ? value.trim() : '';
  const instant = value => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  const clock = instant(ahora);
  if (!Number.isFinite(clock)) throw new Error('Reloj explícito inválido');
  // La clínica procede exclusivamente del contexto autenticado; cualquier valor
  // homónimo enviado por el cliente se ignora.
  const clinic = text(autenticacion.clinic_id), appointment = text(solicitud.appointment_id);
  const result = text(solicitud.resultado_atencion).toLowerCase();
  const reject = (http_status, motivo) => ({ accion: 'rechazar', http_status, motivo, clinic_id: clinic, appointment_id: appointment, resultado_atencion: result });
  if (!clinic || !appointment || !['atencion_realizada', 'no_show'].includes(result)) return reject(400, 'datos_resultado_invalidos');
  const matches = citas.filter(c => text(c.clinic_id) === clinic && text(c.appointment_id) === appointment);
  if (matches.length !== 1) return reject(matches.length > 1 ? 409 : 404, matches.length > 1 ? 'cita_ambigua' : 'cita_no_encontrada');
  const cita = matches[0];
  if (text(cita.clinic_id) !== clinic) return reject(403, 'clinica_cita_no_autorizada');
  const version = Number(cita.version), end = instant(cita.end_time);
  if (!Number.isSafeInteger(version) || version < 1) return reject(409, 'version_cita_invalida');
  if (cita.estado !== 'confirmada') return reject(409, cita.estado === 'cancelada' ? 'cita_cancelada' : 'estado_cita_no_compatible');
  // Cinco minutos cubren desfases menores ya admitidos por LAB-027, sin aceptar
  // un registro claramente anticipado.
  if (!Number.isFinite(end) || end > clock + 5 * 60 * 1000) return reject(409, 'cita_aun_no_finalizada');
  const parts = [clinic, appointment, version, 'resultado_cita', 'post_cita'];
  const seguimiento_id = 'seg_lab027_' + encodeURIComponent(JSON.stringify(parts));
  if (!clinic || seguimiento_id.includes('null') || seguimiento_id.includes('undefined') || seguimiento_id.includes('%22%22'))
    return reject(403, 'contexto_clinica_invalido');
  const rows = existentes.filter(s => text(s.clinic_id) === clinic && text(s.appointment_id) === appointment &&
    Number(s.appointment_version) === version && s.tipo_seguimiento === 'resultado_cita' && s.etapa === 'post_cita');
  if (rows.length > 1) return { ...reject(409, 'resultado_cita_duplicado'), seguimiento_id, appointment_version: version };
  if (rows.length === 1) {
    const row = rows[0];
    if (row.seguimiento_id !== seguimiento_id) return { ...reject(409, 'resultado_cita_identidad_invalida'), seguimiento_id, appointment_version: version };
    if (row.estado === result) return { accion: 'ya_registrado', http_status: 200, motivo: 'resultado_cita_ya_registrado', seguimiento_id, appointment_version: version, fila: row };
    return { ...reject(409, 'resultado_cita_ya_registrado'), seguimiento_id, appointment_version: version };
  }
  const timestamp = new Date(clock).toISOString();
  return { accion: 'insertar', http_status: 200, motivo: 'operacion_completada', seguimiento_id, appointment_version: version,
    fila: { seguimiento_id, clinic_id: clinic, appointment_id: appointment, appointment_version: version,
      tipo_seguimiento: 'resultado_cita', categoria_atencion: '', etapa: 'post_cita', fecha_objetivo: new Date(end).toISOString(),
      estado: result, instruccion_id: '', envio_id: '', enviado_at: '', respuesta_tipo: '', respuesta_at: '', tarea_id: '',
      created_at: timestamp, updated_at: timestamp, closed_at: timestamp } };
}

export function programarSeguimientoClinico({ solicitud = {}, autenticacion = {}, citas = [], resultados = [], existentes = [], ahora }) {
  const text=v=>typeof v==='string'?v.trim():'';
  const instant=v=>typeof v==='string'&&/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)?Date.parse(v):NaN;
  const clock=instant(ahora); if(!Number.isFinite(clock)) throw new Error('Reloj explícito inválido');
  const clinic=text(autenticacion.clinic_id),rol=text(autenticacion.rol).toLowerCase(),permisos=Array.isArray(autenticacion.permisos)?autenticacion.permisos:[];
  const appointment=text(solicitud.appointment_id),tipo=text(solicitud.tipo_seguimiento).toLowerCase(),target=instant(solicitud.fecha_objetivo);
  const reject=(http_status,motivo)=>({accion:'rechazar',http_status,motivo,clinic_id:clinic,appointment_id:appointment,tipo_seguimiento:tipo,fecha_objetivo:text(solicitud.fecha_objetivo)});
  if(!clinic) return reject(403,'contexto_clinica_invalido');
  if(rol!=='veterinario') return reject(403,'rol_clinico_no_autorizado');
  if(!permisos.includes('seguimientos_clinicos_programar')) return reject(403,'permiso_clinico_requerido');
  if(!appointment||!['post_tratamiento','post_cirugia'].includes(tipo)||!Number.isFinite(target)) return reject(400,'datos_programacion_invalidos');
  const found=citas.filter(c=>text(c.clinic_id)===clinic&&text(c.appointment_id)===appointment);
  if(found.length!==1)return reject(found.length>1?409:404,found.length>1?'cita_ambigua':'cita_no_encontrada');
  const cita=found[0],version=Number(cita.version),end=instant(cita.end_time);
  if(cita.estado!=='confirmada')return reject(409,cita.estado==='cancelada'?'cita_cancelada':'estado_cita_no_compatible');
  if(!Number.isSafeInteger(version)||version<1||!Number.isFinite(end))return reject(409,'cita_invalida');
  if(target<=clock||target<=end)return reject(400,'fecha_objetivo_anticipada');
  const result=resultados.filter(r=>text(r.clinic_id)===clinic&&text(r.appointment_id)===appointment&&Number(r.appointment_version)===version&&r.tipo_seguimiento==='resultado_cita'&&r.etapa==='post_cita');
  if(result.length!==1)return reject(result.length>1?409:422,result.length>1?'resultado_cita_duplicado':'atencion_realizada_requerida');
  if(result[0].estado!=='atencion_realizada')return reject(422,result[0].estado==='no_show'?'resultado_no_show':'atencion_realizada_requerida');
  const id='seg_lab027_'+encodeURIComponent(JSON.stringify([clinic,appointment,version,tipo,'post_atencion']));
  const rows=existentes.filter(r=>text(r.clinic_id)===clinic&&text(r.appointment_id)===appointment&&Number(r.appointment_version)===version&&r.tipo_seguimiento===tipo&&r.etapa==='post_atencion');
  if(rows.length>1)return {...reject(409,'seguimiento_clinico_duplicado'),seguimiento_id:id,appointment_version:version};
  if(rows.length===1){const row=rows[0];if(row.seguimiento_id!==id||row.estado!=='pendiente')return {...reject(409,'seguimiento_clinico_inconsistente'),seguimiento_id:id,appointment_version:version};if(instant(row.fecha_objetivo)===target)return {accion:'ya_programado',http_status:200,motivo:'seguimiento_ya_programado',seguimiento_id:id,appointment_version:version,fila:row};return {...reject(409,'fecha_objetivo_en_conflicto'),seguimiento_id:id,appointment_version:version};}
  const timestamp=new Date(clock).toISOString();
  return {accion:'insertar',http_status:200,motivo:'operacion_completada',seguimiento_id:id,appointment_version:version,fila:{seguimiento_id:id,clinic_id:clinic,appointment_id:appointment,appointment_version:version,tipo_seguimiento:tipo,categoria_atencion:'',etapa:'post_atencion',fecha_objetivo:new Date(target).toISOString(),estado:'pendiente',instruccion_id:'',envio_id:'',enviado_at:'',respuesta_tipo:'',respuesta_at:'',tarea_id:'',created_at:timestamp,updated_at:timestamp,closed_at:''}};
}

export function planificarEnvioClinico({ seguimiento:s, citas=[], instrucciones=[], ahora }) {
  const text=v=>typeof v==='string'?v.trim():'';const now=Date.parse(ahora),revision=(motivo,resultado='fallo')=>({accion:'revision',motivo,resultado,seguimiento:s,patch:{estado:'requiere_revision_humana',updated_at:new Date(now).toISOString()}});
  if(!s||!['post_tratamiento','post_cirugia'].includes(s.tipo_seguimiento)||s.etapa!=='post_atencion'||s.estado!=='pendiente')return{accion:'omitir',motivo:'no_elegible'};
  if(!Number.isFinite(now))throw Error('Reloj clínico inválido');
  if(text(s.envio_id)&&!text(s.enviado_at))return revision('envio_previo_sin_confirmacion','resultado_incierto');
  if(text(s.envio_id)||text(s.enviado_at)||!(Date.parse(s.fecha_objetivo)<=now))return{accion:'omitir',motivo:'aun_no_corresponde'};
  const cs=citas.filter(c=>text(c.clinic_id)===text(s.clinic_id)&&text(c.appointment_id)===text(s.appointment_id));
  if(cs.length!==1)return revision(cs.length?'cita_ambigua':'cita_no_encontrada',cs.length?'conflicto':'fallo');const c=cs[0];
  if(c.estado!=='confirmada')return revision(c.estado==='cancelada'?'cita_cancelada':'cita_no_vigente');
  if(Number(c.version)!==Number(s.appointment_version))return revision('appointment_version_cambiada','conflicto');
  const ins=instrucciones.filter(i=>text(i.clinic_id)===text(s.clinic_id)&&text(i.service_id)===text(c.service_id)&&i.categoria_atencion===s.tipo_seguimiento&&i.activo==='true');
  if(ins.length!==1)return revision(ins.length?'instrucciones_duplicadas':'instruccion_no_disponible',ins.length?'conflicto':'fallo');const i=ins[0];
  if(!text(i.instruccion_id)||!text(i.instrucciones)||i.recordatorio_72h!=='false'||i.recordatorio_48h!=='false'||i.recordatorio_24h!=='false')return revision('instruccion_no_disponible');
  const destino=text(c.telefono_normalizado);if(!destino)return revision('destino_no_disponible');const envio_id='env_lab027_'+encodeURIComponent(JSON.stringify([s.clinic_id,s.seguimiento_id,'seguimiento_clinico']));
  const contenido=`Hola. La clínica dejó programado un seguimiento para ${text(c.nombre_mascota)||'tu mascota'}. ${text(i.instrucciones)} Puedes responder este mensaje contándonos cómo sigue.`;
  if([s.appointment_id,s.seguimiento_id,envio_id].some(id=>contenido.includes(id)))return revision('contenido_no_seguro');
  const timestamp=new Date(now).toISOString();return{accion:'adquirir',motivo:'',seguimiento:s,patch:{estado:'pendiente',instruccion_id:i.instruccion_id,envio_id,updated_at:timestamp},contrato:{accion:'enviar',clinic_id:s.clinic_id,seguimiento_id:s.seguimiento_id,envio_id,appointment_id:s.appointment_id,destino,tipo_comunicacion:'seguimiento_clinico',contenido,fecha_envio:timestamp}};
}

export function resolverEnvioClinico(seguimiento,resultado,ahora){const clock=Date.parse(ahora),now=new Date(clock).toISOString(),keys=['ok','status','envio_id','message_id','fecha_resultado','error_code'],stamp=Date.parse(resultado?.fecha_resultado),valid=resultado&&typeof resultado==='object'&&!Array.isArray(resultado)&&Object.keys(resultado).length===keys.length&&keys.every(k=>Object.hasOwn(resultado,k))&&resultado.envio_id===seguimiento.envio_id&&['accepted','rejected','uncertain'].includes(resultado.status)&&resultado.ok===(resultado.status==='accepted')&&typeof resultado.message_id==='string'&&typeof resultado.error_code==='string'&&Number.isFinite(stamp)&&stamp>=Date.parse(seguimiento.updated_at)&&stamp<=clock+300000&&(resultado.status!=='accepted'||(resultado.message_id&&resultado.error_code===''));if(!valid||resultado.status==='uncertain')return{patch:{estado:'requiere_revision_humana',enviado_at:'',updated_at:now},resultado:'resultado_incierto',motivo:'envio_incierto',status_adaptador:valid?resultado.status:'invalid'};if(resultado.status==='rejected')return{patch:{estado:'requiere_revision_humana',enviado_at:'',updated_at:now},resultado:'fallo',motivo:'envio_rechazado',status_adaptador:'rejected'};return{patch:{estado:'contactado',enviado_at:new Date(stamp).toISOString(),updated_at:now},resultado:'exito',motivo:'envio_aceptado',status_adaptador:'accepted'};}

// Función pura autocontenida: el Code node y las pruebas ejecutan esta misma lógica.
// No contiene dependencias de Node, red, canal ni acceso a datos externos.
export function planificarSeguimientos({ citas = [], instrucciones = [], existentes = [], ahora }) {
  const instant = (value) => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ? Date.parse(value) : NaN;
  const clock = instant(ahora);
  if (!Number.isFinite(clock)) throw new Error('Reloj explícito inválido');
  const timestamp = new Date(clock).toISOString();
  const politicas = { rutina: [24], examen_procedimiento: [48, 24], cirugia: [72, 24] };
  const text = (value) => typeof value === 'string' ? value.trim() : '';
  const key = (clinic, appointment) => JSON.stringify([clinic, appointment]);
  const identity = (prefix, parts) => prefix + encodeURIComponent(JSON.stringify(parts));
  const seguimientos = [];
  const revision = [];
  const invalidaciones = [];
  const known = new Set(existentes.map((row) => row.seguimiento_id).filter(Boolean));
  const canonical = new Map();
  const ambiguous = new Set();
  for (const cita of citas) {
    const clinic = text(cita.clinic_id);
    const appointment = text(cita.appointment_id);
    if (!clinic || !appointment) continue; // incluye el item vacío de alwaysOutputData
    const id = key(clinic, appointment);
    if (canonical.has(id)) ambiguous.add(id);
    canonical.set(id, cita);
  }
  for (const [id, cita] of canonical) {
    const clinic = text(cita.clinic_id);
    const appointment = text(cita.appointment_id);
    const issue = (motivo, etapa = '') => revision.push({ clinic_id: clinic, appointment_id: appointment, motivo, etapa });
    if (ambiguous.has(id)) { issue('cita_canonica_ambigua'); continue; }
    const version = typeof cita.version === 'number' || (typeof cita.version === 'string' && /^\d+$/.test(cita.version))
      ? Number(cita.version) : NaN;
    if (!Number.isSafeInteger(version) || version < 1) { issue('version_invalida'); continue; }
    // Solo propuestas: el workflow 1B no actualiza ni cierra filas existentes.
    for (const row of existentes) {
      if (row.clinic_id !== clinic || row.appointment_id !== appointment || row.tipo_seguimiento !== 'pre_cita') continue;
      if (row.estado !== 'pendiente_envio' || !(instant(row.fecha_objetivo) > clock)) continue;
      const oldVersion = Number(row.appointment_version);
      if (!Number.isSafeInteger(oldVersion) || oldVersion < 1) continue;
      if (oldVersion < version || (oldVersion === version && cita.estado !== 'confirmada')) {
        invalidaciones.push({ seguimiento_id: row.seguimiento_id, estado: 'cerrado', closed_at: timestamp,
          motivo: oldVersion < version ? 'version_obsoleta' : 'cita_no_confirmada' });
      }
    }
    if (cita.estado !== 'confirmada') continue;
    const start = instant(cita.start_time);
    if (!Number.isFinite(start) || start <= clock) { issue('cita_sin_inicio_futuro_valido'); continue; }
    const service = text(cita.service_id);
    const catalog = instrucciones.filter((row) => text(row.clinic_id) === clinic && text(row.service_id) === service && row.activo === 'true');
    if (!service || catalog.length !== 1) {
      issue(catalog.length > 1 ? 'configuracion_activa_ambigua' : 'servicio_sin_configuracion_activa'); continue;
    }
    const config = catalog[0];
    const category = config.categoria_atencion;
    if (!Object.hasOwn(politicas, category) || !text(config.instruccion_id)) { issue('configuracion_invalida'); continue; }
    // Instrucciones vacías nunca habilitan la creación de un recordatorio automático.
    if (!text(config.instrucciones)) { issue('instrucciones_no_autorizadas'); continue; }
    for (const hours of politicas[category]) {
      const stage = hours + 'h';
      if (config['recordatorio_' + stage] !== 'true') { issue('etapa_no_habilitada', stage); continue; }
      const target = start - hours * 60 * 60 * 1000;
      if (target < clock) { issue('etapa_vencida', stage); continue; }
      const parts = [clinic, appointment, version, 'pre_cita', stage];
      const seguimientoId = identity('seg_lab027_', parts);
      if (known.has(seguimientoId)) continue;
      known.add(seguimientoId);
      seguimientos.push({
        seguimiento_id: seguimientoId, clinic_id: clinic, appointment_id: appointment,
        appointment_version: version, tipo_seguimiento: 'pre_cita', categoria_atencion: category,
        etapa: stage, fecha_objetivo: new Date(target).toISOString(), estado: 'pendiente_envio',
        instruccion_id: text(config.instruccion_id), envio_id: identity('env_lab027_', parts),
        enviado_at: '', respuesta_tipo: '', respuesta_at: '', tarea_id: '',
        created_at: timestamp, updated_at: timestamp, closed_at: '',
      });
    }
  }
  seguimientos.sort((a, b) => a.seguimiento_id.localeCompare(b.seguimiento_id));
  return { seguimientos, revision, invalidaciones };
}

const uuid = (name) => {
  const hex = crypto.createHash('sha256').update('lab027:' + name).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

// Decisión pura sobre datos releídos. No modifica ninguna fila ni envía nada.
export function prepararEnvio({ seguimiento: s, citas, instrucciones, ahora }) {
  const instant = value => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  const now = instant(ahora);
  if (!Number.isFinite(now)) throw new Error('Reloj de envío inválido');
  const skip = motivo => ({ accion: 'omitir', motivo });
  if (!s || s.estado !== 'pendiente_envio' || s.tipo_seguimiento !== 'pre_cita') return skip('no_pendiente');
  const version = Number(s.appointment_version);
  const policy = { rutina: [24], examen_procedimiento: [48, 24], cirugia: [72, 24] };
  const parts = [s.clinic_id, s.appointment_id, version, 'pre_cita', s.etapa];
  if (!s.clinic_id || !s.appointment_id || !Number.isSafeInteger(version) || version < 1 ||
    s.seguimiento_id !== 'seg_lab027_' + encodeURIComponent(JSON.stringify(parts)) ||
    s.envio_id !== 'env_lab027_' + encodeURIComponent(JSON.stringify(parts))) return skip('identidad_invalida');
  const rows = citas.filter(c => c.clinic_id === s.clinic_id && c.appointment_id === s.appointment_id);
  if (rows.length !== 1) return skip('cita_ausente_o_ambigua');
  const cita = rows[0];
  const close = motivo => ({ accion: 'cerrar', motivo, seguimiento: s,
    patch: { estado: 'cerrado', closed_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString() } });
  if (Number(cita.version) !== version) return close('version_obsoleta');
  if (cita.estado !== 'confirmada') return close('cita_no_confirmada');
  const start = instant(cita.start_time);
  if (!Number.isFinite(start)) return skip('fecha_cita_invalida');
  if (start <= now) return close('cita_vencida');
  const configs = instrucciones.filter(c => c.clinic_id === s.clinic_id && c.service_id === cita.service_id && c.activo === 'true');
  if (configs.length !== 1) return skip('configuracion_inactiva_o_ambigua');
  const config = configs[0];
  if (config.instruccion_id !== s.instruccion_id || config.categoria_atencion !== s.categoria_atencion ||
    !Object.hasOwn(policy, config.categoria_atencion)) return skip('configuracion_cambiada');
  const hours = Number(String(s.etapa).replace(/h$/, ''));
  if (!policy[config.categoria_atencion].includes(hours) || s.etapa !== hours + 'h' || config['recordatorio_' + s.etapa] !== 'true') return skip('etapa_no_vigente');
  const target = instant(s.fecha_objetivo);
  if (!Number.isFinite(target) || target !== start - hours * 3600000) return skip('objetivo_no_coincide');
  if (target > now) return skip('aun_no_corresponde');
  if (typeof config.instrucciones !== 'string' || !config.instrucciones.trim()) return skip('sin_instrucciones_autorizadas');
  const destino = typeof cita.telefono_normalizado === 'string' ? cita.telefono_normalizado.trim() : '';
  if (!destino) return skip('sin_destino');
  const pet = String(cita.nombre_mascota || 'tu mascota').trim();
  const service = String(config.nombre_visible || cita.nombre_servicio || 'tu atención').trim();
  const date = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(start));
  const contenido = 'Recordatorio: ' + service + ' para ' + pet + ', ' + date + ' (America/Santiago). ¿Confirmas tu asistencia?\n' + config.instrucciones.trim();
  if ([s.appointment_id, s.seguimiento_id, s.envio_id].some(id => contenido.includes(id))) return skip('identificador_en_contenido');
  const fecha = new Date(now).toISOString();
  return { accion: 'enviar', seguimiento: s, patch: { estado: 'enviando', updated_at: fecha },
    contrato: { accion: 'enviar', clinic_id: s.clinic_id, seguimiento_id: s.seguimiento_id, envio_id: s.envio_id,
      appointment_id: s.appointment_id, destino, tipo_comunicacion: 'recordatorio_pre_cita', contenido, fecha_envio: fecha } };
}

export function resolverResultado(seguimiento, resultado, ahora) {
  if (seguimiento.estado !== 'enviando') throw new Error('Resultado sin adquisición previa');
  const now = Date.parse(ahora);
  if (!Number.isFinite(now)) throw new Error('Reloj de resultado inválido');
  const timestamp = typeof resultado?.fecha_resultado === 'string' ? Date.parse(resultado.fecha_resultado) : NaN;
  const expectedKeys = ['ok', 'status', 'envio_id', 'message_id', 'fecha_resultado', 'error_code'];
  const valid = resultado && typeof resultado === 'object' && !Array.isArray(resultado) &&
    Object.keys(resultado).length === expectedKeys.length && expectedKeys.every(k => Object.hasOwn(resultado, k)) &&
    resultado.envio_id === seguimiento.envio_id && ['accepted', 'rejected', 'uncertain'].includes(resultado.status) &&
    resultado.ok === (resultado.status === 'accepted') && typeof resultado.error_code === 'string' &&
    typeof resultado.message_id === 'string' && (resultado.status !== 'accepted' || (resultado.message_id.length > 0 && resultado.error_code === '')) &&
    Number.isFinite(timestamp) && timestamp >= Date.parse(seguimiento.updated_at) && timestamp <= now;
  // Ausencia, excepción o contrato inconsistente nunca prueba un rechazo o un éxito.
  if (!valid) return { estado: 'resultado_incierto', updated_at: new Date(now).toISOString() };
  const fecha = new Date(timestamp).toISOString();
  if (resultado.status === 'accepted') return { estado: 'enviado', enviado_at: fecha, updated_at: fecha };
  return { estado: resultado.status === 'rejected' ? 'fallido' : 'resultado_incierto', updated_at: fecha };
}

export function validarContratoRespuesta(respuesta, ahora) {
  const fields = ['clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id', 'appointment_version', 'respuesta_tipo', 'respuesta_texto', 'fecha_respuesta'];
  const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
  const instant = value => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  if (!respuesta || typeof respuesta !== 'object' || Array.isArray(respuesta) || Object.keys(respuesta).length !== fields.length) return false;
  if (!fields.every(key => Object.hasOwn(respuesta, key))) return false;
  if (!fields.filter(key => key !== 'appointment_version').every(key => typeof respuesta[key] === 'string')) return false;
  if (!fields.slice(0, 4).every(key => /^[A-Za-z0-9_.:%~+-]{1,4096}$/.test(respuesta[key]))) return false;
  if (!Number.isSafeInteger(respuesta.appointment_version) || respuesta.appointment_version < 1) return false;
  if (!['si', 'no', 'ambiguo', 'pregunta', 'sin_respuesta', 'normal', 'preocupante', 'posible_urgencia'].includes(respuesta.respuesta_tipo)) return false;
  if (respuesta.respuesta_texto.length > 16384 || (respuesta.respuesta_tipo === 'sin_respuesta' && respuesta.respuesta_texto.trim())) return false;
  const date = instant(respuesta.fecha_respuesta);
  const now = instant(ahora);
  return Number.isFinite(date) && Number.isFinite(now) && date <= now + MAX_CLOCK_SKEW_MS;
}

// Decisiones de negocio exclusivas del núcleo. El texto libre no determina el tipo.
export function procesarRespuesta({ respuesta: r, seguimientos, citas, ahora }) {
  const deny = () => ({ persistir: false, salida: { ok: false, resultado: 'rechazada',
    reply: 'No pude registrar esta respuesta para una cita vigente. Contacta a la clínica para continuar.' } });
  if (!validarContratoRespuesta(r, ahora)) return deny();
  const matches = seguimientos.filter(s => s.clinic_id === r.clinic_id && s.seguimiento_id === r.seguimiento_id && s.envio_id === r.envio_id);
  if (matches.length !== 1) return deny();
  const s = matches[0];
  if (s.appointment_id !== r.appointment_id || !['pre_cita', 'post_tratamiento', 'post_cirugia'].includes(s.tipo_seguimiento)) return deny();
  if (Number(r.appointment_version) !== Number(s.appointment_version)) return deny();
  const current = citas.filter(c => c.clinic_id === s.clinic_id && c.appointment_id === s.appointment_id);
  if (current.length !== 1) return deny();
  const c = current[0];
  const version = Number(s.appointment_version);
  if (!Number.isSafeInteger(version) || version < 1 || version !== Number(c.version) || c.estado !== 'confirmada') return deny();
  if (s.tipo_seguimiento !== 'pre_cita') {
    if (s.etapa !== 'post_atencion' || !s.envio_id || !Number.isFinite(Date.parse(s.enviado_at))) return deny();
    if (!['normal', 'preocupante', 'posible_urgencia', 'ambiguo'].includes(r.respuesta_tipo)) return deny();
    const responseAt = Date.parse(r.fecha_respuesta), sentAt = Date.parse(s.enviado_at);
    if (!Number.isFinite(responseAt) || responseAt < sentAt) return deny();
    const same = s.respuesta_tipo === r.respuesta_tipo && Number.isFinite(Date.parse(s.respuesta_at));
    if (same) return { persistir: false, salida: { ok: true, resultado: 'ya_registrada', reply: 'Tu respuesta ya estaba registrada.' } };
    if (s.estado !== 'contactado') return deny();
    const needsHuman = r.respuesta_tipo !== 'normal';
    const fecha = new Date(responseAt).toISOString();
    const motivo = r.respuesta_tipo === 'normal' ? 'respuesta_normal_registrada'
      : r.respuesta_tipo === 'preocupante' ? 'respuesta_preocupante_revision_humana'
      : r.respuesta_tipo === 'posible_urgencia' ? 'integracion_lab024_no_disponible'
      : 'respuesta_ambigua_revision_humana';
    return { persistir: true, clinica: true, crear_tarea: needsHuman,
      requiere_derivacion_urgencia: r.respuesta_tipo === 'posible_urgencia', seguimiento: s,
      patch: { estado: needsHuman ? 'requiere_revision_humana' : 'respuesta_recibida', respuesta_tipo: r.respuesta_tipo,
        respuesta_at: fecha, tarea_id: s.tarea_id || '', updated_at: fecha },
      auditoria: { resultado: r.respuesta_tipo === 'normal' ? 'exito' : r.respuesta_tipo === 'posible_urgencia' ? 'rechazado' : 'revision_requerida', motivo },
      salida: { ok: true, resultado: needsHuman ? 'revision_humana' : 'registrada',
        reply: needsHuman ? 'Gracias. La clínica revisará tu respuesta.' : 'Gracias. Registramos tu respuesta para la clínica.' } };
  }
  if (!(Date.parse(c.start_time) > Date.parse(ahora))) return deny();
  if (r.respuesta_tipo === 'sin_respuesta') return { persistir: false,
    salida: { ok: true, resultado: 'evento_tecnico', reply: '' } };
  const open = ['enviado', 'sin_respuesta', 'pendiente_contacto_humano'];
  const terminal = ['cerrado', 'confirmado', 'derivado_cancelacion_reprogramacion'];
  if (!open.includes(s.estado) && !terminal.includes(s.estado)) return deny();
  const sentAt = Date.parse(s.enviado_at);
  const responseAt = Date.parse(r.fecha_respuesta);
  if (!Number.isFinite(sentAt) || responseAt < sentAt) return deny();
  const previous = { ok: false, resultado: 'rechazada',
    reply: 'Tu respuesta anterior ya fue registrada. Si necesitas cambiar tu cita, continúa con el proceso de cancelación o reprogramación.' };
  const same = s.respuesta_tipo === r.respuesta_tipo && Number.isFinite(Date.parse(s.respuesta_at));
  if (terminal.includes(s.estado)) {
    const repeatedSi = s.estado === 'confirmado' && r.respuesta_tipo === 'si' && same;
    const repeatedNo = s.estado === 'derivado_cancelacion_reprogramacion' && r.respuesta_tipo === 'no' && same;
    if (repeatedSi) return { persistir: false, salida: { ok: true, resultado: 'ya_registrada',
      reply: 'Tu confirmación ya estaba registrada.' } };
    if (repeatedNo) return { persistir: false, salida: { ok: true, resultado: 'ya_registrada',
      reply: 'Tu respuesta ya estaba registrada. La cita sigue vigente hasta completar la cancelación o reprogramación.' } };
    return { persistir: false, salida: previous };
  }
  if (s.respuesta_at && responseAt < Date.parse(s.respuesta_at)) return deny();
  const replies = {
    si: 'Gracias. Dejamos registrada tu confirmación para la cita.',
    no: 'Entendido. Tu cita sigue vigente hasta que completes la cancelación o reprogramación. Indícame que deseas cancelar o cambiar tu cita y continuaremos con ese proceso.',
    ambiguo: '¿Confirmas que asistirás? Responde Sí o No.',
    pregunta: 'Recibí tu consulta. Para confirmar tu asistencia responde Sí o No. Si necesitas resolver una duda sobre preparación o atención, la clínica podrá revisarla.',
  };
  const salida = { ok: true, resultado: 'registrada', reply: replies[r.respuesta_tipo] };
  if (same && responseAt === Date.parse(s.respuesta_at)) return { persistir: false, salida: { ...salida, resultado: 'repetida' } };
  const estado = r.respuesta_tipo === 'si' ? 'confirmado'
    : r.respuesta_tipo === 'no' ? 'derivado_cancelacion_reprogramacion' : s.estado;
  const fecha = new Date(responseAt).toISOString();
  return { persistir: true, seguimiento: s, patch: { estado, respuesta_tipo: r.respuesta_tipo,
    respuesta_at: fecha, tarea_id: s.tarea_id || '', updated_at: fecha }, salida };
}

export function prepararContratoUrgenciaLab024(decision) {
  const s=decision?.seguimiento||{},p=decision?.patch||{};
  const derivacion_id='urg_lab027_'+encodeURIComponent(JSON.stringify([s.clinic_id,s.seguimiento_id,'posible_urgencia']));
  return { origen:'sistema_lab027',derivacion_id,clinic_id:s.clinic_id,seguimiento_id:s.seguimiento_id,
    envio_id:s.envio_id,appointment_id:s.appointment_id,appointment_version:s.appointment_version,fecha_evento:p.respuesta_at };
}

export function resolverDerivacionUrgenciaLab024(decision, respuesta) {
  const contrato=prepararContratoUrgenciaLab024(decision);
  const keys=['ok','status','derivacion_id','alert_id','episode_id','resultado','motivo'];
  const valida=respuesta&&typeof respuesta==='object'&&!Array.isArray(respuesta)&&Object.keys(respuesta).length===keys.length&&
    keys.every(k=>Object.hasOwn(respuesta,k))&&respuesta.derivacion_id===contrato.derivacion_id&&
    ['accepted','rejected','uncertain'].includes(respuesta.status)&&respuesta.ok===(respuesta.status==='accepted');
  if(valida&&respuesta.status==='accepted'&&['registrada','ya_registrada'].includes(respuesta.resultado)&&
    typeof respuesta.alert_id==='string'&&respuesta.alert_id&&typeof respuesta.episode_id==='string'&&respuesta.episode_id){
    return {...decision,crear_tarea:false,requiere_derivacion_urgencia:false,
      patch:{...decision.patch,estado:'derivado_urgencia',tarea_id:''},
      auditoria:{resultado:'exito',motivo:'derivacion_lab024_confirmada'},
      salida:{ok:true,resultado:'derivado_urgencia',reply:'Gracias. La clínica recibió esta alerta para revisión prioritaria.'}};
  }
  const rechazada=valida&&respuesta.status==='rejected';
  return {...decision,crear_tarea:true,requiere_derivacion_urgencia:false,
    auditoria:{resultado:rechazada?'rechazado':'resultado_incierto',motivo:rechazada?'integracion_lab024_rechazada':'integracion_lab024_incierta'},
    salida:{ok:true,resultado:'revision_humana',reply:'Gracias. La clínica revisará tu respuesta con prioridad.'}};
}

export function tareaRespuestaClinicaId(s) {
  return 'task_lab027_' + encodeURIComponent(JSON.stringify([s.clinic_id, s.seguimiento_id, 'revision_respuesta_clinica']));
}

export function prepararTareaRespuestaClinica(decision, tareas, ahora) {
  if (!decision?.clinica || !decision.crear_tarea) return { accion: 'omitir', decision };
  const id = tareaRespuestaClinicaId(decision.seguimiento);
  const found = tareas.filter(t => t.clinic_id === decision.seguimiento.clinic_id && t.task_id === id);
  if (found.length > 1) return { accion: 'bloquear', decision, salida: { ok: false, resultado: 'conflicto', reply: 'La clínica debe revisar esta respuesta.' } };
  if (found.length === 1) return { accion: 'reutilizar', decision: { ...decision, patch: { ...decision.patch, tarea_id: id } }, tarea: found[0] };
  const prioridad = decision.seguimiento && decision.patch?.respuesta_tipo === 'posible_urgencia' ? 'urgente' : 'alta';
  return { accion: 'insertar', decision: { ...decision, patch: { ...decision.patch, tarea_id: id } }, tarea: {
    task_id: id, clinic_id: decision.seguimiento.clinic_id, titulo: 'Revisar respuesta de seguimiento clínico',
    descripcion: 'Revisar respuesta clasificada de forma controlada; consultar el seguimiento interno asociado.', prioridad,
    estado: 'pendiente', creado_por: 'sistema_lab027', asignado_a: 'veterinario', fecha_creacion: ahora,
    fecha_limite: ahora, fecha_actualizacion: ahora, fecha_cierre: '' } };
}

export function comprobarRespuestaPersistida(decision, filas) {
  const s = decision.seguimiento;
  const matches = filas.filter(row => row.clinic_id === s.clinic_id && row.seguimiento_id === s.seguimiento_id &&
    row.envio_id === s.envio_id && row.appointment_id === s.appointment_id &&
    Number(row.appointment_version) === Number(s.appointment_version) &&
    Object.entries(decision.patch).every(([key, value]) => row[key] === value));
  if (filas.length === 1 && matches.length === 1) return decision.salida;
  return { ok: false, resultado: 'no_verificada',
    reply: 'No pude verificar el registro de tu respuesta. La cita no fue modificada. Contacta a la clínica para continuar.' };
}

// Columnas existentes de LAB-025; fecha_cierre se conserva para su convención de cierre.
export const taskColumns = 'task_id clinic_id titulo descripcion prioridad estado creado_por asignado_a fecha_creacion fecha_limite fecha_actualizacion fecha_cierre'.split(' ');
export function tareaId(s) {
  return 'task_lab027_' + encodeURIComponent(JSON.stringify([s.clinic_id, s.seguimiento_id, 'sin_respuesta_24h']));
}
export function planificarContacto({ seguimiento: s, citas, tareas, ahora }) {
  const skip = motivo => ({ accion: 'omitir', motivo, seguimiento: s });
  const now = Date.parse(ahora), sent = Date.parse(s.enviado_at);
  if (!Number.isFinite(now) || !Number.isFinite(sent) || s.tipo_seguimiento !== 'pre_cita' || s.etapa !== '24h' ||
    !['enviado', 'sin_respuesta'].includes(s.estado)) return skip('no_elegible');
  // ambiguo/pregunta son mensajes persistidos; este bloque no escala consultas.
  if (s.respuesta_tipo || s.respuesta_at) return skip('respuesta_persistida');
  const matches = citas.filter(c => c.clinic_id === s.clinic_id && c.appointment_id === s.appointment_id);
  if (matches.length !== 1) return skip('cita_no_unica');
  const c = matches[0];
  if (c.estado !== 'confirmada' || Number(c.version) !== Number(s.appointment_version) || !(Date.parse(c.start_time) > now)) {
    return { accion: 'cerrar', seguimiento: s, patch: { estado: 'cerrado', updated_at: ahora, closed_at: ahora } };
  }
  if (now < sent + 2 * 60 * 60 * 1000) return skip('antes_umbral');
  const id = tareaId(s);
  if (s.tarea_id && s.tarea_id !== id) return skip('referencia_tarea_inconsistente');
  const found = tareas.filter(t => t.task_id === id && t.clinic_id === s.clinic_id);
  const valid = t => t.creado_por === 'sistema_lab027' && ['pendiente', 'en_proceso'].includes(t.estado);
  if (found.length > 1 || (found.length === 1 && !valid(found[0]))) return skip('tarea_inconsistente');
  if (found.length === 1) return { accion: 'enlazar', seguimiento: s,
    patch: { estado: 'pendiente_contacto_humano', tarea_id: id, updated_at: ahora } };
  if (s.estado === 'sin_respuesta' || s.tarea_id) return skip('insercion_pendiente_revision');
  const telefono = String(c.telefono_normalizado || '').trim();
  if (!/^\+?[0-9]{8,15}$/.test(telefono)) return skip('sin_telefono_operativo');
  const tarea = { task_id: id, clinic_id: s.clinic_id, titulo: 'Contactar tutor por confirmación de cita',
    descripcion: 'Contactar al tutor para confirmar asistencia. Teléfono: ' + telefono + '. Cita: ' + new Date(c.start_time).toISOString() + '. La cita sigue vigente.',
    prioridad: 'media', estado: 'pendiente', creado_por: 'sistema_lab027', asignado_a: '',
    fecha_creacion: ahora, fecha_limite: new Date(sent + 2 * 60 * 60 * 1000).toISOString(), fecha_actualizacion: ahora };
  return { accion: 'adquirir', seguimiento: s, tarea,
    patch: { estado: 'sin_respuesta', tarea_id: id, updated_at: ahora } };
}
export function prepararCierreTarea(decision, tareas) {
  const s = decision.seguimiento;
  if (!decision.persistir || !['si', 'no'].includes(decision.patch.respuesta_tipo) || !s.tarea_id) return { accion: 'continuar', decision };
  const rows = tareas.filter(t => t.task_id === s.tarea_id && t.clinic_id === s.clinic_id);
  const fail = { accion: 'bloquear', decision, salida: { ok: false, resultado: 'no_verificada', reply: 'No pude verificar la tarea asociada. Contacta a la clínica para continuar. La cita sigue vigente.' } };
  if (s.tarea_id !== tareaId(s) || rows.length !== 1 || rows[0].creado_por !== 'sistema_lab027') return fail;
  const tarea = rows[0];
  if (tarea.estado === 'cerrada') return { accion: 'continuar', decision };
  if (!['pendiente', 'en_proceso'].includes(tarea.estado)) return fail;
  return { accion: 'cerrar', decision, tarea,
    patch: { estado: 'cerrada', fecha_actualizacion: decision.patch.respuesta_at, fecha_cierre: decision.patch.respuesta_at } };
}
export function construirWorkflow() {
  const nodes = [];
  const connections = {};
  const add = (name, type, typeVersion, parameters, position, extras = {}) => {
    nodes.push({ name, id: uuid(name), type: 'n8n-nodes-base.' + type, typeVersion, parameters, position, ...extras });
  };
  const connect = (from, to) => { connections[from] = { main: [[{ node: to, type: 'main', index: 0 }]] }; };
  add('Inicializar tablas LAB-027 (ejecutar una vez)', 'manualTrigger', 1, {}, [0, 0]);
  for (const [index, [tableName, columns]] of Object.entries(schemas).entries()) {
    add('Crear tabla ' + tableName, 'dataTable', 1.1, {
      resource: 'table', operation: 'create', tableName,
      columns: { column: columns.map(([name, type]) => ({ name, type })) },
      options: { createIfNotExists: true },
    }, [240 * (index + 1), 0]);
  }
  connect('Inicializar tablas LAB-027 (ejecutar una vez)', 'Crear tabla lab027_seguimientos');
  connect('Crear tabla lab027_seguimientos', 'Crear tabla lab027_instrucciones');
  add('Planificar cada 30 minutos LAB-027', 'scheduleTrigger', 1.3,
    { rule: { interval: [{ field: 'minutes', minutesInterval: 30 }] } }, [0, 320]);
  const readers = [
    ['Leer citas confirmadas LAB-026', 'lab026_citas', [{ keyName: 'estado', keyValue: 'confirmada' }]],
    ['Leer catálogo controlado LAB-027', 'lab027_instrucciones', []],
    ['Leer seguimientos existentes LAB-027', 'lab027_seguimientos', []],
  ];
  let previous = 'Planificar cada 30 minutos LAB-027';
  for (const [index, [name, table, conditions]] of readers.entries()) {
    add(name, 'dataTable', 1.1, { operation: 'get',
      dataTableId: { __rl: true, value: table, mode: 'name' }, returnAll: true,
      matchType: 'allConditions', filters: { conditions },
    }, [240 * (index + 1), 320], { alwaysOutputData: true, executeOnce: true });
    connect(previous, name); previous = name;
  }
  add('Calcular plan determinista LAB-027', 'code', 2, {
    mode: 'runOnceForAllItems',
    jsCode: `const planificar = ${planificarSeguimientos.toString()};\nreturn [{ json: planificar({\n  citas: $("Leer citas confirmadas LAB-026").all().map(item => item.json),\n  instrucciones: $("Leer catálogo controlado LAB-027").all().map(item => item.json),\n  existentes: $input.all().map(item => item.json),\n  ahora: $now.toISO(),\n}) }];`,
  }, [960, 320]);
  connect(previous, 'Calcular plan determinista LAB-027');
  add('Preparar filas nuevas LAB-027', 'code', 2, {
    mode: 'runOnceForAllItems',
    jsCode: 'return $input.first().json.seguimientos.map(json => ({ json }));',
  }, [1200, 320]);
  connect('Calcular plan determinista LAB-027', 'Preparar filas nuevas LAB-027');
  add('Persistir seguimientos nuevos LAB-027', 'dataTable', 1.1, {
    operation: 'upsert', dataTableId: { __rl: true, value: 'lab027_seguimientos', mode: 'name' },
    matchType: 'allConditions', filters: { conditions: [{ keyName: 'seguimiento_id', keyValue: '={{ $json.seguimiento_id }}' }] },
    columns: {
      mappingMode: 'defineBelow',
      value: Object.fromEntries(schemas.lab027_seguimientos.map(([name]) => [name, '={{ $json.' + name + ' }}'])),
      matchingColumns: [],
      schema: schemas.lab027_seguimientos.map(([id, type]) => ({ id, displayName: id, type, required: false,
        defaultMatch: false, display: true, readOnly: false, removed: false })),
      attemptToConvertTypes: false, convertFieldsToString: false,
    }, options: {},
  }, [1440, 320]);
  connect('Preparar filas nuevas LAB-027', 'Persistir seguimientos nuevos LAB-027');
  const addRead = (name, table, conditions, x, executeOnce = true) => add(name, 'dataTable', 1.1, {
    operation: 'get', dataTableId: { __rl: true, value: table, mode: 'name' }, returnAll: true,
    matchType: 'allConditions', filters: { conditions },
  }, [x, 640], { alwaysOutputData: true, executeOnce });
  const addCode = (name, jsCode, x) => add(name, 'code', 2, { mode: 'runOnceForAllItems', jsCode }, [x, 640]);
  const addUpdate = (name, fields, fromState, x) => add(name, 'dataTable', 1.1, {
    operation: 'update', dataTableId: { __rl: true, value: 'lab027_seguimientos', mode: 'name' }, matchType: 'allConditions',
    filters: { conditions: [
      ...['seguimiento_id', 'clinic_id', 'envio_id', 'appointment_version', 'updated_at'].map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' })),
      { keyName: 'estado', keyValue: fromState },
    ] },
    columns: { mappingMode: 'defineBelow', value: Object.fromEntries(fields.map(f => [f, '={{ $json.patch.' + f + ' }}'])),
      matchingColumns: [], schema: schemas.lab027_seguimientos.map(([id, type]) => ({ id, displayName: id, type, required: false,
        defaultMatch: false, display: true, readOnly: false, removed: !fields.includes(id) })),
      attemptToConvertTypes: false, convertFieldsToString: false }, options: {},
  }, [x, 640]); // Sin alwaysOutputData: ninguna coincidencia no puede habilitar un envío.
  addRead('Releer catálogo antes de envío LAB-027', 'lab027_instrucciones', [], 0);
  connections['Planificar cada 30 minutos LAB-027'].main[0].push({ node: 'Releer catálogo antes de envío LAB-027', type: 'main', index: 0 });
  addRead('Leer pendientes de envío LAB-027', 'lab027_seguimientos', [{ keyName: 'estado', keyValue: 'pendiente_envio' }], 240);
  connect('Releer catálogo antes de envío LAB-027', 'Leer pendientes de envío LAB-027');
  addCode('Seleccionar pendientes únicos LAB-027', `const rows = $input.all().map(i => i.json).filter(r => r.estado === 'pendiente_envio');
return rows.filter(r => r.seguimiento_id && r.envio_id && rows.filter(x => x.seguimiento_id === r.seguimiento_id || x.envio_id === r.envio_id).length === 1).map(json => ({ json }));`, 480);
  connect('Leer pendientes de envío LAB-027', 'Seleccionar pendientes únicos LAB-027');
  addRead('Releer cita canónica antes de envío LAB-027', 'lab026_citas', [
    { keyName: 'clinic_id', keyValue: '={{ $json.clinic_id }}' }, { keyName: 'appointment_id', keyValue: '={{ $json.appointment_id }}' },
  ], 720, false);
  connect('Seleccionar pendientes únicos LAB-027', 'Releer cita canónica antes de envío LAB-027');
  addCode('Validar vigencia antes de envío LAB-027', `const preparar = ${prepararEnvio.toString()};
// Una cita puede ser releída para varias etapas; eliminar solo repeticiones idénticas.
const citas = [...new Map($input.all().map(i => [JSON.stringify(i.json), i.json])).values()];
const instrucciones = $("Releer catálogo antes de envío LAB-027").all().map(i => i.json);
return $("Seleccionar pendientes únicos LAB-027").all().map(i => preparar({ seguimiento: i.json, citas, instrucciones, ahora: $now.toISO() })).filter(p => p.accion !== 'omitir').map(json => ({ json }));`, 960);
  connect('Releer cita canónica antes de envío LAB-027', 'Validar vigencia antes de envío LAB-027');
  add('Puede enviar LAB-027', 'if', 2.3, { conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 },
    conditions: [{ id: uuid('puede-enviar'), leftValue: '={{ $json.accion === "enviar" }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, [1200, 640]);
  connect('Validar vigencia antes de envío LAB-027', 'Puede enviar LAB-027');
  addUpdate('Persistir enviando antes del adaptador LAB-027', ['estado', 'updated_at'], 'pendiente_envio', 1440);
  addUpdate('Cerrar pendiente no vigente LAB-027', ['estado', 'updated_at', 'closed_at'], 'pendiente_envio', 1440);
  connections['Puede enviar LAB-027'] = { main: [
    [{ node: 'Persistir enviando antes del adaptador LAB-027', type: 'main', index: 0 }],
    [{ node: 'Cerrar pendiente no vigente LAB-027', type: 'main', index: 0 }],
  ] };
  addCode('Comprobar adquisición y preparar contrato LAB-027', `const planes = $("Validar vigencia antes de envío LAB-027").all().map(i => i.json);
const adquiridos = $input.all().map(i => i.json);
return adquiridos.flatMap(row => {
  if (adquiridos.filter(r => r.seguimiento_id === row.seguimiento_id).length !== 1) return [];
  const plan = planes.find(p => p.accion === 'enviar' && p.seguimiento.seguimiento_id === row.seguimiento_id && p.seguimiento.envio_id === row.envio_id);
  if (!plan || row.estado !== 'enviando' || row.updated_at !== plan.patch.updated_at || row.clinic_id !== plan.seguimiento.clinic_id || Number(row.appointment_version) !== Number(plan.seguimiento.appointment_version)) return [];
  return [{ json: plan.contrato }];
});`, 1680);
  connect('Persistir enviando antes del adaptador LAB-027', 'Comprobar adquisición y preparar contrato LAB-027');
  add('Invocar adaptador simulado LAB-027', 'executeWorkflow', 1.3,
    subworkflowParameters(ADAPTER_RUNTIME_WORKFLOW_ID), [1920, 640], { onError: 'continueRegularOutput', alwaysOutputData: true });
  connect('Comprobar adquisición y preparar contrato LAB-027', 'Invocar adaptador simulado LAB-027');
  addCode('Preparar persistencia resultado LAB-027', `const resolver = ${resolverResultado.toString()};
const results = $input.all().map(i => i.json);
const contratos = $("Comprobar adquisición y preparar contrato LAB-027").all().map(i => i.json);
const claims = $("Persistir enviando antes del adaptador LAB-027").all().map(i => i.json);
return contratos.map(c => {
  const seguimiento = claims.find(r => r.seguimiento_id === c.seguimiento_id && r.envio_id === c.envio_id);
  const matched = results.filter(r => r.envio_id === c.envio_id);
  return { json: { seguimiento, patch: resolver(seguimiento, matched.length === 1 ? matched[0] : null, $now.toISO()) } };
});`, 2160);
  connect('Invocar adaptador simulado LAB-027', 'Preparar persistencia resultado LAB-027');
  // Separar accepted: nunca vaciar enviado_at en un fallo o resultado incierto.
  add('Resultado aceptado LAB-027', 'if', 2.3, { conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 },
    conditions: [{ id: uuid('resultado-aceptado'), leftValue: '={{ $json.patch.estado === "enviado" }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, [2400, 640]);
  connect('Preparar persistencia resultado LAB-027', 'Resultado aceptado LAB-027');
  addUpdate('Persistir resultado enviado LAB-027', ['estado', 'updated_at', 'enviado_at'], 'enviando', 2640);
  addUpdate('Persistir fallo o incertidumbre LAB-027', ['estado', 'updated_at'], 'enviando', 2640);
  connections['Resultado aceptado LAB-027'] = { main: [
    [{ node: 'Persistir resultado enviado LAB-027', type: 'main', index: 0 }],
    [{ node: 'Persistir fallo o incertidumbre LAB-027', type: 'main', index: 0 }],
  ] };
  // Entrada interna exclusiva de respuestas normalizadas; sin webhook en el núcleo.
  const responseCode = (name, jsCode, x) => add(name, 'code', 2, { mode: 'runOnceForAllItems', jsCode }, [x, 960]);
  const responseIf = (name, expression, x) => add(name, 'if', 2.3, { conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 },
    conditions: [{ id: uuid(name), leftValue: expression, rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, [x, 960]);
  const responseRead = (name, table, conditions, x) => add(name, 'dataTable', 1.1, {
    operation: 'get', dataTableId: { __rl: true, value: table, mode: 'name' }, returnAll: true,
    matchType: 'allConditions', filters: { conditions },
  }, [x, 960], { executeOnce: true, alwaysOutputData: true });
  const branch = (name, yes, no) => { connections[name] = { main: [
    [{ node: yes, type: 'main', index: 0 }], [{ node: no, type: 'main', index: 0 }],
  ] }; };
  add('Recibir respuesta normalizada LAB-027', 'executeWorkflowTrigger', 1, {}, [0, 960]);
  responseCode('Validar contrato de respuesta LAB-027', `const validar = ${validarContratoRespuesta.toString()};
const items = $input.all();
const solicitud = items.length === 1 ? items[0].json : null;
const valida = validar(solicitud, $now.toISO());
return [{ json: { solicitud, valida, salida: { ok: false, resultado: 'rechazada', reply: 'No pude registrar esta respuesta. Contacta a la clínica para continuar.' } } }];`, 240);
  connect('Recibir respuesta normalizada LAB-027', 'Validar contrato de respuesta LAB-027');
  responseIf('Contrato de respuesta válido LAB-027', '={{ $json.valida === true }}', 480);
  connect('Validar contrato de respuesta LAB-027', 'Contrato de respuesta válido LAB-027');
  responseRead('Releer seguimiento por respuesta LAB-027', 'lab027_seguimientos',
    ['clinic_id', 'seguimiento_id', 'envio_id'].map(keyName => ({ keyName, keyValue: '={{ $json.solicitud.' + keyName + ' }}' })), 720);
  branch('Contrato de respuesta válido LAB-027', 'Releer seguimiento por respuesta LAB-027', 'Devolver respuesta pública LAB-027');
  responseCode('Correlacionar seguimiento de respuesta LAB-027', `const entrada = $("Validar contrato de respuesta LAB-027").first().json;
const r = entrada.solicitud;
const rows = $input.all().map(i => i.json).filter(s => s.clinic_id === r.clinic_id && s.seguimiento_id === r.seguimiento_id && s.envio_id === r.envio_id);
const encontrado = rows.length === 1 && rows[0].appointment_id === r.appointment_id && ['pre_cita','post_tratamiento','post_cirugia'].includes(rows[0].tipo_seguimiento);
return [{ json: { ...entrada, encontrado, seguimiento: encontrado ? rows[0] : null } }];`, 960);
  connect('Releer seguimiento por respuesta LAB-027', 'Correlacionar seguimiento de respuesta LAB-027');
  responseIf('Seguimiento de respuesta encontrado LAB-027', '={{ $json.encontrado === true }}', 1200);
  connect('Correlacionar seguimiento de respuesta LAB-027', 'Seguimiento de respuesta encontrado LAB-027');
  responseRead('Releer cita para respuesta LAB-027', 'lab026_citas',
    ['clinic_id', 'appointment_id'].map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' })), 1440);
  branch('Seguimiento de respuesta encontrado LAB-027', 'Releer cita para respuesta LAB-027', 'Devolver respuesta pública LAB-027');
  responseCode('Resolver respuesta del tutor LAB-027', `const validarContratoRespuesta = ${validarContratoRespuesta.toString()};
const procesar = ${procesarRespuesta.toString()};
const origen = $("Correlacionar seguimiento de respuesta LAB-027").first().json;
return [{ json: procesar({ respuesta: origen.solicitud, seguimientos: [origen.seguimiento], citas: $input.all().map(i => i.json), ahora: $now.toISO() }) }];`, 1680);
  connect('Releer cita para respuesta LAB-027', 'Resolver respuesta del tutor LAB-027');
  responseIf('Es posible urgencia clínica LAB-027', '={{ $json.requiere_derivacion_urgencia === true }}', 1920);
  connect('Resolver respuesta del tutor LAB-027', 'Es posible urgencia clínica LAB-027');
  responseCode('Preparar contrato urgencia LAB-024', `const preparar=${prepararContratoUrgenciaLab024.toString()};return [{json:preparar($json)}];`, 2160);
  add('Invocar urgencias LAB-024', 'executeWorkflow', 1.3, subworkflowParameters(LAB024_RUNTIME_WORKFLOW_ID), [2400, 960], { onError:'continueRegularOutput', alwaysOutputData:true });
  responseCode('Resolver recepción urgencia LAB-024', `const prepararContratoUrgenciaLab024=${prepararContratoUrgenciaLab024.toString()};const resolver=${resolverDerivacionUrgenciaLab024.toString()};const decision=$("Resolver respuesta del tutor LAB-027").first().json,respuestas=$input.all().map(i=>i.json);return [{json:resolver(decision,respuestas.length===1?respuestas[0]:null)}];`, 2640);
  connect('Preparar contrato urgencia LAB-024', 'Invocar urgencias LAB-024');
  connect('Invocar urgencias LAB-024', 'Resolver recepción urgencia LAB-024');
  responseIf('Requiere persistir respuesta LAB-027', '={{ $json.persistir === true }}', 1920);
  branch('Es posible urgencia clínica LAB-027', 'Preparar contrato urgencia LAB-024', 'Requiere persistir respuesta LAB-027');
  connect('Resolver recepción urgencia LAB-024', 'Requiere persistir respuesta LAB-027');
  addUpdate('Persistir respuesta del tutor LAB-027', ['estado', 'respuesta_tipo', 'respuesta_at', 'tarea_id', 'updated_at'], '', 2160);
  const responseWrite = nodes.find(n => n.name === 'Persistir respuesta del tutor LAB-027');
  responseWrite.position[1] = 960;
  responseWrite.parameters.filters.conditions = ['clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id',
    'appointment_version', 'tipo_seguimiento', 'estado', 'respuesta_tipo', 'respuesta_at', 'tarea_id', 'updated_at'].map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' }));
  responseWrite.alwaysOutputData = true; // Solo permite devolver un fallo controlado cuando no hubo coincidencia.
  responseWrite.onError = 'continueRegularOutput';
  branch('Requiere persistir respuesta LAB-027', 'Persistir respuesta del tutor LAB-027', 'Devolver respuesta pública LAB-027');
  responseCode('Verificar persistencia de respuesta LAB-027', `const verificar = ${comprobarRespuestaPersistida.toString()};
const tareaId = ${tareaRespuestaClinicaId.toString()};
const base = $("Requiere persistir respuesta LAB-027").first().json;
const decision = base.clinica && base.crear_tarea ? { ...base, patch: { ...base.patch, tarea_id: tareaId(base.seguimiento) } } : base;
return [{ json: { salida: verificar(decision, $input.all().map(i => i.json)), decision } }];`, 2400);
  connect('Persistir respuesta del tutor LAB-027', 'Verificar persistencia de respuesta LAB-027');
  responseCode('Devolver respuesta pública LAB-027', 'return $input.all().map(item => ({ json: item.json.salida }));', 2640);
  connect('Verificar persistencia de respuesta LAB-027', 'Devolver respuesta pública LAB-027');
  // Rama 1F del scheduler: lecturas completas y decisiones por identidad, sin pairing implícito.
  const contactCode = (name, code, x) => add(name, 'code', 2, { mode: 'runOnceForAllItems', jsCode: code }, [x, 1280]);
  const contactRead = (name, table, x) => add(name, 'dataTable', 1.1, {
    operation: 'get', dataTableId: { __rl: true, value: table, mode: 'name' }, returnAll: true,
    matchType: 'allConditions', filters: { conditions: [] },
  }, [x, 1280], { alwaysOutputData: true, executeOnce: true });
  const observedFields = ['clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id', 'appointment_version',
    'tipo_seguimiento', 'etapa', 'estado', 'enviado_at', 'respuesta_tipo', 'respuesta_at', 'tarea_id', 'updated_at'];
  const contactUpdate = (name, fields, x) => {
    addUpdate(name, fields, '', x);
    const n = nodes.at(-1); n.position = [x, 1280];
    n.parameters.filters.conditions = observedFields.map(keyName => ({ keyName, keyValue: '={{ $json.seguimiento.' + keyName + ' }}' }));
  };
  const taskWrite = (name, operation, fields, x, filters = []) => add(name, 'dataTable', 1.1, {
    operation, dataTableId: { __rl: true, value: 'lab025_tareas', mode: 'name' }, matchType: 'allConditions', filters: { conditions: filters },
    columns: { mappingMode: 'defineBelow', value: Object.fromEntries(fields.map(f => [f, '={{ $json.' + (operation === 'insert' ? 'tarea' : 'patch') + '.' + f + ' }}'])),
      matchingColumns: [], schema: taskColumns.map(id => ({ id, displayName: id, required: false, defaultMatch: false, display: true, type: 'string', readOnly: false, removed: !fields.includes(id) })),
      attemptToConvertTypes: false, convertFieldsToString: false }, options: {},
  }, [x, 1280], { alwaysOutputData: true, onError: 'continueRegularOutput' });
  contactRead('Releer seguimientos para contacto LAB-027', 'lab027_seguimientos', 0);
  connections['Planificar cada 30 minutos LAB-027'].main[0].push({ node: 'Releer seguimientos para contacto LAB-027', type: 'main', index: 0 });
  contactRead('Releer citas para contacto LAB-027', 'lab026_citas', 240);
  contactRead('Buscar tareas existentes contacto LAB-027', 'lab025_tareas', 480);
  connect('Releer seguimientos para contacto LAB-027', 'Releer citas para contacto LAB-027');
  connect('Releer citas para contacto LAB-027', 'Buscar tareas existentes contacto LAB-027');
  contactCode('Planificar contacto final LAB-027', `const tareaId = ${tareaId.toString()};
const planificar = ${planificarContacto.toString()};
const rows = $("Releer seguimientos para contacto LAB-027").all().map(i => i.json);
const citas = $("Releer citas para contacto LAB-027").all().map(i => i.json);
const tareas = $input.all().map(i => i.json);
return rows.filter(s => s.seguimiento_id && rows.filter(r => r.clinic_id === s.clinic_id && r.seguimiento_id === s.seguimiento_id).length === 1).map(s => ({ json: planificar({ seguimiento: s, citas, tareas, ahora: $now.toISO() }) }));`, 720);
  connect('Buscar tareas existentes contacto LAB-027', 'Planificar contacto final LAB-027');
  // Las tres selecciones son mutuamente excluyentes. Omisiones quedan en la ejecución técnica.
  for (const [action, label, fields] of [
    ['adquirir', 'Adquirir contacto', ['estado', 'tarea_id', 'updated_at']],
    ['cerrar', 'Cerrar contacto no vigente', ['estado', 'updated_at', 'closed_at']],
    ['enlazar', 'Enlazar tarea existente', ['estado', 'tarea_id', 'updated_at']],
  ]) {
    const select = 'Seleccionar ' + action + ' contacto LAB-027', update = label + ' LAB-027';
    contactCode(select, 'return $input.all().filter(i => i.json.accion === "' + action + '");', 960);
    if (!connections['Planificar contacto final LAB-027']) connect('Planificar contacto final LAB-027', select);
    else connections['Planificar contacto final LAB-027'].main[0].push({ node: select, type: 'main', index: 0 });
    contactUpdate(update, fields, 1200); connect(select, update);
  }
  contactCode('Verificar adquisición contacto LAB-027', `const plans = $("Seleccionar adquirir contacto LAB-027").all().map(i => i.json);
const rows = $input.all().map(i => i.json);
return rows.flatMap(row => {
 const p = plans.find(p => p.seguimiento.clinic_id === row.clinic_id && p.seguimiento.seguimiento_id === row.seguimiento_id);
 if (!p || rows.filter(r => r.clinic_id === row.clinic_id && r.seguimiento_id === row.seguimiento_id).length !== 1 || !Object.entries(p.patch).every(([k,v]) => row[k] === v)) return [];
 return [{ json: { ...p, seguimiento: row } }];
});`, 1440);
  connect('Adquirir contacto LAB-027', 'Verificar adquisición contacto LAB-027');
  contactRead('Releer seguimiento adquirido contacto LAB-027', 'lab027_seguimientos', 1680);
  contactRead('Releer cita adquirida contacto LAB-027', 'lab026_citas', 1920);
  contactRead('Releer tareas antes de insertar LAB-027', 'lab025_tareas', 2160);
  connect('Verificar adquisición contacto LAB-027', 'Releer seguimiento adquirido contacto LAB-027');
  connect('Releer seguimiento adquirido contacto LAB-027', 'Releer cita adquirida contacto LAB-027');
  connect('Releer cita adquirida contacto LAB-027', 'Releer tareas antes de insertar LAB-027');
  contactCode('Preparar inserción única tarea LAB-027', `const claims = $("Verificar adquisición contacto LAB-027").all().map(i => i.json);
const rows = $("Releer seguimiento adquirido contacto LAB-027").all().map(i => i.json);
const citas = $("Releer cita adquirida contacto LAB-027").all().map(i => i.json);
const tareas = $input.all().map(i => i.json);
const planes = claims.filter(p => {
 const found = rows.filter(s => s.clinic_id === p.seguimiento.clinic_id && s.seguimiento_id === p.seguimiento.seguimiento_id);
 const cs = citas.filter(c => c.clinic_id === p.seguimiento.clinic_id && c.appointment_id === p.seguimiento.appointment_id);
 return found.length === 1 && ${JSON.stringify(observedFields)}.every(k => found[0][k] === p.seguimiento[k]) &&
 cs.length === 1 && cs[0].estado === 'confirmada' && Number(cs[0].version) === Number(p.seguimiento.appointment_version) && Date.parse(cs[0].start_time) > Date.parse($now.toISO());
});
return [{ json: { planes, insertar: planes.filter(p => !tareas.some(t => t.task_id === p.tarea.task_id && t.clinic_id === p.tarea.clinic_id)) } }];`, 2400);
  connect('Releer tareas antes de insertar LAB-027', 'Preparar inserción única tarea LAB-027');
  responseIf('Hay tareas nuevas LAB-027', '={{ $json.insertar.length > 0 }}', 2640);
  contactCode('Extraer tareas nuevas LAB-027', 'return $input.first().json.insertar.map(json => ({ json }));', 2880);
  taskWrite('Insertar tarea humana LAB-027', 'insert', taskColumns.filter(k => k !== 'fecha_cierre'), 3120);
  contactRead('Verificar tareas persistidas LAB-027', 'lab025_tareas', 3360);
  connect('Preparar inserción única tarea LAB-027', 'Hay tareas nuevas LAB-027');
  branch('Hay tareas nuevas LAB-027', 'Extraer tareas nuevas LAB-027', 'Verificar tareas persistidas LAB-027');
  connect('Extraer tareas nuevas LAB-027', 'Insertar tarea humana LAB-027');
  connect('Insertar tarea humana LAB-027', 'Verificar tareas persistidas LAB-027');
  contactCode('Confirmar tarea para seguimiento LAB-027', `const planes = $("Preparar inserción única tarea LAB-027").first().json.planes;
const tareas = $input.all().map(i => i.json);
return planes.flatMap(p => {
 const found = tareas.filter(t => t.task_id === p.tarea.task_id && t.clinic_id === p.tarea.clinic_id);
 if (found.length !== 1 || found[0].creado_por !== 'sistema_lab027' || !['pendiente','en_proceso'].includes(found[0].estado)) return [];
 return [{ json: { seguimiento: p.seguimiento, patch: { estado: 'pendiente_contacto_humano', tarea_id: found[0].task_id, updated_at: $now.toISO() } } }];
});`, 3600);
  connect('Verificar tareas persistidas LAB-027', 'Confirmar tarea para seguimiento LAB-027');
  contactUpdate('Persistir contacto humano LAB-027', ['estado', 'tarea_id', 'updated_at'], 3840);
  connect('Confirmar tarea para seguimiento LAB-027', 'Persistir contacto humano LAB-027');

  // Cerrar tarea antes de persistir una respuesta clara. Nunca se cierra por ambiguo/pregunta.
  responseIf('Respuesta requiere cierre tarea LAB-027', '={{ ["si","no"].includes($json.patch.respuesta_tipo) && Boolean($json.seguimiento.tarea_id) }}', 2160);
  connections['Requiere persistir respuesta LAB-027'].main[0][0].node = 'Respuesta requiere cierre tarea LAB-027';
  responseRead('Buscar tarea respuesta tardía LAB-027', 'lab025_tareas', [
    { keyName: 'task_id', keyValue: '={{ $json.seguimiento.tarea_id }}' },
    { keyName: 'clinic_id', keyValue: '={{ $json.seguimiento.clinic_id }}' },
  ], 2400);
  branch('Respuesta requiere cierre tarea LAB-027', 'Buscar tarea respuesta tardía LAB-027', 'Persistir respuesta del tutor LAB-027');
  responseCode('Preparar cierre tarea tardía LAB-027', `const tareaId = ${tareaId.toString()};
const preparar = ${prepararCierreTarea.toString()};
return [{ json: preparar($("Resolver respuesta del tutor LAB-027").first().json, $input.all().map(i => i.json)) }];`, 2640);
  connect('Buscar tarea respuesta tardía LAB-027', 'Preparar cierre tarea tardía LAB-027');
  responseIf('Puede continuar respuesta tardía LAB-027', '={{ $json.accion !== "bloquear" }}', 2880);
  connect('Preparar cierre tarea tardía LAB-027', 'Puede continuar respuesta tardía LAB-027');
  responseIf('Debe cerrar tarea tardía LAB-027', '={{ $json.accion === "cerrar" }}', 3120);
  branch('Puede continuar respuesta tardía LAB-027', 'Debe cerrar tarea tardía LAB-027', 'Devolver respuesta pública LAB-027');
  taskWrite('Cerrar tarea por respuesta LAB-027', 'update', ['estado', 'fecha_actualizacion', 'fecha_cierre'], 3360,
    ['task_id', 'clinic_id', 'estado', 'fecha_actualizacion'].map(keyName => ({ keyName, keyValue: '={{ $json.tarea.' + keyName + ' }}' })));
  responseCode('Restaurar decisión respuesta LAB-027', 'return [{ json: $("Requiere persistir respuesta LAB-027").first().json }];', 3840);
  branch('Debe cerrar tarea tardía LAB-027', 'Cerrar tarea por respuesta LAB-027', 'Restaurar decisión respuesta LAB-027');
  responseRead('Verificar cierre tarea tardía LAB-027', 'lab025_tareas', [
    { keyName: 'task_id', keyValue: '={{ $("Preparar cierre tarea tardía LAB-027").first().json.tarea.task_id }}' },
    { keyName: 'clinic_id', keyValue: '={{ $("Preparar cierre tarea tardía LAB-027").first().json.tarea.clinic_id }}' },
  ], 3600);
  connect('Cerrar tarea por respuesta LAB-027', 'Verificar cierre tarea tardía LAB-027');
  responseCode('Comprobar cierre tarea tardía LAB-027', `const p = $("Preparar cierre tarea tardía LAB-027").first().json;
const rows = $input.all().map(i => i.json);
const cerrado = rows.length === 1 && rows[0].task_id === p.tarea.task_id && rows[0].clinic_id === p.tarea.clinic_id && rows[0].estado === 'cerrada' && rows[0].creado_por === 'sistema_lab027';
return [{ json: { cerrado, salida: { ok: false, resultado: 'no_verificada', reply: 'No pude verificar el cierre de la tarea. Contacta a la clínica para continuar. La cita sigue vigente.' } } }];`, 3840);
  connect('Verificar cierre tarea tardía LAB-027', 'Comprobar cierre tarea tardía LAB-027');
  responseIf('Cierre tarea verificado LAB-027', '={{ $json.cerrado }}', 4080);
  connect('Comprobar cierre tarea tardía LAB-027', 'Cierre tarea verificado LAB-027');
  branch('Cierre tarea verificado LAB-027', 'Restaurar decisión respuesta LAB-027', 'Devolver respuesta pública LAB-027');
  connect('Restaurar decisión respuesta LAB-027', 'Persistir respuesta del tutor LAB-027');
  // Respuestas clínicas: misma entrada normalizada; tarea LAB-025 determinista para revisión.
  responseIf('Respuesta clínica requiere tarea LAB-027', '={{ $json.clinica === true && $json.crear_tarea === true }}', 2160);
  connections['Requiere persistir respuesta LAB-027'].main[0][0].node = 'Respuesta clínica requiere tarea LAB-027';
  responseRead('Buscar tarea respuesta clínica LAB-027', 'lab025_tareas', [
    { keyName: 'clinic_id', keyValue: '={{ $json.seguimiento.clinic_id }}' },
  ], 2400);
  branch('Respuesta clínica requiere tarea LAB-027', 'Buscar tarea respuesta clínica LAB-027', 'Respuesta requiere cierre tarea LAB-027');
  responseCode('Preparar tarea respuesta clínica LAB-027', `const tareaRespuestaClinicaId=${tareaRespuestaClinicaId.toString()};
const preparar=${prepararTareaRespuestaClinica.toString()};
return [{json:preparar($("Requiere persistir respuesta LAB-027").first().json,$input.all().map(i=>i.json),$now.toISO())}];`, 2640);
  connect('Buscar tarea respuesta clínica LAB-027', 'Preparar tarea respuesta clínica LAB-027');
  responseIf('Debe insertar tarea clínica LAB-027', '={{ $json.accion === "insertar" }}', 2880);
  connect('Preparar tarea respuesta clínica LAB-027', 'Debe insertar tarea clínica LAB-027');
  responseCode('Extraer tarea clínica LAB-027', 'return [{json:{tarea:$json.tarea}}];', 3120);
  taskWrite('Insertar tarea respuesta clínica LAB-027', 'insert', taskColumns.filter(k => k !== 'fecha_cierre'), 3360);
  responseCode('Verificar tarea respuesta clínica LAB-027', `const tareaRespuestaClinicaId=${tareaRespuestaClinicaId.toString()};
const p=$("Preparar tarea respuesta clínica LAB-027").first().json,d=p.decision,id=tareaRespuestaClinicaId(d.seguimiento);
const existentes=$("Buscar tarea respuesta clínica LAB-027").all().map(i=>i.json).filter(t=>t.clinic_id===d.seguimiento.clinic_id&&t.task_id===id);
const insertadas=$input.all().map(i=>i.json).filter(t=>t.clinic_id===d.seguimiento.clinic_id&&t.task_id===id);
const rows=p.accion==='insertar'?insertadas:existentes;
if(p.accion==='bloquear'||rows.length!==1||rows[0].creado_por!=='sistema_lab027'||!['pendiente','en_proceso'].includes(rows[0].estado))return[{json:{salida:{ok:false,resultado:'no_verificada',reply:'La clínica debe revisar esta respuesta.'}}}];
return[{json:{...d,patch:{...d.patch,tarea_id:id}}}];`, 3600);
  branch('Debe insertar tarea clínica LAB-027', 'Extraer tarea clínica LAB-027', 'Verificar tarea respuesta clínica LAB-027');
  connect('Extraer tarea clínica LAB-027', 'Insertar tarea respuesta clínica LAB-027');
  connect('Insertar tarea respuesta clínica LAB-027', 'Verificar tarea respuesta clínica LAB-027');
  responseIf('Tarea clínica verificada LAB-027', '={{ $json.persistir === true }}', 3840);
  connect('Verificar tarea respuesta clínica LAB-027', 'Tarea clínica verificada LAB-027');
  branch('Tarea clínica verificada LAB-027', 'Persistir respuesta del tutor LAB-027', 'Devolver respuesta pública LAB-027');
  // Auditoría solo tras confirmar la persistencia; las repeticiones no llegan a esta rama.
  responseIf('Respuesta clínica requiere auditoría LAB-027', '={{ $json.decision.clinica === true && $json.salida.ok === true }}', 2640);
  connections['Verificar persistencia de respuesta LAB-027'].main[0][0].node = 'Respuesta clínica requiere auditoría LAB-027';
  responseCode('Preparar auditoría respuesta clínica LAB-027', `const d=$json.decision,s=d.seguimiento,p=d.patch,a=d.auditoria,now=$now.toISO();return[{json:{audit_id:'audit_lab027_'+encodeURIComponent(JSON.stringify([s.seguimiento_id,p.respuesta_tipo,p.respuesta_at])),clinic_id:s.clinic_id,actor_user_id:'sistema_lab027',accion:'procesar_respuesta_seguimiento_clinico',recurso_tipo:'seguimiento',recurso_id:s.seguimiento_id,estado_anterior:s.estado,estado_nuevo:p.estado,resultado:a.resultado,motivo:a.motivo,metadata_controlada:JSON.stringify({appointment_id:s.appointment_id,appointment_version:s.appointment_version,tipo_seguimiento:s.tipo_seguimiento,respuesta_tipo:p.respuesta_tipo,tarea_id:p.tarea_id||''}),fecha_hora:now,salida:$json.salida}}];`, 2880);
  branch('Respuesta clínica requiere auditoría LAB-027', 'Preparar auditoría respuesta clínica LAB-027', 'Devolver respuesta pública LAB-027');
  const responseAuditSchema='audit_id clinic_id actor_user_id accion recurso_tipo recurso_id estado_anterior estado_nuevo resultado motivo metadata_controlada fecha_hora'.split(' ').map(id=>({id,displayName:id,type:'string',required:false,defaultMatch:false,display:true,readOnly:false,removed:false}));
  add('Insertar auditoría respuesta clínica LAB-027','dataTable',1.1,{dataTableId:{__rl:true,value:'lab025_auditoria_operaciones',mode:'name'},columns:{mappingMode:'defineBelow',value:Object.fromEntries(responseAuditSchema.map(c=>[c.id,'={{ $json.'+c.id+' }}'])),matchingColumns:[],schema:responseAuditSchema,attemptToConvertTypes:false,convertFieldsToString:false},options:{}},[3120,960]);
  connect('Preparar auditoría respuesta clínica LAB-027','Insertar auditoría respuesta clínica LAB-027');
  responseCode('Restaurar salida respuesta clínica LAB-027','return [{json:{salida:$("Preparar auditoría respuesta clínica LAB-027").first().json.salida}}];',3360);
  connect('Insertar auditoría respuesta clínica LAB-027','Restaurar salida respuesta clínica LAB-027');
  connect('Restaurar salida respuesta clínica LAB-027','Devolver respuesta pública LAB-027');
  // Envío clínico programado: rama independiente del mismo scheduler.
  const clinicalAdd=(name,type,parameters,x,extras={})=>add(name,type,type==='code'?2:type==='dataTable'?1.1:type==='switch'?3.4:type==='executeWorkflow'?1.3:1,parameters,[x,1600],extras);
  const clinicalRead=(name,table,x)=>clinicalAdd(name,'dataTable',{operation:'get',dataTableId:{__rl:true,value:table,mode:'name'},returnAll:true,matchType:'allConditions',filters:{conditions:[]}},x,{alwaysOutputData:true,executeOnce:true});
  clinicalRead('Leer seguimientos clínicos pendientes LAB-027','lab027_seguimientos',0);
  connections['Planificar cada 30 minutos LAB-027'].main[0].push({node:'Leer seguimientos clínicos pendientes LAB-027',type:'main',index:0});
  clinicalRead('Leer citas para envío clínico LAB-027','lab026_citas',240);connect('Leer seguimientos clínicos pendientes LAB-027','Leer citas para envío clínico LAB-027');
  clinicalRead('Leer instrucciones para envío clínico LAB-027','lab027_instrucciones',480);connect('Leer citas para envío clínico LAB-027','Leer instrucciones para envío clínico LAB-027');
  clinicalAdd('Planificar envío clínico LAB-027','code',{mode:'runOnceForAllItems',jsCode:`const planificar=${planificarEnvioClinico.toString()};const ss=$("Leer seguimientos clínicos pendientes LAB-027").all().map(i=>i.json),cs=$("Leer citas para envío clínico LAB-027").all().map(i=>i.json),ins=$input.all().map(i=>i.json);return ss.filter(s=>s.seguimiento_id).map(s=>({json:planificar({seguimiento:s,citas:cs,instrucciones:ins,ahora:$now.toISO()})})).filter(i=>i.json.accion!=='omitir');`},720);connect('Leer instrucciones para envío clínico LAB-027','Planificar envío clínico LAB-027');
  clinicalAdd('Enrutar envío clínico LAB-027','switch',{rules:{values:['adquirir','revision'].map((value,index)=>({conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:uuid('clinical-route-'+index),leftValue:'={{ $json.accion }}',rightValue:value,operator:{type:'string',operation:'equals'}}],combinator:'and'},renameOutput:true,outputKey:value}))},options:{}},960);connect('Planificar envío clínico LAB-027','Enrutar envío clínico LAB-027');
  const clinicalSchema=schemas.lab027_seguimientos.map(([id,type])=>({id,displayName:id,type,required:false,defaultMatch:false,display:true,readOnly:false,removed:false}));
  const clinicalUpdate=(name,fields,x)=>clinicalAdd(name,'dataTable',{operation:'update',dataTableId:{__rl:true,value:'lab027_seguimientos',mode:'name'},matchType:'allConditions',filters:{conditions:['seguimiento_id','clinic_id','appointment_id','appointment_version','tipo_seguimiento','etapa','estado','envio_id','enviado_at','updated_at'].map(keyName=>({keyName,keyValue:'={{ $json.seguimiento.'+keyName+' }}'}))},columns:{mappingMode:'defineBelow',value:Object.fromEntries(fields.map(f=>[f,'={{ $json.patch.'+f+' }}'])),matchingColumns:[],schema:clinicalSchema.map(c=>({...c,removed:!fields.includes(c.id)})),attemptToConvertTypes:false,convertFieldsToString:false},options:{}},x);
  clinicalUpdate('Adquirir envío clínico LAB-027',['estado','instruccion_id','envio_id','updated_at'],1200);
  clinicalUpdate('Marcar revisión envío clínico LAB-027',['estado','updated_at'],1200);
  connections['Enrutar envío clínico LAB-027']={main:[[{node:'Adquirir envío clínico LAB-027',type:'main',index:0}],[{node:'Marcar revisión envío clínico LAB-027',type:'main',index:0}]]};
  clinicalAdd('Verificar adquisición envío clínico LAB-027','code',{mode:'runOnceForAllItems',jsCode:`const plans=$("Planificar envío clínico LAB-027").all().map(i=>i.json),rows=$input.all().map(i=>i.json);return rows.flatMap(r=>{const p=plans.find(p=>p.accion==='adquirir'&&p.seguimiento.seguimiento_id===r.seguimiento_id);return p&&r.estado==='pendiente'&&r.envio_id===p.patch.envio_id&&r.instruccion_id===p.patch.instruccion_id&&r.updated_at===p.patch.updated_at?[{json:p.contrato}]:[]});`},1440);connect('Adquirir envío clínico LAB-027','Verificar adquisición envío clínico LAB-027');
  clinicalAdd('Invocar adaptador para seguimiento clínico LAB-027','executeWorkflow',subworkflowParameters(ADAPTER_RUNTIME_WORKFLOW_ID),1680,{onError:'continueRegularOutput',alwaysOutputData:true});connect('Verificar adquisición envío clínico LAB-027','Invocar adaptador para seguimiento clínico LAB-027');
  clinicalAdd('Resolver resultado envío clínico LAB-027','code',{mode:'runOnceForAllItems',jsCode:`const resolver=${resolverEnvioClinico.toString()},results=$input.all().map(i=>i.json),plans=$("Planificar envío clínico LAB-027").all().map(i=>i.json);return plans.filter(p=>p.accion==='adquirir').map(p=>{const s={...p.seguimiento,...p.patch},found=results.filter(r=>r.envio_id===s.envio_id);return{json:{seguimiento:s,...resolver(s,found.length===1?found[0]:null,$now.toISO())}}});`},1920);connect('Invocar adaptador para seguimiento clínico LAB-027','Resolver resultado envío clínico LAB-027');
  clinicalUpdate('Persistir resultado envío clínico LAB-027',['estado','enviado_at','updated_at'],2160);connect('Resolver resultado envío clínico LAB-027','Persistir resultado envío clínico LAB-027');
  const auditSchema='audit_id clinic_id actor_user_id accion recurso_tipo recurso_id estado_anterior estado_nuevo resultado motivo metadata_controlada fecha_hora'.split(' ').map(id=>({id,displayName:id,type:'string',required:false,defaultMatch:false,display:true,readOnly:false,removed:false}));
  const auditCode=`const plans=$("Planificar envío clínico LAB-027").all().map(i=>i.json),now=$now.toISO();return $input.all().map(i=>i.json).flatMap(r=>{const p=plans.find(p=>p.seguimiento?.seguimiento_id===r.seguimiento_id);if(!p)return[];const outcome=p.accion==='revision'?{resultado:p.resultado,motivo:p.motivo,status_adaptador:''}:$("Resolver resultado envío clínico LAB-027").all().map(i=>i.json).find(x=>x.seguimiento?.seguimiento_id===r.seguimiento_id);if(!outcome)return[];return[{json:{audit_id:'audit_lab027_'+encodeURIComponent(JSON.stringify([r.seguimiento_id,outcome.motivo,now])),clinic_id:r.clinic_id,actor_user_id:'sistema_lab027',accion:'enviar_seguimiento_clinico',recurso_tipo:'seguimiento',recurso_id:r.seguimiento_id,estado_anterior:'pendiente',estado_nuevo:r.estado,resultado:outcome.resultado,motivo:outcome.motivo,metadata_controlada:JSON.stringify({appointment_id:r.appointment_id,appointment_version:r.appointment_version,tipo_seguimiento:r.tipo_seguimiento,instruccion_id:r.instruccion_id||'',envio_id:r.envio_id||'',status_adaptador:outcome.status_adaptador||''}),fecha_hora:now}}]});`;
  clinicalAdd('Preparar auditoría envío clínico LAB-027','code',{mode:'runOnceForAllItems',jsCode:auditCode},2400);connect('Persistir resultado envío clínico LAB-027','Preparar auditoría envío clínico LAB-027');connections['Marcar revisión envío clínico LAB-027']={main:[[{node:'Preparar auditoría envío clínico LAB-027',type:'main',index:0}]]};
  clinicalAdd('Insertar auditoría envío clínico LAB-027','dataTable',{dataTableId:{__rl:true,value:'lab025_auditoria_operaciones',mode:'name'},columns:{mappingMode:'defineBelow',value:Object.fromEntries(auditSchema.map(c=>[c.id,'={{ $json.'+c.id+' }}'])),matchingColumns:[],schema:auditSchema,attemptToConvertTypes:false,convertFieldsToString:false},options:{}},2640);connect('Preparar auditoría envío clínico LAB-027','Insertar auditoría envío clínico LAB-027');
  return { name: 'LAB-027 - Seguimientos, recordatorios y pendientes', id: 'LAB027VetAtiende',
    versionId: uuid('workflow'), active: false, nodes, connections,
    settings: { executionOrder: 'v1', timezone: 'America/Santiago' } };
}

// Simulador puro y sin persistencia. Los tipos de respuesta se declaran, no se infieren.
export function simularCanal(entrada, ahora) {
  const iso = (value) => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
  if (!iso(ahora)) throw new Error('Reloj del simulador inválido');
  const fecha = new Date(ahora).toISOString();
  const secret = (value) => /-----BEGIN[\s\S]*PRIVATE KEY|\bbearer\s+\S+|\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|authorization)\s*[:=]\s*\S+|\bsk-[a-zA-Z0-9_-]{16,}|\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i.test(value);
  const identifier = (value) => typeof value === 'string' && value.length > 0 && value.length <= 4096
    && /^[A-Za-z0-9_.:%~+-]+$/.test(value) && !secret(value);
  const reject = (error_code) => ({ ok: false, status: 'rejected',
    envio_id: identifier(entrada?.envio_id) ? entrada.envio_id : '', message_id: '', fecha_resultado: fecha, error_code });
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return reject('entrada_invalida');
  const acciones = ['enviar', 'simular_respuesta'];
  if (!acciones.includes(entrada.accion)) return reject('accion_invalida');
  const common = ['accion', 'clinic_id', 'seguimiento_id', 'envio_id', 'appointment_id'];
  const allowed = entrada.accion === 'enviar'
    ? [...common, 'destino', 'tipo_comunicacion', 'contenido', 'fecha_envio', 'modo_resultado']
    : [...common, 'appointment_version', 'respuesta_tipo', 'respuesta_texto', 'fecha_respuesta'];
  // Lista cerrada: no se aceptan session_id, credenciales ni campos clínicos adicionales.
  if (Object.keys(entrada).some(key => !allowed.includes(key))) return reject('campo_no_permitido');
  for (const [key, value] of Object.entries(entrada)) {
    if (key === 'appointment_version' && entrada.accion === 'simular_respuesta') continue;
    if (typeof value !== 'string' || value.length > 16384) return reject('valor_invalido');
    if (secret(value)) return reject('secreto_no_permitido');
  }
  for (const field of common.slice(1)) if (!identifier(entrada[field])) return reject('identificador_requerido');
  if (entrada.accion === 'enviar') {
    for (const field of ['destino', 'tipo_comunicacion', 'contenido']) {
      if (typeof entrada[field] !== 'string' || !entrada[field].trim()) return reject('campo_requerido');
    }
    if (!iso(entrada.fecha_envio)) return reject('fecha_envio_invalida');
    // Los IDs son correlación técnica, no datos que deba copiar o escribir el tutor.
    if (['appointment_id', 'seguimiento_id', 'envio_id'].some(field => entrada.contenido.includes(entrada[field]))) {
      return reject('identificador_en_contenido');
    }
    const status = entrada.modo_resultado === undefined ? 'accepted' : entrada.modo_resultado;
    if (!['accepted', 'rejected', 'uncertain'].includes(status)) return reject('modo_resultado_invalido');
    const message_id = 'sim_lab027_' + encodeURIComponent(JSON.stringify([entrada.clinic_id, entrada.envio_id]));
    return { ok: status === 'accepted', status, envio_id: entrada.envio_id, message_id,
      fecha_resultado: fecha, error_code: status === 'accepted' ? '' : 'simulado_' + status };
  }
  if (!Number.isSafeInteger(entrada.appointment_version) || entrada.appointment_version < 1) return reject('appointment_version_invalida');
  const type = (entrada.respuesta_tipo || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!['si', 'no', 'ambiguo', 'pregunta', 'sin_respuesta', 'normal', 'preocupante', 'posible_urgencia'].includes(type)) return reject('respuesta_tipo_invalida');
  if (entrada.fecha_respuesta !== undefined && !iso(entrada.fecha_respuesta)) return reject('fecha_respuesta_invalida');
  const text = (entrada.respuesta_texto || '').trim();
  if (type === 'sin_respuesta' && text) return reject('sin_respuesta_con_texto');
  return { clinic_id: entrada.clinic_id, seguimiento_id: entrada.seguimiento_id, envio_id: entrada.envio_id,
    appointment_id: entrada.appointment_id, appointment_version: entrada.appointment_version, respuesta_tipo: type, respuesta_texto: text,
    fecha_respuesta: entrada.fecha_respuesta ? new Date(entrada.fecha_respuesta).toISOString() : fecha };
}

export function construirAdaptador() {
  const nodes = [
    { name: 'Entrada técnica canal simulado LAB-027', type: 'n8n-nodes-base.webhook', typeVersion: 2.1,
      parameters: { httpMethod: 'POST', path: 'vetatiende-lab027-canal-simulado', responseMode: 'responseNode', options: {} },
      position: [0, 0], webhookId: uuid('webhook-adaptador') },
    { name: 'Validar y simular contrato LAB-027', type: 'n8n-nodes-base.code', typeVersion: 2,
      parameters: { mode: 'runOnceForEachItem',
        jsCode: `const simular = ${simularCanal.toString()};\nreturn { json: simular($json.body, $now.toISO()) };` }, position: [260, 0] },
    { name: 'Devolver contrato simulado LAB-027', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5,
      parameters: { respondWith: 'json', responseBody: '={{ $json }}', options: {} }, position: [520, 0] },
  ].map(node => ({ ...node, id: uuid(node.name) }));
  const connections = Object.fromEntries(nodes.slice(0, -1).map((node, index) => [node.name,
    { main: [[{ node: nodes[index + 1].name, type: 'main', index: 0 }]] }]));
  nodes.push({ name: 'Entrada interna subworkflow LAB-027', id: uuid('entrada-interna'),
    type: 'n8n-nodes-base.executeWorkflowTrigger', typeVersion: 1, parameters: {}, position: [0, 280] });
  nodes.push({ name: 'Simular contrato interno LAB-027', id: uuid('contrato-interno'),
    type: 'n8n-nodes-base.code', typeVersion: 2, parameters: { mode: 'runOnceForEachItem',
      jsCode: `const simular = ${simularCanal.toString()};\nreturn { json: simular($json, $now.toISO()) };` }, position: [260, 280] });
  connections['Entrada interna subworkflow LAB-027'] = { main: [[{ node: 'Simular contrato interno LAB-027', type: 'main', index: 0 }]] };
  // Enrutamiento de transporte únicamente: el cambio de estado pertenece al núcleo.
  nodes.push({ name: 'Devolver contrato interno adaptador LAB-027', id: uuid('devolver-interno'),
    type: 'n8n-nodes-base.code', typeVersion: 2, parameters: { mode: 'runOnceForAllItems',
      jsCode: 'return $input.all();' }, position: [1040, 280] });
  for (const [suffix, source, target, y] of [
    ['webhook', 'Validar y simular contrato LAB-027', 'Devolver contrato simulado LAB-027', 0],
    ['interno', 'Simular contrato interno LAB-027', 'Devolver contrato interno adaptador LAB-027', 280],
  ]) {
    const condition = 'Es respuesta normalizada ' + suffix + ' LAB-027';
    const call = 'Entregar respuesta al núcleo ' + suffix + ' LAB-027';
    nodes.push({ name: condition, id: uuid(condition), type: 'n8n-nodes-base.if', typeVersion: 2.3,
      parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 },
        conditions: [{ id: uuid(condition + ':condition'), leftValue: '={{ typeof $json.respuesta_tipo === "string" }}', rightValue: '',
          operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, position: [520, y] });
    nodes.push({ name: call, id: uuid(call), type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.3,
      parameters: subworkflowParameters(CORE_RUNTIME_WORKFLOW_ID), position: [780, y] });
    connections[source] = { main: [[{ node: condition, type: 'main', index: 0 }]] };
    // Checkpoint runtime 2: main[0]=TRUE normalizada → núcleo; main[1]=FALSE enviar → retorno directo.
    // Ambas salidas deben tener destino; enviar nunca debe entrar al núcleo de respuestas.
    connections[condition] = { main: [[{ node: call, type: 'main', index: 0 }], [{ node: target, type: 'main', index: 0 }]] };
    connections[call] = { main: [[{ node: target, type: 'main', index: 0 }]] };
  }
  nodes.find(n => n.name === 'Devolver contrato simulado LAB-027').position = [1040, 0];
  return { name: 'LAB-027 - Adaptador de canal simulado', id: 'LAB027CanalSimulado',
    versionId: uuid('adaptador-version'), active: false, nodes, connections, settings: { executionOrder: 'v1' } };
}

export function idsUrgenciaLab024(contrato) {
  const identity=[contrato.clinic_id,contrato.seguimiento_id,'posible_urgencia'];
  const suffix=encodeURIComponent(JSON.stringify(identity));
  return {alert_id:'alert_lab027_'+suffix,episode_id:'episode_lab027_'+suffix,
    attempt_id:'attempt_lab027_'+suffix,session_id:'lab027_'+encodeURIComponent(JSON.stringify([contrato.clinic_id,contrato.seguimiento_id]))};
}

export function validarContratoUrgenciaLab024(entrada, ahora) {
  const fields=['origen','derivacion_id','clinic_id','seguimiento_id','envio_id','appointment_id','appointment_version','fecha_evento'];
  const iso=v=>typeof v==='string'&&/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v));
  if(!entrada||typeof entrada!=='object'||Array.isArray(entrada)||Object.keys(entrada).length!==fields.length||!fields.every(k=>Object.hasOwn(entrada,k)))return false;
  if(entrada.origen!=='sistema_lab027'||!fields.filter(k=>k!=='appointment_version').every(k=>typeof entrada[k]==='string'))return false;
  if(!['derivacion_id','clinic_id','seguimiento_id','envio_id','appointment_id'].every(k=>/^[A-Za-z0-9_.:%~+-]{1,4096}$/.test(entrada[k])))return false;
  if(!Number.isSafeInteger(entrada.appointment_version)||entrada.appointment_version<1||!iso(entrada.fecha_evento)||!iso(ahora)||Date.parse(entrada.fecha_evento)>Date.parse(ahora)+300000)return false;
  return entrada.derivacion_id==='urg_lab027_'+encodeURIComponent(JSON.stringify([entrada.clinic_id,entrada.seguimiento_id,'posible_urgencia']));
}

export function planificarRecepcionUrgenciaLab024(contrato, alertas=[], historial=[], operativas=[]) {
  const ids=idsUrgenciaLab024(contrato),fecha=new Date(Date.parse(contrato.fecha_evento)).toISOString();
  const alerta={alert_id:ids.alert_id,episode_id:ids.episode_id,parent_alert_id:'',tipo_evento:'apertura',clinic_id:contrato.clinic_id,
    session_id:ids.session_id,canal_publico:'adaptador_lab027',created_at:fecha,mensaje_actual:'',contexto_reciente_json:'[]',
    tipo_contexto:'seguimiento_clinico',prioridad:'prioridad_inmediata',categoria:'otra_senal_prioritaria',
    clasificacion_json:JSON.stringify({fuente:'clasificacion_controlada_lab027',respuesta_tipo:'posible_urgencia',seguimiento_id:contrato.seguimiento_id,appointment_id:contrato.appointment_id,appointment_version:contrato.appointment_version}),
    requiere_aviso_interno:true,resultado_deduplicacion:'nueva',plantilla_publica_id:'',respuesta_publica:'',estado_ejecucion:'recibida_desde_lab027'};
  const intento={attempt_id:ids.attempt_id,alert_id:ids.alert_id,episode_id:ids.episode_id,clinic_id:contrato.clinic_id,tipo_canal:'interno',
    adaptador:'integracion_lab027_v1',destino_alias:'equipo_urgencias_piloto',numero_intento:1,estado_envio:'recibido',provider_message_ref:'',
    error_sanitizado:'',reintentable:false,inicio_intento_at:fecha,fin_intento_at:fecha};
  const operativa={alert_id:ids.alert_id,episode_id:ids.episode_id,clinic_id:contrato.clinic_id,estado_operacion:'pendiente',reconocida_por:'',
    fecha_reconocimiento:'',atendida_por:'',fecha_inicio_atencion:'',cerrada_por:'',fecha_cierre:'',fecha_actualizacion:fecha};
  const a=alertas.filter(r=>r.alert_id===ids.alert_id),h=historial.filter(r=>r.attempt_id===ids.attempt_id),o=operativas.filter(r=>r.alert_id===ids.alert_id);
  const timestampFields=new Set(['created_at','inicio_intento_at','fin_intento_at','fecha_actualizacion']);
  const same=(row,expected)=>Object.entries(expected).filter(([k])=>!timestampFields.has(k)).every(([k,v])=>row?.[k]===v);
  const respuesta=(status,resultado,motivo)=>({ok:status==='accepted',status,derivacion_id:contrato.derivacion_id,
    alert_id:ids.alert_id,episode_id:ids.episode_id,resultado,motivo});
  if(a.length>1||h.length>1||o.length>1)return{accion:'no_persistir',ids,alerta,intento,operativa,respuesta:respuesta('uncertain','no_verificada','integridad_ambigua')};
  if((a.length&&!same(a[0],alerta))||(h.length&&!same(h[0],intento))||(o.length&&!same(o[0],operativa)))return{accion:'no_persistir',ids,alerta,intento,operativa,respuesta:respuesta('rejected','rechazada','identidad_conflictiva')};
  if(a.length+h.length+o.length===3)return{accion:'aceptar',ids,alerta,intento,operativa,respuesta:respuesta('accepted','ya_registrada','recepcion_previa_confirmada')};
  if(a.length+h.length+o.length!==0)return{accion:'no_persistir',ids,alerta,intento,operativa,respuesta:respuesta('uncertain','no_verificada','persistencia_parcial')};
  return{accion:'insertar',ids,alerta,intento,operativa,respuesta:respuesta('uncertain','pendiente','persistencia_pendiente')};
}

export function construirIntegracionLab024(baseWorkflow) {
  const workflow=structuredClone(baseWorkflow);
  const integrationNames=new Set([
    'Entrada interna posible urgencia LAB-027','Validar contrato interno LAB-027 en LAB-024','Contrato interno LAB-027 válido',
    'Rechazar contrato interno LAB-027','Buscar alerta interna LAB-027','Buscar historial interno LAB-027','Buscar alerta operativa interna LAB-027',
    'Planificar recepción interna LAB-027','Enrutar recepción interna LAB-027','Devolver recepción interna existente LAB-027',
    'Devolver recepción interna no aceptada LAB-027','Insertar alerta interna LAB-027','Insertar historial interno LAB-027',
    'Insertar alerta operativa interna LAB-027','Verificar alerta interna LAB-027','Verificar historial interno LAB-027',
    'Verificar alerta operativa interna LAB-027','Confirmar recepción interna LAB-027']);
  if(workflow.nodes.length===integrationNames.size&&workflow.nodes.every(n=>integrationNames.has(n.name))){
    const byName=new Map(workflow.nodes.map(n=>[n.name,n]));
    byName.get('Planificar recepción interna LAB-027').parameters.jsCode=`const idsUrgenciaLab024=${idsUrgenciaLab024.toString()},planificar=${planificarRecepcionUrgenciaLab024.toString()},contrato=$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato;return[{json:planificar(contrato,$("Buscar alerta interna LAB-027").all().map(i=>i.json),$("Buscar historial interno LAB-027").all().map(i=>i.json),$input.all().map(i=>i.json))}];`;
    byName.get('Confirmar recepción interna LAB-027').parameters.jsCode=`const idsUrgenciaLab024=${idsUrgenciaLab024.toString()},planificar=${planificarRecepcionUrgenciaLab024.toString()},contrato=$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato,p=planificar(contrato,$("Verificar alerta interna LAB-027").all().map(i=>i.json),$("Verificar historial interno LAB-027").all().map(i=>i.json),$input.all().map(i=>i.json));const r=p.respuesta;return[{json:p.accion==='aceptar'?{...r,resultado:'registrada',motivo:'recepcion_confirmada'}:{...r,status:'uncertain',ok:false,resultado:'no_verificada',motivo:'persistencia_no_confirmada'}}];`;
    workflow.name='LAB-024 - Recepción interna de urgencias LAB-027';workflow.id=LAB024_RUNTIME_WORKFLOW_ID;
    workflow.active=true;workflow.settings={executionOrder:'v1',binaryMode:'separate',availableInMCP:false};
    workflow.versionId=uuid('lab024-integracion-lab027-v2');return workflow;
  }
  workflow.nodes=workflow.nodes.filter(n=>!integrationNames.has(n.name));
  for(const name of integrationNames)delete workflow.connections[name];
  for(const c of Object.values(workflow.connections))for(const outputs of Object.values(c))for(const output of outputs)for(let i=output.length-1;i>=0;i--)if(integrationNames.has(output[i].node))output.splice(i,1);
  const nodes=workflow.nodes,connections=workflow.connections;
  const add=(name,type,typeVersion,parameters,x,extras={})=>nodes.push({name,id:uuid('lab024:'+name),type:'n8n-nodes-base.'+type,typeVersion,parameters,position:[x,1800],...extras});
  const connect=(from,to)=>{connections[from]={main:[[{node:to,type:'main',index:0}]]};};
  const branch=(from,yes,no)=>{connections[from]={main:[[{node:yes,type:'main',index:0}],[{node:no,type:'main',index:0}]]};};
  const tableNode=name=>workflow.nodes.find(n=>n.name===name);
  const tableRef=(sourceName)=>structuredClone(tableNode(sourceName).parameters.dataTableId);
  const schema=(sourceName)=>structuredClone(tableNode(sourceName).parameters.columns.schema);
  const read=(name,sourceName,conditions,x)=>add(name,'dataTable',1.1,{operation:'get',dataTableId:tableRef(sourceName),returnAll:true,matchType:'allConditions',filters:{conditions}},x,{executeOnce:true,alwaysOutputData:true});
  const insert=(name,sourceName,objectName,x)=>add(name,'dataTable',1.1,{dataTableId:tableRef(sourceName),columns:{mappingMode:'defineBelow',
    value:Object.fromEntries(schema(sourceName).map(c=>[c.id,`={{ $("Planificar recepción interna LAB-027").first().json.${objectName}.${c.id} }}`])),
    matchingColumns:[],schema:schema(sourceName),attemptToConvertTypes:false,convertFieldsToString:false},options:{}},x,{alwaysOutputData:true,onError:'continueRegularOutput'});
  add('Entrada interna posible urgencia LAB-027','executeWorkflowTrigger',1,{},0);
  add('Validar contrato interno LAB-027 en LAB-024','code',2,{mode:'runOnceForAllItems',jsCode:`const validar=${validarContratoUrgenciaLab024.toString()},items=$input.all(),contrato=items.length===1?items[0].json:null,valida=validar(contrato,$now.toISO());return[{json:{contrato,valida,salida:{ok:false,status:'rejected',derivacion_id:contrato?.derivacion_id||'',alert_id:'',episode_id:'',resultado:'rechazada',motivo:'contrato_invalido'}}}];`},240);
  add('Contrato interno LAB-027 válido','if',2.3,{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:3},conditions:[{id:uuid('lab024:contrato-valido'),leftValue:'={{ $json.valida === true }}',rightValue:'',operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}},480);
  add('Rechazar contrato interno LAB-027','code',2,{mode:'runOnceForAllItems',jsCode:'return [{json:$input.first().json.salida}];'},720);
  connect('Entrada interna posible urgencia LAB-027','Validar contrato interno LAB-027 en LAB-024');connect('Validar contrato interno LAB-027 en LAB-024','Contrato interno LAB-027 válido');
  read('Buscar alerta interna LAB-027','Registrar alerta urgencia',[{keyName:'alert_id',keyValue:'={{ "alert_lab027_" + encodeURIComponent(JSON.stringify([$json.contrato.clinic_id,$json.contrato.seguimiento_id,"posible_urgencia"])) }}'}],720);
  branch('Contrato interno LAB-027 válido','Buscar alerta interna LAB-027','Rechazar contrato interno LAB-027');
  read('Buscar historial interno LAB-027','Registrar intento Telegram pendiente',[{keyName:'attempt_id',keyValue:'={{ "attempt_lab027_" + encodeURIComponent(JSON.stringify([$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato.clinic_id,$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato.seguimiento_id,"posible_urgencia"])) }}'}],960);
  read('Buscar alerta operativa interna LAB-027','Buscar alerta operativa LAB-025 existente',[{keyName:'alert_id',keyValue:'={{ "alert_lab027_" + encodeURIComponent(JSON.stringify([$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato.clinic_id,$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato.seguimiento_id,"posible_urgencia"])) }}'}],1200);
  connect('Buscar alerta interna LAB-027','Buscar historial interno LAB-027');connect('Buscar historial interno LAB-027','Buscar alerta operativa interna LAB-027');
  add('Planificar recepción interna LAB-027','code',2,{mode:'runOnceForAllItems',jsCode:`const idsUrgenciaLab024=${idsUrgenciaLab024.toString()},planificar=${planificarRecepcionUrgenciaLab024.toString()},contrato=$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato;return[{json:planificar(contrato,$("Buscar alerta interna LAB-027").all().map(i=>i.json),$("Buscar historial interno LAB-027").all().map(i=>i.json),$input.all().map(i=>i.json))}];`},1440);
  connect('Buscar alerta operativa interna LAB-027','Planificar recepción interna LAB-027');
  add('Enrutar recepción interna LAB-027','switch',3.4,{rules:{values:['insertar','aceptar','no_persistir'].map((value,index)=>({conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:uuid('lab024:route:'+index),leftValue:'={{ $json.accion }}',rightValue:value,operator:{type:'string',operation:'equals'}}],combinator:'and'},renameOutput:true,outputKey:value}))},options:{}},1680);
  connect('Planificar recepción interna LAB-027','Enrutar recepción interna LAB-027');
  add('Devolver recepción interna existente LAB-027','code',2,{mode:'runOnceForAllItems',jsCode:'return [{json:$input.first().json.respuesta}];'},1920);
  add('Devolver recepción interna no aceptada LAB-027','code',2,{mode:'runOnceForAllItems',jsCode:'return [{json:$input.first().json.respuesta}];'},1920);
  insert('Insertar alerta interna LAB-027','Registrar alerta urgencia','alerta',1920);
  insert('Insertar historial interno LAB-027','Registrar intento Telegram pendiente','intento',2160);
  insert('Insertar alerta operativa interna LAB-027','Insertar alerta operativa LAB-025','operativa',2400);
  connections['Enrutar recepción interna LAB-027']={main:[[{node:'Insertar alerta interna LAB-027',type:'main',index:0}],[{node:'Devolver recepción interna existente LAB-027',type:'main',index:0}],[{node:'Devolver recepción interna no aceptada LAB-027',type:'main',index:0}]]};
  connect('Insertar alerta interna LAB-027','Insertar historial interno LAB-027');connect('Insertar historial interno LAB-027','Insertar alerta operativa interna LAB-027');
  read('Verificar alerta interna LAB-027','Registrar alerta urgencia',[{keyName:'alert_id',keyValue:'={{ $("Planificar recepción interna LAB-027").first().json.ids.alert_id }}'}],2640);
  read('Verificar historial interno LAB-027','Registrar intento Telegram pendiente',[{keyName:'attempt_id',keyValue:'={{ $("Planificar recepción interna LAB-027").first().json.ids.attempt_id }}'}],2880);
  read('Verificar alerta operativa interna LAB-027','Buscar alerta operativa LAB-025 existente',[{keyName:'alert_id',keyValue:'={{ $("Planificar recepción interna LAB-027").first().json.ids.alert_id }}'}],3120);
  connect('Insertar alerta operativa interna LAB-027','Verificar alerta interna LAB-027');connect('Verificar alerta interna LAB-027','Verificar historial interno LAB-027');connect('Verificar historial interno LAB-027','Verificar alerta operativa interna LAB-027');
  add('Confirmar recepción interna LAB-027','code',2,{mode:'runOnceForAllItems',jsCode:`const idsUrgenciaLab024=${idsUrgenciaLab024.toString()},planificar=${planificarRecepcionUrgenciaLab024.toString()},contrato=$("Validar contrato interno LAB-027 en LAB-024").first().json.contrato,p=planificar(contrato,$("Verificar alerta interna LAB-027").all().map(i=>i.json),$("Verificar historial interno LAB-027").all().map(i=>i.json),$input.all().map(i=>i.json));const r=p.respuesta;return[{json:p.accion==='aceptar'?{...r,resultado:'registrada',motivo:'recepcion_confirmada'}:{...r,status:'uncertain',ok:false,resultado:'no_verificada',motivo:'persistencia_no_confirmada'}}];`},3360);
  connect('Verificar alerta operativa interna LAB-027','Confirmar recepción interna LAB-027');
  workflow.nodes=workflow.nodes.filter(n=>integrationNames.has(n.name));
  for(const name of Object.keys(workflow.connections))if(!integrationNames.has(name))delete workflow.connections[name];
  workflow.name='LAB-024 - Recepción interna de urgencias LAB-027';
  workflow.id=LAB024_RUNTIME_WORKFLOW_ID;workflow.active=true;
  workflow.settings={executionOrder:'v1',binaryMode:'separate',availableInMCP:false};
  workflow.versionId=uuid('lab024-integracion-lab027-v2');
  return workflow;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const main = construirWorkflow();
  const adapter = construirAdaptador();
  // Compatibilidad: --stdout conserva la salida del núcleo; --adaptador selecciona el simulador.
  if (process.argv.includes('--stdout')) process.stdout.write(JSON.stringify(process.argv.includes('--adaptador') ? adapter : main, null, 2) + '\n');
  else {
    const lab024=construirIntegracionLab024(JSON.parse(fs.readFileSync(lab024Path,'utf8')));
    for (const [target, workflow] of [[workflowPath, main], [adapterPath, adapter], [lab024Path, lab024]]) {
      const json = JSON.stringify(workflow, null, 2) + '\n';
      // Regenerar únicamente los dos exports autorizados; omitir escrituras idénticas.
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== json) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, json, 'utf8');
      }
      console.log(JSON.stringify({ ok: true, nodes: workflow.nodes.length, active: workflow.active, workflow: target }));
    }
  }
}
