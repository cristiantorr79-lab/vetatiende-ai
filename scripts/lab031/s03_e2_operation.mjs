import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createReadonlyInventoryAdapter } from './s03_inventory_readonly.mjs';
import { createQdrantReadonlyReader, createPostgresReadonlyReader } from './s03_readers_e2.mjs';
import { createPsqlInventoryExecutor, postgresConnectionFromEnvironment } from './s03_postgres_executor.mjs';
import { createExactCleanupTransports } from './s03_cleanup_transports.mjs';
import { createS03IntegrationAdapter } from './s03_integration_adapter.mjs';
import { CLEANUP_CONFIRM, EXECUTE_CONFIRM, EXPECTED_ANSWER, cleanupPreparedS03, loadManifest, manifestPathFor, reconcileCreation, runPreparedS03 } from './s03_fixture_documental.mjs';

const fail = (reason) => { throw new Error(`S03_E2_${reason}`); };
const RUN_ID = 'PRECHECK_20261104A';
const MANAGEMENT_ID = 's0NoyEyVtO9AgJUk';
const CONFIRM = 'LAB031_S03_E2_EXECUTE_ONCE';
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
const clone = (value) => structuredClone(value);

function requireEnvironment(env) {
  const required = ['LAB031_S03_E2_CONFIRM','LAB031_S03_QDRANT_URL','LAB031_S03_QDRANT_API_KEY','LAB031_INTERNAL_BASE_URL','LAB031_INTERNAL_WEBHOOK_PATH','LAB031_INTERNAL_HEADER_NAME','LAB031_INTERNAL_HEADER_VALUE'];
  if (required.some((name) => !String(env[name] || '').trim())) fail('CONFIGURACION_INCOMPLETA');
  if (env.LAB031_S03_E2_CONFIRM !== CONFIRM) fail('CONFIRMACION_REQUERIDA');
  if (env.LAB031_S03_DRIVER_WORKFLOW_ID && (!ID.test(env.LAB031_S03_DRIVER_WORKFLOW_ID) || env.LAB031_S03_DRIVER_WORKFLOW_ID === MANAGEMENT_ID)) fail('DRIVER_ID_INVALIDO');
  postgresConnectionFromEnvironment(env);
}

function commandRunner({ command, args, options = {} }) {
  const result = spawnSync(command, args, { shell: false, windowsHide: true, encoding: 'utf8', ...options });
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '', error: result.error, signal: result.signal };
}

function successful(result, reason) {
  if (result?.error || result?.signal || result?.status !== 0) fail(reason);
  return result;
}

function docker(run, args, { allowFailure = false } = {}) {
  const result = run({ command: 'docker', args: ['compose', ...args], options: { cwd: '/opt/vetatiende-ab' } });
  if (!allowFailure) successful(result, 'N8N_CLI_ERROR');
  return result;
}

export async function prepareRuntimeWorkflow({ driverId, directory }) {
  const source = JSON.parse(await readFile(new URL('./s03_management_invoker_qa.json', import.meta.url), 'utf8'));
  source.id = driverId; source.active = false;
  const setNode = source.nodes.find((node) => node.name === 'Configurar gates bloqueados S-03');
  const workflowAssignment = setNode?.parameters?.assignments?.assignments?.find((item) => item.name === 'management_workflow_id');
  if (!workflowAssignment) fail('DRIVER_CONTRATO_INVALIDO');
  workflowAssignment.value = MANAGEMENT_ID;
  const gate = source.nodes.find((node) => node.name === 'Validar evidencia y autorización S-03');
  if (!gate?.parameters?.jsCode?.includes('authorized:false')) fail('DRIVER_CONTRATO_INVALIDO');
  gate.parameters.jsCode = gate.parameters.jsCode.replace('authorized:false', 'authorized:true');
  source.connections['¿Gates completos S-03?'].main[0] = [{ node: 'Invocar Management LAB-029 S-03', type: 'main', index: 0 }];
  const path = join(directory, 'runtime-driver.json'); await writeFile(path, `${JSON.stringify([source])}\n`, { mode: 0o600 }); return path;
}

async function invokeManagementOnce({ env, run = commandRunner }) {
  const directory = await mkdtemp(join(tmpdir(), 'lab031-s03-'));
  let driverId = env.LAB031_S03_DRIVER_WORKFLOW_ID;
  const containerAll = `/tmp/lab031-s03-${process.pid}-all.json`;
  const containerBackup = `/tmp/lab031-s03-${process.pid}-backup.json`;
  const containerRuntime = `/tmp/lab031-s03-${process.pid}-runtime.json`;
  let exported = false;
  try {
    const containerId = successful(run({ command:'docker', args:['compose','ps','-q','n8n'], options:{ cwd:'/opt/vetatiende-ab' } }), 'N8N_CONTENEDOR_AUSENTE').stdout.trim();
    if (!containerId) fail('N8N_CONTENEDOR_AUSENTE');
    if (!driverId) {
      docker(run, ['exec','-T','n8n','n8n','export:workflow','--all',`--output=${containerAll}`]);
      const allPath = join(directory,'all-workflows.json');
      successful(run({ command:'docker', args:['cp',`${containerId}:${containerAll}`,allPath] }), 'DRIVER_DISCOVERY_ERROR');
      const all = JSON.parse(await readFile(allPath,'utf8'));
      const matches = all.filter((item) => item?.name === 'LAB-031 TEMP QA - Invocador Management S-03 BLOQUEADO' && item?.active === false);
      if (matches.length !== 1 || !ID.test(String(matches[0]?.id || '')) || matches[0].id === MANAGEMENT_ID) fail('DRIVER_NO_UNIVOCO');
      driverId = matches[0].id;
    }
    docker(run, ['exec','-T','n8n','n8n','export:workflow',`--id=${driverId}`,`--output=${containerBackup}`]); exported = true;
    const runtimePath = await prepareRuntimeWorkflow({ driverId, directory });
    successful(run({ command:'docker', args:['cp',runtimePath,`${containerId}:${containerRuntime}`] }), 'DRIVER_COPY_ERROR');
    docker(run, ['exec','-T','n8n','n8n','import:workflow',`--input=${containerRuntime}`]);
    const execution = docker(run, ['exec','-T','n8n','n8n','execute',`--id=${driverId}`], { allowFailure: true });
    return { ok: execution.status === 0, ambiguous: execution.status !== 0 };
  } finally {
    if (exported) docker(run, ['exec','-T','n8n','n8n','import:workflow',`--input=${containerBackup}`]);
    docker(run, ['exec','-T','n8n','rm','-f',containerAll,containerBackup,containerRuntime], { allowFailure: true });
    await rm(directory, { recursive: true, force: true });
  }
}

export function createPostgresDelete({ connection, run = commandRunner, processEnv = process.env }) {
  return async ({ clinic_id: clinicId, document_id: documentId, resources }) => {
    if (!ID.test(clinicId) || !ID.test(documentId)) fail('POSTGRES_IDENTIDAD_INVALIDA');
    const byType = (type) => resources.filter((item) => item.type === type).map((item) => item.id);
    const events = byType('event'), versions = byType('version'), documents = byType('document');
    if (documents.length !== 1 || documents[0] !== documentId || !events.length || !versions.length) fail('POSTGRES_RECURSOS_INCOMPLETOS');
    const sql = `BEGIN; SET LOCAL statement_timeout='30000ms';
WITH ids AS (SELECT jsonb_array_elements_text(:'event_ids'::jsonb) id), gone AS (DELETE FROM vetatiende_documental.document_events e USING ids WHERE e.event_id=ids.id AND e.clinic_id=:'clinic_id' AND e.document_id=:'document_id' RETURNING e.event_id) SELECT json_agg(event_id)::text FROM gone;
WITH ids AS (SELECT jsonb_array_elements_text(:'version_ids'::jsonb) id), gone AS (DELETE FROM vetatiende_documental.document_versions v USING ids WHERE v.version_id=ids.id AND v.document_id=:'document_id' RETURNING v.version_id) SELECT json_agg(version_id)::text FROM gone;
DELETE FROM vetatiende_documental.documents WHERE clinic_id=:'clinic_id' AND document_id=:'document_id' RETURNING json_build_array(document_id)::text;
COMMIT;`;
    const args = ['-X','--no-psqlrc','-q','-A','-t','-v','ON_ERROR_STOP=1','-v',`clinic_id=${clinicId}`,'-v',`document_id=${documentId}`,'-v',`event_ids=${JSON.stringify(events)}`,'-v',`version_ids=${JSON.stringify(versions)}`];
    const result = successful(run({ command:'psql', args, options:{ shell:false,encoding:'utf8',timeout:45000,env:{...processEnv,PGDATABASE:connection.value},input:`${sql}\n` } }), 'POSTGRES_DELETE_ERROR');
    const arrays = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { try { return JSON.parse(line); } catch { fail('POSTGRES_DELETE_AMBIGUO'); } });
    const deleted = arrays.flat().map(String);
    const expected = [...events,...versions,...documents];
    if (deleted.length !== expected.length || expected.some((id) => !deleted.includes(id))) fail('POSTGRES_DELETE_DIFIERE');
    return { ok:true, deleted: resources.map((item) => `postgres:${item.type}:${item.id}`) };
  };
}

export function createQdrantDelete({ env, fetchImpl = globalThis.fetch }) {
  return async ({ collection, point_ids: pointIds }) => {
    if (collection !== 'vetatiende_interno' || !Array.isArray(pointIds) || !pointIds.length) fail('QDRANT_DELETE_INVALIDO');
    const root = new URL(env.LAB031_S03_QDRANT_URL); root.pathname = root.pathname.replace(/\/$/, '');
    let response; try { response = await fetchImpl(`${root.href.replace(/\/$/,'')}/collections/vetatiende_interno/points/delete?wait=true`, { method:'POST', headers:{'content-type':'application/json','api-key':env.LAB031_S03_QDRANT_API_KEY}, body:JSON.stringify({points:pointIds}), signal:AbortSignal.timeout(30000) }); } catch { fail('QDRANT_DELETE_ERROR'); }
    if (!response?.ok) fail('QDRANT_DELETE_ERROR');
    const json = await response.json(); if (json?.status !== 'ok') fail('QDRANT_DELETE_AMBIGUO');
    return { ok:true, deleted:pointIds.map((id) => `qdrant:point:${id}`) };
  };
}

export async function executeS03E2({ repoRoot = process.cwd(), env = process.env, run = commandRunner, fetchImpl = globalThis.fetch } = {}) {
  requireEnvironment(env);
  const manifestPath = manifestPathFor(resolve(repoRoot), RUN_ID); const initial = await loadManifest(manifestPath);
  const connection = postgresConnectionFromEnvironment(env);
  const pgExecutor = createPsqlInventoryExecutor({ runProcess: run, processEnv: env });
  const postgresRead = createPostgresReadonlyReader({ executor:pgExecutor, connection, timeoutMs:env.LAB031_S03_POSTGRES_TIMEOUT_MS });
  const qdrantScroll = createQdrantReadonlyReader({ fetchImpl, baseUrl:env.LAB031_S03_QDRANT_URL, apiKey:env.LAB031_S03_QDRANT_API_KEY, timeoutMs:env.LAB031_S03_QDRANT_TIMEOUT_MS });
  const inventoryAdapter = createReadonlyInventoryAdapter({ postgresRead, qdrantScroll });
  const authorizationEvidenceProvider = async ({ operation }) => ({ run_id:initial.run_id,clinic_id:initial.clinic_id,document_id:initial.fixture.document_id,operation,confirm:env.LAB031_S03_E2_CONFIRM });
  const verifyExternalAuthorization = async (e, expected) => ({ verified:e?.confirm===CONFIRM,...expected });
  const cleanup = createExactCleanupTransports({ qdrantDeletePoints:createQdrantDelete({env,fetchImpl}), postgresDeleteOrdered:createPostgresDelete({connection,run,processEnv:env}), authorizationEvidenceProvider, verifyExternalAuthorization });
  const capability = cleanup.capability(); if (!capability.qdrant_exact || !capability.postgres_exact || !capability.external_authorization) fail('CLEANUP_NO_DISPONIBLE');
  const adapter = createS03IntegrationAdapter({ env, fetchImpl, inventoryAdapter, managementInvoke:async()=>invokeManagementOnce({env,run}), deleteExactQdrant:cleanup.deleteExactQdrant, deleteExactPostgres:cleanup.deleteExactPostgres });
  let creation, queryError;
  try { creation = await runPreparedS03({ manifestPath, adapter, confirm:EXECUTE_CONFIRM }); }
  catch (error) {
    queryError = error;
    const ambiguous = await loadManifest(manifestPath);
    if (['CREATION_IN_FLIGHT','CREATION_AMBIGUOUS'].includes(ambiguous.status)) {
      const recovered = await reconcileCreation({ manifestPath, adapter });
      if (recovered.outcome === 'CREATED') {
        const reconciled = await loadManifest(manifestPath); const response = await adapter.queryInternal(reconciled);
        const text = String(response?.answer || response?.message || '');
        const attributedDocument = Array.isArray(response?.sources) && response.sources.includes(reconciled.fixture.document_id);
        const activeVersions = reconciled.resources.created.filter((item) => item.store === 'postgres' && item.type === 'version' && item.status === 'active');
        if (response?.http_status === 200 && response?.fallback !== true && response?.clinic_id === ambiguous.clinic_id && text.includes(EXPECTED_ANSWER) && attributedDocument && activeVersions.length === 1) {
          creation = { answer_verified:true, recovered_after_ambiguous:true }; queryError = undefined;
        }
      }
    }
  }
  const after = await loadManifest(manifestPath);
  if (!after.resources.created.length) throw queryError || new Error('S03_E2_CREACION_NO_ACREDITADA');
  let cleanupResult;
  try { cleanupResult = await cleanupPreparedS03({ manifestPath, adapter, confirm:CLEANUP_CONFIRM }); }
  catch (cleanupError) { throw new AggregateError([queryError,cleanupError].filter(Boolean), 'S03_E2_CLEANUP_FAIL'); }
  if (queryError) throw queryError;
  return { ok:true, creation:'PASS', query:'PASS', cleanup:cleanupResult.ok?'PASS':'FAIL', residues:cleanupResult.residues, answer_verified:creation.answer_verified, e2:true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { const result = await executeS03E2({ repoRoot:process.cwd() }); process.stdout.write(`${JSON.stringify(result)}\n`); }
  catch (error) { process.stderr.write(`${String(error?.message || 'S03_E2_ERROR').replace(/[^A-Z0-9_ -]/gi,'').slice(0,160)}\n`); process.exitCode=1; }
}
