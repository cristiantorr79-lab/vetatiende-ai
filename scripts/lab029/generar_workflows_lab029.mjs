import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const workflowDir = path.join(root, 'n8n', 'workflows', 'comercial');
const read = (name) => JSON.parse(fs.readFileSync(path.join(workflowDir, name), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
export const filtrarDocumentosInternosAutorizados = (items, niveles) => {
  const permitidos = new Set((Array.isArray(niveles) ? niveles : []).map((nivel) => String(nivel || '').trim().toLowerCase()).filter(Boolean));
  return (Array.isArray(items) ? items : []).filter((item) => permitidos.has(String(item?.json?.document?.metadata?.access_level || '').trim().toLowerCase()));
};
const qdrantCredential = { qdrantApi: { id: 'jHiRqgWleLSSH6GM', name: 'VetAtiende Qdrant Comercial' } };
const cohereCredential = { cohereApi: { id: 'UlLe3QFsEljmwhWq', name: 'Cohere comercial LAB-021' } };
const locator = (value) => ({ __rl: true, value, mode: 'id' });
const postgresCredential = { postgres: { id: 'vpbKJO7irGofixTr', name: 'Postgres account' } };

function removeNodes(workflow, names) {
  const removed = new Set(names);
  workflow.nodes = workflow.nodes.filter((node) => !removed.has(node.name));
  for (const name of removed) delete workflow.connections[name];
  for (const connection of Object.values(workflow.connections)) for (const outputs of Object.values(connection)) for (const output of outputs) {
    for (let i = output.length - 1; i >= 0; i -= 1) if (removed.has(output[i].node)) output.splice(i, 1);
  }
}

function addActiveVersionLookup(workflow, { from, target, visibility, position }) {
  const label = visibility === 'public' ? 'públicas' : 'internas';
  const readName = `Leer versiones ${label} activas LAB-029`;
  const mergeName = `Consolidar versiones ${label} activas LAB-029`;
  workflow.nodes.push(
    { id: `lab029-${visibility}-active`, name: readName, type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position, parameters: { operation: 'executeQuery', query: `SELECT v.version_id FROM vetatiende_documental.documents d JOIN vetatiende_documental.document_versions v ON v.document_id=d.document_id AND v.status='active' WHERE d.clinic_id=$1 AND d.visibility='${visibility}' AND d.status='active'`, options: { queryReplacement: `={{ [$("${from}").first().json.clinic_id] }}` } }, credentials: clone(postgresCredential) },
    { id: `lab029-${visibility}-merge`, name: mergeName, type: 'n8n-nodes-base.code', typeVersion: 2, position: [position[0] + 220, position[1]], parameters: { mode: 'runOnceForAllItems', jsCode: `const original=$("${from}").first().json; const ids=$input.all().map(i=>String(i.json.version_id||'')).filter(Boolean); return [{json:{...original,versiones_activas_lab029:ids}}];` } },
  );
  const existing = workflow.connections[from];
  if (!existing?.main) throw new Error(`conexion_origen_ausente:${from}`);
  let replaced = false;
  const main = existing.main.map((output) => output.map((edge) => {
    if (edge.node !== target) return edge;
    replaced = true;
    return { ...edge, node: readName };
  }));
  if (!replaced) throw new Error(`conexion_objetivo_ausente:${from}->${target}`);
  workflow.connections[from] = { ...existing, main };
  workflow.connections[readName] = { main: [[{ node: mergeName, type: 'main', index: 0 }]] };
  workflow.connections[mergeName] = { main: [[{ node: target, type: 'main', index: 0 }]] };
}

function aplicarAislamientoPublicoMultiClinica(workflow) {
  const normalizar = workflow.nodes.find((node) => node.name === 'Normalizar entrada comercial');
  const clinicAssignment = normalizar?.parameters?.assignments?.assignments?.find((assignment) => assignment.name === 'clinic_id');
  if (!clinicAssignment) throw new Error('normalizacion_clinic_id_ausente');
  clinicAssignment.value = '={{ String($json.body?.clinic_id ?? $json.clinic_id ?? "").trim() }}';

  const validarNombre = 'Validar clínica pública PostgreSQL LAB-029';
  const restaurarNombre = 'Restaurar contexto clínica pública LAB-029';
  workflow.nodes.push(
    {
      id: 'lab029-public-clinic-authority', name: validarNombre, type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [3440, 10688],
      parameters: { operation: 'executeQuery', query: "SELECT ($1 ~ '^[a-z0-9][a-z0-9_-]{2,63}$' AND EXISTS (SELECT 1 FROM vetatiende_documental.clinics WHERE clinic_id=$1 AND status='active')) AS clinic_id_permitido", options: { queryReplacement: '={{ [$("Normalizar entrada comercial").first().json.clinic_id] }}' } },
      credentials: clone(postgresCredential), alwaysOutputData: true, onError: 'continueRegularOutput',
    },
    {
      id: 'lab029-public-clinic-context', name: restaurarNombre, type: 'n8n-nodes-base.code', typeVersion: 2, position: [3600, 10688],
      parameters: { mode: 'runOnceForEachItem', jsCode: 'const base=$("Normalizar entrada comercial").first().json; return {json:{...base,clinic_id_permitido:$json.clinic_id_permitido===true}};' },
    },
  );
  const sessionConnections = workflow.connections['Tiene session_id válido']?.main;
  if (!sessionConnections?.[0]?.some((edge) => edge.node === 'Clinic_id permitido')) throw new Error('ruta_validacion_clinica_ausente');
  workflow.connections['Tiene session_id válido'].main[0] = sessionConnections[0].map((edge) => edge.node === 'Clinic_id permitido' ? { ...edge, node: validarNombre } : edge);
  workflow.connections[validarNombre] = { main: [[{ node: restaurarNombre, type: 'main', index: 0 }]] };
  workflow.connections[restaurarNombre] = { main: [[{ node: 'Clinic_id permitido', type: 'main', index: 0 }]] };

  const permitido = workflow.nodes.find((node) => node.name === 'Clinic_id permitido');
  permitido.parameters.conditions.conditions = [{ id: 'lab029-clinic-authorized', leftValue: '={{ $json.clinic_id_permitido === true }}', operator: { type: 'boolean', operation: 'true', singleValue: true } }];
  permitido.parameters.conditions.combinator = 'and';

  const peluqueria = workflow.nodes.find((node) => node.name === 'Cargar configuración peluquería');
  const peluqueriaAssignment = peluqueria?.parameters?.assignments?.assignments?.find((assignment) => assignment.name === 'peluqueriaConfig');
  if (!peluqueriaAssignment?.value?.includes('clinic_id: "clinica_piloto_001"')) throw new Error('configuracion_peluqueria_clinica_ausente');
  peluqueriaAssignment.value = peluqueriaAssignment.value.replace('clinic_id: "clinica_piloto_001"', 'clinic_id: String($json.clinic_id || "").trim()');

  const respuesta = workflow.nodes.find((node) => node.name === 'Responder gestión cita LAB-026');
  respuesta.parameters.responseBody = respuesta.parameters.responseBody.replace('$json.clinic_id || "clinica_piloto_001"', '$json.clinic_id || ""');
  const revision = workflow.nodes.find((node) => node.name === 'Preparar revisión humana LAB-026');
  revision.parameters.jsCode = revision.parameters.jsCode.replace('contexto.clinic_id || "clinica_piloto_001"', 'contexto.clinic_id || ""');
}

export function generarPublico(source = read('lab028_avisos_comerciales_contextuales_post_reserva.json')) {
  const workflow = clone(source); workflow.name = 'LAB-029 - RAG público persistente por clínica'; workflow.active = false;
  removeNodes(workflow, ['Recargar RAG al iniciar n8n', 'Leer documentos públicos comerciales', 'Preparar documentos públicos para RAG', 'Cargar documentos públicos en RAG']);
  const node = workflow.nodes.find((n) => n.name === 'Buscar información pública de la clínica');
  node.type = '@n8n/n8n-nodes-langchain.vectorStoreQdrant'; node.typeVersion = 1.3;
  node.parameters = { mode: 'retrieve-as-tool', toolName: 'buscar_informacion_publica_clinica', toolDescription: node.parameters.toolDescription, qdrantCollection: locator('vetatiende_publico'), topK: 6, includeDocumentMetadata: true, options: { searchFilterJson: '={{ { must: [ { key: "metadata.clinic_id", match: { value: $json.clinic_id } }, { key: "metadata.visibility", match: { value: "public" } }, { key: "metadata.status", match: { value: "active" } }, { key: "metadata.version_id", match: { any: $json.versiones_activas_lab029 } } ] } }}' } };
  node.credentials = clone(qdrantCredential);
  const embedding = workflow.connections['Generar embeddings públicos con Cohere'].ai_embedding[0];
  workflow.connections['Generar embeddings públicos con Cohere'].ai_embedding[0] = embedding.filter((edge) => edge.node === node.name);
  addActiveVersionLookup(workflow, { from: 'Preparar consulta pública comercial', target: 'Luna comercial con RAG público', visibility: 'public', position: [7420, 10720] });
  aplicarAislamientoPublicoMultiClinica(workflow);
  return workflow;
}

export function generarInterno(source = read('lab025_operacion_interna_protegida_rag_interno.json')) {
  const workflow = clone(source); workflow.name = 'LAB-029 - Operación interna con RAG persistente por clínica'; workflow.active = false;
  removeNodes(workflow, ['Recargar RAG interno LAB-025', 'Leer documentos RAG interno', 'Procesar documentos RAG interno uno a uno', 'Preparar metadata documento RAG interno', 'Cargar documentos RAG interno', 'Guardar documentos RAG interno en Qdrant', 'Embeddings Cohere RAG interno']);
  const node = workflow.nodes.find((n) => n.name === 'Buscar conocimiento RAG interno');
  node.parameters.qdrantCollection = locator('vetatiende_interno');
  node.parameters.options.searchFilterJson = '={{ { must: [ { key: "metadata.clinic_id", match: { value: $json.clinic_id } }, { key: "metadata.visibility", match: { value: "internal" } }, { key: "metadata.status", match: { value: "active" } }, { key: "metadata.version_id", match: { any: $json.versiones_activas_lab029 } } ] } }}';
  const consolidate = workflow.nodes.find((n) => n.name === 'Consolidar contexto RAG interno');
  if (!consolidate) throw new Error('nodo_consolidacion_interna_ausente');
  consolidate.parameters.jsCode = `const filtrarDocumentosInternosAutorizados = ${filtrarDocumentosInternosAutorizados.toString()};\n${consolidate.parameters.jsCode
    .replace('const resultados = $input.all();', 'const resultados = filtrarDocumentosInternosAutorizados($input.all(), solicitud.niveles_acceso_permitidos);')
    .replaceAll('metadata.nivel_acceso', 'metadata.access_level')}`;
  addActiveVersionLookup(workflow, { from: '¿Consulta RAG interna válida?', target: 'Buscar conocimiento RAG interno', visibility: 'internal', position: [2920, 1680] });
  return workflow;
}

export function generarGestion() {
  const nodes = [
    { id: 'lab029-input', name: 'Entrada interna gestión documental LAB-029', type: 'n8n-nodes-base.executeWorkflowTrigger', typeVersion: 1.1, position: [0, 0], parameters: { workflowInputs: { values: [{ name: 'clinic_id' }, { name: 'document_id' }, { name: 'document_type' }, { name: 'visibility' }, { name: 'access_level' }, { name: 'source_file' }, { name: 'content_hash' }] } } },
    { id: 'lab029-validate', name: 'Validar contrato documental LAB-029', type: 'n8n-nodes-base.code', typeVersion: 2, position: [240, 0], parameters: { mode: 'runOnceForEachItem', jsCode: `const x=$json; const required=['clinic_id','document_id','visibility','source_file','content_hash']; const ok=required.every(k=>String(x[k]||'').trim())&&['public','internal'].includes(x.visibility)&&/^[a-f0-9]{64}$/.test(x.content_hash)&&!(x.visibility==='internal'&&!x.access_level)&&!(x.visibility==='public'&&x.access_level); return {json:{...x,contrato_valido:ok,coleccion:x.visibility==='public'?'vetatiende_publico':'vetatiende_interno'}};` } },
    { id: 'lab029-pg-read', name: 'Consultar versión activa PostgreSQL LAB-029', type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [480, 0], parameters: { operation: 'executeQuery', query: `SELECT d.document_id,v.version_id,v.version_number,v.content_hash FROM vetatiende_documental.documents d LEFT JOIN vetatiende_documental.document_versions v ON v.document_id=d.document_id AND v.status='active' WHERE d.clinic_id=$1 AND d.document_id=$2`, options: { queryReplacement: '={{ [$json.clinic_id, $json.document_id] }}' } }, credentials: clone(postgresCredential) },
    { id: 'lab029-decision', name: 'Decidir staging documental LAB-029', type: 'n8n-nodes-base.code', typeVersion: 2, position: [720, 0], parameters: { mode: 'runOnceForEachItem', jsCode: `const original=$('Validar contrato documental LAB-029').first().json; const active=$json||{}; const sinCambios=active.content_hash===original.content_hash; return {json:{...original,active_version_id:active.version_id||'',next_version_number:Number(active.version_number||0)+1,resultado:sinCambios?'sin_cambios':'staging'}};` } },
    { id: 'lab029-route', name: 'Requiere nueva versión LAB-029', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [960, 0], parameters: { conditions: { options: { typeValidation: 'strict', version: 3 }, conditions: [{ leftValue: '={{ $json.resultado === "staging" }}', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } },
    { id: 'lab029-stage', name: 'Crear versión staging PostgreSQL LAB-029', type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [1200, -120], parameters: { operation: 'executeQuery', query: `BEGIN; INSERT INTO vetatiende_documental.document_versions(version_id,document_id,version_number,content_hash,source_file,status) VALUES($1,$2,$3,$4,$5,'staging'); COMMIT;`, options: { queryReplacement: '={{ [$json.version_id,$json.document_id,$json.next_version_number,$json.content_hash,$json.source_file] }}' } }, credentials: clone(postgresCredential) },
    { id: 'lab029-qdrant', name: 'Cargar staging en Qdrant LAB-029', type: '@n8n/n8n-nodes-langchain.vectorStoreQdrant', typeVersion: 1.3, position: [1440, -120], parameters: { mode: 'insert', qdrantCollection: locator('={{ $json.coleccion }}'), options: {} }, credentials: clone(qdrantCredential) },
    { id: 'lab029-embed', name: 'Embeddings Cohere LAB-029', type: '@n8n/n8n-nodes-langchain.embeddingsCohere', typeVersion: 1, position: [1440, 100], parameters: { modelName: 'embed-multilingual-v3.0' }, credentials: clone(cohereCredential) },
    { id: 'lab029-activate', name: 'Activar versión validada PostgreSQL LAB-029', type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [1680, -120], parameters: { operation: 'executeQuery', query: `BEGIN; UPDATE vetatiende_documental.document_versions SET validated_at=now() WHERE version_id=$1 AND status='staging'; SELECT vetatiende_documental.activate_document_version($1); COMMIT;`, options: { queryReplacement: '={{ [$json.version_id] }}' } }, credentials: clone(postgresCredential) },
    { id: 'lab029-no-change', name: 'Registrar documento sin cambios LAB-029', type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [1200, 120], parameters: { operation: 'executeQuery', query: `INSERT INTO vetatiende_documental.document_events(event_id,clinic_id,document_id,version_id,event_type,result,details) VALUES($1,$2,$3,$4,'no_changes','accepted','{}')`, options: { queryReplacement: '={{ [$json.event_id,$json.clinic_id,$json.document_id,$json.active_version_id] }}' } }, credentials: clone(postgresCredential) },
  ];
  const connections = { 'Entrada interna gestión documental LAB-029': { main: [[{ node: 'Validar contrato documental LAB-029', type: 'main', index: 0 }]] }, 'Validar contrato documental LAB-029': { main: [[{ node: 'Consultar versión activa PostgreSQL LAB-029', type: 'main', index: 0 }]] }, 'Consultar versión activa PostgreSQL LAB-029': { main: [[{ node: 'Decidir staging documental LAB-029', type: 'main', index: 0 }]] }, 'Decidir staging documental LAB-029': { main: [[{ node: 'Requiere nueva versión LAB-029', type: 'main', index: 0 }]] }, 'Requiere nueva versión LAB-029': { main: [[{ node: 'Crear versión staging PostgreSQL LAB-029', type: 'main', index: 0 }],[{ node: 'Registrar documento sin cambios LAB-029', type: 'main', index: 0 }]] }, 'Crear versión staging PostgreSQL LAB-029': { main: [[{ node: 'Cargar staging en Qdrant LAB-029', type: 'main', index: 0 }]] }, 'Embeddings Cohere LAB-029': { ai_embedding: [[{ node: 'Cargar staging en Qdrant LAB-029', type: 'ai_embedding', index: 0 }]] }, 'Cargar staging en Qdrant LAB-029': { main: [[{ node: 'Activar versión validada PostgreSQL LAB-029', type: 'main', index: 0 }]] } };
  return { name: 'LAB-029 - Gestión documental persistente y versionada', nodes, connections, active: false, settings: { executionOrder: 'v1' }, versionId: 'lab029-gestion-documental-v1', meta: { templateCredsSetupCompleted: false }, tags: [] };
}

function generarGestionCompleta() {
  const pg=(id,name,x,y,query,queryReplacement,onError=false)=>({id,name,type:'n8n-nodes-base.postgres',typeVersion:2.6,position:[x,y],parameters:{operation:'executeQuery',query,options:{queryReplacement}},credentials:clone(postgresCredential),...(onError?{onError:'continueErrorOutput'}:{})});
  const code=(id,name,x,y,jsCode)=>({id,name,type:'n8n-nodes-base.code',typeVersion:2,position:[x,y],parameters:{mode:'runOnceForEachItem',jsCode}});
  const iff=(id,name,x,y,leftValue)=>({id,name,type:'n8n-nodes-base.if',typeVersion:2.3,position:[x,y],parameters:{conditions:{options:{typeValidation:'strict',version:3},conditions:[{leftValue,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}});
  const dynamic=value=>`{{ ${value} }}`;
  const http=(id,name,x,y,path,jsonBody,onError=true)=>({id,name,type:'n8n-nodes-base.httpRequest',typeVersion:4.2,position:[x,y],parameters:{method:'POST',url:`={{ $env.LAB029_QDRANT_URL + "/collections/" + $("Preparar contexto e IDs LAB-029").first().json.coleccion + "${path}" }}`,authentication:'predefinedCredentialType',nodeCredentialType:'qdrantApi',sendBody:true,contentType:'json',specifyBody:'json',jsonBody:`=${JSON.stringify(jsonBody,null,2)}`},credentials:clone(qdrantCredential),...(onError?{onError:'continueErrorOutput'}:{})});
  const qfilter=(version,status)=>({filter:{must:[{key:'metadata.clinic_id',match:{value:dynamic("$('Preparar contexto e IDs LAB-029').first().json.clinic_id")}},{key:'metadata.document_id',match:{value:dynamic("$('Preparar contexto e IDs LAB-029').first().json.document_id")}},{key:'metadata.version_id',match:{value:dynamic(version)}},...(status?[{key:'metadata.status',match:{value:status}}]:[])]}});
  const restore=`const base=$('Preparar contexto e IDs LAB-029').first().json; return {json:{...base,...$json}};`;
  const nodes=[
    {id:'lab029-input-v2',name:'Entrada interna gestión documental LAB-029',type:'n8n-nodes-base.executeWorkflowTrigger',typeVersion:1.1,position:[0,0],parameters:{workflowInputs:{values:['action','clinic_id','document_id','document_type','visibility','access_level','source_file','content_hash','document_content','target_version_id'].map(name=>({name}))}}},
    code('lab029-validate-v2','Validar contrato documental LAB-029',220,0,`const x=$json;const action=String(x.action||'ingest');const req=['clinic_id','document_id','document_type','visibility','source_file','content_hash'];const id=/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$/;const ok=req.every(k=>String(x[k]||'').trim())&&id.test(String(x.clinic_id))&&id.test(String(x.document_id))&&['public','internal'].includes(x.visibility)&&/^[a-f0-9]{64}$/.test(String(x.content_hash))&&!(x.visibility==='internal'&&!String(x.access_level||'').trim())&&!(x.visibility==='public'&&x.access_level)&&(action==='rollback'?id.test(String(x.target_version_id||'')):String(x.document_content||'').trim().length>0);return {json:{...x,action,contrato_valido:ok,coleccion:x.visibility==='public'?'vetatiende_publico':'vetatiende_interno'}};`),
    iff('lab029-valid-v2','¿Contrato válido LAB-029?',440,0,'={{ $json.contrato_valido === true }}'),
    {id:'lab029-stop-v2',name:'Detener contrato inválido LAB-029',type:'n8n-nodes-base.stopAndError',typeVersion:1,position:[660,180],parameters:{errorMessage:'Contrato documental LAB-029 inválido'}},
    code('lab029-context-v2','Preparar contexto e IDs LAB-029',660,0,`const x=$json;const token=String($execution.id+'_'+Date.now()).replace(/[^a-zA-Z0-9_-]/g,'_');return {json:{...x,version_id:'ver_'+x.document_id+'_'+token,event_id:'evt_'+x.document_id+'_'+token,version_number:0,active_version_id:'',updated_at:new Date().toISOString()}};`),
    iff('lab029-action-v2','¿Es rollback LAB-029?',880,0,'={{ $json.action === "rollback" }}'),
    pg('lab029-doc-v2','Asegurar documento nuevo PostgreSQL LAB-029',1100,-220,`INSERT INTO vetatiende_documental.documents(document_id,clinic_id,document_type,visibility,access_level,status) VALUES($1,$2,$3,$4,$5,'active') ON CONFLICT(document_id) DO UPDATE SET document_type=EXCLUDED.document_type,visibility=EXCLUDED.visibility,access_level=EXCLUDED.access_level WHERE documents.clinic_id=EXCLUDED.clinic_id RETURNING document_id`,`={{ [$json.document_id,$json.clinic_id,$json.document_type,$json.visibility,$json.access_level||null] }}`,true),
    code('lab029-doc-context-v2','Restaurar contexto tras documento LAB-029',1320,-220,restore),
    pg('lab029-active-v2','Consultar versión activa PostgreSQL LAB-029',1540,-220,`SELECT active.version_id AS active_version_id,active.content_hash AS active_content_hash,COALESCE(MAX(history.version_number),0)::integer AS max_version_number FROM vetatiende_documental.documents d LEFT JOIN vetatiende_documental.document_versions active ON active.document_id=d.document_id AND active.status='active' LEFT JOIN vetatiende_documental.document_versions history ON history.document_id=d.document_id WHERE d.clinic_id=$1 AND d.document_id=$2 GROUP BY active.version_id,active.content_hash`,`={{ [$json.clinic_id,$json.document_id] }}`,true),
    code('lab029-decision-v2','Decidir staging documental LAB-029',1760,-220,`const b=$('Preparar contexto e IDs LAB-029').first().json;const a=$json||{};return {json:{...b,active_version_id:a.active_version_id||'',version_number:Number(a.max_version_number||0)+1,resultado:a.active_content_hash===b.content_hash?'sin_cambios':'staging'}};`),
    iff('lab029-route-v2','Requiere nueva versión LAB-029',1980,-220,'={{ $json.resultado === "staging" }}'),
    pg('lab029-stage','Crear versión staging PostgreSQL LAB-029',2200,-340,`INSERT INTO vetatiende_documental.document_versions(version_id,document_id,version_number,content_hash,source_file,status) VALUES($1,$2,$3,$4,$5,'staging') ON CONFLICT (document_id,content_hash) DO UPDATE SET status='staging',source_file=EXCLUDED.source_file,validated_at=NULL,activated_at=NULL,superseded_at=NULL WHERE document_versions.status='failed' RETURNING version_id,document_id,version_number,content_hash,source_file,status`,`={{ [$json.version_id,$json.document_id,$json.version_number,$json.content_hash,$json.source_file] }}`,true),
    code('lab029-stage-context-v2','Restaurar contexto tras staging PostgreSQL LAB-029',2420,-340,`const base=$('Decidir staging documental LAB-029').first().json; return {json:{...base,...$json}};`),
    {id:'lab029-qdrant',name:'Cargar staging en Qdrant LAB-029',type:'@n8n/n8n-nodes-langchain.vectorStoreQdrant',typeVersion:1.3,position:[2640,-340],parameters:{mode:'insert',qdrantCollection:locator('={{ $json.coleccion }}'),options:{}},credentials:clone(qdrantCredential),onError:'continueErrorOutput'},
    {id:'lab029-loader-v2',name:'Cargar contenido documental real LAB-029',type:'@n8n/n8n-nodes-langchain.documentDefaultDataLoader',typeVersion:1.1,position:[2520,-100],parameters:{dataType:'json',jsonMode:'expressionData',jsonData:'={{ $json.document_content }}',options:{metadata:{metadataValues:['clinic_id','document_id','version_id','version_number','document_type','visibility','content_hash','updated_at','source_file','access_level'].map(name=>({name,value:`={{ $json.${name} }}`})).concat([{name:'status',value:'staging'}])}}}},
    {id:'lab029-split-v2',name:'Dividir contenido documental LAB-029',type:'@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter',typeVersion:1,position:[2440,80],parameters:{chunkSize:900,chunkOverlap:120}},
    {id:'lab029-embed-v2',name:'Embeddings Cohere LAB-029',type:'@n8n/n8n-nodes-langchain.embeddingsCohere',typeVersion:1,position:[2700,-100],parameters:{modelName:'embed-multilingual-v3.0'},credentials:clone(cohereCredential)},
    code('lab029-q-context-v2','Restaurar contexto tras Qdrant LAB-029',2860,-340,`const base=$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json; return {json:{...base,...$json}};`),
    http('lab029-recover-v2','Recuperar staging Qdrant LAB-029',3080,-340,'/points/scroll',{limit:1,with_payload:true,...qfilter("$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json.version_id",'staging')}),
    code('lab029-check-v2','Validar recuperación staging Qdrant LAB-029',3300,-340,`const b=$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json;const p=$json.result?.points||[];const payload=p[0]?.payload||{};const c=payload.content||payload.text||payload.pageContent||payload.document?.pageContent||'';const m=payload.metadata||{};return {json:{...b,staging_valido:p.length>0&&String(c).trim().length>0&&String(m.version_id)===String(b.version_id)&&Number(m.version_number)===Number(b.version_number)}};`),
    iff('lab029-check-route-v2','¿Staging recuperado válido LAB-029?',3520,-340,'={{ $json.staging_valido === true }}'),
    http('lab029-old-v2','Qdrant anterior a superseded LAB-029',3740,-460,'/points/payload',{payload:{status:'superseded'},key:'metadata',...qfilter("$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json.active_version_id",'active')}),
    http('lab029-new-v2','Qdrant nueva versión a active LAB-029',3960,-460,'/points/payload',{payload:{status:'active'},key:'metadata',...qfilter("$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json.version_id",'staging')}),
    pg('lab029-activate','Activar versión validada PostgreSQL LAB-029',4180,-460,`BEGIN;UPDATE vetatiende_documental.document_versions SET validated_at=now() WHERE version_id=$1 AND document_id=$2 AND status='staging';SELECT vetatiende_documental.activate_document_version($1);COMMIT;`,`={{ [$("Restaurar contexto tras staging PostgreSQL LAB-029").first().json.version_id,$("Restaurar contexto tras staging PostgreSQL LAB-029").first().json.document_id] }}`,true),
    pg('lab029-no-change','Registrar documento sin cambios LAB-029',2200,-100,`INSERT INTO vetatiende_documental.document_events(event_id,clinic_id,document_id,version_id,event_type,result,details) VALUES($1,$2,$3,$4,'no_changes','accepted','{}')`,`={{ [$json.event_id,$json.clinic_id,$json.document_id,$json.active_version_id] }}`),
    pg('lab029-failed-v2','Marcar staging failed PostgreSQL LAB-029',3740,20,`UPDATE vetatiende_documental.document_versions SET status='failed' WHERE version_id=$1 AND document_id=$2 AND status='staging'`,`={{ [$("Restaurar contexto tras staging PostgreSQL LAB-029").first().json.version_id,$("Restaurar contexto tras staging PostgreSQL LAB-029").first().json.document_id] }}`),
    http('lab029-failed-q-v2','Marcar staging failed Qdrant LAB-029',3960,20,'/points/payload',{payload:{status:'failed'},key:'metadata',...qfilter("$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json.version_id")},false),
    http('lab029-restore-old-v2','Restaurar versión anterior active Qdrant LAB-029',4180,20,'/points/payload',{payload:{status:'active'},key:'metadata',...qfilter("$('Restaurar contexto tras staging PostgreSQL LAB-029').first().json.active_version_id")},false),
    pg('lab029-r-read-v2','Leer versiones para rollback PostgreSQL LAB-029',1100,280,`SELECT c.version_id AS active_version_id,t.version_id AS target_version_id FROM vetatiende_documental.documents d JOIN vetatiende_documental.document_versions t ON t.document_id=d.document_id AND t.version_id=$3 AND t.validated_at IS NOT NULL LEFT JOIN vetatiende_documental.document_versions c ON c.document_id=d.document_id AND c.status='active' WHERE d.clinic_id=$1 AND d.document_id=$2`,`={{ [$json.clinic_id,$json.document_id,$json.target_version_id] }}`,true),
    code('lab029-r-context-v2','Restaurar contexto rollback LAB-029',1320,280,`const b=$('Preparar contexto e IDs LAB-029').first().json;if(!$json.target_version_id)throw new Error('rollback_target_invalid');return {json:{...b,active_version_id:$json.active_version_id||'',target_version_id:$json.target_version_id}};`),
    http('lab029-r-current-v2','Qdrant rollback actual a superseded LAB-029',1540,280,'/points/payload',{payload:{status:'superseded'},key:'metadata',...qfilter("$('Restaurar contexto rollback LAB-029').first().json.active_version_id",'active')}),
    http('lab029-r-target-v2','Qdrant rollback destino a active LAB-029',1760,280,'/points/payload',{payload:{status:'active'},key:'metadata',...qfilter("$('Restaurar contexto rollback LAB-029').first().json.target_version_id",'superseded')}),
    pg('lab029-r-pg-v2','Ejecutar rollback PostgreSQL LAB-029',1980,280,`SELECT vetatiende_documental.rollback_document_version($1,$2)`,`={{ [$("Restaurar contexto rollback LAB-029").first().json.document_id,$("Restaurar contexto rollback LAB-029").first().json.target_version_id] }}`,true),
    http('lab029-r-verify-v2','Recuperar versión después del rollback Qdrant LAB-029',2200,280,'/points/scroll',{limit:1,with_payload:true,...qfilter("$('Restaurar contexto rollback LAB-029').first().json.target_version_id",'active')},true),
    code('lab029-r-check-v2','Validar recuperación después del rollback Qdrant LAB-029',2420,280,`const b=$('Restaurar contexto rollback LAB-029').first().json;const p=$json.result?.points||[];const payload=p[0]?.payload||{};const m=payload.metadata||{};const content=payload.content||payload.text||payload.pageContent||payload.document?.pageContent||'';const rollback_valido=p.length>0&&String(content).trim().length>0&&String(m.clinic_id)===String(b.clinic_id)&&String(m.document_id)===String(b.document_id)&&String(m.version_id)===String(b.target_version_id)&&String(m.status)==='active'&&String(m.content_hash)===String(b.content_hash);return {json:{...b,rollback_valido}};`),
    iff('lab029-r-check-route-v2','¿Rollback recuperado válido LAB-029?',2640,280,'={{ $json.rollback_valido === true }}'),
    pg('lab029-r-comp-pg-v2','Compensar rollback PostgreSQL LAB-029',2420,500,`SELECT vetatiende_documental.rollback_document_version($1,$2)`,`={{ [$("Restaurar contexto rollback LAB-029").first().json.document_id,$("Restaurar contexto rollback LAB-029").first().json.active_version_id] }}`),
    http('lab029-r-comp-current-v2','Compensar rollback Qdrant actual active LAB-029',2640,500,'/points/payload',{payload:{status:'active'},key:'metadata',...qfilter("$('Restaurar contexto rollback LAB-029').first().json.active_version_id")},false),
    http('lab029-r-comp-target-v2','Compensar rollback Qdrant destino superseded LAB-029',2860,500,'/points/payload',{payload:{status:'superseded'},key:'metadata',...qfilter("$('Restaurar contexto rollback LAB-029').first().json.target_version_id")},false),
  ];
  const e=(node,type='main')=>({node,type,index:0});
  const connections={
    'Entrada interna gestión documental LAB-029':{main:[[e('Validar contrato documental LAB-029')]]},'Validar contrato documental LAB-029':{main:[[e('¿Contrato válido LAB-029?')]]},'¿Contrato válido LAB-029?':{main:[[e('Preparar contexto e IDs LAB-029')],[e('Detener contrato inválido LAB-029')]]},'Preparar contexto e IDs LAB-029':{main:[[e('¿Es rollback LAB-029?')]]},'¿Es rollback LAB-029?':{main:[[e('Leer versiones para rollback PostgreSQL LAB-029')],[e('Asegurar documento nuevo PostgreSQL LAB-029')]]},
    'Asegurar documento nuevo PostgreSQL LAB-029':{main:[[e('Restaurar contexto tras documento LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Restaurar contexto tras documento LAB-029':{main:[[e('Consultar versión activa PostgreSQL LAB-029')]]},'Consultar versión activa PostgreSQL LAB-029':{main:[[e('Decidir staging documental LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Decidir staging documental LAB-029':{main:[[e('Requiere nueva versión LAB-029')]]},'Requiere nueva versión LAB-029':{main:[[e('Crear versión staging PostgreSQL LAB-029')],[e('Registrar documento sin cambios LAB-029')]]},'Crear versión staging PostgreSQL LAB-029':{main:[[e('Restaurar contexto tras staging PostgreSQL LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Restaurar contexto tras staging PostgreSQL LAB-029':{main:[[e('Cargar staging en Qdrant LAB-029')]]},
    'Cargar contenido documental real LAB-029':{ai_document:[[e('Cargar staging en Qdrant LAB-029','ai_document')]]},'Dividir contenido documental LAB-029':{ai_textSplitter:[[e('Cargar contenido documental real LAB-029','ai_textSplitter')]]},'Embeddings Cohere LAB-029':{ai_embedding:[[e('Cargar staging en Qdrant LAB-029','ai_embedding')]]},'Cargar staging en Qdrant LAB-029':{main:[[e('Restaurar contexto tras Qdrant LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Restaurar contexto tras Qdrant LAB-029':{main:[[e('Recuperar staging Qdrant LAB-029')]]},'Recuperar staging Qdrant LAB-029':{main:[[e('Validar recuperación staging Qdrant LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Validar recuperación staging Qdrant LAB-029':{main:[[e('¿Staging recuperado válido LAB-029?')]]},'¿Staging recuperado válido LAB-029?':{main:[[e('Qdrant anterior a superseded LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Qdrant anterior a superseded LAB-029':{main:[[e('Qdrant nueva versión a active LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Qdrant nueva versión a active LAB-029':{main:[[e('Activar versión validada PostgreSQL LAB-029')],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Activar versión validada PostgreSQL LAB-029':{main:[[],[e('Marcar staging failed PostgreSQL LAB-029')]]},'Marcar staging failed PostgreSQL LAB-029':{main:[[e('Marcar staging failed Qdrant LAB-029')]]},'Marcar staging failed Qdrant LAB-029':{main:[[e('Restaurar versión anterior active Qdrant LAB-029')]]},
    'Leer versiones para rollback PostgreSQL LAB-029':{main:[[e('Restaurar contexto rollback LAB-029')],[e('Compensar rollback Qdrant actual active LAB-029')]]},'Restaurar contexto rollback LAB-029':{main:[[e('Qdrant rollback actual a superseded LAB-029')]]},'Qdrant rollback actual a superseded LAB-029':{main:[[e('Qdrant rollback destino a active LAB-029')],[e('Compensar rollback Qdrant actual active LAB-029')]]},'Qdrant rollback destino a active LAB-029':{main:[[e('Ejecutar rollback PostgreSQL LAB-029')],[e('Compensar rollback Qdrant actual active LAB-029')]]},'Ejecutar rollback PostgreSQL LAB-029':{main:[[e('Recuperar versión después del rollback Qdrant LAB-029')],[e('Compensar rollback Qdrant actual active LAB-029')]]},'Recuperar versión después del rollback Qdrant LAB-029':{main:[[e('Validar recuperación después del rollback Qdrant LAB-029')],[e('Compensar rollback PostgreSQL LAB-029')]]},'Validar recuperación después del rollback Qdrant LAB-029':{main:[[e('¿Rollback recuperado válido LAB-029?')]]},'¿Rollback recuperado válido LAB-029?':{main:[[],[e('Compensar rollback PostgreSQL LAB-029')]]},'Compensar rollback PostgreSQL LAB-029':{main:[[e('Compensar rollback Qdrant actual active LAB-029')]]},'Compensar rollback Qdrant actual active LAB-029':{main:[[e('Compensar rollback Qdrant destino superseded LAB-029')]]},
  };
  return {name:'LAB-029 - Gestión documental persistente y versionada',nodes,connections,active:false,settings:{executionOrder:'v1'},versionId:'lab029-gestion-documental-v2',meta:{templateCredsSetupCompleted:false},tags:[]};
}

export function generarTodo() { return { publico: generarPublico(), interno: generarInterno(), gestion: generarGestionCompleta() }; }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const all = generarTodo();
  for (const [key, workflow] of Object.entries(all)) fs.writeFileSync(path.join(workflowDir, `lab029_${key}_rag_persistente.json`), `${JSON.stringify(workflow, null, 2)}\n`);
  process.stdout.write(`${Object.keys(all).length} workflows LAB-029 generados\n`);
}
