import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { idsCleanupExactos, validarInventarioCleanup } from './validar_inventario_cleanup_lab029.mjs';

export async function ejecutarPrecheckCleanup({ manifestPath, env = process.env, fetchImpl = globalThis.fetch }) {
  if (env.LAB029_RUNTIME_CONFIRM !== 'LAB029_RUNTIME_REAL') throw new Error('confirmacion_precheck_requerida');
  const path = resolve(manifestPath);
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const { prefix } = idsCleanupExactos(manifest);
  const base = String(env.LAB029_N8N_WEBHOOK_BASE_URL || '').replace(/\/$/, '');
  const headerName = String(env.LAB029_INTERNAL_HEADER_NAME || '');
  const headerValue = String(env.LAB029_INTERNAL_HEADER_VALUE || '');
  if (!base || !headerName || !headerValue) throw new Error('configuracion_webhook_precheck_faltante');
  const webhookPath = `${prefix.toLowerCase().replaceAll('_', '-')}-cleanup-precheck`;
  const response = await fetchImpl(`${base}/webhook/${webhookPath}`, {
    method: 'POST', headers: { 'content-type': 'application/json', [headerName]: headerValue },
    body: JSON.stringify({ prefix, ids: manifest.ids }), signal: AbortSignal.timeout(90000)
  });
  if (response.status !== 200) throw new Error(`precheck_http_${response.status}`);
  let body;
  try { body = await response.json(); } catch { throw new Error('precheck_respuesta_no_json'); }
  if (body?.ok !== true || !body.inventory) throw new Error('precheck_respuesta_incompleta');
  const folder = dirname(path);
  const names = await readdir(folder, { withFileTypes: true });
  const temporaryFiles = names.filter(entry => entry.isFile() &&
    !['manifest.json', 'cleanup_evidence.json', 'cleanup_precheck_snapshot.json'].includes(entry.name))
    .map(entry => join(folder, entry.name));
  const inventory = { ...body.inventory, runtime: { temporary_files: temporaryFiles } };
  const checked = validarInventarioCleanup(manifest, inventory);
  const output = join(folder, 'cleanup_precheck_snapshot.json');
  await writeFile(output, `${JSON.stringify({ prefix, observed_at: new Date().toISOString(), inventory }, null, 2)}\n`, { flag: 'wx' });
  return { ok: true, prefix, counts: checked.counts, snapshot: output };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifestPath = process.argv.find(arg => arg.startsWith('--manifest='))?.slice(11);
  if (!manifestPath) throw new Error('manifest_requerido');
  console.log(JSON.stringify(await ejecutarPrecheckCleanup({ manifestPath })));
}
