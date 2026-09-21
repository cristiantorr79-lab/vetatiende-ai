const fail = reason => { throw new Error(`cleanup_precheck_${reason}`); };
const requireArray = (value, name) => Array.isArray(value) ? value : fail(`${name}_ausente`);

export function idsCleanupExactos(manifest) {
  const prefix = String(manifest?.prefix || '');
  if (!/^LAB029_TEST_[A-Za-z0-9][A-Za-z0-9_-]{5,51}$/.test(prefix)) fail('run_invalido');
  const lower = prefix.toLowerCase();
  const ids = manifest?.ids || {};
  if (ids.clinic_a !== `${lower}_clinic_a` || ids.clinic_b !== `${lower}_clinic_b` ||
      ids.document_public_a !== `${prefix}_DOC_PUBLIC_A` ||
      ids.document_public_b !== `${prefix}_DOC_PUBLIC_B` ||
      ids.document_internal_a !== `${prefix}_DOC_INTERNAL_A`) fail('manifest_ids_ajenos');
  const collections = manifest?.qdrant?.collections;
  if (!Array.isArray(collections) || collections.length !== 2 ||
      !collections.includes('vetatiende_publico') || !collections.includes('vetatiende_interno')) fail('colecciones_ajenas');
  return { prefix, lower, ids, clinics: new Set([ids.clinic_a, ids.clinic_b]),
    documents: new Set([ids.document_public_a, ids.document_public_b, ids.document_internal_a]),
    users: new Set([`${lower}_user_a`, `${lower}_user_b`]),
    subjects: new Set([`${lower}_subject_a`, `${lower}_subject_b`]) };
}

export function validarInventarioCleanup(manifest, inventory) {
  const expected = idsCleanupExactos(manifest);
  if (!inventory || inventory.prefix !== expected.prefix) fail('inventario_run_distinto');
  const pg = inventory.postgres || {};
  const clinics = requireArray(pg.clinics, 'clinicas');
  const documents = requireArray(pg.documents, 'documentos');
  const versions = requireArray(pg.versions, 'versiones');
  const events = requireArray(pg.events, 'eventos');
  const qdrant = inventory.qdrant || {};
  const publicPoints = requireArray(qdrant.vetatiende_publico, 'qdrant_publico');
  const internalPoints = requireArray(qdrant.vetatiende_interno, 'qdrant_interno');
  const tables = inventory.data_tables || {};
  const users = requireArray(tables.users, 'usuarios');
  const permissions = requireArray(tables.permissions, 'permisos');
  const audits = requireArray(tables.audits, 'auditoria');
  const temporaryFiles = requireArray(inventory.runtime?.temporary_files, 'archivos_runtime');
  const contains = (set, value, reason) => { if (!set.has(String(value))) fail(reason); };
  for (const row of clinics) contains(expected.clinics, row.clinic_id, 'clinica_ajena');
  for (const row of documents) { contains(expected.documents, row.document_id, 'documento_ajeno'); contains(expected.clinics, row.clinic_id, 'documento_clinica_ajena'); }
  const versionIds = new Set();
  for (const row of versions) {
    contains(expected.documents, row.document_id, 'version_documento_ajeno');
    if (!String(row.version_id).startsWith(`ver_${row.document_id}_`)) fail('version_id_ajeno');
    versionIds.add(String(row.version_id));
  }
  for (const row of events) {
    contains(expected.documents, row.document_id, 'evento_documento_ajeno');
    contains(expected.clinics, row.clinic_id, 'evento_clinica_ajena');
    if (!String(row.event_id || '').trim() ||
        (row.version_id != null && !versionIds.has(String(row.version_id)))) fail('evento_id_ajeno');
  }
  for (const [collection, points] of [['vetatiende_publico', publicPoints], ['vetatiende_interno', internalPoints]]) {
    const visibility = collection === 'vetatiende_publico' ? 'public' : 'internal';
    for (const point of points) {
      const meta = point?.payload?.metadata || point?.metadata || {};
      contains(expected.clinics, meta.clinic_id, 'qdrant_clinica_ajena');
      contains(expected.documents, meta.document_id, 'qdrant_documento_ajeno');
      if (meta.visibility !== visibility || !String(meta.version_id).startsWith(`ver_${meta.document_id}_`)) fail('qdrant_metadata_ajena');
      if (!(typeof point.id === 'string' || Number.isSafeInteger(point.id))) fail('qdrant_point_id_invalido');
    }
  }
  for (const row of users) {
    contains(expected.users, row.user_id, 'usuario_ajeno');
    contains(expected.clinics, row.clinic_id, 'usuario_clinica_ajena');
    contains(expected.subjects, row.identity_subject, 'usuario_subject_ajeno');
    if (row.identity_provider !== 'lab029_runtime') fail('usuario_provider_ajeno');
  }
  for (const row of permissions) {
    contains(expected.clinics, row.clinic_id, 'permiso_clinica_ajena');
    if (row.rol !== 'veterinario' || row.permiso !== 'rag_interno_consultar') fail('permiso_ajeno');
  }
  for (const row of audits) {
    const metadata = typeof row.metadata_controlada === 'string' ? JSON.parse(row.metadata_controlada || '{}') : row.metadata_controlada || {};
    if (!String(metadata.internal_session_id || '').startsWith(`${expected.prefix}_`) ||
        (row.clinic_id && !expected.clinics.has(row.clinic_id)) ||
        (row.actor_user_id && !expected.users.has(row.actor_user_id))) fail('auditoria_ajena');
    if (!String(row.audit_id || '').startsWith('audit_')) fail('auditoria_id_invalido');
  }
  for (const file of temporaryFiles) {
    const normal = String(file).replaceAll('\\', '/');
    if (!normal.includes(`/${expected.prefix}/`) || normal.includes('/../') || normal.endsWith('/manifest.json') || normal.endsWith('/cleanup_evidence.json'))
      fail('archivo_runtime_ajeno');
  }
  return { ok: true, counts: { clinics: clinics.length, documents: documents.length,
    versions: versions.length, events: events.length,
    qdrant_public: publicPoints.length, qdrant_internal: internalPoints.length,
    users: users.length, permissions: permissions.length, audits: audits.length,
    temporary_files: temporaryFiles.length } };
}

export function validarPostCleanup(manifest, inventory) {
  const checked = validarInventarioCleanup(manifest, inventory);
  if (Object.values(checked.counts).some(count => count !== 0)) fail('residuos_persistentes');
  return checked;
}
