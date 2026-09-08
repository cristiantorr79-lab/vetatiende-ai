import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURES_LAB028 } from './fixtures_runtime_contextual_lab028.mjs';
import { detectarAvisos, ejecutarPruebasRuntime, interpretarRespuesta } from './probar_runtime_real_lab028.mjs';
import { validarWorkflowLab028 } from './validar_workflow_lab028.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let tests = 0;
async function test(name, fn) { try { await fn(); tests += 1; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } }
const medicalNotice = FIXTURES_LAB028.lab028_campanas.find((row) => row.categoria === 'medica').texto;
const groomingNotice = FIXTURES_LAB028.lab028_campanas.find((row) => row.categoria === 'peluqueria').texto;

function harness({ finalNotice = () => medicalNotice, responseMode = 'normal', invalidContract = false } = {}) {
  let fixtures = true;
  const counts = new Map();
  const fixtureClient = { async ejecutar(action) { if (action === 'limpiar') fixtures = false; if (action === 'cargar') fixtures = true; return { ok: true }; } };
  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body), count = (counts.get(body.session_id) || 0) + 1;
    counts.set(body.session_id, count);
    let reply;
    if (/no respira/i.test(body.message)) reply = 'Esto es una urgencia. Acude a atención veterinaria inmediata.';
    else if (responseMode === 'empty') reply = '';
    else if (responseMode === 'loop') reply = '¿Cómo se llama tu mascota?';
    else if (responseMode === 'max') reply = count % 2 ? '¿Cómo se llama tu mascota?' : '¿Es perro o gato?';
    else if (count === 1) reply = 'Para continuar, ¿cómo se llama tu mascota?';
    else if (count === 2) reply = 'Selecciona una de las alternativas disponibles.';
    else if (count === 3) reply = '¿Deseas confirmar esta reserva?';
    else reply = `La cita quedó confirmada.${fixtures ? `\n\n${finalNotice()}` : ''}`;
    return { ok: true, status: 200, async json() { return { ok: invalidContract ? false : true, clinic_id: body.clinic_id, session_id: body.session_id, reply, appointment_id: count === 4 ? `LAB028_TEST_APPT_${body.session_id}` : undefined }; } };
  };
  let tick = 0;
  return { fixtureClient, fetchImpl, clock: () => { tick += 100; return tick; } };
}

await test('detecta confirmación con redacción flexible', () => {
  assert.equal(interpretarRespuesta('Tu cita ha sido correctamente agendada.', {}).estado, 'confirmacion_detectada');
  assert.equal(interpretarRespuesta('La reserva quedó confirmada para mañana.', {}).estado, 'confirmacion_detectada');
});

await test('respuesta real observada produce selección y datos completos', () => {
  const reply = `Tengo estas alternativas reales disponibles:
1. lunes 7 de septiembre a las 14:00
2. lunes 7 de septiembre a las 14:30
3. lunes 7 de septiembre a las 15:00
Para confirmar necesito también: nombre del tutor, nombre de la mascota, teléfono de contacto. Puedes responder con el número de la opción junto con esos datos.`;
  const data = { tutorName: 'LAB028_TEST_Tutor_real', petName: 'LAB028_TEST_Mascota_real' };
  const parsed = interpretarRespuesta(reply, data);
  assert.equal(parsed.accion, 'enviar_seleccion_y_datos_completos');
  assert.ok(parsed.mensaje.includes('Opción 1'));
  assert.ok(parsed.mensaje.includes(data.tutorName));
  assert.ok(parsed.mensaje.includes(data.petName));
  assert.ok(parsed.mensaje.includes('+56912345678'));
});

await test('selección más datos completos tiene prioridad', () => {
  const parsed = interpretarRespuesta('Responde con opción + nombre del tutor + nombre de la mascota + teléfono.', { tutorName: 'Tutor', petName: 'Mascota' });
  assert.equal(parsed.estado, 'solicitud_seleccion_y_datos_completos');
  assert.equal(parsed.accion, 'enviar_seleccion_y_datos_completos');
});

await test('datos completos sin selección se envían juntos', () => {
  const parsed = interpretarRespuesta('Necesito nombre del tutor, nombre de la mascota y teléfono.', { tutorName: 'Tutor', petName: 'Mascota' });
  assert.equal(parsed.accion, 'enviar_datos_completos');
  assert.ok(parsed.mensaje.includes('Tutor') && parsed.mensaje.includes('Mascota') && parsed.mensaje.includes('+56912345678'));
});

await test('selección sola elige primera alternativa', () => {
  assert.equal(interpretarRespuesta('Selecciona el número de una opción.', {}).accion, 'seleccionar_primera_alternativa');
});

await test('solicitudes individuales conservan acciones específicas', () => {
  const data = { tutorName: 'Tutor', petName: 'Mascota' };
  assert.equal(interpretarRespuesta('Indica el nombre del tutor.', data).accion, 'enviar_nombre_tutor');
  assert.equal(interpretarRespuesta('¿Cómo se llama tu mascota?', data).accion, 'enviar_nombre_mascota');
  assert.equal(interpretarRespuesta('Indica un teléfono de contacto.', data).accion, 'enviar_telefono');
});

await test('detecta aviso literal y su categoría', () => {
  assert.deepEqual(detectarAvisos(`Confirmada.\n\n${medicalNotice}`).map((item) => item.categoria), ['medica']);
});

await test('ejecución mock cubre confirmación con y sin aviso', async () => {
  const mock = harness();
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'diagnostico_ok' });
  assert.equal(output.ok, true);
  assert.equal(output.sesiones.aviso, 'lab028_test_medica_aviso_diagnostico_ok');
  assert.equal(output.pruebas[0].confirmacion_detectada, true);
  assert.equal(output.pruebas[0].cantidad_avisos_detectados, 1);
  assert.equal(output.pruebas[1].confirmacion_detectada, true);
  assert.equal(output.pruebas[1].cantidad_avisos_detectados, 0);
  assert.ok(output.pruebas.flatMap((item) => item.pasos).every((step) => ['paso', 'mensaje_enviado', 'http_status', 'tiempo_s', 'reply_recibido', 'ok_recibido', 'clinic_id_recibido', 'session_id_recibido', 'estado_interpretado', 'siguiente_accion'].every((key) => Object.hasOwn(step, key))));
});

await test('selección medica_aviso ejecuta únicamente la primera prueba', async () => {
  const mock = harness();
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'solo_medica', testSelection: 'medica_aviso' });
  assert.equal(output.ok, true);
  assert.equal(output.resumen.total, 1);
  assert.deepEqual(output.pruebas.map((item) => item.nombre), ['Reserva médica confirmada + aviso']);
});

await test('selección all mantiene las cuatro pruebas', async () => {
  const mock = harness();
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'all', testSelection: 'all' });
  assert.equal(output.resumen.total, 4);
  assert.equal(output.pruebas.length, 4);
});

await test('selección inválida falla antes de ejecutar', async () => {
  const mock = harness();
  await assert.rejects(() => ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, testSelection: 'desconocida' }), /seleccion_prueba_invalida:desconocida/);
});

await test('aviso de otra categoría produce causa concreta', async () => {
  const mock = harness({ finalNotice: () => groomingNotice });
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'categoria' });
  assert.equal(output.pruebas[0].causa, 'aviso_categoria_incorrecta');
  assert.equal(output.pruebas[0].categoria_aviso_compatible, false);
});

await test('respuesta repetida detiene bucle antes del máximo', async () => {
  const mock = harness({ responseMode: 'loop' });
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'loop' });
  assert.equal(output.pruebas[0].causa, 'bucle_conversacional');
  assert.ok(output.pruebas[0].cantidad_pasos < 12);
  assert.equal(output.pruebas[0].pasos.at(-1).estado_interpretado, 'bucle_conversacional');
});

await test('máximo de pasos tiene causa exacta', async () => {
  const mock = harness({ responseMode: 'max' });
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'max', maxSteps: 2 });
  assert.equal(output.pruebas[0].causa, 'maximo_pasos_alcanzado');
  assert.equal(output.pruebas[0].cantidad_pasos, 2);
});

await test('contrato inválido se distingue', async () => {
  const mock = harness({ invalidContract: true });
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'contract' });
  assert.equal(output.pruebas[0].causa, 'contrato_publico_invalido');
  assert.equal(output.pruebas[0].contrato_publico_valido, false);
});

await test('respuesta vacía se detiene inmediatamente', async () => {
  const mock = harness({ responseMode: 'empty' });
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://mock.invalid', ...mock, runId: 'empty' });
  assert.equal(output.pruebas[0].causa, 'respuesta_vacia');
  assert.equal(output.pruebas[0].cantidad_pasos, 1);
});

await test('salida no contiene URL ni secretos y fuente no usa structuredClone', async () => {
  const mock = harness();
  const output = await ejecutarPruebasRuntime({ webhookUrl: 'https://privada.invalid/secreto', ...mock, runId: 'safe' });
  const serialized = JSON.stringify(output);
  assert.equal(serialized.includes('privada.invalid'), false);
  const source = fs.readFileSync(path.join(root, 'scripts/lab028/probar_runtime_real_lab028.mjs'), 'utf8');
  assert.equal(source.includes('structuredClone'), false);
});

await test('workflow LAB-028 permanece intacto y válido', () => {
  const result = validarWorkflowLab028();
  assert.equal(result.ok, true);
  assert.deepEqual([result.nodes, result.code, result.wait, result.added_wait], [311, 104, 1, 0]);
});

process.stdout.write(`PASS ${tests} pruebas locales diagnóstico runner LAB-028\n`);
