import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crearWorkflowVerificadorRuntime } from './crear_workflow_verificador_runtime_lab029.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const PRIVATE=resolve(ROOT,'private-storage/lab029/runtime');
const sha=(text)=>createHash('sha256').update(text).digest('hex');
const safeRun=(value)=>{const v=String(value||'').replace(/[^a-zA-Z0-9_-]/g,'_');if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{5,63}$/.test(v))throw new Error('run_id_invalido');return v;};
const clone=(x)=>structuredClone(x);
export const adaptarPublicoRuntime=workflow=>{
  const node=workflow.nodes.find(item=>item.name==='Clinic_id permitido');
  if(!node)throw new Error('clinic_id_permitido_ausente');
  node.parameters.conditions.conditions=[{
    id:'lab029-runtime-clinic-id-permitido',
    leftValue:'={{ (() => { const clinicId = String($json.clinic_id || "").trim(); return clinicId === "clinica_piloto_001" || /^lab029_test_[a-z0-9](?:[a-z0-9_-]{4,41}[a-z0-9])?_clinic_[ab]$/.test(clinicId); })() }}',
    rightValue:true,
    operator:{type:'boolean',operation:'true',singleValue:true}
  }];
  node.parameters.conditions.combinator='and';
  return workflow;
};

const selfContainedDriver=({source,name,path,prefix,credentials})=>{const workflow=clone(source);workflow.name=name;workflow.active=false;const entry=workflow.nodes.find(node=>node.type==='n8n-nodes-base.executeWorkflowTrigger');if(!entry)throw new Error('trigger_gestion_ausente');const next=workflow.connections[entry.name]?.main?.[0]||[];entry.id=`${prefix}_hook`;entry.type='n8n-nodes-base.webhook';entry.typeVersion=2;entry.parameters={httpMethod:'POST',path,authentication:'headerAuth',responseMode:'lastNode',options:{}};entry.credentials=credentials;entry.webhookId=`${prefix}_hook`;const extractor={id:`${prefix}_body`,name:'Extraer payload runtime LAB-029',type:'n8n-nodes-base.code',typeVersion:2,position:[entry.position[0]+180,entry.position[1]],parameters:{jsCode:'return $input.all().map(item=>({json:item.json?.body??item.json??{}}));'}};workflow.nodes.push(extractor);workflow.connections[entry.name]={main:[[{node:extractor.name,type:'main',index:0}]]};workflow.connections[extractor.name]={main:[next]};return workflow;};
const normalizePostgresCredential=workflow=>{for(const node of workflow.nodes.filter(item=>item.type==='n8n-nodes-base.postgres'))node.credentials={postgres:{id:'vpbKJO7irGofixTr',name:'Postgres account'}};return workflow;};

export async function prepararRuntime({runId,outputRoot=PRIVATE,managementWorkflowId='',failureWorkflowId=''}={}){
  const rid=safeRun(runId||`${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}_${randomBytes(4).toString('hex')}`);
  const prefix=`LAB029_TEST_${rid}`;
  const dir=resolve(outputRoot,prefix);
  if(!dir.startsWith(resolve(outputRoot)))throw new Error('ruta_run_invalida');
  await mkdir(dir,{recursive:true});
  const publicText=`${prefix}: La Clínica A atiende consultas de prueba los martes a las 15:29.`;
  const publicTextV2=`${prefix}: La Clínica A atiende consultas de prueba los jueves a las 16:29.`;
  const publicB=`${prefix}: La Clínica B usa el código aislado B-${rid}.`;
  const internalText=`${prefix}: Protocolo interno ${rid}; acceso exclusivo de veterinario.`;
  const clinicPrefix=`lab029_test_${rid.toLowerCase()}`;
  const ids={clinic_a:`${clinicPrefix}_clinic_a`,clinic_b:`${clinicPrefix}_clinic_b`,document_public_a:`${prefix}_DOC_PUBLIC_A`,document_public_b:`${prefix}_DOC_PUBLIC_B`,document_internal_a:`${prefix}_DOC_INTERNAL_A`};
  const webhookPaths={gestion:`lab029-test-${rid.toLowerCase()}-gestion`,gestion_fallo:`lab029-test-${rid.toLowerCase()}-gestion-fallo`,publico:`lab029-test-${rid.toLowerCase()}-publico`,interno:`lab029-test-${rid.toLowerCase()}-interno`,verificador_runtime:`lab029-test-${rid.toLowerCase()}-verificador`};
  const workflows={gestion:{name:`${prefix} Gestión driver`,id:null,active:false},gestion_fallo:{name:`${prefix} Gestión fallo controlado`,id:null,active:false},gestion_fallo_driver:{name:`${prefix} Gestión fallo driver`,id:null,active:false},publico:{name:`${prefix} Público`,id:null,active:false},interno:{name:`${prefix} Interno`,id:null,active:false},verificador_runtime:{name:`${prefix} Verificador runtime`,id:null,active:false}};
  for(const [kind,file] of Object.entries({publico:'lab029_publico_rag_persistente.json',interno:'lab029_interno_rag_persistente.json'})){
    const workflow=JSON.parse(await readFile(resolve(ROOT,'n8n/workflows/comercial',file),'utf8'));
    if(kind==='publico')adaptarPublicoRuntime(workflow);
    workflow.name=workflows[kind].name;workflow.active=false;
    const hook=workflow.nodes.find(n=>n.type==='n8n-nodes-base.webhook');
    if(!hook)throw new Error(`webhook_ausente_${kind}`);
    hook.parameters.path=webhookPaths[kind];hook.webhookId=`${prefix}_${kind}`;
    await writeFile(resolve(dir,`workflow_${kind}.json`),`${JSON.stringify(workflow,null,2)}\n`);
  }
  const internalBase=JSON.parse(await readFile(resolve(ROOT,'n8n/workflows/comercial/lab029_interno_rag_persistente.json'),'utf8'));
  const internalCredentials=clone(internalBase.nodes.find(n=>n.type==='n8n-nodes-base.webhook')?.credentials||{});if(!internalCredentials.httpHeaderAuth)throw new Error('credencial_header_interna_ausente');
  const managementBase=JSON.parse(await readFile(resolve(ROOT,'n8n/workflows/comercial/lab029_gestion_rag_persistente.json'),'utf8'));const management=clone(managementBase);
  management.name=`${prefix} Gestión fallo controlado`;management.active=false;
  const failureNode=management.nodes.find(n=>n.name==='Recuperar staging Qdrant LAB-029');if(!failureNode)throw new Error('nodo_fallo_controlado_ausente');failureNode.parameters.url='http://127.0.0.1:1/lab029-test-failure';
  await writeFile(resolve(dir,'workflow_gestion_fallo.json'),`${JSON.stringify(management,null,2)}\n`);
  await writeFile(resolve(dir,'workflow_gestion_driver.json'),`${JSON.stringify(normalizePostgresCredential(selfContainedDriver({source:managementBase,name:workflows.gestion.name,path:webhookPaths.gestion,prefix:`${prefix}_driver`,credentials:internalCredentials})),null,2)}\n`);
  await writeFile(resolve(dir,'workflow_gestion_fallo_driver.json'),`${JSON.stringify(normalizePostgresCredential(selfContainedDriver({source:management,name:`${prefix} Gestión fallo driver`,path:webhookPaths.gestion_fallo,prefix:`${prefix}_failure_driver`,credentials:internalCredentials})),null,2)}\n`);
  await writeFile(resolve(dir,'workflow_verificador_runtime.json'),`${JSON.stringify(crearWorkflowVerificadorRuntime({name:workflows.verificador_runtime.name,path:webhookPaths.verificador_runtime,prefix:`${prefix}_verifier`,headerCredentials:internalCredentials}),null,2)}\n`);
  const payloads={
    gestion_public_v1:{action:'ingest',clinic_id:ids.clinic_a,document_id:ids.document_public_a,document_type:'faq',visibility:'public',access_level:null,source_file:`${prefix}_public_v1.txt`,content_hash:sha(publicText),document_content:publicText,target_version_id:''},
    gestion_public_v2:{action:'ingest',clinic_id:ids.clinic_a,document_id:ids.document_public_a,document_type:'faq',visibility:'public',access_level:null,source_file:`${prefix}_public_v2.txt`,content_hash:sha(publicTextV2),document_content:publicTextV2,target_version_id:''},
    gestion_public_b:{action:'ingest',clinic_id:ids.clinic_b,document_id:ids.document_public_b,document_type:'faq',visibility:'public',access_level:null,source_file:`${prefix}_public_b.txt`,content_hash:sha(publicB),document_content:publicB,target_version_id:''},
    gestion_internal_a:{action:'ingest',clinic_id:ids.clinic_a,document_id:ids.document_internal_a,document_type:'protocol',visibility:'internal',access_level:'veterinario',source_file:`${prefix}_internal.txt`,content_hash:sha(internalText),document_content:internalText,target_version_id:''},
    public_query_a:{clinic_id:ids.clinic_a,session_id:`${prefix}_PUBLIC_SESSION`,channel:'runtime_test',message:`¿Qué día y hora atiende la clínica según ${prefix}?`},
    public_query_b:{clinic_id:ids.clinic_b,session_id:`${prefix}_PUBLIC_B_SESSION`,channel:'runtime_test',message:`¿Cuál es el horario de ${prefix}?`},
    internal_query_a:{internal_session_id:`${prefix}_INTERNAL_SESSION`,accion:'consulta_rag_interno',message:`¿Cuál es el protocolo interno ${rid}?`},
    internal_query_invalid:{internal_session_id:`${prefix}_INVALID_SESSION`,accion:'consulta_rag_interno',message:''}
  };
  const testPlan=['RT-00','RT-01','RT-02','G-01','G-02','G-03','G-04','G-05','G-06','G-07','G-08','G-09','P-01','P-02','P-03','P-04','P-05','I-01','I-02','I-03','I-04','I-05','PS-01','PF-01','CL-01','CL-02','CL-03'];
  const manifest={schema_version:1,lab:'LAB-029',run_id:rid,prefix,created_at:new Date().toISOString(),status:'prepared',test_plan:testPlan,ids,versions:{public_a_v1:null,public_a_v2:null,public_b:null,internal_a:null,failed:null},qdrant:{collections:['vetatiende_publico','vetatiende_interno'],protected_collection:'vetatiende_interno_clinica_piloto_001',point_ids:[],legacy_points:[292001,292002,292003]},hashes:Object.fromEntries(Object.entries(payloads).filter(([,x])=>x.content_hash).map(([k,x])=>[k,x.content_hash])),workflows,webhook_paths:webhookPaths,previous_active_state:{public_a:null,public_b:null,internal_a:null},tests:{},configuration_pending:{management_workflow_id:!managementWorkflowId,failure_workflow_id:!failureWorkflowId,internal_identity_fixture:true,verifier_workflow_id:true},artifacts:{payloads:'payloads.json',public_workflow:'workflow_publico.json',internal_workflow:'workflow_interno.json',management_driver:'workflow_gestion_driver.json',failure_workflow:'workflow_gestion_fallo.json',failure_driver:'workflow_gestion_fallo_driver.json',runtime_verifier:'workflow_verificador_runtime.json'}};
  await writeFile(resolve(dir,'payloads.json'),`${JSON.stringify(payloads,null,2)}\n`);
  await writeFile(resolve(dir,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);
  return {ok:true,run_id:rid,directory:dir,manifest:resolve(dir,'manifest.json')};
}
export async function agregarVerificadorRuntime({manifestPath}){const path=resolve(manifestPath),dir=dirname(path);const manifest=JSON.parse(await readFile(path,'utf8'));if(!String(manifest.prefix||'').startsWith('LAB029_TEST_'))throw new Error('manifiesto_no_lab029_test');const internal=JSON.parse(await readFile(resolve(ROOT,'n8n/workflows/comercial/lab029_interno_rag_persistente.json'),'utf8'));const credentials=clone(internal.nodes.find(n=>n.type==='n8n-nodes-base.webhook')?.credentials||{});if(!credentials.httpHeaderAuth)throw new Error('credencial_header_interna_ausente');const base=JSON.parse(await readFile(resolve(ROOT,'n8n/workflows/comercial/lab029_gestion_rag_persistente.json'),'utf8')),failure=clone(base);failure.nodes.find(n=>n.name==='Recuperar staging Qdrant LAB-029').parameters.url='http://127.0.0.1:1/lab029-test-failure';const route=manifest.webhook_paths?.verificador_runtime||`lab029-test-${manifest.run_id.toLowerCase()}-verificador`;const name=`${manifest.prefix} Verificador runtime`;await writeFile(resolve(dir,'workflow_verificador_runtime.json'),`${JSON.stringify(crearWorkflowVerificadorRuntime({name,path:route,prefix:`${manifest.prefix}_verifier`,headerCredentials:credentials}),null,2)}\n`);await writeFile(resolve(dir,'workflow_gestion_driver.json'),`${JSON.stringify(selfContainedDriver({source:base,name:manifest.workflows.gestion.name,path:manifest.webhook_paths.gestion,prefix:`${manifest.prefix}_driver`,credentials}),null,2)}\n`);await writeFile(resolve(dir,'workflow_gestion_fallo_driver.json'),`${JSON.stringify(selfContainedDriver({source:failure,name:manifest.workflows.gestion_fallo_driver.name,path:manifest.webhook_paths.gestion_fallo,prefix:`${manifest.prefix}_failure_driver`,credentials}),null,2)}\n`);manifest.webhook_paths={...manifest.webhook_paths,verificador_runtime:route};manifest.workflows={...manifest.workflows,verificador_runtime:manifest.workflows?.verificador_runtime||{name,id:null,active:false}};manifest.configuration_pending={...manifest.configuration_pending,verifier_workflow_id:!manifest.workflows.verificador_runtime.id,management_workflow_id:false,failure_workflow_id:false};manifest.artifacts={...manifest.artifacts,runtime_verifier:'workflow_verificador_runtime.json'};await writeFile(path,`${JSON.stringify(manifest,null,2)}\n`);return {ok:true,manifest:path,workflows:['workflow_gestion_driver.json','workflow_gestion_fallo_driver.json','workflow_verificador_runtime.json'],webhook_path:route};}
export async function regenerarExportsRuntime({manifestPath}){const result=await agregarVerificadorRuntime({manifestPath});const dir=dirname(resolve(manifestPath));for(const file of ['workflow_gestion_driver.json','workflow_gestion_fallo_driver.json','workflow_publico.json','workflow_interno.json']){const path=resolve(dir,file),workflow=normalizePostgresCredential(JSON.parse(await readFile(path,'utf8')));if(file==='workflow_publico.json')adaptarPublicoRuntime(workflow);await writeFile(path,`${JSON.stringify(workflow,null,2)}\n`);}const base=JSON.parse(await readFile(resolve(ROOT,'n8n/workflows/comercial/lab029_gestion_rag_persistente.json'),'utf8')),failure=normalizePostgresCredential(clone(base));failure.name=`${JSON.parse(await readFile(resolve(manifestPath),'utf8')).prefix} Gestión fallo`;failure.nodes.find(node=>node.name==='Recuperar staging Qdrant LAB-029').parameters.url='http://127.0.0.1:1/lab029-test-failure';await writeFile(resolve(dir,'workflow_gestion_fallo.json'),`${JSON.stringify(failure,null,2)}\n`);return {...result,workflows:[...result.workflows,'workflow_gestion_fallo.json','workflow_publico.json','workflow_interno.json']};}
if(import.meta.url===pathToFileURL(process.argv[1]).href){const value=(key)=>process.argv.find(x=>x.startsWith(`--${key}=`))?.split('=').slice(1).join('=')||'';const augment=value('augment-manifest');console.log(JSON.stringify(augment?await regenerarExportsRuntime({manifestPath:augment}):await prepararRuntime({runId:value('run-id'),managementWorkflowId:value('management-workflow-id'),failureWorkflowId:value('failure-workflow-id')}),null,2));}
