import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCUMENT_SPEC } from './preparar_documento_rag_publico.mjs';

const COLLECTION = 'vetatiende_publico';

export const CLEANUP_SPEC = Object.freeze({
  clinic_id: DOCUMENT_SPEC.clinic_id,
  document_id: DOCUMENT_SPEC.document_id,
  content_hash: '0c1e8ac9d2cc2fbe9c3c12f9692c3532b3681da3a4d55533cd1d930cef1d3e5a',
  collection: COLLECTION,
  event_types: Object.freeze(['staged', 'validated', 'activated']),
  qdrant_points: 1,
});

const exactStrings = (rows, key, label) => rows.map(row => {
  const value = String(row?.[key] || '').trim();
  if (!value) throw new Error(`${label}_id_ausente`);
  return value;
});

export function prepararCleanup(inventory = null) {
  const selectors = {
    ...CLEANUP_SPEC,
  };
  if (inventory === null) {
    return {
      ok: true,
      mode: 'PLAN_ONLY',
      network_executed: false,
      selectors,
      inventory_required: ['postgres.documents', 'postgres.versions', 'postgres.events', 'qdrant.vetatiende_publico'],
      delete_order: ['qdrant_point_ids', 'postgres_event_ids', 'postgres_version_ids', 'postgres_document_id'],
      post_check: 'cero documentos/versiones/eventos/puntos para document_id exacto',
      clinic_delete_forbidden: true,
    };
  }

  const documents = inventory?.postgres?.documents || [];
  const versions = inventory?.postgres?.versions || [];
  const events = inventory?.postgres?.events || [];
  const points = inventory?.qdrant?.[COLLECTION] || [];
  if (documents.length !== 1
      || documents[0]?.document_id !== selectors.document_id
      || documents[0]?.clinic_id !== selectors.clinic_id) {
    throw new Error('cleanup_documento_inventario_ambiguo');
  }
  if (versions.length !== 1
      || !String(versions[0]?.version_id || '').startsWith(`ver_${selectors.document_id}_`)
      || versions[0]?.document_id !== selectors.document_id
      || versions[0]?.content_hash !== selectors.content_hash
      || versions[0]?.status !== 'active') {
    throw new Error('cleanup_versiones_inventario_ambiguo');
  }
  const versionId = versions[0].version_id;
  if (events.length !== selectors.event_types.length
      || events.some(row => row.document_id !== selectors.document_id
        || row.version_id !== versionId)
      || JSON.stringify(events.map(row => row.event_type).sort())
        !== JSON.stringify([...selectors.event_types].sort())) {
    throw new Error('cleanup_eventos_inventario_ambiguo');
  }
  if (points.length !== selectors.qdrant_points
      || points.some(point => point?.payload?.metadata?.document_id !== selectors.document_id
      || point?.payload?.metadata?.clinic_id !== selectors.clinic_id
      || point?.payload?.metadata?.version_id !== versionId
      || point?.payload?.metadata?.content_hash !== selectors.content_hash)) {
    throw new Error('cleanup_qdrant_inventario_ambiguo');
  }

  const plan = {
    qdrant_point_ids: exactStrings(points, 'id', 'qdrant_point'),
    postgres_event_ids: exactStrings(events, 'event_id', 'postgres_event'),
    postgres_version_ids: exactStrings(versions, 'version_id', 'postgres_version'),
    postgres_document_ids: [selectors.document_id],
  };
  return {
    ok: true,
    mode: 'EXACT_IDS_READY',
    network_executed: false,
    selectors: { ...selectors, version_id: versionId },
    created_ids: plan,
    delete_order: Object.keys(plan),
    post_check: selectors,
    clinic_delete_forbidden: true,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inventoryArg = process.argv.find(value => value.startsWith('--inventory='));
  if (process.argv.includes('--e2')) throw new Error('cleanup_e2_endpoint_protegido_no_preparado');
  const inventory = inventoryArg
    ? JSON.parse(await readFile(path.resolve(inventoryArg.slice('--inventory='.length)), 'utf8'))
    : null;
  console.log(JSON.stringify(prepararCleanup(inventory), null, 2));
}
