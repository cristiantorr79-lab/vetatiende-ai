import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolverAvisoContextual } from './logica_lab028.mjs';
import { detectarSeleccionInicial } from './seleccion_alternativas_lab028.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const sourcePath = path.join(root, 'n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json');
const targetPath = path.join(root, 'n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json');
const cloneJson = (value) => JSON.parse(JSON.stringify(value));
const tables = {
  config: { __rl: true, value: 'lab028_configuracion', mode: 'name', cachedResultName: 'lab028_configuracion' },
  campaigns: { __rl: true, value: 'lab028_campanas', mode: 'name', cachedResultName: 'lab028_campanas' },
  urgency: { __rl: true, value: 'WYCc8CjBsmZij4Wn', mode: 'list', cachedResultName: 'lab024_estado_urgencia', cachedResultUrl: '/projects/WS8DFPmFaG2eZFOj/datatables/WYCc8CjBsmZij4Wn' },
};

function readNode(name, table, conditions, limit, position) {
  return { parameters: { operation: 'get', dataTableId: cloneJson(table), matchType: 'allConditions', filters: { conditions }, returnAll: false, limit }, id: `lab028-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, type: 'n8n-nodes-base.dataTable', typeVersion: 1, position, alwaysOutputData: true, onError: 'continueRegularOutput' };
}

function route(tipo) {
  const medical = tipo === 'medica';
  const label = medical ? 'médica' : 'peluquería';
  const prepare = medical ? 'Preparar respuesta cita confirmada' : 'Preparar respuesta cita peluquería confirmada';
  const respond = medical ? 'Responder cita confirmada' : 'Responder cita peluquería confirmada';
  const names = [`Leer configuración contextual ${label} LAB-028`, `Leer avisos contextuales ${label} LAB-028`, `Leer urgencia sesión ${label} LAB-028`, `Añadir aviso contextual ${label} LAB-028`];
  const clinic = `={{ $("${prepare}").first().json.clinic_id }}`;
  const stateKey = `={{ [$("${prepare}").first().json.clinic_id, $("${prepare}").first().json.session_id].join("::") }}`;
  const y = medical ? 2320 : 2600;
  const code = `const resolverAvisoContextual = ${resolverAvisoContextual.toString()};
const original = $("${prepare}").first().json;
const leer = nombre => { try { return $(nombre).all().map(item => item.json || {}); } catch { return [{ error: true }]; } };
const configuraciones = leer("${names[0]}");
const campanas = leer("${names[1]}");
const estadosUrgencia = leer("${names[2]}");
const fallo = filas => filas.some(fila => fila.error || fila.error_message);
const resultado = resolverAvisoContextual({ respuestaOriginal: original, tipoReserva: "${tipo}", configuraciones, campanas, estadosUrgencia, ahora: $now.toISO(), errorConfiguracion: fallo(configuraciones), errorCampanas: fallo(campanas), errorUrgencia: fallo(estadosUrgencia) });
return { json: resultado.respuesta };`;
  const nodes = [
    readNode(names[0], tables.config, [{ keyName: 'clinic_id', keyValue: clinic }], 2, [3440, y]),
    readNode(names[1], tables.campaigns, [{ keyName: 'clinic_id', keyValue: clinic }], 100, [3660, y]),
    readNode(names[2], tables.urgency, [{ keyName: 'state_key', keyValue: stateKey }], 2, [3880, y]),
    { parameters: { mode: 'runOnceForEachItem', jsCode: code }, id: `lab028-${tipo}-resolver`, name: names[3], type: 'n8n-nodes-base.code', typeVersion: 2, position: [4100, y] },
  ];
  return { prepare, respond, names, nodes };
}

function corregirSeleccionCombinada(workflow) {
  const nombres = [
    'Interpretar fecha y hora agenda',
    'Interpretar fecha y hora peluquería',
  ];
  for (const nombre of nombres) {
    const nodo = workflow.nodes.find((item) => item.name === nombre);
    if (!nodo?.parameters?.jsCode) throw new Error(`No se encontró el Code heredado: ${nombre}`);
    const inicio = nodo.parameters.jsCode.indexOf('const detectarOpcionSeleccionada');
    const numero = nodo.parameters.jsCode.indexOf('const numeroDirecto', inicio);
    const frase = nodo.parameters.jsCode.indexOf('const numeroEnFrase', numero);
    if (inicio < 0 || numero < 0 || frase < 0) throw new Error(`No se encontró el bloque de selección: ${nombre}`);
    const indentacion = nodo.parameters.jsCode.slice(nodo.parameters.jsCode.lastIndexOf('\n', numero) + 1, numero);
    const reemplazo = `${indentacion}const numeroDirecto =\n${indentacion}  detectarSeleccionInicial(mensaje, opcionesGuardadas);\n\n${indentacion}if (numeroDirecto) {\n${indentacion}  return numeroDirecto;\n${indentacion}}\n\n${indentacion}`;
    nodo.parameters.jsCode =
      `const detectarSeleccionInicial = ${detectarSeleccionInicial.toString()};\n` +
      nodo.parameters.jsCode.slice(0, numero) +
      reemplazo +
      nodo.parameters.jsCode.slice(frase);
  }
}

export function generarWorkflowLab028(source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))) {
  const workflow = cloneJson(source);
  workflow.name = 'LAB-028 - Avisos comerciales contextuales post-reserva';
  corregirSeleccionCombinada(workflow);
  for (const current of [route('medica'), route('peluqueria')]) {
    workflow.nodes.push(...current.nodes);
    workflow.connections[current.prepare] = { main: [[{ node: current.names[0], type: 'main', index: 0 }]] };
    for (let i = 0; i < 3; i += 1) workflow.connections[current.names[i]] = { main: [[{ node: current.names[i + 1], type: 'main', index: 0 }]] };
    workflow.connections[current.names[3]] = { main: [[{ node: current.respond, type: 'main', index: 0 }]] };
  }
  return workflow;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(targetPath, `${JSON.stringify(generarWorkflowLab028(), null, 2)}\n`, 'utf8');
  process.stdout.write(`${targetPath}\n`);
}
