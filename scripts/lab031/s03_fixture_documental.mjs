import { createHash, randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CLINIC_ID = 'clinica_piloto_001';
export const FIXTURE_TEXT = 'El código de inventario del material de demostración es QA-S03-742.';
export const EXPECTED_ANSWER = 'QA-S03-742';
export const EXECUTE_CONFIRM = 'LAB031_S03_EXECUTE';
export const CLEANUP_CONFIRM = 'LAB031_S03_CLEANUP';
export const BLOCKING_STATES = Object.freeze(['CREATION_IN_FLIGHT', 'CREATION_AMBIGUOUS', 'CLEANUP_QDRANT_IN_FLIGHT', 'CLEANUP_POSTGRES_IN_FLIGHT', 'CLEANUP_AMBIGUOUS']);

const fail = (reason) => { throw new Error(`S03_${reason}`); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const clone = (value) => structuredClone(value);
const exactKey = (item) => `${item.store}:${item.type}:${item.id}`;
const now = () => new Date().toISOString();

export function normalizeRunId(runId) {
  const value = String(runId || '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,40}$/.test(value)) fail('RUN_ID_INVALIDO');
  return value;
}

export function manifestPathFor(repoRoot, runId) {
  const rid = normalizeRunId(runId);
  return resolve(repoRoot, 'private-storage', 'lab031', 's03', rid, 'manifest.json');
}

export function createManifest({ runId, createdAt = now() }) {
  const rid = normalizeRunId(runId), prefix = `LAB031_S03_${rid}`;
  const manifest = {
    schema_version: '1.1', lab: 'LAB-031', test: 'S-03', run_id: rid, prefix,
    created_at: createdAt, updated_at: createdAt, status: 'PREPARED', clinic_id: CLINIC_ID,
    fixture: { synthetic: true, document_id: `${prefix}_DOC_INTERNAL`, document_type: 'administrative_demo', visibility: 'internal', access_level: 'veterinario', status: 'active', source_file: `${prefix}_internal.txt`, content_hash: sha256(FIXTURE_TEXT), content: FIXTURE_TEXT, query: '¿Cuál es el código de inventario del material de demostración?', expected_answer: EXPECTED_ANSWER },
    management: { action: 'ingest', contract: 'LAB-029', executed: false, output_contract: 'IDS_NOT_GUARANTEED' },
    resources: { before: [], created: [], existing: [], deleted: [], pending: [], after_cleanup: null },
    cleanup: { exact_ids_only: true, inventory_before_delete: true, qdrant_explicit: true, postcheck_required: true, status: 'NOT_RUN' },
    evidence: { precheck: 'NOT_RUN', creation: 'NOT_RUN', reconciliation: 'NOT_RUN', query: 'NOT_RUN', inventory_after: 'NOT_RUN', postcheck: 'NOT_RUN' },
    journal: [{ at: createdAt, state: 'PREPARED' }],
  };
  validateManifest(manifest); return manifest;
}

export function validateManifest(manifest) {
  if (manifest?.schema_version !== '1.1' || manifest?.lab !== 'LAB-031' || manifest?.test !== 'S-03') fail('MANIFEST_INVALIDO');
  const rid = normalizeRunId(manifest.run_id);
  if (manifest.prefix !== `LAB031_S03_${rid}` || manifest.clinic_id !== CLINIC_ID) fail('MANIFEST_IDENTIDAD_INVALIDA');
  const f = manifest.fixture || {};
  if (!f.synthetic || f.document_id !== `${manifest.prefix}_DOC_INTERNAL` || f.visibility !== 'internal' || f.status !== 'active') fail('FIXTURE_INVALIDO');
  if (f.content !== FIXTURE_TEXT || f.expected_answer !== EXPECTED_ANSWER || f.content_hash !== sha256(FIXTURE_TEXT)) fail('ORACULO_INVALIDO');
  if (!manifest.cleanup?.exact_ids_only || !manifest.cleanup?.inventory_before_delete || !manifest.cleanup?.qdrant_explicit || !manifest.cleanup?.postcheck_required) fail('CLEANUP_INSEGURO');
  for (const name of ['before', 'created', 'existing', 'deleted', 'pending']) if (!Array.isArray(manifest.resources?.[name])) fail('RECURSOS_INVALIDOS');
  if (!Array.isArray(manifest.journal) || !manifest.status) fail('ESTADO_INVALIDO');
  return true;
}

function validatePath(path, manifest) {
  const full = resolve(path), root = resolve(full, '..', '..', '..', '..', '..'), rel = relative(root, full).split(sep).join('/');
  if (rel !== `private-storage/lab031/s03/${manifest.run_id}/manifest.json`) fail('RUTA_MANIFEST_INVALIDA');
  return full;
}

export async function writeManifestAtomic(path, manifest, { writeImpl = writeFile, renameImpl = rename, chmodImpl = chmod } = {}) {
  validateManifest(manifest); const full = validatePath(path, manifest), temp = `${full}.${randomUUID()}.tmp`;
  manifest.updated_at = now();
  await writeImpl(temp, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  await chmodImpl(temp, 0o600); await renameImpl(temp, full); await chmodImpl(full, 0o600); return full;
}

export async function loadManifest(path) {
  const full = resolve(path); let stat;
  try { stat = await lstat(full); } catch { fail('MANIFEST_INEXISTENTE'); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail('MANIFEST_INVALIDO');
  let manifest; try { manifest = JSON.parse(await readFile(full, 'utf8')); } catch { fail('MANIFEST_INVALIDO'); }
  validateManifest(manifest); validatePath(full, manifest); return manifest;
}

async function persist(path, manifest, state, detail = {}, io) {
  manifest.status = state; manifest.journal.push({ at: now(), state, ...detail });
  await writeManifestAtomic(path, manifest, io); return manifest;
}

function validateResources(manifest, resources, { allowEmpty = false, requireComplete = true } = {}) {
  if (!Array.isArray(resources) || (!allowEmpty && resources.length === 0)) fail('INVENTARIO_INCOMPLETO');
  const seen = new Set();
  for (const item of resources) {
    if (!item?.id || item.clinic_id !== CLINIC_ID || !['postgres', 'qdrant'].includes(item.store)) fail('RECURSO_AJENO');
    if (item.store === 'qdrant' && (item.collection !== 'vetatiende_interno' || item.type !== 'point')) fail('COLECCION_AJENA');
    if (item.store === 'postgres' && !['document', 'version', 'event'].includes(item.type)) fail('TIPO_AJENO');
    const key = exactKey(item); if (seen.has(key)) fail('RECURSO_DUPLICADO'); seen.add(key);
  }
  if (requireComplete) {
    const types = new Set(resources.map((item) => `${item.store}:${item.type}`));
    for (const required of ['postgres:document', 'postgres:version', 'qdrant:point']) if (!types.has(required)) fail('INVENTARIO_INCOMPLETO');
    if (!resources.some((item) => item.type === 'document' && item.id === manifest.fixture.document_id)) fail('DOCUMENTO_NO_CORRESPONDE');
  }
  return resources.map(clone);
}

const keys = (items) => new Set(items.map(exactKey));
function isSubset(items, expected) { const allowed = keys(expected); return items.every((item) => allowed.has(exactKey(item))); }

export async function prepareManifest({ repoRoot = process.cwd(), runId }) {
  const manifest = createManifest({ runId }), path = manifestPathFor(repoRoot, runId);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  try { await lstat(path); fail('MANIFEST_YA_EXISTE'); } catch (error) { if (error?.message?.includes('MANIFEST_YA_EXISTE')) throw error; }
  await writeManifestAtomic(path, manifest); return { ok: true, network_used: false, manifest_path: path };
}

async function markAmbiguous(path, manifest, state, cause, io) {
  try { await persist(path, manifest, state, { cause: String(cause?.message || cause || 'unknown').slice(0, 120) }, io); } catch { /* IN_FLIGHT durable conserva el bloqueo */ }
}

export async function runPreparedS03({ manifestPath, adapter, confirm = '', io }) {
  const manifest = await loadManifest(manifestPath);
  if (BLOCKING_STATES.includes(manifest.status)) fail('RECONCILIACION_REQUERIDA');
  if (!['PREPARED', 'RECONCILED_EMPTY'].includes(manifest.status)) fail('ESTADO_NO_EJECUTABLE');
  if (confirm !== EXECUTE_CONFIRM) fail('AUTORIZACION_EJECUCION_REQUERIDA');
  for (const method of ['inventoryExact', 'createViaManagement', 'queryInternal']) if (typeof adapter?.[method] !== 'function') fail('ADAPTADOR_INCOMPLETO');
  await persist(manifestPath, manifest, 'PRECHECK_IN_FLIGHT', {}, io);
  const before = await adapter.inventoryExact(clone(manifest), { mode: 'PRE_CREATE' });
  if (!Array.isArray(before) || before.length !== 0) { await persist(manifestPath, manifest, 'BLOCKED_PREEXISTING', {}, io); fail('PRECHECK_NO_VACIO'); }
  manifest.resources.before = []; manifest.evidence.precheck = 'PASS'; await persist(manifestPath, manifest, 'PRECHECK_PASS', {}, io);
  await persist(manifestPath, manifest, 'CREATION_IN_FLIGHT', {}, io);
  try { await adapter.createViaManagement(clone(manifest)); }
  catch (error) { await markAmbiguous(manifestPath, manifest, 'CREATION_AMBIGUOUS', error, io); throw error; }
  let created;
  try {
    created = validateResources(manifest, await adapter.inventoryExact(clone(manifest), { mode: 'POST_CREATE' }));
    manifest.resources.created = created; manifest.resources.existing = created; manifest.resources.pending = created;
    manifest.management.executed = true; manifest.evidence.creation = 'PASS'; manifest.evidence.inventory_after = 'PASS';
    await persist(manifestPath, manifest, 'CREATED_INVENTORIED', {}, io);
  } catch (error) { await markAmbiguous(manifestPath, manifest, 'CREATION_AMBIGUOUS', error, io); throw error; }
  const response = await adapter.queryInternal(clone(manifest)), text = String(response?.answer || response?.message || '');
  if (response?.http_status !== 200 || !text.includes(EXPECTED_ANSWER) || response?.fallback === true) fail('ORACULO_NO_CUMPLIDO');
  const sources = Array.isArray(response?.sources) ? response.sources : [];
  const attributedDocument = response?.document_id === manifest.fixture.document_id || sources.includes(manifest.fixture.document_id);
  const activeVersions = created.filter((x) => x.type === 'version' && x.status === 'active');
  const attributedVersion = response?.version_id
    ? activeVersions.some((x) => x.id === response.version_id)
    : activeVersions.length === 1;
  if (response?.clinic_id !== CLINIC_ID || !attributedDocument || !attributedVersion) fail('ATRIBUCION_INVALIDA');
  manifest.evidence.query = 'PASS'; await persist(manifestPath, manifest, 'EXECUTED', {}, io);
  return { ok: true, manifest: clone(manifest), answer_verified: true };
}

export async function reconcileCreation({ manifestPath, adapter, io }) {
  const manifest = await loadManifest(manifestPath);
  if (!['CREATION_IN_FLIGHT', 'CREATION_AMBIGUOUS'].includes(manifest.status)) fail('RECONCILIACION_NO_REQUERIDA');
  if (typeof adapter?.inventoryExact !== 'function') fail('ADAPTADOR_INCOMPLETO');
  const observed = await adapter.inventoryExact(clone(manifest), { mode: 'RECONCILE_CREATION' });
  if (!Array.isArray(observed)) fail('INVENTARIO_INCOMPLETO');
  if (observed.length === 0) { manifest.evidence.reconciliation = 'PASS_EMPTY'; await persist(manifestPath, manifest, 'RECONCILED_EMPTY', {}, io); return { ok: true, outcome: 'EMPTY' }; }
  const created = validateResources(manifest, observed);
  manifest.resources.created = created; manifest.resources.existing = created; manifest.resources.pending = created; manifest.evidence.reconciliation = 'PASS_CREATED';
  await persist(manifestPath, manifest, 'CREATED_INVENTORIED', {}, io); return { ok: true, outcome: 'CREATED', resources: created.length };
}

export async function cleanupPreparedS03({ manifestPath, adapter, confirm = '', io }) {
  const manifest = await loadManifest(manifestPath);
  if (confirm !== CLEANUP_CONFIRM) fail('AUTORIZACION_CLEANUP_REQUERIDA');
  if (['CREATION_IN_FLIGHT', 'CREATION_AMBIGUOUS'].includes(manifest.status)) fail('RECONCILIACION_REQUERIDA');
  for (const method of ['inventoryExact', 'deleteExactPostgres', 'deleteExactQdrant', 'postcheckExact']) if (typeof adapter?.[method] !== 'function') fail('ADAPTADOR_CLEANUP_INCOMPLETO');
  const expected = validateResources(manifest, manifest.resources.created);
  const current = validateResources(manifest, await adapter.inventoryExact(clone(manifest), { mode: 'RECOVERY_CLEANUP' }), { allowEmpty: true, requireComplete: false });
  if (!isSubset(current, expected)) fail('CLEANUP_INVENTARIO_AMBIGUO');
  const currentKeys = keys(current); manifest.resources.existing = current; manifest.resources.deleted = expected.filter((x) => !currentKeys.has(exactKey(x))); manifest.resources.pending = current;
  await persist(manifestPath, manifest, 'CLEANUP_INVENTORIED', {}, io);
  const qdrant = current.filter((x) => x.store === 'qdrant');
  if (qdrant.length) {
    await persist(manifestPath, manifest, 'CLEANUP_QDRANT_IN_FLIGHT', {}, io);
    try { await adapter.deleteExactQdrant(clone(qdrant), clone(manifest)); } catch (error) { await markAmbiguous(manifestPath, manifest, 'CLEANUP_AMBIGUOUS', error, io); throw error; }
    manifest.resources.deleted.push(...qdrant); manifest.resources.pending = manifest.resources.pending.filter((x) => x.store !== 'qdrant');
    try { await persist(manifestPath, manifest, 'CLEANUP_QDRANT_DONE', {}, io); } catch (error) { await markAmbiguous(manifestPath, manifest, 'CLEANUP_AMBIGUOUS', error, io); throw error; }
  }
  const refreshed = validateResources(manifest, await adapter.inventoryExact(clone(manifest), { mode: 'RECOVERY_CLEANUP' }), { allowEmpty: true, requireComplete: false });
  if (!isSubset(refreshed, expected) || refreshed.some((x) => x.store === 'qdrant')) fail('CLEANUP_RECONCILIACION_INVALIDA');
  const postgres = refreshed.filter((x) => x.store === 'postgres');
  if (postgres.length) {
    await persist(manifestPath, manifest, 'CLEANUP_POSTGRES_IN_FLIGHT', {}, io);
    try { await adapter.deleteExactPostgres(clone(postgres), clone(manifest)); } catch (error) { await markAmbiguous(manifestPath, manifest, 'CLEANUP_AMBIGUOUS', error, io); throw error; }
    manifest.resources.deleted = expected; manifest.resources.pending = [];
    try { await persist(manifestPath, manifest, 'CLEANUP_POSTGRES_DONE', {}, io); } catch (error) { await markAmbiguous(manifestPath, manifest, 'CLEANUP_AMBIGUOUS', error, io); throw error; }
  }
  const remaining = await adapter.postcheckExact(clone(manifest));
  if (!Array.isArray(remaining) || remaining.length !== 0) { await persist(manifestPath, manifest, 'CLEANUP_POSTCHECK_FAILED', {}, io); fail('POSTCHECK_CON_RESIDUOS'); }
  manifest.resources.after_cleanup = []; manifest.cleanup.status = 'PASS'; manifest.evidence.postcheck = 'PASS'; await persist(manifestPath, manifest, 'COMPLETE', {}, io);
  return { ok: true, manifest: clone(manifest), deleted: expected.length, residues: 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const value = (name) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3);
  if (!process.argv.includes('--prepare')) fail('SOLO_PREPARACION_LOCAL_PERMITIDA');
  const result = await prepareManifest({ runId: value('run-id') }); process.stdout.write(`${JSON.stringify({ ...result, manifest_path: '[PRIVATE_RUNTIME_PATH]' }, null, 2)}\n`);
}
