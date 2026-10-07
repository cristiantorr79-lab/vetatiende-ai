import assert from 'node:assert/strict';
import { CLEANUP_SPEC, prepararCleanup } from './cleanup_documento_rag_publico.mjs';

const inventory = {
  postgres: {
    documents: [{ document_id: CLEANUP_SPEC.document_id, clinic_id: CLEANUP_SPEC.clinic_id }],
    versions: [{ version_id: `ver_${CLEANUP_SPEC.document_id}_LOCAL_DYNAMIC`, document_id: CLEANUP_SPEC.document_id, content_hash: CLEANUP_SPEC.content_hash, status: 'active' }],
    events: CLEANUP_SPEC.event_types.map((event_type, index) => ({
      event_id: `lab029_evt_local_${index + 1}`,
      clinic_id: CLEANUP_SPEC.clinic_id,
      document_id: CLEANUP_SPEC.document_id,
      version_id: `ver_${CLEANUP_SPEC.document_id}_LOCAL_DYNAMIC`,
      event_type,
    })),
  },
  qdrant: {
    [CLEANUP_SPEC.collection]: [{
      id: 'local-point-id',
      payload: { metadata: {
        clinic_id: CLEANUP_SPEC.clinic_id,
        document_id: CLEANUP_SPEC.document_id,
        version_id: `ver_${CLEANUP_SPEC.document_id}_LOCAL_DYNAMIC`,
        content_hash: CLEANUP_SPEC.content_hash,
      } },
    }],
  },
};

const plan = prepararCleanup();
assert.equal(plan.mode, 'PLAN_ONLY');
assert.equal(plan.network_executed, false);
const exact = prepararCleanup(inventory);
assert.equal(exact.mode, 'EXACT_IDS_READY');
assert.deepEqual(exact.created_ids.postgres_version_ids, [`ver_${CLEANUP_SPEC.document_id}_LOCAL_DYNAMIC`]);
assert.deepEqual(exact.created_ids.qdrant_point_ids, ['local-point-id']);
const nextVersion = `ver_${CLEANUP_SPEC.document_id}_NEXT_DYNAMIC`;
const nextInventory = structuredClone(inventory);
nextInventory.postgres.versions[0].version_id = nextVersion;
nextInventory.postgres.events.forEach(event => { event.version_id = nextVersion; });
nextInventory.qdrant[CLEANUP_SPEC.collection][0].payload.metadata.version_id = nextVersion;
assert.deepEqual(prepararCleanup(nextInventory).created_ids.postgres_version_ids, [nextVersion]);
assert.throws(() => prepararCleanup({ ...inventory, postgres: { ...inventory.postgres, events: inventory.postgres.events.slice(1) } }), /eventos_inventario_ambiguo/);
assert.throws(() => prepararCleanup({ ...inventory, qdrant: { [CLEANUP_SPEC.collection]: [] } }), /qdrant_inventario_ambiguo/);

console.log(JSON.stringify({ ok: true, network_executed: false, plan: plan.mode, exact: exact.mode }));
