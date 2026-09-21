import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const load=async path=>JSON.parse(await readFile(resolve(path),'utf8'));
const ensure=(value,message)=>{if(!value)throw new Error(message);};
const unwrap=response=>{let value=response;if(typeof value==='string'){try{value=JSON.parse(value);}catch{throw new Error('verifier_body_text_not_json');}}if(Array.isArray(value)){if(value.length!==1)throw new Error('verifier_body_shape_invalid');value=value[0];}for(const key of ['json','body','data'])if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===1&&Object.hasOwn(value,key))value=value[key];if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('verifier_body_shape_invalid');return value;};
export async function verificarEstado({manifestPath,checkpoint='snapshot',confirm='',env=process.env,fetchImpl=globalThis.fetch}){
  if(confirm!=='LAB029_RUNTIME_REAL')throw new Error('confirmacion_runtime_requerida');const manifest=await load(manifestPath);ensure(String(manifest.prefix).startsWith('LAB029_TEST_'),'manifiesto_no_lab029_test');
  const base=String(env.LAB029_N8N_WEBHOOK_BASE_URL||'').replace(/\/$/,'');const name=env.LAB029_INTERNAL_HEADER_NAME||'',value=env.LAB029_INTERNAL_HEADER_VALUE||'';ensure(base&&name&&value,'configuracion_webhook_verificador_faltante');ensure(manifest.webhook_paths?.verificador_runtime,'webhook_verificador_ausente');
  const body={prefix:manifest.prefix,checkpoint,ids:manifest.ids,hashes:manifest.hashes,checkpoint_metrics:manifest.checkpoint_metrics||{},persistence_baseline:manifest.persistence_baseline||null};
  const response=await fetchImpl(`${base}/webhook/${manifest.webhook_paths.verificador_runtime}`,{method:'POST',headers:{'content-type':'application/json',[name]:value},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});const raw=typeof response.text==='function'?await response.text():JSON.stringify(await response.json());const hint=/postgres/i.test(raw)?'verifier_postgres_failed':/qdrant/i.test(raw)?'verifier_qdrant_failed':'';if(response.status>=500||response.status===401||response.status===403)throw new Error(`verifier_http_${response.status}${hint?`:${hint}`:''}`);let parsed;try{parsed=JSON.parse(raw);}catch{throw new Error(raw?'verifier_body_text_not_json':'verifier_body_empty');}const result=unwrap(parsed);if(!Object.hasOwn(result,'ok'))throw new Error('verifier_body_missing_ok');if(typeof result.checkpoint!=='string'||!Array.isArray(result.assertions)||!result.summary||typeof result.summary!=='object'||Array.isArray(result.summary))throw new Error('verifier_body_contract_invalid');ensure(result.ok===true,`assertions_verificador_fallidas:${result.assertions.filter(x=>!x?.ok).map(x=>x?.name||'sin_nombre').join(',')||'sin_detalle'}`);if(response.status!==200)throw new Error(`verifier_http_${response.status}`);const summary=result.summary;
  const safe={checkpoint:result.checkpoint,assertions:result.assertions,versions:summary.versions||{},postgres_rows:Number(summary.postgres_rows)||0,event_counts:summary.event_counts||{},fingerprint:String(summary.fingerprint||''),metrics:summary.metrics||{}};
  manifest.versions={...manifest.versions,...Object.fromEntries(Object.entries(safe.versions).filter(([,item])=>item))};if(checkpoint==='g02')manifest.checkpoint_metrics={...(manifest.checkpoint_metrics||{}),g02:safe.metrics};if(checkpoint==='g09')manifest.persistence_baseline={fingerprint:safe.fingerprint,created_at:new Date().toISOString()};manifest.runtime_state={checked_at:new Date().toISOString(),...safe};await writeFile(resolve(manifestPath),`${JSON.stringify(manifest,null,2)}\n`);return {ok:true,...safe};
}
export async function rehidratarBaselineG09({manifestPath,evidencePath}){
  const manifest=await load(manifestPath),evidence=await load(evidencePath);
  ensure(/^LAB029_TEST_[A-Za-z0-9_]+$/.test(manifest.prefix)&&evidence.prefix===manifest.prefix,'evidencia_run_invalido');
  const before=evidence.g09,after=evidence.after_restart;
  ensure(before?.checkpoint==='g09'&&before.ok===true&&Array.isArray(before.assertions)&&before.assertions.length>0&&before.assertions.every(x=>x.ok===true),'evidencia_g09_invalida');
  ensure(after?.checkpoint==='persistence'&&after.ok===false&&Array.isArray(after.assertions)&&after.assertions.some(x=>x.name==='fingerprint_postgres_persistente'&&x.ok===false),'evidencia_post_reinicio_invalida');
  const start=Date.parse(before.observed_at),restart=Date.parse(evidence.restarted_at),end=Date.parse(after.observed_at);
  ensure(Number.isFinite(start)&&Number.isFinite(restart)&&Number.isFinite(end)&&start<restart&&restart<end,'cronologia_evidencia_invalida');
  ensure(String(before.execution_id||'').trim()&&String(after.execution_id||'').trim(),'execution_id_evidencia_ausente');
  const counts=before.summary?.event_counts||{};
  ensure(['staged','validated','activated','no_changes','failed','rollback'].every(key=>Number(counts[key])>=1),'eventos_g09_incompletos');
  ensure(before.summary?.postgres_rows===5&&after.summary?.postgres_rows===5,'filas_evidencia_incorrectas');
  const fingerprint=before.summary?.fingerprint;
  ensure(typeof fingerprint==='string'&&fingerprint.length>0&&fingerprint===after.summary?.fingerprint,'fingerprints_historicos_distintos');
  let rows;try{rows=JSON.parse(fingerprint);}catch{throw new Error('fingerprint_historico_invalido');}
  const documents=new Set([manifest.ids?.document_public_a,manifest.ids?.document_public_b,manifest.ids?.document_internal_a]);
  ensure(Array.isArray(rows)&&rows.length===5&&rows.every(row=>Array.isArray(row)&&row.length===4&&documents.has(row[0])&&typeof row[1]==='string'&&row[1].includes(manifest.prefix)&&['active','superseded','failed','staging'].includes(row[2])&&/^[a-f0-9]{64}$/.test(row[3])),'fingerprint_historico_fuera_de_run');
  ensure(!manifest.persistence_baseline||manifest.persistence_baseline.fingerprint===fingerprint,'baseline_existente_distinto');
  manifest.persistence_baseline={fingerprint,created_at:before.observed_at,source:'historical_g09_evidence',execution_id:String(before.execution_id)};
  await writeFile(resolve(manifestPath),`${JSON.stringify(manifest,null,2)}\n`);
  return {ok:true,prefix:manifest.prefix,source:'historical_g09_evidence',postgres_rows:rows.length,fingerprints_match:true};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){const arg=key=>process.argv.find(x=>x.startsWith(`--${key}=`))?.slice(key.length+3);console.log(JSON.stringify(arg('rehydrate-g09-evidence')?await rehidratarBaselineG09({manifestPath:arg('manifest'),evidencePath:arg('rehydrate-g09-evidence')}):await verificarEstado({manifestPath:arg('manifest'),checkpoint:arg('checkpoint')||'snapshot',confirm:process.env.LAB029_RUNTIME_CONFIRM}),null,2));}
