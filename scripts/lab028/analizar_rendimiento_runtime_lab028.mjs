import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowPath = path.join(root, 'n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json');

function executionData(value) {
  return value?.data?.resultData?.runData || value?.resultData?.runData || value?.runData || null;
}

function category(type, name) {
  if (name.includes('LAB-028')) return 'LAB028';
  if (type === 'n8n-nodes-base.googleCalendar') return 'Calendar';
  if (type === 'n8n-nodes-base.dataTable') return 'DataTable';
  if (type === 'n8n-nodes-base.code') return 'Code';
  if (/groq|cohere|langchain|embedding|vector/i.test(type)) return 'IA_RAG';
  if (type === 'n8n-nodes-base.wait') return 'Wait';
  return 'Otro';
}

function nodeType(type) {
  if (type === 'n8n-nodes-base.googleCalendar') return 'GoogleCalendar';
  if (type === 'n8n-nodes-base.dataTable') return 'DataTable';
  if (type === 'n8n-nodes-base.code') return 'Code';
  if (type === 'n8n-nodes-base.wait') return 'Wait';
  if (/groq|cohere|langchain|embedding|vector/i.test(type)) return 'IA_RAG';
  return 'Otro';
}

function aggregate(nodes, key) {
  const output = {};
  for (const node of nodes) {
    const group = node[key];
    output[group] ??= { nodos_ejecutados: 0, tiempo_acumulado_ms: 0, maximo_nodo_ms: 0 };
    output[group].nodos_ejecutados += 1;
    output[group].tiempo_acumulado_ms += node.duracion_ms;
    output[group].maximo_nodo_ms = Math.max(output[group].maximo_nodo_ms, node.duracion_ms);
  }
  return output;
}

export function analizarEjecucionesLab028(executions, workflow) {
  if (!Array.isArray(executions) || !workflow?.nodes) throw new Error('entrada_invalida');
  const types = new Map(workflow.nodes.map((node) => [node.name, node.type]));
  const analyzed = executions.map((execution, index) => {
    const runData = executionData(execution);
    if (!runData || typeof runData !== 'object') throw new Error(`runData_ausente:${index}`);
    const nodes = [];
    for (const [name, runs] of Object.entries(runData)) {
      if (!Array.isArray(runs)) continue;
      for (let attempt = 0; attempt < runs.length; attempt += 1) {
        const run = runs[attempt] || {}, duration = Number(run.executionTime || 0), start = Number(run.startTime || 0);
        const type = types.get(name) || 'desconocido';
        nodes.push({ nombre: name, tipo: type, tipo_metrica: nodeType(type), categoria: category(type, name), es_lab028: name.includes('LAB-028'), intento: attempt + 1, inicio_epoch_ms: start, duracion_ms: duration, error: Boolean(run.error) });
      }
    }
    nodes.sort((a, b) => a.inicio_epoch_ms - b.inicio_epoch_ms || b.duracion_ms - a.duracion_ms);
    const grouped = aggregate(nodes, 'categoria');
    const groupedTypes = aggregate(nodes, 'tipo_metrica');
    const started = Date.parse(execution.startedAt || ''), stopped = Date.parse(execution.stoppedAt || '');
    const wall = Number.isFinite(started) && Number.isFinite(stopped) ? Math.max(0, stopped - started) : 0;
    const starts = nodes.map((node) => node.inicio_epoch_ms).filter(Boolean);
    const ends = nodes.filter((node) => node.inicio_epoch_ms).map((node) => node.inicio_epoch_ms + node.duracion_ms);
    const nodeWindow = starts.length ? Math.max(...ends) - Math.min(...starts) : 0;
    const gaps = [];
    for (let position = 1; position < nodes.length; position += 1) {
      const previous = nodes[position - 1], current = nodes[position];
      if (!previous.inicio_epoch_ms || !current.inicio_epoch_ms) continue;
      const gap = current.inicio_epoch_ms - (previous.inicio_epoch_ms + previous.duracion_ms);
      if (gap >= 1000) gaps.push({ despues_de: previous.nombre, antes_de: current.nombre, pausa_ms: gap, posible_pausa_task_runner: gap >= 5000 && (previous.tipo_metrica === 'Code' || current.tipo_metrica === 'Code') });
    }
    const attempts = new Map();
    for (const node of nodes) attempts.set(node.nombre, (attempts.get(node.nombre) || 0) + 1);
    const retries = [...attempts].filter(([, amount]) => amount > 1).map(([nombre, intentos]) => ({ nombre, intentos }));
    const classification = nodes.some((node) => node.tipo_metrica === 'GoogleCalendar') ? 'agenda'
      : nodes.some((node) => /urgencia/i.test(node.nombre)) ? 'urgencia' : 'otra';
    return {
      execution_id: String(execution.id ?? index),
      estado: execution.status || (execution.finished ? 'success' : 'unknown'),
      clasificacion: classification,
      tiempo_pared_ms: wall,
      ventana_nodos_ms: nodeWindow,
      tiempo_fuera_ventana_nodos_ms: wall ? Math.max(0, wall - nodeWindow) : null,
      categorias: grouped,
      tipos_nodo: groupedTypes,
      nodos_lab028: nodes.filter((node) => node.categoria === 'LAB028'),
      esperas_reintentos: { nodos_wait: nodes.filter((node) => node.tipo_metrica === 'Wait'), reintentos: retries },
      pausas_entre_nodos: gaps,
      posibles_pausas_task_runner: gaps.filter((gap) => gap.posible_pausa_task_runner),
      nodos_mas_lentos: [...nodes].sort((a, b) => b.duracion_ms - a.duracion_ms).slice(0, 15),
      secuencia: nodes,
    };
  });
  const agenda = analyzed.filter((item) => item.clasificacion === 'agenda');
  const urgency = analyzed.filter((item) => item.clasificacion === 'urgencia');
  const average = (items) => items.length ? Math.round(items.reduce((sum, item) => sum + item.tiempo_pared_ms, 0) / items.length) : null;
  const agendaAverage = average(agenda), urgencyAverage = average(urgency);
  return {
    ok: true,
    ejecuciones: analyzed,
    resumen: {
      total: analyzed.length,
      con_lab028: analyzed.filter((item) => item.nodos_lab028.length > 0).length,
      maximo_nodo_ms: Math.max(0, ...analyzed.flatMap((item) => item.nodos_mas_lentos.map((node) => node.duracion_ms))),
    },
    comparacion_agenda_urgencia: {
      ejecuciones_agenda: agenda.length,
      ejecuciones_urgencia: urgency.length,
      promedio_agenda_ms: agendaAverage,
      promedio_urgencia_ms: urgencyAverage,
      diferencia_promedio_ms: agendaAverage !== null && urgencyAverage !== null ? agendaAverage - urgencyAverage : null,
      conclusion: agendaAverage !== null && urgencyAverage !== null
        ? 'La diferencia queda cuantificada; revise nodos_mas_lentos y pausas_entre_nodos para atribuirla.'
        : 'Se requiere al menos una ejecución de agenda y una de urgencia para comparar.',
    },
  };
}

async function loadExecutions(args) {
  if (args.length) return args.flatMap((file) => {
    const parsed = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
    return Array.isArray(parsed) ? parsed : [parsed];
  });
  const baseUrl = process.env.LAB028_N8N_BASE_URL, apiToken = process.env.LAB028_N8N_API_TOKEN;
  const ids = String(process.env.LAB028_EXECUTION_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!baseUrl || !apiToken || !ids.length) throw new Error('configuracion_faltante');
  let rootUrl;
  try { rootUrl = new URL(baseUrl).href.replace(/\/$/, ''); } catch { throw new Error('configuracion_invalida'); }
  const output = [];
  for (const id of ids) {
    const response = await fetch(`${rootUrl}/api/v1/executions/${encodeURIComponent(id)}?includeData=true`, { headers: { Accept: 'application/json', 'X-N8N-API-KEY': apiToken } });
    if (!response.ok) throw new Error(`n8n_http_${response.status}`);
    output.push(await response.json());
  }
  return output;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let output;
  try {
    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    output = analizarEjecucionesLab028(await loadExecutions(process.argv.slice(2)), workflow);
  } catch (error) { output = { ok: false, causa: error.message, ejecuciones: [] }; }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.ok) process.exitCode = 1;
}
