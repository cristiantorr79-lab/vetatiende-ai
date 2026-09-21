import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verificarEstado } from './verificar_estado_runtime_lab029.mjs';

const PHASES=['management','public','internal','persistence'];
const load=async path=>JSON.parse(await readFile(resolve(path),'utf8'));
const sha=text=>createHash('sha256').update(text).digest('hex');
const redact=value=>String(value||'').replace(/https?:\/\/\S+/g,'[URL]').replace(/(token|password|api[-_]?key)[^\s,]*/gi,'$1=[REDACTED]');
const errorInfo=error=>{const code=String(error?.cause?.code||error?.code||'').replace(/[^A-Z0-9_-]/gi,'');const message=redact(error?.message);return {error:code?`${message} (${code})`:message,failure_kind:/^(ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT)$/.test(code)?'transport':'test'};};
const bodyText=body=>JSON.stringify(body||{}).toLowerCase();
const normalizeText=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
export const contieneFugaPublicaA=({response,question,sourceContent})=>{
  const prompt=normalizeText(question),answer=normalizeText(response).replaceAll(prompt,' ');
  const source=normalizeText(sourceContent),material=source.includes(':')?source.split(':').slice(1).join(':').trim():source;
  const markers=['martes','15:29','clinica a atiende','atiende consultas de prueba',material].filter(value=>value.length>=5);
  return markers.some(marker=>answer.includes(marker));
};
const field=(value,key)=>{if(!value||typeof value!=='object')return null;if(value[key]!==undefined&&value[key]!==null)return value[key];for(const child of Object.values(value)){const found=field(child,key);if(found!==null)return found;}return null;};
const ensure=(condition,message)=>{if(!condition)throw new Error(`assertion:${message}`);};
const durationStatus=(seconds,allowOver15=false)=>seconds>15&&!allowOver15?'FAIL':seconds>10?'WARN':'PASS';

async function timed(id,action,{slowJustification='',allowOver15=false}={}){const start=performance.now();try{const detail=await action();const seconds=Number(((performance.now()-start)/1000).toFixed(3));return {id,status:durationStatus(seconds,allowOver15),seconds,...(slowJustification?{slow_justification:slowJustification}:{}),detail};}catch(error){return {id,status:'FAIL',seconds:Number(((performance.now()-start)/1000).toFixed(3)),...errorInfo(error)};}}
async function request(fetchImpl,url,body,headers={},expected=[200]){const response=await fetchImpl(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});let data=null;try{data=await response.json();}catch{}ensure(expected.includes(response.status),`http_${response.status}`);return {http_status:response.status,body:data,text:bodyText(data)};}
const summarize=detail=>({http_status:detail?.http_status??null,response_ok:field(detail?.body,'ok')??null,contains_reply:Boolean(field(detail?.body,'reply')||field(detail?.body,'message')),state_checkpoint:detail?.state?.checkpoint||null});

export const runtimeMatrix={
  management:[
    ['G-01','contrato inválido','HTTP lo rechaza y estado confirma cero residuos'],['G-02','ingest public v1','v1 active y eventos de activación'],['G-03','repetir exactamente v1','no_changes sin versión/punto nuevo'],['G-04','ingest public v2','v2 active; v1 superseded'],['G-05','fallo posterior a staging','failed; v2 sigue active'],['G-06','rollback a v1','v1 active; v2 superseded'],['G-07','ingest internal A','active solo en colección interna'],['G-08','ingest public B','active solo en colección pública'],['G-09','auditoría final sin HTTP','seis tipos de evento requeridos']
  ],
  public:[['P-01','consulta A','dato A activo'],['P-02','consulta B','aislamiento A/B'],['P-03','sondeo interno','solo visibility public'],['P-04','consulta A tras rollback','solo active; excluye superseded'],['P-05','checkpoint PostgreSQL','versiones públicas esperadas siguen active']],
  internal:[['I-01','consulta A conocida','dato interno activo y access_level'],['I-02','consulta como clínica B','sin fuga A/B'],['I-03','consulta válida sin información','respuesta segura'],['I-04','consulta inválida','HTTP 400 y ok=false'],['I-05','checkpoint','rutas de auditoría ejecutadas/verificables']],
  persistence:[['PS-01/P-01','repetir P-01 tras recrear n8n','mismo dato público'],['PS-01/I-01','repetir I-01 tras recrear n8n','mismo dato interno'],['PS-01/STATE','checkpoint + evidencia operativa','mismos hashes/versiones/puntos y confirmación de que no hubo recarga']]
};
export function dryRunPlan(phase){if(phase&&!PHASES.includes(phase))throw new Error('fase_invalida');const selected=phase?[phase]:PHASES;const needsIdentity=selected.some(x=>x==='internal'||x==='persistence');return {ok:true,dry_run:true,phases:selected,workflows:['gestion_driver','gestion_fallo_driver','publico','interno','verificador_runtime'],required_variables:['LAB029_N8N_WEBHOOK_BASE_URL','LAB029_INTERNAL_HEADER_NAME','LAB029_INTERNAL_HEADER_VALUE','LAB029_RUNTIME_CONFIRM',...(needsIdentity?['LAB029_IDENTITY_SUBJECT_A','LAB029_IDENTITY_SUBJECT_B']:[])],not_required:['LAB029_POSTGRES_URI','LAB029_QDRANT_API_KEY','N8N_ENCRYPTION_KEY'],e2_generation_command:'docker compose exec --user "$(id -u):$(id -g)" n8n node /ruta/scripts/lab029/preparar_runtime_lab029.mjs --run-id=<run_id>',requirements:{confirmation:'LAB029_RUNTIME_REAL',management:['drivers gestión/fallo y verificador activos'],public:['workflow público temporal y verificador activos'],internal:['workflow interno temporal y verificador activos','setup crea identidades A/B controladas'],persistence:['copias pública/interna y verificador activos','n8n recreado','LAB029_PS01_NO_REBUILD_EVIDENCE=CONFIRMED_NO_REBUILD tras revisar ejecuciones/logs']},tests:Object.fromEntries(selected.map(x=>[x,runtimeMatrix[x].map(([id,action,assertion])=>({id,action,assertion,phase:x}))]))};}

export async function ejecutarRuntime({manifestPath,phase,caseId='',fromId='',confirm='',fetchImpl=globalThis.fetch,verifyImpl=verificarEstado,env=process.env}){
  ensure(PHASES.includes(phase),'fase_invalida');if(confirm!=='LAB029_RUNTIME_REAL')throw new Error('confirmacion_runtime_requerida');
  const phaseCases=runtimeMatrix[phase].map(([id])=>id);ensure(!(caseId&&fromId),'case_y_from_incompatibles');if(caseId)ensure(phaseCases.includes(caseId),'caso_invalido_para_fase');if(fromId)ensure(phase==='management'&&phaseCases.includes(fromId),'inicio_invalido_para_fase');const fromIndex=fromId?phaseCases.indexOf(fromId):0;const selected=id=>caseId?id===caseId:!fromId||phaseCases.indexOf(id)>=fromIndex;
  const manifest=await load(manifestPath),payloads=await load(resolve(manifestPath,'../payloads.json'));ensure(String(manifest.prefix).startsWith('LAB029_TEST_'),'manifiesto_no_lab029_test');
  const base=String(env.LAB029_N8N_WEBHOOK_BASE_URL||'').replace(/\/$/,'');ensure(base,'LAB029_N8N_WEBHOOK_BASE_URL_requerida');const headerName=env.LAB029_INTERNAL_HEADER_NAME||'',headerValue=env.LAB029_INTERNAL_HEADER_VALUE||'';ensure(headerName&&headerValue,'credencial_header_runtime_requerida');
  const auth={[headerName]:headerValue};const provider=env.LAB029_IDENTITY_PROVIDER||'lab029_runtime';const identityA={...auth,'x-vetatiende-identity-provider':provider,'x-vetatiende-identity-subject':env.LAB029_IDENTITY_SUBJECT_A||''};const identityB={...auth,'x-vetatiende-identity-provider':provider,'x-vetatiende-identity-subject':env.LAB029_IDENTITY_SUBJECT_B||''};
  const urls=Object.fromEntries(Object.entries(manifest.webhook_paths).map(([key,path])=>[key,`${base}/webhook/${path}`]));const tests=[];const state=checkpoint=>verifyImpl({manifestPath,checkpoint,confirm,env});const run=async(id,fn,options)=>{if(!selected(id))return;const result=await timed(id,fn,options);tests.push(result);return result;};const slow={slowJustification:'operación con embeddings/LLM',allowOver15:true};
  if(phase==='management'){
    await state('setup');
    if(caseId==='G-02')await state('prepare_g02');
    let blockedBy='';const manage=async(id,fn,options)=>{if(blockedBy){const result={id,status:'BLOCKED',seconds:0,error:`dependencia_${blockedBy}_fallida`};tests.push(result);return result;}const result=await run(id,fn,options);if(result.status==='FAIL')blockedBy=id.toLowerCase().replace(/[^a-z0-9]/g,'');return result;};
    const invalid={...payloads.gestion_public_v1,clinic_id:'',content_hash:'invalid'};
    if(selected('G-01'))await manage('G-01',async()=>{const http=await request(fetchImpl,urls.gestion,invalid,auth,[200,400,422,500]);const rejected=http.http_status>=400||field(http.body,'contrato_valido')===false||field(http.body,'ok')===false||/inválid|invalid|contrato/.test(http.text);ensure(rejected,'contrato_invalido_no_bloqueado');return {...http,state:await state('g01')};});
    let g02;if(selected('G-02')){g02=await manage('G-02',async()=>{const http=await request(fetchImpl,urls.gestion,payloads.gestion_public_v1,auth);return {...http,state:await state('g02')};},slow);manifest.versions.public_a_v1=field(g02.detail?.body,'version_id')||g02.detail?.state?.versions?.public_a_v1||manifest.versions.public_a_v1;}
    if(selected('G-03'))await manage('G-03',async()=>{const http=await request(fetchImpl,urls.gestion,payloads.gestion_public_v1,auth);return {...http,state:await state('g03')};});
    let g04;if(selected('G-04')){g04=await manage('G-04',async()=>{const http=await request(fetchImpl,urls.gestion,payloads.gestion_public_v2,auth);return {...http,state:await state('g04')};},slow);manifest.versions.public_a_v2=field(g04.detail?.body,'version_id')||g04.detail?.state?.versions?.public_a_v2||manifest.versions.public_a_v2;}
    const failureContent=`${payloads.gestion_public_v2.document_content} ${manifest.prefix}_FAILURE`;
    if(selected('G-05'))await manage('G-05',async()=>{const body={...payloads.gestion_public_v2,source_file:`${manifest.prefix}_failure.txt`,document_content:failureContent,content_hash:sha(failureContent)};const http=await request(fetchImpl,urls.gestion_fallo,body,auth,[200,500]);return {...http,state:await state('g05')};},slow);
    if(selected('G-06'))await manage('G-06',async()=>{ensure(manifest.versions.public_a_v1,'version_objetivo_rollback_ausente');const http=await request(fetchImpl,urls.gestion,{...payloads.gestion_public_v1,action:'rollback',target_version_id:manifest.versions.public_a_v1},auth);return {...http,state:await state('g06')};});
    if(selected('G-07'))await manage('G-07',async()=>{const http=await request(fetchImpl,urls.gestion,payloads.gestion_internal_a,auth);return {...http,state:await state('g07')};},slow);
    if(selected('G-08'))await manage('G-08',async()=>{const http=await request(fetchImpl,urls.gestion,payloads.gestion_public_b,auth);return {...http,state:await state('g08')};},slow);
    if(selected('G-09'))await manage('G-09',async()=>({state:await state('g09')}));
  } else if(phase==='public'){
    const a=payloads.public_query_a,b=payloads.public_query_b;
    await run('P-01',async()=>{const http=await request(fetchImpl,urls.publico,a);ensure(/martes|15:29/.test(http.text),'dato_publico_a_no_recuperado');return http;},slow);
    await run('P-02',async()=>{const http=await request(fetchImpl,urls.publico,b);ensure(!contieneFugaPublicaA({response:http.text,question:b.message,sourceContent:payloads.gestion_public_v1.document_content}),'aislamiento_publico_fallido');return http;},slow);
    await run('P-03',async()=>{const http=await request(fetchImpl,urls.publico,{...a,session_id:`${manifest.prefix}_PUBLIC_INTERNAL_PROBE`,message:`¿Cuál es el protocolo interno ${manifest.run_id}?`});ensure(!http.text.includes('acceso exclusivo de veterinario'),'visibility_public_fallida');return http;},slow);
    await run('P-04',async()=>{const http=await request(fetchImpl,urls.publico,{...a,session_id:`${manifest.prefix}_PUBLIC_ACTIVE_PROBE`});ensure(/martes|15:29/.test(http.text)&&!/jueves|16:29/.test(http.text),'active_publico_fallido');return http;},slow);
    await run('P-05',async()=>({state:await state('p05')}));
  } else if(phase==='internal'){
    const identityPrefix=manifest.prefix.toLowerCase();ensure(provider==='lab029_runtime','LAB029_IDENTITY_PROVIDER_invalido');ensure(identityA['x-vetatiende-identity-subject']===`${identityPrefix}_subject_a`,'LAB029_IDENTITY_SUBJECT_A_invalido');ensure(identityB['x-vetatiende-identity-subject']===`${identityPrefix}_subject_b`,'LAB029_IDENTITY_SUBJECT_B_invalido');await state('setup');const a=payloads.internal_query_a;
    await run('I-01',async()=>{const http=await request(fetchImpl,urls.interno,a,identityA);ensure(http.text.includes(`protocolo interno ${manifest.run_id}`.toLowerCase()),'dato_interno_a_no_recuperado');return http;},slow);
    await run('I-02',async()=>{const http=await request(fetchImpl,urls.interno,{...a,internal_session_id:`${manifest.prefix}_INTERNAL_B_SESSION`},identityB);ensure(!http.text.includes(`protocolo interno ${manifest.run_id}`.toLowerCase()),'fuga_clinica_interna');return http;},slow);
    await run('I-03',async()=>{const http=await request(fetchImpl,urls.interno,{...a,internal_session_id:`${manifest.prefix}_INTERNAL_EMPTY_SESSION`,message:'¿Cuál es el número de serie del extintor instalado en la bodega norte?'},identityA);ensure(/no encontr|revisión humana|revision humana/.test(http.text),'sin_informacion_invalida');return http;},slow);
    await run('I-04',async()=>{const http=await request(fetchImpl,urls.interno,payloads.internal_query_invalid,identityA,[400]);ensure(field(http.body,'ok')===false,'consulta_invalida_no_rechazada');return http;});
    await run('I-05',async()=>{ensure(tests.filter(test=>/^I-0[1-4]$/.test(test.id)).every(test=>test.status!=='FAIL'),'rutas_auditoria_no_completadas');return {state:await state('i05')};});
  } else {
    ensure(identityA['x-vetatiende-identity-subject'],'LAB029_IDENTITY_SUBJECT_A_requerido');ensure(env.LAB029_PS01_NO_REBUILD_EVIDENCE==='CONFIRMED_NO_REBUILD','evidencia_ausencia_recarga_requerida');
    await run('PS-01/P-01',async()=>{const http=await request(fetchImpl,urls.publico,payloads.public_query_a);ensure(/martes|15:29/.test(http.text),'persistencia_publica_fallida');return http;},slow);
    await run('PS-01/I-01',async()=>{const http=await request(fetchImpl,urls.interno,payloads.internal_query_a,identityA);ensure(normalizeText(field(http.body,'message')).includes(normalizeText(`protocolo interno ${manifest.run_id}`))&&Array.isArray(http.body?.data?.fuentes)&&http.body.data.fuentes.includes(manifest.ids.document_internal_a),'persistencia_interna_fallida');return http;},slow);
    await run('PS-01/STATE',async()=>({state:await state('persistence')}));
  }
  const summaries=tests.map(({detail,...rest})=>({...rest,...summarize(detail)}));const latest=await load(manifestPath);latest.versions={...latest.versions,...Object.fromEntries(Object.entries(manifest.versions).filter(([,value])=>value))};latest.tests[phase]={executed_at:new Date().toISOString(),...(caseId?{case:caseId}:{}),...(fromId?{from:fromId}:{}),results:summaries};latest.status=tests.some(x=>x.status==='FAIL')?'failed':`${phase}_executed`;await writeFile(resolve(manifestPath),`${JSON.stringify(latest,null,2)}\n`);return {ok:!tests.some(x=>x.status==='FAIL'),phase,...(caseId?{case:caseId}:{}),...(fromId?{from:fromId}:{}),results:summaries};
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){const value=key=>process.argv.find(x=>x.startsWith(`--${key}=`))?.slice(key.length+3);const dry=process.argv.includes('--dry-run')||process.argv.includes('--help');const phase=value('phase'),caseId=value('case'),fromId=value('from');if(dry)console.log(JSON.stringify(dryRunPlan(phase),null,2));else{const out=await ejecutarRuntime({manifestPath:value('manifest'),phase,caseId,fromId,confirm:process.env.LAB029_RUNTIME_CONFIRM});const printable=process.argv.includes('--summary')?{ok:out.ok,phase:out.phase,...(out.case?{case:out.case}:{}),...(out.from?{from:out.from}:{}),counts:{PASS:out.results.filter(x=>x.status==='PASS').length,WARN:out.results.filter(x=>x.status==='WARN').length,FAIL:out.results.filter(x=>x.status==='FAIL').length,BLOCKED:out.results.filter(x=>x.status==='BLOCKED').length},results:out.results.map(({id,status,seconds,error})=>({id,status,seconds,...(error?{cause:error}:{})}))}:out;console.log(JSON.stringify(printable,null,2));if(!out.ok)process.exitCode=1;}}
