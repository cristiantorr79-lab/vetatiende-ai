import { createHash } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { idsCleanupExactos, validarInventarioCleanup, validarPostCleanup } from './validar_inventario_cleanup_lab029.mjs';

const sha256=value=>createHash('sha256').update(value).digest('hex');
const stable=value=>Array.isArray(value)?value.map(stable).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
const required={clinics:2,documents:3,versions:5,events:16,qdrant_public:15,qdrant_internal:1,users:2,permissions:2,audits:46,temporary_files:1};

const config=env=>{const base=String(env.LAB029_N8N_WEBHOOK_BASE_URL||'').replace(/\/$/,'');const name=String(env.LAB029_INTERNAL_HEADER_NAME||''),value=String(env.LAB029_INTERNAL_HEADER_VALUE||'');if(!base||!name||!value)throw new Error('configuracion_cleanup_faltante');return {base,name,value};};
async function call({url,name,value,body,fetchImpl}){const response=await fetchImpl(url,{method:'POST',headers:{'content-type':'application/json',[name]:value},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});let json;try{json=await response.json();}catch{throw new Error(`cleanup_http_${response.status}_no_json`);}if(response.status!==200||json?.ok!==true)throw new Error(`cleanup_http_${response.status}`);return json;}
async function inspect({manifest,base,name,value,fetchImpl}){const path=`${manifest.prefix.toLowerCase().replaceAll('_','-')}-cleanup-precheck`;const body=await call({url:`${base}/webhook/${path}`,name,value,body:{prefix:manifest.prefix,ids:manifest.ids},fetchImpl});if(!body.inventory)throw new Error('cleanup_inventario_ausente');return body.inventory;}

export async function ejecutarCleanup({manifestPath,snapshotPath,mode,env=process.env,fetchImpl=globalThis.fetch}){
  if(env.LAB029_RUNTIME_CONFIRM!=='LAB029_RUNTIME_CLEANUP')throw new Error('confirmacion_cleanup_requerida');
  if(!['execute','postcheck'].includes(mode))throw new Error('modo_cleanup_invalido');
  const manifestFile=resolve(manifestPath),snapshotFile=resolve(snapshotPath),folder=dirname(manifestFile);
  const manifest=JSON.parse(await readFile(manifestFile,'utf8')),rawSnapshot=await readFile(snapshotFile,'utf8'),snapshot=JSON.parse(rawSnapshot);
  idsCleanupExactos(manifest);if(snapshot.prefix!==manifest.prefix||!snapshot.inventory)throw new Error('cleanup_snapshot_run_invalido');
  snapshot.inventory.runtime??={temporary_files:[join(folder,'payloads.json')]};
  const approved=validarInventarioCleanup(manifest,snapshot.inventory);if(!same(approved.counts,required))throw new Error('cleanup_snapshot_counts_no_aprobados');
  const {base,name,value}=config(env),evidencePath=join(folder,'cleanup_evidence.json');
  if(mode==='execute'){
    const current=await inspect({manifest,base,name,value,fetchImpl});current.runtime=snapshot.inventory.runtime;
    validarInventarioCleanup(manifest,current);if(!same(current,snapshot.inventory))throw new Error('cleanup_estado_difiere_snapshot');
    const seal=sha256(rawSnapshot),path=`${manifest.prefix.toLowerCase().replaceAll('_','-')}-cleanup-execute`;
    const result=await call({url:`${base}/webhook/${path}`,name,value,body:{prefix:manifest.prefix,confirm:'LAB029_RUNTIME_CLEANUP',snapshot_sha256:seal},fetchImpl});
    if(result.snapshot_sha256!==seal||!same(result.deleted_counts,{audits:46,permissions:2,users:2,events:16,versions:5,documents:3,clinics:2,qdrant_public:15,qdrant_internal:1}))throw new Error('cleanup_execute_respuesta_invalida');
    const evidence={prefix:manifest.prefix,precheck:{status:'PASS',snapshot_sha256:seal,counts:approved.counts},execute:{status:'PASS',at:new Date().toISOString(),deleted_counts:result.deleted_counts},postcheck:{status:'PENDING'}};
    await writeFile(evidencePath,`${JSON.stringify(evidence,null,2)}\n`,{flag:'wx'});return {ok:true,status:'execute_complete',deleted_counts:result.deleted_counts};
  }
  const evidence=JSON.parse(await readFile(evidencePath,'utf8'));if(evidence.prefix!==manifest.prefix||evidence.execute?.status!=='PASS'||evidence.precheck?.snapshot_sha256!==sha256(rawSnapshot))throw new Error('cleanup_execute_evidence_invalida');
  const current=await inspect({manifest,base,name,value,fetchImpl});current.runtime={temporary_files:[]};
  const checked=validarPostCleanup(manifest,current);
  const payload=join(folder,'payloads.json');await unlink(payload);
  evidence.postcheck={status:'PASS',at:new Date().toISOString(),remaining_counts:checked.counts};
  await writeFile(evidencePath,`${JSON.stringify(evidence,null,2)}\n`);
  manifest.status='cleaned';manifest.cleanup={status:'PASS',executed_at:evidence.execute.at,postchecked_at:evidence.postcheck.at,evidence_file:'cleanup_evidence.json'};
  await writeFile(manifestFile,`${JSON.stringify(manifest,null,2)}\n`);return {ok:true,status:'PASS',remaining_counts:checked.counts,payloads_deleted:true};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const arg=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);console.log(JSON.stringify(await ejecutarCleanup({manifestPath:arg('manifest'),snapshotPath:arg('snapshot'),mode:arg('mode'),env:process.env})));}
