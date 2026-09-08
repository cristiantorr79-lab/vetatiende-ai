import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analizarEjecucionesLab028 } from './analizar_rendimiento_runtime_lab028.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflow = JSON.parse(fs.readFileSync(path.join(root, 'n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json'), 'utf8'));
let tests = 0;
function test(name, fn) { try { fn(); tests += 1; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } }
const execution = {
  id: 'mock-1', status: 'success', startedAt: '2026-09-07T12:00:00.000Z', stoppedAt: '2026-09-07T12:00:51.000Z',
  data: { resultData: { runData: {
    'Consultar disponibilidad agenda médica': [{ startTime: 1000, executionTime: 30000 }],
    'Crear cita médica comercial': [{ startTime: 31000, executionTime: 18000 }],
    'Leer configuración contextual médica LAB-028': [{ startTime: 49000, executionTime: 20 }],
    'Leer avisos contextuales médica LAB-028': [{ startTime: 49020, executionTime: 25 }],
    'Leer urgencia sesión médica LAB-028': [{ startTime: 49045, executionTime: 15 }],
    'Añadir aviso contextual médica LAB-028': [{ startTime: 49060, executionTime: 2 }],
  } } },
};
const urgentExecution = {
  id: 'mock-urgency', status: 'success', startedAt: '2026-09-07T12:01:00.000Z', stoppedAt: '2026-09-07T12:01:06.000Z',
  data: { resultData: { runData: {
    'Consolidar estado urgencia': [{ startTime: 61000, executionTime: 100 }],
    'Evaluar reglas deterministas urgencia': [{ startTime: 61100, executionTime: 200 }],
  } } },
};

test('atribuye tiempo por categoría', () => {
  const result = analizarEjecucionesLab028([execution], workflow).ejecuciones[0];
  assert.equal(result.categorias.Calendar.tiempo_acumulado_ms, 48000);
  assert.equal(result.categorias.LAB028.tiempo_acumulado_ms, 62);
  assert.equal(result.nodos_lab028.length, 4);
  assert.equal(result.tipos_nodo.GoogleCalendar.tiempo_acumulado_ms, 48000);
  assert.equal(result.tipos_nodo.DataTable.tiempo_acumulado_ms, 60);
  assert.equal(result.tipos_nodo.Code.tiempo_acumulado_ms, 2);
});
test('ordena nodos más lentos', () => {
  const result = analizarEjecucionesLab028([execution], workflow).ejecuciones[0];
  assert.deepEqual(result.nodos_mas_lentos.slice(0, 2).map((node) => node.nombre), ['Consultar disponibilidad agenda médica', 'Crear cita médica comercial']);
});
test('calcula pared, ventana y tiempo no atribuido', () => {
  const result = analizarEjecucionesLab028([execution], workflow).ejecuciones[0];
  assert.equal(result.tiempo_pared_ms, 51000);
  assert.equal(result.ventana_nodos_ms, 48062);
  assert.equal(result.tiempo_fuera_ventana_nodos_ms, 2938);
});
test('rechaza ejecución sin runData', () => assert.throws(() => analizarEjecucionesLab028([{}], workflow), /runData_ausente/));
test('compara agenda lenta con urgencia', () => {
  const result = analizarEjecucionesLab028([execution, urgentExecution], workflow);
  assert.deepEqual(result.comparacion_agenda_urgencia, {
    ejecuciones_agenda: 1,
    ejecuciones_urgencia: 1,
    promedio_agenda_ms: 51000,
    promedio_urgencia_ms: 6000,
    diferencia_promedio_ms: 45000,
    conclusion: 'La diferencia queda cuantificada; revise nodos_mas_lentos y pausas_entre_nodos para atribuirla.',
  });
});
test('detecta reintentos, waits y pausas observables', () => {
  const modified = JSON.parse(JSON.stringify(execution));
  modified.data.resultData.runData['Consultar disponibilidad agenda médica'].push({ startTime: 35000, executionTime: 1000 });
  modified.data.resultData.runData['Esperar antes de reintento Telegram'] = [{ startTime: 37000, executionTime: 2000 }];
  const result = analizarEjecucionesLab028([modified], workflow).ejecuciones[0];
  assert.deepEqual(result.esperas_reintentos.reintentos, [{ nombre: 'Consultar disponibilidad agenda médica', intentos: 2 }]);
  assert.equal(result.esperas_reintentos.nodos_wait.length, 1);
  assert.ok(Array.isArray(result.pausas_entre_nodos));
});
test('no contiene configuración ni secretos hardcodeados', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/lab028/analizar_rendimiento_runtime_lab028.mjs'), 'utf8');
  assert.equal(/127\.0\.0\.1|5681|structuredClone/.test(source), false);
});
test('instrumentación es estrictamente de solo lectura', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/lab028/analizar_rendimiento_runtime_lab028.mjs'), 'utf8');
  assert.equal(/writeFile|appendFile|unlink|rmSync|method:\s*['"](?:POST|PATCH|PUT|DELETE)/.test(source), false);
  assert.ok(source.includes('/api/v1/executions/'));
});

process.stdout.write(`PASS ${tests} pruebas análisis rendimiento LAB-028\n`);
