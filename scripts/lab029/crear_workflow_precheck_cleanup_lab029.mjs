import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { idsCleanupExactos } from './validar_inventario_cleanup_lab029.mjs';

export async function crearWorkflowPrecheckCleanup({ directory }) {
  const folder = resolve(directory);
  const manifest = JSON.parse(await readFile(join(folder, 'manifest.json'), 'utf8'));
  const { prefix, ids } = idsCleanupExactos(manifest);
  const verifier = JSON.parse(await readFile(join(folder, 'workflow_verificador_runtime.json'), 'utf8'));
  const headerCredentials = verifier.nodes.find(node => node.type === 'n8n-nodes-base.webhook')?.credentials;
  if (!headerCredentials?.httpHeaderAuth?.id) throw new Error('credencial_header_runtime_ausente');
  const path = `${prefix.toLowerCase().replaceAll('_', '-')}-cleanup-precheck`;
  const postgresCredential = { postgres: { id: 'vpbKJO7irGofixTr', name: 'Postgres account' } };
  const qdrantCredential = { qdrantApi: { id: 'jHiRqgWleLSSH6GM', name: 'VetAtiende Qdrant Comercial' } };
  const nodes = [];
  const add = node => { nodes.push(node); return node.name; };
  const edge = (from, to, connections) => { connections[from] = { main: [[{ node: to, type: 'main', index: 0 }]] }; };
  const requestName = 'Validar run exacto para PRE-CHECK LAB-029';
  add({ id: `${prefix}_pre_hook`, name: 'Entrada PRE-CHECK cleanup LAB-029', type: 'n8n-nodes-base.webhook', typeVersion: 2,
    position: [0, 0], webhookId: `${prefix}_pre_hook`, credentials: headerCredentials,
    parameters: { httpMethod: 'POST', path, authentication: 'headerAuth', responseMode: 'responseNode', options: {} } });
  add({ id: `${prefix}_pre_input`, name: requestName, type: 'n8n-nodes-base.code', typeVersion: 2,
    position: [220, 0], parameters: { jsCode: `const b=$json.body||{};const ids=${JSON.stringify(ids)};if(b.prefix!==${JSON.stringify(prefix)}||JSON.stringify(b.ids)!==JSON.stringify(ids))throw new Error('precheck_run_o_ids_distintos');return [{json:{prefix:b.prefix,ids}}];` } });
  const pgName = 'Inventariar PostgreSQL run D LAB-029';
  const query = `SELECT
    COALESCE((SELECT jsonb_agg(jsonb_build_object('clinic_id',c.clinic_id)) FROM vetatiende_documental.clinics c WHERE c.clinic_id IN ($1,$2)),'[]'::jsonb) AS clinics,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('document_id',d.document_id,'clinic_id',d.clinic_id)) FROM vetatiende_documental.documents d WHERE d.clinic_id IN ($1,$2) OR d.document_id IN ($3,$4,$5)),'[]'::jsonb) AS documents,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('version_id',v.version_id,'document_id',v.document_id)) FROM vetatiende_documental.document_versions v WHERE v.document_id IN ($3,$4,$5) OR v.version_id LIKE 'ver_'||$6||'_%'),'[]'::jsonb) AS versions,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('event_id',e.event_id,'clinic_id',e.clinic_id,'document_id',e.document_id,'version_id',e.version_id)) FROM vetatiende_documental.document_events e WHERE e.clinic_id IN ($1,$2) OR e.document_id IN ($3,$4,$5) OR e.event_id LIKE '%'||$6||'%'),'[]'::jsonb) AS events`;
  add({ id: `${prefix}_pre_pg`, name: pgName, type: 'n8n-nodes-base.postgres', typeVersion: 2.6,
    position: [440, 0], alwaysOutputData: true, onError: 'continueRegularOutput', credentials: postgresCredential,
    parameters: { operation: 'executeQuery', query, options: { queryReplacement: `={{ [${JSON.stringify(ids.clinic_a)},${JSON.stringify(ids.clinic_b)},${JSON.stringify(ids.document_public_a)},${JSON.stringify(ids.document_public_b)},${JSON.stringify(ids.document_internal_a)},${JSON.stringify(prefix)}] }}` } } });
  for (const collection of ['vetatiende_publico', 'vetatiende_interno']) for (const side of ['a', 'b']) {
    const name = `Inventariar ${collection} clínica ${side.toUpperCase()} LAB-029`;
    const body = { limit: 256, with_payload: true, with_vector: false,
      filter: { must: [{ key: 'metadata.clinic_id', match: { value: `{{ $('${requestName}').first().json.ids.clinic_${side} }}` } }] } };
    add({ id: `${prefix}_pre_q_${collection}_${side}`, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
      position: [660 + nodes.length * 220, 0], executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput',
      credentials: qdrantCredential,
      parameters: { method: 'POST', url: `={{ $env.LAB029_QDRANT_URL + '/collections/${collection}/points/scroll' }}`,
        authentication: 'predefinedCredentialType', nodeCredentialType: 'qdrantApi', sendBody: true,
        contentType: 'json', specifyBody: 'json', jsonBody: `=${JSON.stringify(body)}`, options: { timeout: 30000 } } });
  }
  const table = (name, id, conditions) => {
    const dataTableId = { __rl: true, value: id, mode: 'list' };
    add({ id: `${prefix}_pre_table_${id}`, name, type: 'n8n-nodes-base.dataTable', typeVersion: 1.1,
      position: [1900 + nodes.length * 220, 0], alwaysOutputData: true, executeOnce: true, onError: 'continueRegularOutput',
      parameters: { operation: 'get', dataTableId, returnAll: true,
        ...(conditions ? { matchType: 'anyCondition', filters: { conditions } } : {}) } });
  };
  table('Inventariar usuarios temporales LAB-029', 'tTLj4q6JRRta8bdH',
    ['a', 'b'].map(side => ({ keyName: 'user_id', keyValue: `${prefix.toLowerCase()}_user_${side}` })));
  table('Inventariar permisos temporales LAB-029', 'ZIV6jWevCteTInzo',
    ['a', 'b'].map(side => ({ keyName: 'clinic_id', keyValue: ids[`clinic_${side}`] })));
  table('Inventariar auditoría temporal LAB-029', 'ePS8wwZ1Q0yh9fqq');
  const collectCode = `const input=$('${requestName}').first().json;
const get=name=>$(name).all().map(item=>item.json||{});
const pg=get('${pgName}')[0]||{};
if(pg.error||!Array.isArray(pg.clinics)||!Array.isArray(pg.documents)||!Array.isArray(pg.versions)||!Array.isArray(pg.events))throw new Error('precheck_postgres_incompleto');
const qdrant={};
for(const collection of ['vetatiende_publico','vetatiende_interno']){
  qdrant[collection]=[];
  for(const side of ['a','b']){
    const response=get('Inventariar '+collection+' clínica '+side.toUpperCase()+' LAB-029')[0]||{};
    if(response.status!=='ok'||!Array.isArray(response.result?.points)||response.result?.next_page_offset!=null)throw new Error('precheck_qdrant_incompleto');
    for(const point of response.result.points)qdrant[collection].push({id:point.id,metadata:point.payload?.metadata||{}});
  }
}
const allUsers=get('Inventariar usuarios temporales LAB-029');
const allPermissions=get('Inventariar permisos temporales LAB-029');
if(allUsers.some(row=>row.error)||allPermissions.some(row=>row.error))throw new Error('precheck_datatable_incompleta');
const users=allUsers.filter(row=>row.user_id);
const permissions=allPermissions.filter(row=>row.clinic_id);
const allAudits=get('Inventariar auditoría temporal LAB-029');
if(allAudits.some(row=>row.error)||allAudits.length>=1000)throw new Error('precheck_auditoria_incompleta');
const lower=input.prefix.toLowerCase();
const audits=allAudits.filter(row=>{
  let meta={};try{meta=typeof row.metadata_controlada==='string'?JSON.parse(row.metadata_controlada||'{}'):(row.metadata_controlada||{})}catch{throw new Error('precheck_auditoria_json_invalido')}
  return [input.ids.clinic_a,input.ids.clinic_b].includes(row.clinic_id)||
    [lower+'_user_a',lower+'_user_b'].includes(row.actor_user_id)||
    String(meta.internal_session_id||'').startsWith(input.prefix+'_');
}).map(row=>({audit_id:row.audit_id,clinic_id:row.clinic_id,actor_user_id:row.actor_user_id,metadata_controlada:row.metadata_controlada}));
return [{json:{ok:true,inventory:{prefix:input.prefix,postgres:{clinics:pg.clinics,documents:pg.documents,versions:pg.versions,events:pg.events},qdrant,data_tables:{users,permissions,audits}}}}];`;
  add({ id: `${prefix}_pre_collect`, name: 'Consolidar inventario PRE-CHECK LAB-029', type: 'n8n-nodes-base.code',
    typeVersion: 2, position: [3000, 0], parameters: { jsCode: collectCode } });
  add({ id: `${prefix}_pre_response`, name: 'Responder PRE-CHECK LAB-029', type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.4, position: [3220, 0], parameters: { respondWith: 'json', responseBody: '={{ $json }}', options: { responseCode: 200 } } });
  const connections = {};
  for (let index = 0; index < nodes.length - 1; index++) edge(nodes[index].name, nodes[index + 1].name, connections);
  const workflow = { name: `${prefix} PRE-CHECK cleanup`, active: false, nodes, connections, settings: { executionOrder: 'v1' } };
  const output = join(folder, 'workflow_cleanup_precheck.json');
  await writeFile(output, `${JSON.stringify(workflow, null, 2)}\n`);
  return { output, path, nodes: nodes.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = process.argv.find(arg => arg.startsWith('--directory='))?.slice(12);
  if (!directory) throw new Error('directory_requerido');
  console.log(JSON.stringify(await crearWorkflowPrecheckCleanup({ directory })));
}
