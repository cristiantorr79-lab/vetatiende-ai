import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { idsCleanupExactos, validarInventarioCleanup } from './validar_inventario_cleanup_lab029.mjs';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const list = values => values.map(quote).join(',');
const conditions = (keyName, values) => values.map(keyValue => ({ keyName, keyValue }));

export async function crearWorkflowCleanupExecute({ manifestPath, snapshotPath }) {
  const manifestFile = resolve(manifestPath), snapshotFile = resolve(snapshotPath);
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const rawSnapshot = await readFile(snapshotFile, 'utf8');
  const snapshot = JSON.parse(rawSnapshot);
  const expected = idsCleanupExactos(manifest);
  if (snapshot.prefix !== expected.prefix || !snapshot.inventory) throw new Error('cleanup_snapshot_run_invalido');
  const inventory = snapshot.inventory;
  inventory.runtime ??= { temporary_files: [join(dirname(manifestFile), 'payloads.json')] };
  const checked = validarInventarioCleanup(manifest, inventory);
  const required = { clinics: 2, documents: 3, versions: 5, events: 16, qdrant_public: 15,
    qdrant_internal: 1, users: 2, permissions: 2, audits: 46, temporary_files: 1 };
  if (JSON.stringify(checked.counts) !== JSON.stringify(required)) throw new Error('cleanup_snapshot_counts_no_aprobados');
  if (inventory.runtime.temporary_files.some(file => !String(file).replaceAll('\\','/').endsWith('/payloads.json')))
    throw new Error('cleanup_snapshot_runtime_ajeno');
  const seal = sha256(rawSnapshot);
  const verifier = JSON.parse(await readFile(join(dirname(manifestFile), 'workflow_verificador_runtime.json'), 'utf8'));
  const headerCredentials = verifier.nodes.find(node => node.type === 'n8n-nodes-base.webhook')?.credentials;
  if (!headerCredentials?.httpHeaderAuth?.id) throw new Error('credencial_header_runtime_ausente');
  const pgCred = { postgres: { id: 'vpbKJO7irGofixTr', name: 'Postgres account' } };
  const qCred = { qdrantApi: { id: 'jHiRqgWleLSSH6GM', name: 'VetAtiende Qdrant Comercial' } };
  const prefix = expected.prefix, lower = expected.lower;
  const events = inventory.postgres.events.map(row => row.event_id);
  const versions = inventory.postgres.versions.map(row => row.version_id);
  const documents = inventory.postgres.documents.map(row => row.document_id);
  const clinics = inventory.postgres.clinics.map(row => row.clinic_id);
  const publicPoints = inventory.qdrant.vetatiende_publico.map(row => row.id);
  const internalPoints = inventory.qdrant.vetatiende_interno.map(row => row.id);
  const audits = inventory.data_tables.audits.map(row => row.audit_id);
  const nodes = [], connections = {};
  const add = node => { nodes.push(node); return node.name; };
  const edge = (from, to) => { connections[from] = { main: [[{ node: to, type: 'main', index: 0 }]] }; };
  const hook = add({ id:`${prefix}_cleanup_hook`, name:'Entrada cleanup_execute LAB-029', type:'n8n-nodes-base.webhook', typeVersion:2,
    position:[0,0], webhookId:`${prefix}_cleanup_hook`, credentials:headerCredentials,
    parameters:{httpMethod:'POST',path:`${lower.replaceAll('_','-')}-cleanup-execute`,authentication:'headerAuth',responseMode:'responseNode',options:{}} });
  const guard = add({ id:`${prefix}_cleanup_guard`, name:'Validar snapshot sellado cleanup LAB-029', type:'n8n-nodes-base.code', typeVersion:2,
    position:[220,0], parameters:{jsCode:`const b=$json.body||{};if(b.prefix!==${JSON.stringify(prefix)}||b.confirm!=='LAB029_RUNTIME_CLEANUP'||b.snapshot_sha256!==${JSON.stringify(seal)})throw new Error('cleanup_execute_no_autorizado');return [{json:{ok:true}}];`} });
  const dataTable = (id, name, matchType, filters) => add({ id:`${prefix}_${id}`, name, type:'n8n-nodes-base.dataTable', typeVersion:1.1,
    position:[440+nodes.length*180,0], alwaysOutputData:true,
    parameters:{operation:'deleteRows',dataTableId:{__rl:true,value:id.includes('audit')?'ePS8wwZ1Q0yh9fqq':id.includes('permission')?'ZIV6jWevCteTInzo':'tTLj4q6JRRta8bdH',mode:'list'},matchType,filters:{conditions:filters}} });
  const auditNode=dataTable('audit_delete','Eliminar 46 auditorías exactas LAB-029','anyCondition',conditions('audit_id',audits));
  const permA=dataTable('permission_a','Eliminar permiso exacto A LAB-029','allConditions',[{keyName:'clinic_id',keyValue:expected.ids.clinic_a},{keyName:'rol',keyValue:'veterinario'},{keyName:'permiso',keyValue:'rag_interno_consultar'}]);
  const permB=dataTable('permission_b','Eliminar permiso exacto B LAB-029','allConditions',[{keyName:'clinic_id',keyValue:expected.ids.clinic_b},{keyName:'rol',keyValue:'veterinario'},{keyName:'permiso',keyValue:'rag_interno_consultar'}]);
  const userA=dataTable('user_a','Eliminar usuario exacto A LAB-029','allConditions',[{keyName:'user_id',keyValue:`${lower}_user_a`}]);
  const userB=dataTable('user_b','Eliminar usuario exacto B LAB-029','allConditions',[{keyName:'user_id',keyValue:`${lower}_user_b`}]);
  const qdelete=(collection,points)=>add({id:`${prefix}_q_${collection}`,name:`Eliminar puntos exactos ${collection} LAB-029`,type:'n8n-nodes-base.httpRequest',typeVersion:4.2,
    position:[1600+nodes.length*180,0],executeOnce:true,alwaysOutputData:true,credentials:qCred,
    parameters:{method:'POST',url:`={{ $env.LAB029_QDRANT_URL + '/collections/${collection}/points/delete?wait=true' }}`,authentication:'predefinedCredentialType',nodeCredentialType:'qdrantApi',sendBody:true,contentType:'json',specifyBody:'json',jsonBody:`=${JSON.stringify({points})}`,options:{timeout:30000}}});
  const qPublic=qdelete('vetatiende_publico',publicPoints), qInternal=qdelete('vetatiende_interno',internalPoints);
  const pg = add({id:`${prefix}_cleanup_pg`,name:'Eliminar PostgreSQL exacto LAB-029',type:'n8n-nodes-base.postgres',typeVersion:2.6,position:[2200,0],credentials:pgCred,
    parameters:{operation:'executeQuery',query:`DO $$ BEGIN
IF (SELECT count(*) FROM vetatiende_documental.document_events WHERE event_id IN (${list(events)})) <> ${events.length} THEN RAISE EXCEPTION 'cleanup_eventos_difieren_snapshot'; END IF;
IF (SELECT count(*) FROM vetatiende_documental.document_versions WHERE version_id IN (${list(versions)})) <> ${versions.length} THEN RAISE EXCEPTION 'cleanup_versiones_difieren_snapshot'; END IF;
IF (SELECT count(*) FROM vetatiende_documental.documents WHERE document_id IN (${list(documents)})) <> ${documents.length} THEN RAISE EXCEPTION 'cleanup_documentos_difieren_snapshot'; END IF;
IF (SELECT count(*) FROM vetatiende_documental.clinics WHERE clinic_id IN (${list(clinics)})) <> ${clinics.length} THEN RAISE EXCEPTION 'cleanup_clinicas_difieren_snapshot'; END IF;
DELETE FROM vetatiende_documental.document_events WHERE event_id IN (${list(events)});
DELETE FROM vetatiende_documental.document_versions WHERE version_id IN (${list(versions)});
DELETE FROM vetatiende_documental.documents WHERE document_id IN (${list(documents)});
DELETE FROM vetatiende_documental.clinics WHERE clinic_id IN (${list(clinics)});
END $$; SELECT ${events.length}::int deleted_events,${versions.length}::int deleted_versions,${documents.length}::int deleted_documents,${clinics.length}::int deleted_clinics;`,options:{}}});
  const result=add({id:`${prefix}_cleanup_result`,name:'Responder cleanup_execute LAB-029',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.4,position:[2420,0],parameters:{respondWith:'json',responseBody:`=${JSON.stringify({ok:true,status:'execute_complete',snapshot_sha256:seal,deleted_counts:{audits:audits.length,permissions:2,users:2,events:events.length,versions:versions.length,documents:documents.length,clinics:clinics.length,qdrant_public:publicPoints.length,qdrant_internal:internalPoints.length}})}`,options:{responseCode:200}}});
  [hook,guard,auditNode,permA,permB,userA,userB,qPublic,qInternal,pg,result].forEach((name,index,array)=>{if(index<array.length-1)edge(name,array[index+1]);});
  const workflow={name:`${prefix} cleanup_execute`,active:false,nodes,connections,settings:{executionOrder:'v1'}};
  const output=join(dirname(manifestFile),'workflow_cleanup_execute.json');
  await writeFile(output,`${JSON.stringify(workflow,null,2)}\n`);
  return {output,path:`${lower.replaceAll('_','-')}-cleanup-execute`,snapshot_sha256:seal,counts:checked.counts};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
  console.log(JSON.stringify(await crearWorkflowCleanupExecute({manifestPath:arg('manifest'),snapshotPath:arg('snapshot')})));
}
