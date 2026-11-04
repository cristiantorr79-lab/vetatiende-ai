export const POSTGRES_INVENTORY_SQL = `SELECT 'document'::text AS record_type,
  d.document_id AS id, d.clinic_id, d.visibility, d.status, NULL::text AS document_id,
  NULL::text AS version_id, NULL::text AS event_type
FROM vetatiende_documental.documents d
WHERE d.clinic_id = $1 AND d.document_id = $2
UNION ALL
SELECT 'version', v.version_id, d.clinic_id, d.visibility, v.status, v.document_id,
  v.version_id, NULL::text
FROM vetatiende_documental.document_versions v
JOIN vetatiende_documental.documents d ON d.document_id = v.document_id
WHERE d.clinic_id = $1 AND d.document_id = $2
UNION ALL
SELECT 'event', e.event_id, e.clinic_id, d.visibility, e.result, e.document_id,
  e.version_id, e.event_type
FROM vetatiende_documental.document_events e
JOIN vetatiende_documental.documents d
  ON d.document_id = e.document_id AND d.clinic_id = e.clinic_id
WHERE e.clinic_id = $1 AND e.document_id = $2
ORDER BY record_type, id`;

export const QDRANT_COLLECTION = 'vetatiende_interno';
export const INVENTORY_MODES = Object.freeze(['PRE_CREATE', 'POST_CREATE', 'RECOVERY_CLEANUP']);
const fail = (reason) => { throw new Error(`S03_INVENTORY_${reason}`); };
const key = (item) => `${item.store}:${item.type}:${item.id}`;

export function postgresRequest(manifest) {
  const clinicId = String(manifest?.clinic_id || ''), documentId = String(manifest?.fixture?.document_id || '');
  if (clinicId !== 'clinica_piloto_001' || !documentId || documentId !== `${manifest?.prefix}_DOC_INTERNAL`) fail('MANIFEST_INVALIDO');
  return Object.freeze({ query: POSTGRES_INVENTORY_SQL, params: [clinicId, documentId], read_only: true });
}

export function qdrantFilter(manifest) {
  const { params: [clinicId, documentId] } = postgresRequest(manifest);
  return Object.freeze({ must: [
    { key: 'metadata.clinic_id', match: { value: clinicId } },
    { key: 'metadata.document_id', match: { value: documentId } },
  ] });
}

function normalizePostgres(manifest, rows) {
  if (!Array.isArray(rows)) fail('POSTGRES_RESPUESTA_INVALIDA');
  const resources = [], documents = [], versions = [];
  for (const row of rows) {
    if (!row || row.error) fail('POSTGRES_ERROR');
    if (!row.id || row.clinic_id !== manifest.clinic_id || !['document', 'version', 'event'].includes(row.record_type)) fail('POSTGRES_RECURSO_AJENO');
    if (row.visibility !== 'internal') fail('POSTGRES_VISIBILIDAD_INVALIDA');
    if (row.record_type === 'document') {
      if (row.id !== manifest.fixture.document_id || row.status !== 'active') fail('POSTGRES_DOCUMENTO_INVALIDO');
      documents.push(row); resources.push({ store: 'postgres', type: 'document', id: row.id, clinic_id: row.clinic_id, visibility: row.visibility, status: row.status });
    } else if (row.record_type === 'version') {
      if (row.document_id !== manifest.fixture.document_id || row.version_id !== row.id || !['staging', 'active', 'superseded', 'failed'].includes(row.status)) fail('POSTGRES_VERSION_INVALIDA');
      versions.push(row); resources.push({ store: 'postgres', type: 'version', id: row.id, clinic_id: row.clinic_id, document_id: row.document_id, visibility: row.visibility, status: row.status });
    } else {
      if (row.document_id !== manifest.fixture.document_id || !row.event_type || !['accepted', 'rejected', 'uncertain'].includes(row.status)) fail('POSTGRES_EVENTO_INVALIDO');
      resources.push({ store: 'postgres', type: 'event', id: row.id, clinic_id: row.clinic_id, document_id: row.document_id, version_id: row.version_id || null, event_type: row.event_type, status: row.status });
    }
  }
  if (documents.length > 1 || (rows.length && documents.length !== 1)) fail('POSTGRES_AMBIGUO');
  if (versions.filter((row) => row.status === 'active').length > 1) fail('POSTGRES_MULTIPLES_ACTIVAS');
  const versionIds = new Set(versions.map((row) => row.id));
  for (const item of resources.filter((x) => x.type === 'event' && x.version_id)) if (!versionIds.has(item.version_id)) fail('POSTGRES_EVENTO_VERSION_AJENA');
  return { resources, versionIds };
}

async function readQdrant(manifest, qdrantScroll, { pageSize = 128, maxPages = 20 } = {}) {
  const points = []; let offset = null;
  for (let page = 0; page < maxPages; page += 1) {
    let response;
    try { response = await qdrantScroll({ collection: QDRANT_COLLECTION, filter: qdrantFilter(manifest), offset, limit: pageSize, with_payload: true, with_vector: false, read_only: true }); }
    catch { fail('QDRANT_ERROR_CONEXION'); }
    if (response?.status !== 'ok' || !Array.isArray(response?.result?.points)) fail('QDRANT_RESPUESTA_INVALIDA');
    points.push(...response.result.points);
    const next = response.result.next_page_offset;
    if (next === null || next === undefined) return points;
    if (response.result.points.length === 0) fail('QDRANT_RESPUESTA_TRUNCADA');
    if (next === offset) fail('QDRANT_PAGINACION_AMBIGUA');
    offset = next;
  }
  fail('QDRANT_PAGINACION_INCOMPLETA');
}

function normalizeQdrant(manifest, points, versionIds) {
  const resources = [];
  for (const point of points) {
    const metadata = point?.payload?.metadata;
    if (point?.id === undefined || point?.id === null || !metadata) fail('QDRANT_ID_O_METADATA_FALTANTE');
    if (metadata.clinic_id !== manifest.clinic_id || metadata.document_id !== manifest.fixture.document_id) fail('QDRANT_RECURSO_AJENO');
    if (metadata.visibility !== 'internal' || !['staging', 'active', 'superseded', 'failed'].includes(metadata.status)) fail('QDRANT_METADATA_INVALIDA');
    if (!metadata.version_id || !versionIds.has(metadata.version_id)) fail('QDRANT_VERSION_NO_ACREDITADA');
    resources.push({ store: 'qdrant', type: 'point', id: String(point.id), clinic_id: metadata.clinic_id, document_id: metadata.document_id, version_id: metadata.version_id, visibility: metadata.visibility, status: metadata.status, collection: QDRANT_COLLECTION });
  }
  return resources;
}

function ensureUnique(resources) {
  const seen = new Set();
  for (const item of resources) { const value = key(item); if (seen.has(value)) fail('ID_DUPLICADO'); seen.add(value); }
  return resources;
}

export function createReadonlyInventoryAdapter({ postgresRead, qdrantScroll, pageSize, maxPages } = {}) {
  if (typeof postgresRead !== 'function' || typeof qdrantScroll !== 'function') fail('LECTORES_REQUERIDOS');
  return Object.freeze({
    async inventoryExact(manifest, { mode = 'POST_CREATE' } = {}) {
      if (!INVENTORY_MODES.includes(mode)) fail('MODO_INVALIDO');
      let rows;
      try { rows = await postgresRead(postgresRequest(manifest)); } catch { fail('POSTGRES_ERROR_CONEXION'); }
      const pg = normalizePostgres(manifest, rows);
      const points = await readQdrant(manifest, qdrantScroll, { pageSize, maxPages });
      if (!pg.resources.length && points.length) fail('QDRANT_SIN_POSTGRES');
      const resources = ensureUnique([...pg.resources, ...normalizeQdrant(manifest, points, pg.versionIds)]);
      if (mode === 'PRE_CREATE') {
        if (resources.length) fail('PRE_CREATE_NO_VACIO');
        return resources;
      }
      if (mode === 'POST_CREATE') {
        const has = (store, type) => resources.some((x) => x.store === store && x.type === type);
        if (!has('postgres', 'document') || !resources.some((x) => x.type === 'version' && x.status === 'active') || !resources.some((x) => x.store === 'qdrant' && x.type === 'point' && x.status === 'active')) fail('POST_CREATE_INCOMPLETO');
      }
      if (mode === 'RECOVERY_CLEANUP') {
        const expected = Array.isArray(manifest?.resources?.created) ? manifest.resources.created : [];
        if (!expected.length && resources.length) fail('RECOVERY_SIN_AUTORIDAD');
        const allowed = new Set(expected.map(key));
        if (resources.some((item) => !allowed.has(key(item)))) fail('RECOVERY_RECURSO_INESPERADO');
      }
      return resources;
    },
  });
}
