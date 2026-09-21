import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validarInventarioCleanup, validarPostCleanup } from './validar_inventario_cleanup_lab029.mjs';

const summarise = inventory => ({
  postgres: {
    clinics: inventory.postgres.clinics.map(row => row.clinic_id),
    documents: inventory.postgres.documents.map(row => row.document_id),
    versions: inventory.postgres.versions.map(row => row.version_id),
    events: inventory.postgres.events.map(row => row.event_id)
  },
  qdrant: Object.fromEntries(['vetatiende_publico', 'vetatiende_interno'].map(collection =>
    [collection, inventory.qdrant[collection].map(point => point.id)])),
  data_tables: {
    users: inventory.data_tables.users.map(row => row.user_id),
    permissions: inventory.data_tables.permissions.map(row => `${row.clinic_id}:veterinario:rag_interno_consultar`),
    audits: inventory.data_tables.audits.map(row => row.audit_id)
  },
  runtime: { temporary_files: inventory.runtime.temporary_files }
});

export async function limpiarRuntime({ manifestPath, confirm = '', adapter }) {
  if (confirm !== 'LAB029_RUNTIME_CLEANUP') throw new Error('confirmacion_cleanup_requerida');
  if (!adapter || typeof adapter.inspect !== 'function' || typeof adapter.removeVerified !== 'function')
    throw new Error('adaptador_cleanup_seguro_requerido');
  const path = resolve(manifestPath);
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const evidencePath = join(dirname(path), 'cleanup_evidence.json');
  const pre = await adapter.inspect(manifest);
  const checkedPre = validarInventarioCleanup(manifest, pre);
  const evidence = { prefix: manifest.prefix, pre_check: { ok: true, at: new Date().toISOString(),
    counts: checkedPre.counts, ids: summarise(pre) }, cleanup: { ok: false }, post_check: { ok: false } };
  // Evidence must survive even if deletion fails. Never persist document content, credentials, or payloads.
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' });
  await adapter.removeVerified(manifest, pre);
  evidence.cleanup = { ok: true, at: new Date().toISOString() };
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  const post = await adapter.inspect(manifest);
  const checkedPost = validarPostCleanup(manifest, post);
  evidence.post_check = { ok: true, at: new Date().toISOString(), counts: checkedPost.counts };
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  manifest.status = 'cleaned';
  manifest.cleanup = { executed_at: evidence.post_check.at, evidence_file: 'cleanup_evidence.json' };
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  return { ok: true, pre_check: checkedPre.counts, post_check: checkedPost.counts, evidencePath };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  throw new Error('adaptador_cleanup_seguro_requerido');
}
