import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolverAvisoContextual } from './logica_lab028.mjs';
import { detectarSeleccionInicial } from './seleccion_alternativas_lab028.mjs';
import { validarWorkflowLab028 } from './validar_workflow_lab028.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const baseCommit = '8df810bb35de7a58ef04ae42fe65f8bcb30526a1';
const now = '2026-09-07T12:00:00.000Z';
let tests = 0;
function test(name, fn) { try { fn(); tests += 1; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } }
function fixture(tipoReserva = 'medica') {
  const respuestaOriginal = { ok: true, clinic_id: 'clinica_piloto_001', session_id: 'sesion_actual', reply: 'Reserva confirmada.' };
  return { respuestaOriginal, tipoReserva, ahora: now, configuraciones: [{ clinic_id: respuestaOriginal.clinic_id, habilitado: 'true', canal: 'contextual' }], campanas: [{ clinic_id: respuestaOriginal.clinic_id, campana_id: 'aviso_001', tipo: 'servicio', categoria: tipoReserva, texto: 'Aviso literal autorizado.', estado: 'activa', inicio: '2026-09-01T00:00:00Z', fin: '2026-10-01T00:00:00Z', programada_at: '2026-09-02T00:00:00Z' }], estadosUrgencia: [] };
}
const solve = resolverAvisoContextual;
const opciones = [{ numero: 1 }, { numero: 2 }, { numero: 3 }];

for (const [mensaje, esperada] of [
  ['1', 1], ['2', 2], ['3', 3], ['1.', 1], ['2.', 2], ['3.', 3],
  ['Opción 1', 1], ['Opcion 1', 1], ['opción 1.', 1],
  ['1, Tutor Juan, mascota Max, teléfono +56911111111', 1],
  ['1. Tutor Juan, mascota Max, teléfono +56911111111', 1],
  ['Opción 1, tutor Juan, mascota Max, teléfono +56911111111', 1],
  ['Opción 1. Tutor Juan, mascota Max, teléfono +56911111111', 1],
]) test(`selección inicial reconoce ${JSON.stringify(mensaje)}`, () => assert.equal(detectarSeleccionInicial(mensaje, opciones), esperada));

for (const mensaje of ['+56911111111', '08/09/2026', 'a las 17:00', 'Tutor Juan, mascota Max, teléfono +56911111111']) {
  test(`no genera selección falsa con ${JSON.stringify(mensaje)}`, () => assert.equal(detectarSeleccionInicial(mensaje, opciones), null));
}
test('selección queda limitada a alternativas ofrecidas', () => assert.equal(detectarSeleccionInicial('3. Tutor Juan', opciones.slice(0, 2)), null));

test('médica confirmada agrega un aviso médico', () => assert.equal(solve(fixture()).respuesta.reply, 'Reserva confirmada.\n\nAviso literal autorizado.'));
test('peluquería confirmada agrega un aviso de peluquería', () => assert.equal(solve(fixture('peluqueria')).aviso.categoria, 'peluqueria'));
test('aviso general sirve para ambas', () => { for (const type of ['medica', 'peluqueria']) { const data = fixture(type); data.campanas[0].categoria = 'general'; assert.ok(solve(data).aviso); } });
test('configuración deshabilitada conserva confirmación', () => { const data = fixture(); data.configuraciones[0].habilitado = 'false'; assert.deepEqual(solve(data).respuesta, data.respuestaOriginal); });
test('campaña inactiva no aparece', () => { const data = fixture(); data.campanas[0].estado = 'inactiva'; assert.equal(solve(data).aviso, null); });
test('campaña futura no aparece', () => { const data = fixture(); data.campanas[0].inicio = '2026-09-08T00:00:00Z'; data.campanas[0].programada_at = data.campanas[0].inicio; assert.equal(solve(data).aviso, null); });
test('campaña expirada no aparece', () => { const data = fixture(); data.campanas[0].fin = '2026-09-07T00:00:00Z'; assert.equal(solve(data).aviso, null); });
test('categoría incompatible no aparece', () => { const data = fixture(); data.campanas[0].categoria = 'peluqueria'; assert.equal(solve(data).aviso, null); });
test('sin campaña elegible conserva confirmación', () => { const data = fixture(); data.campanas = []; assert.deepEqual(solve(data).respuesta, data.respuestaOriginal); });
test('urgencia de la misma sesión bloquea', () => { const data = fixture(); data.estadosUrgencia = [{ clinic_id: 'clinica_piloto_001', session_id: 'sesion_actual', episode_id_activo: 'ep', estado_episodio: 'activo_inmediato' }]; assert.equal(solve(data).aviso, null); });
test('urgencia de otra sesión no bloquea', () => { const data = fixture(); data.estadosUrgencia = [{ clinic_id: 'clinica_piloto_001', session_id: 'otra', episode_id_activo: 'ep', estado_episodio: 'activo_inmediato' }]; assert.ok(solve(data).aviso); });
for (const key of ['errorConfiguracion', 'errorCampanas', 'errorUrgencia']) test(`${key} conserva reserva sin aviso`, () => { const data = fixture(); data[key] = true; const result = solve(data); assert.equal(result.aviso, null); assert.deepEqual(result.respuesta, data.respuestaOriginal); });
test('selección múltiple es única y determinista', () => { const data = fixture(); data.campanas.push({ ...data.campanas[0], campana_id: 'aviso_000', texto: 'Aviso determinista.' }); const result = solve(data); assert.equal(result.aviso.campana_id, 'aviso_000'); assert.equal(result.respuesta.reply, 'Reserva confirmada.\n\nAviso determinista.'); });
test('medicamento conserva texto literal', () => { const data = fixture(); const literal = 'Medicamento disponible según texto autorizado; consulte al equipo veterinario.'; Object.assign(data.campanas[0], { tipo: 'medicamento', texto: literal }); const result = solve(data); assert.equal(result.aviso.texto, literal); assert.ok(result.respuesta.reply.endsWith(literal)); });
test('workflow cumple arquitectura focalizada', () => assert.equal(validarWorkflowLab028().ok, true));
test('ningún Code LAB-028 generado usa structuredClone', () => {
  const workflowPath = path.join(root, 'n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json');
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  const codeLab028 = workflow.nodes.filter((node) => node.name.includes('LAB-028') && node.type === 'n8n-nodes-base.code').map((node) => node.parameters.jsCode).join('\n');
  assert.equal(codeLab028.includes('structuredClone'), false);
});
test('LAB-026 original permanece byte a byte intacto', () => {
  const relative = 'n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json';
  assert.deepEqual(fs.readFileSync(path.join(root, relative)), execFileSync('git', ['show', `${baseCommit}:${relative}`], { cwd: root, encoding: 'buffer', maxBuffer: 20_000_000 }));
});
test('LAB-025 y validador LAB-027 están restaurados al base', () => {
  for (const relative of ['n8n/workflows/comercial/lab025_operacion_interna_protegida_rag_interno.json', 'scripts/lab027/validar_workflows_lab027.mjs']) assert.deepEqual(fs.readFileSync(path.join(root, relative)), execFileSync('git', ['show', `${baseCommit}:${relative}`], { cwd: root, encoding: 'buffer', maxBuffer: 20_000_000 }));
});

process.stdout.write(`PASS ${tests} pruebas focalizadas LAB-028\n`);
