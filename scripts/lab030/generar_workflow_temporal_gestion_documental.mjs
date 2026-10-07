import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const sourcePath = path.join(repoRoot, 'n8n', 'workflows', 'comercial', 'lab029_gestion_rag_persistente.json');
const outputPath = path.join(scriptDir, 'workflow_temporal_gestion_documental.json');

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const sourceEntryName = 'Entrada interna gestión documental LAB-029';
const sourceEntry = source.nodes.find((node) => node.name === sourceEntryName);
const sourceConnection = source.connections[sourceEntryName];

if (!sourceEntry || sourceEntry.type !== 'n8n-nodes-base.executeWorkflowTrigger') {
  throw new Error('No se encontró la entrada interna esperada de LAB-029.');
}
if (!sourceConnection?.main?.[0]?.length) {
  throw new Error('La entrada interna de LAB-029 no tiene una conexión principal utilizable.');
}

const webhookName = 'Entrada temporal Gestión documental LAB-030';
const payloadName = 'Extraer payload temporal LAB-030';
const workflow = structuredClone(source);

workflow.name = 'LAB-030 TEMP driver Gestión documental';
workflow.active = false;
workflow.id = null;
workflow.versionId = 'lab030-temp-gestion-documental-v1';
workflow.nodes = workflow.nodes.filter((node) => node.name !== sourceEntryName);
workflow.nodes.unshift(
  {
    id: 'lab030-temp-management-webhook',
    name: webhookName,
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [0, 0],
    webhookId: 'lab030-qa-gestion-documental',
    parameters: {
      httpMethod: 'POST',
      path: 'lab030-qa-gestion-documental',
      authentication: 'headerAuth',
      responseMode: 'lastNode',
      options: {},
    },
    credentials: {
      httpHeaderAuth: {
        id: 'CONFIGURE_EXISTING_HEADER_AUTH',
        name: 'VetAtiende Internal Header Auth',
      },
    },
  },
  {
    id: 'lab030-temp-management-payload',
    name: payloadName,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [220, 0],
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "return $input.all().map((item) => ({ json: item.json?.body ?? item.json ?? {} }));",
    },
  },
);

delete workflow.connections[sourceEntryName];
workflow.connections[webhookName] = {
  main: [[{ node: payloadName, type: 'main', index: 0 }]],
};
workflow.connections[payloadName] = sourceConnection;

const codeNode = (id, name, position, jsCode) => ({
  id,
  name,
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position,
  parameters: { mode: 'runOnceForEachItem', jsCode },
});
const target = (node) => ({ node, type: 'main', index: 0 });
const setOutput = (from, output, to) => {
  workflow.connections[from].main[output] = [target(to)];
};

// LAB-029 enviaba errores de etapas diferentes a un único handler que
// referenciaba el nodo de éxito de staging. En la rama de error ese nodo puede
// no haberse ejecutado. Se separan fallos previos y posteriores al staging, y
// se repone explícitamente el contexto después de cada nodo que sustituye su
// input por una respuesta PostgreSQL/Qdrant.
const preStagingFailure = 'Detener error previo a staging LAB-030';
const stageCreateFailureContext = 'Restaurar contexto error creación staging LAB-030';
const markStageCreateFailed = 'Marcar creación staging failed PostgreSQL LAB-030';
const ingestFailureContext = 'Restaurar contexto error ingestión LAB-030';
const afterFailedPg = 'Restaurar contexto tras failed PostgreSQL LAB-030';
const afterFailedQdrant = 'Restaurar contexto tras failed Qdrant LAB-030';
const preRollbackFailure = 'Detener error previo a rollback LAB-030';
const rollbackFailureContext = 'Restaurar contexto error rollback LAB-030';
const afterRollbackPg = 'Restaurar contexto tras compensación PostgreSQL LAB-030';
const afterRollbackCurrent = 'Restaurar contexto tras compensación Qdrant actual LAB-030';

workflow.nodes.push(
  codeNode('lab030-pre-stage-error', preStagingFailure, [1760, 40],
    "throw new Error('lab030_ingest_error_before_staging_context');"),
  codeNode('lab030-stage-create-error-context', stageCreateFailureContext, [2420, 40],
    "const base=$('Decidir staging documental LAB-029').first().json;return {json:{...base,lab030_error:$json?.error??$json}};"),
  codeNode('lab030-ingest-error-context', ingestFailureContext, [3520, 20],
    "const base=$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json;return {json:{...base,lab030_error:$json?.error??$json}};"),
  codeNode('lab030-after-failed-pg', afterFailedPg, [3960, 20],
    "const base=$('Restaurar contexto error ingestión LAB-030').first().json;return {json:{...base,failed_pg_result:$json}};"),
  codeNode('lab030-after-failed-qdrant', afterFailedQdrant, [4400, 20],
    "const base=$('Restaurar contexto tras failed PostgreSQL LAB-030').first().json;return {json:{...base,failed_qdrant_result:$json}};"),
  codeNode('lab030-pre-rollback-error', preRollbackFailure, [1100, 500],
    "throw new Error('lab030_rollback_error_before_context');"),
  codeNode('lab030-rollback-error-context', rollbackFailureContext, [2200, 500],
    "const base=$('Restaurar contexto rollback LAB-029').first().json;return {json:{...base,lab030_error:$json?.error??$json}};"),
  codeNode('lab030-after-rollback-pg', afterRollbackPg, [2640, 500],
    "const base=$('Restaurar contexto error rollback LAB-030').first().json;return {json:{...base,rollback_pg_result:$json}};"),
  codeNode('lab030-after-rollback-current', afterRollbackCurrent, [3080, 500],
    "const base=$('Restaurar contexto tras compensación PostgreSQL LAB-030').first().json;return {json:{...base,rollback_qdrant_result:$json}};"),
);

const stageCreateFailedNode = structuredClone(
  workflow.nodes.find((node) => node.name === 'Marcar staging failed PostgreSQL LAB-029'),
);
stageCreateFailedNode.id = 'lab030-mark-stage-create-failed';
stageCreateFailedNode.name = markStageCreateFailed;
stageCreateFailedNode.position = [2640, 40];
stageCreateFailedNode.parameters.options.queryReplacement = '={{ [$json.version_id,$json.document_id] }}';
workflow.nodes.push(stageCreateFailedNode);

workflow.connections[preStagingFailure] = { main: [[]] };
workflow.connections[stageCreateFailureContext] = { main: [[target(markStageCreateFailed)]] };
workflow.connections[markStageCreateFailed] = { main: [[]] };
workflow.connections[ingestFailureContext] = { main: [[target('Marcar staging failed PostgreSQL LAB-029')]] };
workflow.connections[afterFailedPg] = { main: [[target('Marcar staging failed Qdrant LAB-029')]] };
workflow.connections[afterFailedQdrant] = { main: [[target('Restaurar versión anterior active Qdrant LAB-029')]] };
workflow.connections[preRollbackFailure] = { main: [[]] };
workflow.connections[rollbackFailureContext] = { main: [[target('Compensar rollback PostgreSQL LAB-029')]] };
workflow.connections[afterRollbackPg] = { main: [[target('Compensar rollback Qdrant actual active LAB-029')]] };
workflow.connections[afterRollbackCurrent] = { main: [[target('Compensar rollback Qdrant destino superseded LAB-029')]] };

for (const node of ['Asegurar documento nuevo PostgreSQL LAB-029', 'Consultar versión activa PostgreSQL LAB-029']) {
  setOutput(node, 1, preStagingFailure);
}
setOutput('Crear versión staging PostgreSQL LAB-029', 1, stageCreateFailureContext);
for (const node of ['Cargar staging en Qdrant LAB-029', 'Recuperar staging Qdrant LAB-029', 'Qdrant anterior a superseded LAB-029', 'Qdrant nueva versión a active LAB-029', 'Activar versión validada PostgreSQL LAB-029']) {
  setOutput(node, 1, ingestFailureContext);
}
setOutput('¿Staging recuperado válido LAB-029?', 1, ingestFailureContext);
setOutput('Marcar staging failed PostgreSQL LAB-029', 0, afterFailedPg);
setOutput('Marcar staging failed Qdrant LAB-029', 0, afterFailedQdrant);

setOutput('Leer versiones para rollback PostgreSQL LAB-029', 1, preRollbackFailure);
for (const node of ['Qdrant rollback actual a superseded LAB-029', 'Qdrant rollback destino a active LAB-029', 'Ejecutar rollback PostgreSQL LAB-029']) {
  setOutput(node, 1, rollbackFailureContext);
}
setOutput('Recuperar versión después del rollback Qdrant LAB-029', 1, rollbackFailureContext);
setOutput('¿Rollback recuperado válido LAB-029?', 1, rollbackFailureContext);
setOutput('Compensar rollback PostgreSQL LAB-029', 0, afterRollbackPg);
setOutput('Compensar rollback Qdrant actual active LAB-029', 0, afterRollbackCurrent);

const byName = new Map(workflow.nodes.map((node) => [node.name, node]));
byName.get('Marcar staging failed PostgreSQL LAB-029').parameters.options.queryReplacement =
  '={{ [$json.version_id,$json.document_id] }}';
for (const name of ['Marcar staging failed Qdrant LAB-029', 'Restaurar versión anterior active Qdrant LAB-029']) {
  const node = byName.get(name);
  node.parameters.url = node.parameters.url.replace(
    '$("Preparar contexto e IDs LAB-029").first().json.coleccion', '$json.coleccion');
  node.parameters.jsonBody = node.parameters.jsonBody
    .replaceAll("$('Preparar contexto e IDs LAB-029').first().json.clinic_id", '$json.clinic_id')
    .replaceAll("$('Preparar contexto e IDs LAB-029').first().json.document_id", '$json.document_id')
    .replaceAll("$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json.version_id", '$json.version_id')
    .replaceAll("$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json.active_version_id", '$json.active_version_id');
}
byName.get('Compensar rollback PostgreSQL LAB-029').parameters.options.queryReplacement =
  '={{ [$json.document_id,$json.active_version_id] }}';
for (const [name, versionKey] of [
  ['Compensar rollback Qdrant actual active LAB-029', 'active_version_id'],
  ['Compensar rollback Qdrant destino superseded LAB-029', 'target_version_id'],
]) {
  const node = byName.get(name);
  node.parameters.url = node.parameters.url.replace(
    '$("Preparar contexto e IDs LAB-029").first().json.coleccion', '$json.coleccion');
  node.parameters.jsonBody = node.parameters.jsonBody
    .replaceAll("$('Preparar contexto e IDs LAB-029').first().json.clinic_id", '$json.clinic_id')
    .replaceAll("$('Preparar contexto e IDs LAB-029').first().json.document_id", '$json.document_id')
    .replaceAll(`$('Restaurar contexto rollback LAB-029').first().json.${versionKey}`, `$json.${versionKey}`);
}

await writeFile(outputPath, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
console.log(`Generado ${path.relative(repoRoot, outputPath)} (${workflow.nodes.length} nodos, activo=${workflow.active}).`);
