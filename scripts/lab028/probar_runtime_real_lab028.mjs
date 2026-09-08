import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { crearClienteFixturesLab028, FIXTURES_LAB028 } from './fixtures_runtime_contextual_lab028.mjs';

const AVISOS = FIXTURES_LAB028.lab028_campanas.filter((row) => row.estado === 'activa');
const SESIONES_PROHIBIDAS = new Set(['lab028_runtime_medica_001', 'lab028_runtime_medica_002']);
const normalizar = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const confirmada = (reply) => /(?:qued[oa]|esta|fue|ha sido)\s+(?:correctamente\s+)?(?:confirmad[ao]|agendad[ao]|reservad[ao])|(?:cita|reserva).{0,40}(?:confirmad[ao]|agendad[ao]|reservad[ao])/i.test(normalizar(reply));

export function detectarAvisos(reply) {
  return AVISOS.filter((aviso) => String(reply || '').includes(aviso.texto)).map(({ campana_id, tipo, categoria, texto }) => ({ campana_id, tipo, categoria, texto }));
}
export const contarAvisos = (reply) => detectarAvisos(reply).length;

export function interpretarRespuesta(reply, data) {
  const text = normalizar(reply);
  if (!text) return { estado: 'respuesta_vacia', accion: 'detener', mensaje: null };
  if (confirmada(reply)) return { estado: 'confirmacion_detectada', accion: 'finalizar_confirmacion', mensaje: null };
  if (/urgencia|emergencia|atencion veterinaria inmediata|acude.*inmediat/.test(text)) return { estado: 'urgencia_detectada', accion: 'finalizar_urgencia', mensaje: null };
  const pideSeleccion = /alternativa|opcion|numero de (?:la )?opcion|elige|selecciona|disponibilidad/.test(text);
  const pideTutor = /nombre.{0,30}(?:del )?(?:tutor|responsable)|(?:tu nombre|responsable de la mascota)/.test(text);
  const pideMascota = /(?:como se llama|nombre).{0,30}(?:de la )?mascota|mascota.{0,30}nombre/.test(text);
  const pideTelefono = /telefono|celular|numero de contacto|contacto telefonico/.test(text);
  const datosCompletos = `Tutor ${data.tutorName}, mascota ${data.petName}, teléfono +56912345678`;
  if (pideSeleccion && pideTutor && pideMascota && pideTelefono) return { estado: 'solicitud_seleccion_y_datos_completos', accion: 'enviar_seleccion_y_datos_completos', mensaje: `Opción 1. ${datosCompletos}` };
  if (pideTutor && pideMascota && pideTelefono) return { estado: 'solicitud_datos_completos', accion: 'enviar_datos_completos', mensaje: datosCompletos };
  if (pideSeleccion) return { estado: 'solicitud_seleccion', accion: 'seleccionar_primera_alternativa', mensaje: '1' };
  if (pideTutor) return { estado: 'solicitud_nombre_tutor', accion: 'enviar_nombre_tutor', mensaje: data.tutorName };
  if (pideMascota) return { estado: 'solicitud_nombre_mascota', accion: 'enviar_nombre_mascota', mensaje: data.petName };
  if (pideTelefono) return { estado: 'solicitud_telefono', accion: 'enviar_telefono', mensaje: '+56912345678' };
  if (/especie|perro.{0,20}gato|gato.{0,20}perro/.test(text)) return { estado: 'solicitud_especie', accion: 'enviar_especie', mensaje: 'perro' };
  if (/correo|e mail|email/.test(text)) return { estado: 'solicitud_email', accion: 'enviar_email', mensaje: `${data.sessionId}@example.invalid` };
  if (/motivo|que le ocurre|razon de la consulta/.test(text)) return { estado: 'solicitud_motivo', accion: 'enviar_motivo', mensaje: 'Control general ficticio LAB028_TEST.' };
  if (/servicio|tipo de consulta/.test(text)) return { estado: 'solicitud_servicio', accion: 'enviar_servicio', mensaje: 'consulta veterinaria general' };
  if (/horario/.test(text)) return { estado: 'solicitud_seleccion', accion: 'seleccionar_primera_alternativa', mensaje: '1' };
  if (/confirm|estas seguro|deseas reservar|proceder con la reserva/.test(text)) return { estado: 'solicitud_confirmacion', accion: 'confirmar_reserva', mensaje: 'Sí, confirmo' };
  if (/fecha|que dia|dia prefieres/.test(text)) return { estado: 'solicitud_fecha', accion: 'enviar_fecha', mensaje: 'mañana' };
  return { estado: 'respuesta_no_interpretable', accion: 'detener', mensaje: null };
}

export function siguienteMensaje(reply, data) {
  return interpretarRespuesta(reply, data).mensaje;
}

function similitud(a, b) {
  const left = new Set(normalizar(a).replace(/\d+/g, '#').split(' ').filter(Boolean));
  const right = new Set(normalizar(b).replace(/\d+/g, '#').split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;
  const common = [...left].filter((token) => right.has(token)).length;
  return common / new Set([...left, ...right]).size;
}

function idsCita(payload) {
  const found = {};
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (['appointment_id', 'event_id'].includes(key) && ['string', 'number'].includes(typeof item)) found[key] = String(item);
      else visit(item);
    }
  };
  visit(payload);
  return found;
}

function tiempos(steps) {
  const values = steps.map((step) => step.tiempo_s), total = values.reduce((sum, value) => sum + value, 0);
  const round = (value) => Number(value.toFixed(6));
  return { tiempo_total_s: round(total), minimo_s: values.length ? round(Math.min(...values)) : 0, maximo_s: values.length ? round(Math.max(...values)) : 0, promedio_s: values.length ? round(total / values.length) : 0 };
}

function resultadoPrueba(nombre, { pass, causa = '', steps = [], sessionId = '', urgentSessionId = '', finalPayload = {}, tipoReserva = 'medica' }) {
  const reply = typeof finalPayload?.reply === 'string' ? finalPayload.reply : '';
  const notices = detectarAvisos(reply);
  const confirmation = confirmada(reply);
  const contract = finalPayload?.ok === true && finalPayload?.clinic_id === 'clinica_piloto_001'
    && finalPayload?.session_id === sessionId && typeof finalPayload?.reply === 'string' && Boolean(reply.trim());
  const compatible = notices.length === 0 || notices.every((notice) => ['general', tipoReserva].includes(notice.categoria));
  return {
    nombre,
    pass,
    'PASS/FAIL': pass ? 'PASS' : 'FAIL',
    causa,
    session_id: sessionId,
    session_id_urgencia: urgentSessionId,
    respuesta_final: reply,
    confirmacion_detectada: confirmation,
    cantidad_avisos_detectados: notices.length,
    aviso_detectado: notices.length === 1 ? notices[0] : notices,
    contrato_publico_valido: contract,
    categoria_aviso_compatible: compatible,
    identificadores_cita: idsCita(finalPayload),
    cantidad_pasos: steps.length,
    pasos: steps,
    ...tiempos(steps),
  };
}

function causaReserva(payload, sessionId, expectNotice, notices, tipoReserva, stopCause) {
  if (stopCause) return stopCause;
  const reply = typeof payload?.reply === 'string' ? payload.reply : '';
  if (!reply.trim()) return 'respuesta_vacia';
  if (payload?.session_id !== sessionId) return 'session_id_incorrecta';
  if (payload?.ok !== true || payload?.clinic_id !== 'clinica_piloto_001' || typeof payload?.reply !== 'string') return 'contrato_publico_invalido';
  if (!confirmada(reply)) return 'confirmacion_no_detectada';
  if (notices.length > 1) return 'multiples_avisos';
  if (notices.some((notice) => !['general', tipoReserva].includes(notice.categoria))) return 'aviso_categoria_incorrecta';
  if (expectNotice && notices.length === 0) return 'aviso_esperado_no_detectado';
  if (!expectNotice && notices.length > 0) return 'aviso_inesperado';
  return '';
}

export async function ejecutarPruebasRuntime({ webhookUrl, fetchImpl = globalThis.fetch, fixtureClient, clock = () => performance.now(), runId = Date.now().toString(36), timeoutMs = 90000, maxSteps = 12, testSelection = 'all' } = {}) {
  if (typeof webhookUrl !== 'string' || !/^https?:\/\//.test(webhookUrl) || typeof fetchImpl !== 'function' || !fixtureClient?.ejecutar) throw new Error('configuracion_runtime_invalida');
  const selections = new Set(['medica_aviso', 'sin_aviso', 'urgencia_misma_sesion', 'urgencia_otra_sesion', 'all']);
  if (!selections.has(testSelection)) throw new Error(`seleccion_prueba_invalida:${testSelection}`);
  const selected = (name) => testSelection === 'all' || testSelection === name;
  const clinicId = 'clinica_piloto_001', pruebas = [];
  const sesiones = { aviso: `lab028_test_medica_aviso_${runId}`, sin_aviso: `lab028_test_medica_sin_aviso_${runId}`, urgencia_misma: `lab028_test_urgencia_misma_${runId}`, urgencia_otra: `lab028_test_urgencia_otra_${runId}`, reserva_aislada: `lab028_test_medica_aislada_${runId}` };
  if (Object.values(sesiones).some((value) => SESIONES_PROHIBIDAS.has(value))) throw new Error('session_id_reutilizada');

  async function turn(sessionId, message, number, steps) {
    const started = clock();
    let response;
    try { response = await fetchImpl(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinic_id: clinicId, session_id: sessionId, channel: 'streamlit', message }), signal: AbortSignal.timeout(timeoutMs) }); }
    catch { throw new Error('fallo_http_webhook'); }
    const duration = Number(Math.max(0, (clock() - started) / 1000).toFixed(6));
    if (!response?.ok) throw new Error(`webhook_http_${Number(response?.status) || 0}`);
    let payload;
    try { payload = await response.json(); } catch { throw new Error('respuesta_json_invalida'); }
    const step = { paso: number, mensaje_enviado: message, http_status: Number(response.status) || 0, tiempo_s: duration, reply_recibido: typeof payload?.reply === 'string' ? payload.reply : '', ok_recibido: payload?.ok ?? null, clinic_id_recibido: payload?.clinic_id ?? '', session_id_recibido: payload?.session_id ?? '', estado_interpretado: '', siguiente_accion: '' };
    steps.push(step);
    return { payload, step };
  }

  async function reserva(nombre, sessionId, expectNotice) {
    const steps = [], data = { sessionId, petName: `LAB028_TEST_Mascota_${runId}`, tutorName: `LAB028_TEST_Tutor_${runId}` };
    let payload = {}, message = 'Quiero reservar una consulta veterinaria general para mi mascota.', stopCause = '';
    try {
      for (let number = 1; number <= maxSteps; number += 1) {
        const current = await turn(sessionId, message, number, steps);
        payload = current.payload;
        const interpreted = interpretarRespuesta(payload?.reply, data);
        current.step.estado_interpretado = interpreted.estado;
        current.step.siguiente_accion = interpreted.accion;
        if (interpreted.estado === 'confirmacion_detectada') break;
        if (interpreted.estado === 'respuesta_vacia' || interpreted.estado === 'respuesta_no_interpretable') { stopCause = interpreted.estado; break; }
        const previous = steps.at(-2);
        const repeatedReply = previous && similitud(previous.reply_recibido, current.step.reply_recibido) >= 0.92;
        const repeatedAction = steps.slice(-3).length === 3 && steps.slice(-3).every((step) => step.siguiente_accion === interpreted.accion);
        if (repeatedReply || repeatedAction) { current.step.estado_interpretado = 'bucle_conversacional'; current.step.siguiente_accion = 'detener'; stopCause = 'bucle_conversacional'; break; }
        if (!interpreted.mensaje) { stopCause = 'respuesta_no_interpretable'; break; }
        message = interpreted.mensaje;
        if (number === maxSteps) stopCause = 'maximo_pasos_alcanzado';
      }
      const notices = detectarAvisos(payload?.reply);
      const cause = causaReserva(payload, sessionId, expectNotice, notices, 'medica', stopCause);
      return resultadoPrueba(nombre, { pass: !cause, causa: cause, steps, sessionId, finalPayload: payload });
    } catch (error) { return resultadoPrueba(nombre, { pass: false, causa: error.message, steps, sessionId, finalPayload: payload }); }
  }

  if (selected('medica_aviso')) pruebas.push(await reserva('Reserva médica confirmada + aviso', sesiones.aviso, true));
  if (selected('sin_aviso')) {
    try {
      const cleanup = await fixtureClient.ejecutar('limpiar');
      if (!cleanup.ok) pruebas.push(resultadoPrueba('Reserva confirmada sin aviso', { pass: false, causa: 'no_fue_posible_preparar_sin_aviso', sessionId: sesiones.sin_aviso }));
      else pruebas.push(await reserva('Reserva confirmada sin aviso', sesiones.sin_aviso, false));
    } finally {
      const restore = await fixtureClient.ejecutar('cargar');
      if (!restore.ok) { const last = pruebas.length - 1; pruebas[last] = { ...pruebas[last], pass: false, 'PASS/FAIL': 'FAIL', causa: 'fixtures_no_restaurados' }; }
    }
  }

  if (selected('urgencia_misma_sesion')) {
    const steps = []; let payload = {};
    try {
      const current = await turn(sesiones.urgencia_misma, 'Mi perro no respira y está inconsciente.', 1, steps); payload = current.payload;
      const interpreted = interpretarRespuesta(payload?.reply, {}); current.step.estado_interpretado = interpreted.estado; current.step.siguiente_accion = interpreted.accion;
      const notices = detectarAvisos(payload?.reply), contract = payload?.ok === true && payload?.clinic_id === clinicId && payload?.session_id === sesiones.urgencia_misma && typeof payload?.reply === 'string' && payload.reply.trim();
      const cause = !payload?.reply?.trim() ? 'respuesta_vacia' : payload?.session_id !== sesiones.urgencia_misma ? 'session_id_incorrecta' : !contract ? 'contrato_publico_invalido' : notices.length ? 'aviso_inesperado' : interpreted.estado !== 'urgencia_detectada' ? 'urgencia_no_detectada' : '';
      pruebas.push(resultadoPrueba('Urgencia misma sesión → cero publicidad', { pass: !cause, causa: cause, steps, sessionId: sesiones.urgencia_misma, urgentSessionId: sesiones.urgencia_misma, finalPayload: payload }));
    } catch (error) { pruebas.push(resultadoPrueba('Urgencia misma sesión → cero publicidad', { pass: false, causa: error.message, steps, sessionId: sesiones.urgencia_misma, urgentSessionId: sesiones.urgencia_misma, finalPayload: payload })); }
  }

  if (selected('urgencia_otra_sesion')) {
    const urgentSteps = []; let urgentPayload = {};
    try {
      const current = await turn(sesiones.urgencia_otra, 'Mi perro no respira y está inconsciente.', 1, urgentSteps); urgentPayload = current.payload;
      const interpreted = interpretarRespuesta(urgentPayload?.reply, {}); current.step.estado_interpretado = interpreted.estado; current.step.siguiente_accion = interpreted.accion;
      if (detectarAvisos(urgentPayload?.reply).length) throw new Error('aviso_inesperado');
      const isolated = await reserva('Urgencia otra sesión → no bloquea', sesiones.reserva_aislada, true);
      isolated.session_id_urgencia = sesiones.urgencia_otra;
      isolated.pasos = [...urgentSteps, ...isolated.pasos.map((step) => ({ ...step, paso: step.paso + urgentSteps.length }))];
      Object.assign(isolated, { cantidad_pasos: isolated.pasos.length }, tiempos(isolated.pasos));
      pruebas.push(isolated);
    } catch (error) { pruebas.push(resultadoPrueba('Urgencia otra sesión → no bloquea', { pass: false, causa: error.message, steps: urgentSteps, sessionId: sesiones.reserva_aislada, urgentSessionId: sesiones.urgencia_otra, finalPayload: urgentPayload })); }
  }

  const allSteps = pruebas.flatMap((test) => test.pasos), aggregate = tiempos(allSteps), pass = pruebas.filter((test) => test.pass).length;
  return { ok: pass === pruebas.length, sesiones, pruebas, resumen: { total: pruebas.length, pass, fail: pruebas.length - pass, ...aggregate } };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let output;
  try {
    const fixtureClient = crearClienteFixturesLab028({ baseUrl: process.env.LAB028_N8N_BASE_URL, apiToken: process.env.LAB028_N8N_API_TOKEN });
    output = await ejecutarPruebasRuntime({ webhookUrl: process.env.LAB028_RUNTIME_WEBHOOK_URL, fixtureClient, testSelection: process.env.LAB028_RUNTIME_TEST || 'all' });
  } catch (error) { output = { ok: false, sesiones: {}, pruebas: [], resumen: { total: 0, pass: 0, fail: 1, tiempo_total_s: 0, minimo_s: 0, maximo_s: 0, promedio_s: 0 }, causa: error.message }; }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.ok) process.exitCode = 1;
}
