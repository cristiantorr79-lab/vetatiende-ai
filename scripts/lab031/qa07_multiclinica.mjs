import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CLINICS = Object.freeze({ a: 'lab031_qa_clinic_a', b: 'lab031_qa_clinic_b' });
export const CASE_IDS = Object.freeze(['L-01', 'L-02', 'M-01', 'M-02', 'C-01', 'F-01', 'F-02']);
export const MODES = Object.freeze(['PRECHECK_LOCAL', 'PREPARE_MANIFEST', 'INVENTORY', 'EXECUTE', 'CLEANUP', 'POSTCHECK']);
export const ADAPTER_METHODS = Object.freeze(['inventory', 'runCase', 'deleteExact', 'postcheck']);
const RESOURCE_GROUPS = Object.freeze(['calendar_event_ids', 'persistent_ids', 'data_table_resources', 'rag_resources', 'audits_events']);
const REQUIRED_REFS = Object.freeze([
  'docs/comercial/lab031/QA07_DISENO_AISLAMIENTO_MULTICLINICA.md',
  'docs/comercial/lab031/QA_VETATIENDE_MASTER.md',
  'docs/comercial/lab031/HANDOFF_CODEX.md',
  'scripts/lab029/validar_inventario_cleanup_lab029.mjs',
]);
const RUN_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{5,51}$/;
const CLINIC_RE = /^[a-z0-9][a-z0-9_-]{5,63}$/;

const fail = (reason) => { throw new Error(`LAB031_QA07_${reason}`); };
const cleanString = (value) => String(value ?? '').trim();
const now = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));

function assertNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 20) fail('NODE_INCOMPATIBLE');
}

function assertIds(runId, clinics = CLINICS) {
  if (!RUN_RE.test(cleanString(runId))) fail('RUN_ID_INVALIDO');
  if (!CLINIC_RE.test(cleanString(clinics.a)) || !CLINIC_RE.test(cleanString(clinics.b)) || clinics.a === clinics.b)
    fail('CLINICAS_INVALIDAS');
}

export function manifestPathFor(runtimeRoot, runId) {
  const root = resolve(cleanString(runtimeRoot));
  if (!root || !RUN_RE.test(cleanString(runId))) fail('RUTA_MANIFEST_INVALIDA');
  const path = resolve(root, 'private-storage', 'lab031', runId, 'manifest.json');
  const normal = path.split(sep).join('/').toLowerCase();
  if (!normal.includes('/private-storage/lab031/') || !normal.endsWith(`/${runId.toLowerCase()}/manifest.json`))
    fail('RUTA_MANIFEST_NO_PRIVADA');
  return path;
}

function scanHardcodedSecrets(source) {
  const findings = [];
  if (/https?:\/\/(?!example\.invalid)[^\s'"`]+/i.test(source)) findings.push('url');
  if (/(?:api[_-]?key|token|password|authorization)\s*[:=]\s*['"][^'"]{8,}['"]/i.test(source)) findings.push('secret_literal');
  if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(source)) findings.push('ip');
  return findings;
}

export async function precheckLocal({ runId, environment, runtimeRoot, repoRoot = process.cwd(), sourcePath = new URL(import.meta.url) } = {}) {
  assertNode();
  assertIds(runId);
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{1,31}$/.test(cleanString(environment))) fail('ENVIRONMENT_INVALIDO');
  const manifestPath = manifestPathFor(runtimeRoot, runId);
  const rel = relative(resolve(repoRoot), manifestPath).split(sep).join('/');
  if (!rel.startsWith('../') && !rel.startsWith('private-storage/lab031/')) fail('RUTA_MANIFEST_DENTRO_DE_GIT');
  const source = await readFile(sourcePath, 'utf8');
  if (scanHardcodedSecrets(source).length) fail('SECRETO_HARDCODEADO');
  for (const file of REQUIRED_REFS) {
    try { await readFile(resolve(repoRoot, file), 'utf8'); } catch { fail(`REFERENCIA_AUSENTE_${file.replaceAll('/', '_').toUpperCase()}`); }
  }
  return {
    ok: true,
    mode: 'PRECHECK_LOCAL',
    node: `>=20 (${process.versions.node.split('.')[0]})`,
    run_id_valid: true,
    clinics_valid: true,
    manifest_path_private: true,
    hardcoded_secrets_absent: true,
    required_references_present: true,
    cleanup_strategy_prepared: true,
    network_used: false,
    manifestPath,
  };
}

const emptyResources = () => Object.fromEntries(RESOURCE_GROUPS.map((key) => [key, []]));

export function createManifest({ runId, environment }) {
  assertIds(runId);
  return {
    schema_version: '1.0',
    run_id: runId,
    qa_prefix: `LAB031_QA_${runId}`,
    started_at: now(),
    environment,
    clinic_a: { clinic_id: CLINICS.a, baseline_snapshot_ref: null },
    clinic_b: { clinic_id: CLINICS.b, baseline_snapshot_ref: null },
    sessions: { a: [`LAB031_QA_${runId}_SESSION_A`], b: [`LAB031_QA_${runId}_SESSION_B`], shared_values: [] },
    resources_by_clinic: { a: emptyResources(), b: emptyResources() },
    calendar_event_ids: { a: [], b: [] },
    persistent_ids: { a: [], b: [] },
    data_table_resources: { a: [], b: [] },
    rag_resources: { a: [], b: [] },
    audits_events: { a: [], b: [] },
    cases: Object.fromEntries(CASE_IDS.map((id) => [id, { result: 'NOT_RUN', evidence_refs: [] }])),
    cleanup_expected: [],
    cleanup_actual: { inventory: 'NOT_RUN', comparison: 'NOT_RUN', delete: 'NOT_RUN', postcheck: 'NOT_RUN', residues_remaining: null },
    cleanup_strategy: { exact_ids_only: true, inventory_before_delete: true, postcheck_required: true, delete_clinics: false },
    status: 'PREPARED',
    global_result: 'NOT_VERIFIED',
  };
}

export function validateManifest(manifest) {
  if (manifest?.schema_version !== '1.0') fail('MANIFEST_SCHEMA_INVALIDO');
  assertIds(manifest.run_id, { a: manifest?.clinic_a?.clinic_id, b: manifest?.clinic_b?.clinic_id });
  if (manifest.clinic_a.clinic_id !== CLINICS.a || manifest.clinic_b.clinic_id !== CLINICS.b) fail('MANIFEST_CLINICAS_AJENAS');
  if (manifest.qa_prefix !== `LAB031_QA_${manifest.run_id}`) fail('MANIFEST_PREFIX_INVALIDO');
  if (!manifest.cleanup_strategy?.exact_ids_only || !manifest.cleanup_strategy?.inventory_before_delete ||
      !manifest.cleanup_strategy?.postcheck_required || manifest.cleanup_strategy?.delete_clinics !== false) fail('CLEANUP_NO_GARANTIZADO');
  if (!CASE_IDS.every((id) => manifest.cases?.[id])) fail('CASOS_INCOMPLETOS');
  for (const side of ['a', 'b']) for (const group of RESOURCE_GROUPS)
    if (!Array.isArray(manifest.resources_by_clinic?.[side]?.[group])) fail('RECURSOS_MANIFEST_INVALIDOS');
  if (!Array.isArray(manifest.cleanup_expected)) fail('CLEANUP_EXPECTED_INVALIDO');
  return true;
}

async function writeJsonAtomic(path, value, { exclusive = false } = {}) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { flag: 'w' });
  if (exclusive) {
    try { await readFile(path); fail('MANIFEST_YA_EXISTE'); } catch (error) { if (error?.message?.includes('MANIFEST_YA_EXISTE')) throw error; }
  }
  await writeFile(path, await readFile(temp), { flag: exclusive ? 'wx' : 'w' });
  return path;
}

export async function prepareManifest(options = {}) {
  const checked = await precheckLocal(options);
  const manifest = createManifest(options);
  validateManifest(manifest);
  await writeJsonAtomic(checked.manifestPath, manifest, { exclusive: true });
  return { ok: true, mode: 'PREPARE_MANIFEST', network_used: false, manifestPath: checked.manifestPath, manifest };
}

export function addResource(manifest, side, group, resource) {
  validateManifest(manifest);
  if (!['a', 'b'].includes(side) || !RESOURCE_GROUPS.includes(group)) fail('RECURSO_TIPO_INVALIDO');
  const clinicId = side === 'a' ? CLINICS.a : CLINICS.b;
  const id = cleanString(resource?.id);
  if (!id || resource?.clinic_id !== clinicId || resource?.deletable === false && group !== 'audits_events') fail('RECURSO_INVALIDO');
  const all = flattenExpected(manifest);
  if (all.some((item) => item.id === id && item.store === resource.store)) fail('RECURSO_DUPLICADO');
  const item = { id, clinic_id: clinicId, store: cleanString(resource.store), type: cleanString(resource.type || group) };
  if (!item.store) fail('RECURSO_STORE_INVALIDO');
  manifest.resources_by_clinic[side][group].push(item);
  manifest.cleanup_expected.push(clone(item));
  return item;
}

export function flattenExpected(manifest) {
  const out = [];
  for (const side of ['a', 'b']) for (const group of RESOURCE_GROUPS)
    for (const resource of manifest.resources_by_clinic?.[side]?.[group] || []) out.push(resource);
  return out;
}

const resourceKey = (item) => `${item.store}::${item.type}::${item.id}`;

export function validateInventory(manifest, inventory, { postcheck = false } = {}) {
  validateManifest(manifest);
  if (inventory?.run_id !== manifest.run_id || !Array.isArray(inventory?.resources)) fail('INVENTORY_INVALIDO');
  const expected = postcheck ? [] : flattenExpected(manifest);
  const expectedMap = new Map(expected.map((item) => [resourceKey(item), item]));
  if (expectedMap.size !== expected.length) fail('EXPECTED_DUPLICADO');
  const foundMap = new Map();
  for (const item of inventory.resources) {
    const key = resourceKey(item);
    if (foundMap.has(key)) fail('INVENTORY_CARDINALIDAD');
    foundMap.set(key, item);
    const expectedItem = expectedMap.get(key);
    if (!expectedItem) fail(postcheck ? 'POSTCHECK_RESIDUO' : 'INVENTORY_RECURSO_INESPERADO');
    if (item.clinic_id !== expectedItem.clinic_id || !Object.values(CLINICS).includes(item.clinic_id)) fail('INVENTORY_CLINICA_AJENA');
  }
  if (foundMap.size !== expectedMap.size || [...expectedMap.keys()].some((key) => !foundMap.has(key))) fail('INVENTORY_RECURSO_FALTANTE');
  return { ok: true, count: foundMap.size, postcheck };
}

async function loadManifest(path) {
  const manifest = JSON.parse(await readFile(resolve(path), 'utf8'));
  validateManifest(manifest);
  return manifest;
}

function requireAdapter(adapter, methods) {
  if (!adapter || methods.some((method) => typeof adapter[method] !== 'function')) fail('ADAPTADOR_SEGURO_REQUERIDO');
}

export async function inventoryMode({ manifestPath, adapter }) {
  requireAdapter(adapter, ['inventory']);
  const manifest = await loadManifest(manifestPath);
  const inventory = await adapter.inventory(clone(manifest));
  const result = validateInventory(manifest, inventory);
  return { ok: true, mode: 'INVENTORY', result, inventory };
}

export async function executeMode({ manifestPath, adapter, selectedCases = CASE_IDS, confirm = '' }) {
  if (confirm !== 'LAB031_QA_E2') fail('CONFIRMACION_E2_REQUERIDA');
  requireAdapter(adapter, ['runCase', 'inventory', 'deleteExact', 'postcheck']);
  const manifest = await loadManifest(manifestPath);
  if (!Array.isArray(selectedCases) || !selectedCases.length || selectedCases.some((id) => !CASE_IDS.includes(id))) fail('SELECCION_CASOS_INVALIDA');
  for (const id of selectedCases) {
    const output = await adapter.runCase(id, clone(manifest));
    if (!output || typeof output.ok !== 'boolean' || !Array.isArray(output.created_resources)) fail('ADAPTADOR_RESULTADO_CASO_INVALIDO');
    for (const resource of output.created_resources) {
      const { side, group, ...item } = resource || {};
      addResource(manifest, side, group, item);
    }
    manifest.cases[id] = { result: output?.ok ? 'PASS' : 'FAIL', evidence_refs: Array.isArray(output?.evidence_refs) ? output.evidence_refs : [] };
    if (!output?.ok) { manifest.global_result = 'FAIL'; manifest.status = 'FAILED'; break; }
    await writeJsonAtomic(resolve(manifestPath), manifest);
  }
  await writeJsonAtomic(resolve(manifestPath), manifest);
  return { ok: manifest.status !== 'FAILED', mode: 'EXECUTE', cases: manifest.cases };
}

export async function cleanupMode({ manifestPath, adapter, confirm = '' }) {
  if (confirm !== 'LAB031_QA_CLEANUP') fail('CONFIRMACION_CLEANUP_REQUERIDA');
  requireAdapter(adapter, ['inventory', 'deleteExact', 'postcheck']);
  const manifest = await loadManifest(manifestPath);
  const expected = flattenExpected(manifest);
  if (!expected.length || manifest.cleanup_expected.length !== expected.length) fail('CLEANUP_IDS_NO_INVENTARIADOS');
  const inventory = await adapter.inventory(clone(manifest));
  validateInventory(manifest, inventory);
  manifest.cleanup_actual.inventory = 'PASS';
  manifest.cleanup_actual.comparison = 'PASS';
  await adapter.deleteExact(clone(expected), clone(inventory), clone(manifest));
  manifest.cleanup_actual.delete = 'PASS';
  const post = await adapter.postcheck(clone(manifest));
  validateInventory(manifest, post, { postcheck: true });
  manifest.cleanup_actual.postcheck = 'PASS';
  manifest.cleanup_actual.residues_remaining = 0;
  manifest.status = 'COMPLETE';
  await writeJsonAtomic(resolve(manifestPath), manifest);
  return { ok: true, mode: 'CLEANUP', deleted: expected.length, residues_remaining: 0 };
}

export async function postcheckMode({ manifestPath, adapter }) {
  requireAdapter(adapter, ['postcheck']);
  const manifest = await loadManifest(manifestPath);
  const inventory = await adapter.postcheck(clone(manifest));
  return { ok: true, mode: 'POSTCHECK', result: validateInventory(manifest, inventory, { postcheck: true }) };
}

function parseArgs(argv) {
  const options = {};
  for (const arg of argv) if (arg.startsWith('--')) {
    const [key, ...rest] = arg.slice(2).split('='); options[key] = rest.join('=');
  }
  return options;
}

async function loadExternalAdapter(modulePath) {
  if (!modulePath) fail('ADAPTADOR_SEGURO_REQUERIDO');
  const loaded = await import(pathToFileURL(resolve(modulePath)).href);
  return loaded.default || loaded.adapter;
}

async function cli() {
  const args = parseArgs(process.argv.slice(2));
  const mode = cleanString(args.mode || '');
  if (!MODES.includes(mode)) fail('MODO_INVALIDO');
  const common = {
    runId: args['run-id'] || process.env.LAB031_RUN_ID,
    environment: args.environment || process.env.LAB031_ENVIRONMENT,
    runtimeRoot: args['runtime-root'] || process.env.LAB031_RUNTIME_ROOT,
    repoRoot: process.cwd(),
  };
  let output;
  if (mode === 'PRECHECK_LOCAL') output = await precheckLocal(common);
  else if (mode === 'PREPARE_MANIFEST') output = await prepareManifest(common);
  else {
    const manifestPath = args.manifest;
    const adapter = await loadExternalAdapter(args.adapter || process.env.LAB031_ADAPTER_MODULE);
    if (mode === 'INVENTORY') output = await inventoryMode({ manifestPath, adapter });
    if (mode === 'EXECUTE') output = await executeMode({ manifestPath, adapter, selectedCases: args.cases?.split(',') || CASE_IDS, confirm: args.confirm });
    if (mode === 'CLEANUP') output = await cleanupMode({ manifestPath, adapter, confirm: args.confirm });
    if (mode === 'POSTCHECK') output = await postcheckMode({ manifestPath, adapter });
  }
  const safeOutput = clone(output);
  if (safeOutput.manifestPath) safeOutput.manifestPath = '[PRIVATE_RUNTIME_PATH]';
  if (safeOutput.manifest) delete safeOutput.manifest;
  process.stdout.write(`${JSON.stringify(safeOutput, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    process.stderr.write(`${cleanString(error?.message).slice(0, 200)}\n`);
    process.exitCode = 1;
  });
}
