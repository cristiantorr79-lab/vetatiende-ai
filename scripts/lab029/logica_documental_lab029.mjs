import crypto from 'node:crypto';

export const VISIBILITIES = Object.freeze(['public', 'internal']);
export const VERSION_STATES = Object.freeze(['staging', 'active', 'superseded', 'failed']);
export const COLLECTIONS = Object.freeze({ public: 'vetatiende_publico', internal: 'vetatiende_interno' });
export const sha256 = (content) => crypto.createHash('sha256').update(Buffer.isBuffer(content) ? content : Buffer.from(String(content))).digest('hex');

const clone = (v) => JSON.parse(JSON.stringify(v));
const required = (value, name) => { const text = String(value || '').trim(); if (!text) throw new Error(`${name}_required`); return text; };
export function metadataQdrant({ clinic_id, document_id, version_id, version_number, document_type, visibility, status = 'active', content_hash, updated_at, source_file, access_level }) {
  const meta = { clinic_id: required(clinic_id, 'clinic_id'), document_id: required(document_id, 'document_id'), version_id: required(version_id, 'version_id'), version_number: Number(version_number), document_type: required(document_type, 'document_type'), visibility: required(visibility, 'visibility'), status, content_hash: required(content_hash, 'content_hash'), updated_at: required(updated_at, 'updated_at'), source_file: required(source_file, 'source_file') };
  if (!VISIBILITIES.includes(meta.visibility) || meta.status !== 'active' || !Number.isInteger(meta.version_number) || meta.version_number < 1 || !/^[a-f0-9]{64}$/.test(meta.content_hash)) throw new Error('metadata_invalid');
  if (meta.visibility === 'internal') meta.access_level = required(access_level, 'access_level');
  return meta;
}

export function filtroRecuperacion({ clinic_id, visibility, access_levels = [] }) {
  const clinic = required(clinic_id, 'clinic_id');
  if (!VISIBILITIES.includes(visibility)) throw new Error('visibility_invalid');
  const must = [{ key: 'metadata.clinic_id', match: { value: clinic } }, { key: 'metadata.visibility', match: { value: visibility } }, { key: 'metadata.status', match: { value: 'active' } }];
  if (visibility === 'internal') { if (!Array.isArray(access_levels) || !access_levels.length) throw new Error('access_level_required'); must.push({ key: 'metadata.access_level', match: { any: [...new Set(access_levels.map(String))] } }); }
  return { must };
}

export function crearRegistroFicticio() { return { clinics: [], documents: [], versions: [], events: [], vectors: [] }; }
const active = (db, documentId) => db.versions.find((v) => v.document_id === documentId && v.status === 'active');
const event = (db, input, type, result, details = {}) => db.events.push({ event_id: `LAB029_TEST_evt_${db.events.length + 1}`, clinic_id: input.clinic_id, document_id: input.document_id, version_id: details.version_id || null, event_type: type, result, details: clone(details) });

export function prepararVersion(db, input) {
  for (const key of ['clinic_id','document_id','document_type','visibility','source_file']) required(input[key], key);
  if (!VISIBILITIES.includes(input.visibility) || (input.visibility === 'internal' && !input.access_level) || (input.visibility === 'public' && input.access_level)) throw new Error('document_invalid');
  if (!db.clinics.some((c) => c.clinic_id === input.clinic_id && c.status === 'active')) throw new Error('clinic_invalid');
  const existing = db.documents.find((d) => d.document_id === input.document_id);
  if (existing && existing.clinic_id !== input.clinic_id) throw new Error('cross_clinic_document');
  if (!existing) db.documents.push({ document_id: input.document_id, clinic_id: input.clinic_id, document_type: input.document_type, visibility: input.visibility, access_level: input.access_level || null, status: 'active' });
  const hash = sha256(input.content), current = active(db, input.document_id);
  if (current?.content_hash === hash) { event(db, input, 'no_changes', 'accepted', { version_id: current.version_id }); return { result: 'sin_cambios', version: clone(current) }; }
  const number = Math.max(0, ...db.versions.filter((v) => v.document_id === input.document_id).map((v) => v.version_number)) + 1;
  const version = { version_id: `LAB029_TEST_ver_${input.document_id}_${number}`, document_id: input.document_id, version_number: number, content_hash: hash, source_file: input.source_file, status: 'staging', validated_at: null, activated_at: null, superseded_at: null };
  db.versions.push(version); event(db, input, 'staged', 'accepted', { version_id: version.version_id }); return { result: 'staging', version: clone(version) };
}

export function completarCarga(db, input, { chunks = [], embedding_ok = true, qdrant_ok = true, validation_ok = true } = {}) {
  const version = db.versions.find((v) => v.version_id === input.version_id); if (!version || version.status !== 'staging') throw new Error('staging_not_found');
  const document = db.documents.find((d) => d.document_id === version.document_id);
  const fail = (phase) => { version.status = 'failed'; db.vectors = db.vectors.filter((v) => v.version_id !== version.version_id); event(db, { ...document }, 'failed', 'rejected', { version_id: version.version_id, phase }); return { result: 'failed', phase }; };
  if (!embedding_ok) return fail('embeddings'); if (!qdrant_ok) return fail('qdrant');
  const now = new Date().toISOString();
  db.vectors.push(...chunks.map((content, index) => ({ id: `${version.version_id}_${index}`, content, ...metadataQdrant({ ...document, ...version, status: 'active', updated_at: now }) })));
  if (!validation_ok || !chunks.length) return fail('validation');
  version.validated_at = now; event(db, document, 'validated', 'accepted', { version_id: version.version_id }); const previous = active(db, version.document_id); if (previous) { previous.status = 'superseded'; previous.superseded_at = now; }
  version.status = 'active'; version.activated_at = now; event(db, { ...document }, 'activated', 'accepted', { version_id: version.version_id }); return { result: 'active', version: clone(version) };
}

export function rollback(db, { clinic_id, document_id, target_version_id }) {
  const document = db.documents.find((d) => d.document_id === document_id && d.clinic_id === clinic_id); if (!document) throw new Error('document_not_found');
  const target = db.versions.find((v) => v.version_id === target_version_id && v.document_id === document_id && ['active','superseded'].includes(v.status) && v.validated_at); if (!target) throw new Error('rollback_target_invalid');
  const now = new Date().toISOString();
  const current = active(db, document_id); if (current && current !== target) { current.status = 'superseded'; current.superseded_at = now; }
  target.status = 'active'; target.activated_at = now; target.superseded_at = null; event(db, document, 'rollback', 'accepted', { version_id: target.version_id }); return clone(target);
}

export function recuperar(db, { clinic_id, visibility, access_levels = [] }) {
  filtroRecuperacion({ clinic_id, visibility, access_levels });
  return db.vectors.filter((v) => v.clinic_id === clinic_id && v.visibility === visibility && v.status === 'active' && (visibility === 'public' || access_levels.includes(v.access_level))).map(clone);
}
export function health({ postgres, qdrant }) { return { ok: postgres === true && qdrant === true, postgres: postgres === true ? 'PASS' : 'FAIL', qdrant: qdrant === true ? 'PASS' : 'FAIL' }; }
export function limpiarFixtures(db) { for (const key of ['events','vectors','versions','documents','clinics']) db[key] = db[key].filter((row) => !Object.values(row).some((value) => typeof value === 'string' && value.startsWith('LAB029_TEST'))); return Object.values(db).flat().filter((row) => Object.values(row).some((value) => typeof value === 'string' && value.startsWith('LAB029_TEST'))).length; }
