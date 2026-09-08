import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generarWorkflowLab028 } from './generar_workflow_lab028.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const basePath = path.join(root, 'n8n', 'workflows', 'comercial', 'lab026_cancelacion_reprogramacion_citas_confirmadas.json');
const targetPath = path.join(root, 'n8n', 'workflows', 'comercial', 'lab028_avisos_comerciales_contextuales_post_reserva.json');
const count = (workflow, type) => workflow.nodes.filter((node) => node.type === type).length;

export function validarWorkflowLab028() {
  const errors = [];
  const baseBytes = fs.readFileSync(basePath);
  const base = JSON.parse(baseBytes);
  const actual = JSON.parse(fs.readFileSync(targetPath));
  if (JSON.stringify(actual) !== JSON.stringify(generarWorkflowLab028(base))) errors.push('export_no_reproducible');
  if (actual.name !== 'LAB-028 - Avisos comerciales contextuales post-reserva') errors.push('nombre_incorrecto');
  if (actual.nodes.length !== base.nodes.length + 8) errors.push('cantidad_nodos');
  if (count(actual, 'n8n-nodes-base.code') !== count(base, 'n8n-nodes-base.code') + 2) errors.push('cantidad_code');
  if (count(actual, 'n8n-nodes-base.wait') !== count(base, 'n8n-nodes-base.wait')) errors.push('wait_nuevo');
  const added = actual.nodes.filter((node) => !base.nodes.some((candidate) => candidate.name === node.name));
  if (added.some((node) => ['n8n-nodes-base.wait', 'n8n-nodes-base.scheduleTrigger', 'n8n-nodes-base.webhook', 'n8n-nodes-base.executeWorkflow'].includes(node.type))) errors.push('nodo_prohibido_lab028');
  const addedText = JSON.stringify(added);
  if (addedText.includes('structuredClone')) errors.push('runtime_incompatible:structuredClone');
  for (const forbidden of ['enviando', 'lab028_envios', 'lab028_preferencias_contacto', 'runtime_n8n_lab028']) if (addedText.includes(forbidden)) errors.push(`contenido_prohibido:${forbidden}`);
  for (const [from, to] of [
    ['Preparar respuesta cita confirmada', 'Leer configuración contextual médica LAB-028'],
    ['Añadir aviso contextual médica LAB-028', 'Responder cita confirmada'],
    ['Preparar respuesta cita peluquería confirmada', 'Leer configuración contextual peluquería LAB-028'],
    ['Añadir aviso contextual peluquería LAB-028', 'Responder cita peluquería confirmada'],
  ]) if (actual.connections[from]?.main?.[0]?.[0]?.node !== to) errors.push(`conexion:${from}`);
  return { ok: errors.length === 0, errors, nodes: actual.nodes.length, code: count(actual, 'n8n-nodes-base.code'), wait: count(actual, 'n8n-nodes-base.wait'), added_nodes: added.length, added_code: count(actual, 'n8n-nodes-base.code') - count(base, 'n8n-nodes-base.code'), added_wait: count(actual, 'n8n-nodes-base.wait') - count(base, 'n8n-nodes-base.wait'), base_sha256: crypto.createHash('sha256').update(baseBytes).digest('hex') };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validarWorkflowLab028();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}
