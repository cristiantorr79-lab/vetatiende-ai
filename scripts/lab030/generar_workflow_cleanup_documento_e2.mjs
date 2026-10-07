import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLEANUP_SPEC as S } from './cleanup_documento_rag_publico.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const auth = { httpHeaderAuth: { id: 'CONFIGURE_EXISTING_HEADER_AUTH', name: 'VetAtiende Internal Header Auth' } };
const pgCred = { postgres: { id: 'CONFIGURE_EXISTING_POSTGRES', name: 'Postgres account' } };
const qCred = { qdrantApi: { id: 'CONFIGURE_EXISTING_QDRANT', name: 'VetAtiende Qdrant Comercial' } };
const nodes = [], connections = {};
const add = n => (nodes.push(n), n.name);
const edge = (a, b) => { connections[a] = { main: [[{ node: b, type: 'main', index: 0 }]] }; };
const chain = list => list.forEach((n, i) => { if (i < list.length - 1) edge(n, list[i + 1]); });
const hook = (id, name, route, y) => add({ id, name, type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, y], webhookId: route, parameters: { httpMethod: 'POST', path: route, authentication: 'headerAuth', responseMode: 'lastNode', options: {} }, credentials: auth });
const code = (id, name, jsCode, x, y) => add({ id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y], parameters: { mode: 'runOnceForAllItems', jsCode } });
const pg = (id, name, query, x, y, queryReplacement) => add({ id, name, type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [x, y], parameters: { operation: 'executeQuery', query, options: queryReplacement ? { queryReplacement } : {} }, credentials: pgCred });
const q = (id, name, endpoint, jsonBody, x, y) => add({ id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [x, y], parameters: { method: 'POST', url: `={{ $env.LAB029_QDRANT_URL + "/collections/${S.collection}/${endpoint}" }}`, authentication: 'predefinedCredentialType', nodeCredentialType: 'qdrantApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody, options: { timeout: 30000 } }, credentials: qCred });

const selectorGuard = `const b=$input.first().json?.body||{};if(b.clinic_id!=='${S.clinic_id}'||b.document_id!=='${S.document_id}')throw new Error('LAB030_DOCUMENT_SELECTORS_INVALID');return [{json:{clinic_id:b.clinic_id,document_id:b.document_id,content_hash:'${S.content_hash}'}}];`;
const inventoryQuery = `WITH target AS (
 SELECT v.* FROM vetatiende_documental.document_versions v JOIN vetatiende_documental.documents d ON d.document_id=v.document_id
 WHERE d.clinic_id=$1 AND d.document_id=$2 AND d.status='active' AND v.status='active' AND v.content_hash=$3
) SELECT
 COALESCE((SELECT jsonb_agg(jsonb_build_object('clinic_id',c.clinic_id,'name',c.name,'status',c.status,'created_at',c.created_at,'updated_at',c.updated_at)) FROM vetatiende_documental.clinics c WHERE c.clinic_id=$1),'[]'::jsonb) clinics,
 COALESCE((SELECT jsonb_agg(to_jsonb(d)) FROM vetatiende_documental.documents d WHERE d.clinic_id=$1 AND d.document_id=$2),'[]'::jsonb) documents,
 COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM target t),'[]'::jsonb) versions,
 COALESCE((SELECT jsonb_agg(jsonb_build_object('event_id',e.event_id,'clinic_id',e.clinic_id,'document_id',e.document_id,'version_id',e.version_id,'event_type',e.event_type,'result',e.result)) FROM vetatiende_documental.document_events e WHERE e.clinic_id=$1 AND e.document_id=$2 AND e.version_id IN (SELECT version_id FROM target)),'[]'::jsonb) events;`;
const inv = [
 hook('dyn-inv-hook', 'Entrada INVENTORY cleanup documental LAB-030', 'lab030-document-cleanup-inventory', -360),
 code('dyn-inv-guard', 'Validar selectores INVENTORY LAB-030', selectorGuard, 220, -360),
 pg('dyn-inv-pg', 'Inventariar PostgreSQL cleanup documental LAB-030', inventoryQuery, 440, -360, '={{ [$json.clinic_id,$json.document_id,$json.content_hash] }}'),
 code('dyn-inv-pg-check', 'Validar inventario PostgreSQL LAB-030', `const input=$('Validar selectores INVENTORY LAB-030').first().json,x=$input.first().json,c=x.clinics||[],d=x.documents||[],v=x.versions||[],e=x.events||[],expected=${JSON.stringify([...S.event_types].sort())};if(c.length!==1||d.length!==1||v.length!==1||e.length!==3||JSON.stringify(e.map(r=>r.event_type).sort())!==JSON.stringify(expected)||d[0].clinic_id!==input.clinic_id||d[0].document_id!==input.document_id||v[0].document_id!==input.document_id||v[0].status!=='active'||v[0].content_hash!==input.content_hash||!String(v[0].version_id||'').startsWith('ver_'+input.document_id+'_')||e.some(r=>r.clinic_id!==input.clinic_id||r.document_id!==input.document_id||r.version_id!==v[0].version_id||r.result!=='accepted'))throw new Error('LAB030_DOCUMENT_CLEANUP_INVENTORY_AMBIGUOUS');return [{json:{...input,version_id:String(v[0].version_id),events:e,clinic_snapshot:c[0]}}];`, 660, -360),
 q('dyn-inv-q', 'Inventariar Qdrant cleanup documental LAB-030', 'points/scroll', `={"limit":16,"with_payload":true,"with_vector":false,"filter":{"must":[{"key":"metadata.clinic_id","match":{"value":"{{ $json.clinic_id }}"}},{"key":"metadata.document_id","match":{"value":"{{ $json.document_id }}"}},{"key":"metadata.version_id","match":{"value":"{{ $json.version_id }}"}},{"key":"metadata.content_hash","match":{"value":"{{ $json.content_hash }}"}}]}}`, 880, -360),
 code('dyn-inv-result', 'Responder INVENTORY cleanup documental LAB-030', `const b=$('Validar inventario PostgreSQL LAB-030').first().json,p=$input.first().json?.result?.points||[];if(p.length!==1)throw new Error('LAB030_DOCUMENT_CLEANUP_QDRANT_AMBIGUOUS');const m=p[0]?.payload?.metadata||{};if(String(m.clinic_id)!==b.clinic_id||String(m.document_id)!==b.document_id||String(m.version_id)!==b.version_id||String(m.content_hash)!==b.content_hash||!String(p[0].id||''))throw new Error('LAB030_DOCUMENT_CLEANUP_QDRANT_MISMATCH');return [{json:{ok:true,phase:'INVENTORY',created_ids:{postgres_event_ids:b.events.map(e=>String(e.event_id)).sort(),postgres_version_ids:[b.version_id],postgres_document_ids:[b.document_id],qdrant_point_ids:[String(p[0].id)]},clinic_snapshot:b.clinic_snapshot,selectors:{clinic_id:b.clinic_id,document_id:b.document_id,version_id:b.version_id,content_hash:b.content_hash,collection:'${S.collection}'}}}];`, 1100, -360),
]; chain(inv);

const manifestGuard = confirm => `const b=$input.first().json?.body||{},ids=b.created_ids||{},s=b.selectors||{},c=b.clinic_snapshot||{},uniq=(a,n)=>Array.isArray(a)&&a.length===n&&a.length===new Set(a).size&&a.every(x=>typeof x==='string'&&x.length>0);if(b.confirm!=='${confirm}'||s.clinic_id!=='${S.clinic_id}'||s.document_id!=='${S.document_id}'||s.content_hash!=='${S.content_hash}'||s.collection!=='${S.collection}'||!/^ver_LAB030_QA_DOC_PUBLIC_HORARIOS_001_[A-Za-z0-9_-]+$/.test(s.version_id||'')||!uniq(ids.postgres_event_ids,3)||!uniq(ids.postgres_version_ids,1)||ids.postgres_version_ids[0]!==s.version_id||!uniq(ids.postgres_document_ids,1)||ids.postgres_document_ids[0]!==s.document_id||!uniq(ids.qdrant_point_ids,1)||c.clinic_id!==s.clinic_id||c.name!=='LAB030_QA Clínica Piloto 001'||c.status!=='active'||!c.created_at||!c.updated_at)throw new Error('LAB030_DOCUMENT_CLEANUP_MANIFEST_INVALID');return [{json:{created_ids:ids,selectors:s,clinic_snapshot:c}}];`;
const deleteQuery = `DO $cleanup$ DECLARE event_ids text[]:=ARRAY(SELECT jsonb_array_elements_text($1::jsonb)); BEGIN
 IF cardinality(event_ids)<>3 THEN RAISE EXCEPTION 'cleanup_event_ids_count_invalid'; END IF;
 IF (SELECT count(*) FROM vetatiende_documental.document_events WHERE event_id=ANY(event_ids) AND clinic_id=$2 AND document_id=$3 AND version_id=$4)<>3 THEN RAISE EXCEPTION 'cleanup_events_snapshot_mismatch'; END IF;
 IF (SELECT count(DISTINCT event_type) FROM vetatiende_documental.document_events WHERE event_id=ANY(event_ids) AND event_type IN ('staged','validated','activated'))<>3 THEN RAISE EXCEPTION 'cleanup_event_types_mismatch'; END IF;
 IF (SELECT count(*) FROM vetatiende_documental.document_versions WHERE version_id=$4 AND document_id=$3 AND content_hash=$5)<>1 THEN RAISE EXCEPTION 'cleanup_version_snapshot_mismatch'; END IF;
 IF (SELECT count(*) FROM vetatiende_documental.documents WHERE document_id=$3 AND clinic_id=$2)<>1 THEN RAISE EXCEPTION 'cleanup_document_snapshot_mismatch'; END IF;
 IF (SELECT count(*) FROM vetatiende_documental.clinics WHERE clinic_id=$2 AND name=$6 AND status=$7 AND created_at=$8::timestamptz AND updated_at=$9::timestamptz)<>1 THEN RAISE EXCEPTION 'cleanup_clinic_snapshot_changed'; END IF;
 DELETE FROM vetatiende_documental.document_events WHERE event_id=ANY(event_ids); DELETE FROM vetatiende_documental.document_versions WHERE version_id=$4 AND document_id=$3; DELETE FROM vetatiende_documental.documents WHERE document_id=$3 AND clinic_id=$2;
END $cleanup$; SELECT 3 deleted_events,1 deleted_versions,1 deleted_documents,0 deleted_clinics;`;
const del = [
 hook('dyn-del-hook', 'Entrada DELETE cleanup documental LAB-030', 'lab030-document-cleanup-delete', 0),
 code('dyn-del-guard', 'Validar manifest DELETE LAB-030', manifestGuard('LAB030_DOCUMENT_CLEANUP_EXECUTE'), 220, 0),
 q('dyn-del-q', 'Eliminar punto Qdrant exacto LAB-030', 'points/delete?wait=true', '={{ { points: $json.created_ids.qdrant_point_ids } }}', 440, 0),
 code('dyn-del-restore', 'Restaurar manifest DELETE LAB-030', "return [{json:$('Validar manifest DELETE LAB-030').first().json}];", 660, 0),
 pg('dyn-del-pg', 'Eliminar PostgreSQL exacto LAB-030', deleteQuery, 880, 0, '={{ [JSON.stringify($json.created_ids.postgres_event_ids),$json.selectors.clinic_id,$json.selectors.document_id,$json.selectors.version_id,$json.selectors.content_hash,$json.clinic_snapshot.name,$json.clinic_snapshot.status,$json.clinic_snapshot.created_at,$json.clinic_snapshot.updated_at] }}'),
 code('dyn-del-result', 'Responder DELETE cleanup documental LAB-030', "const x=$input.first().json;if(Number(x.deleted_events)!==3||Number(x.deleted_versions)!==1||Number(x.deleted_documents)!==1||Number(x.deleted_clinics)!==0)throw new Error('LAB030_DOCUMENT_CLEANUP_DELETE_RESULT_INVALID');return [{json:{ok:true,phase:'DELETE',deleted_events:3,deleted_versions:1,deleted_documents:1,deleted_clinics:0,post_check_required:true}}];", 1100, 0),
]; chain(del);

const postQuery = `SELECT
 (SELECT count(*) FROM vetatiende_documental.documents WHERE clinic_id=$1 AND document_id=$2) documents_remaining,
 (SELECT count(*) FROM vetatiende_documental.document_versions WHERE document_id=$2 AND version_id=$3) versions_remaining,
 (SELECT count(*) FROM vetatiende_documental.document_events WHERE event_id=ANY(ARRAY(SELECT jsonb_array_elements_text($4::jsonb))) OR (clinic_id=$1 AND document_id=$2 AND version_id=$3)) events_remaining,
 (SELECT jsonb_build_object('clinic_id',clinic_id,'name',name,'status',status,'created_at',created_at,'updated_at',updated_at) FROM vetatiende_documental.clinics WHERE clinic_id=$1) clinic_snapshot;`;
const post = [
 hook('dyn-post-hook', 'Entrada POST_CHECK cleanup documental LAB-030', 'lab030-document-cleanup-postcheck', 360),
 code('dyn-post-guard', 'Validar manifest POST_CHECK LAB-030', manifestGuard('LAB030_DOCUMENT_CLEANUP_POSTCHECK'), 220, 360),
 pg('dyn-post-pg', 'Verificar ausencia PostgreSQL LAB-030', postQuery, 440, 360, '={{ [$json.selectors.clinic_id,$json.selectors.document_id,$json.selectors.version_id,JSON.stringify($json.created_ids.postgres_event_ids)] }}'),
 q('dyn-post-q', 'Verificar ausencia Qdrant LAB-030', 'points/scroll', `={"limit":16,"with_payload":true,"with_vector":false,"filter":{"must":[{"key":"metadata.clinic_id","match":{"value":"{{ $('Validar manifest POST_CHECK LAB-030').first().json.selectors.clinic_id }}"}},{"key":"metadata.document_id","match":{"value":"{{ $('Validar manifest POST_CHECK LAB-030').first().json.selectors.document_id }}"}},{"key":"metadata.version_id","match":{"value":"{{ $('Validar manifest POST_CHECK LAB-030').first().json.selectors.version_id }}"}}]}}`, 660, 360),
 code('dyn-post-result', 'Responder POST_CHECK cleanup documental LAB-030', "const e=$('Validar manifest POST_CHECK LAB-030').first().json,pg=$('Verificar ausencia PostgreSQL LAB-030').first().json,p=$input.first().json?.result?.points||[],c=pg.clinic_snapshot||{},expected=e.clinic_snapshot||{};const clinicOk=['name','status','clinic_id','created_at','updated_at'].every(k=>String(c[k])===String(expected[k]));if(Number(pg.documents_remaining)!==0||Number(pg.versions_remaining)!==0||Number(pg.events_remaining)!==0||p.length!==0||!clinicOk)throw new Error('LAB030_DOCUMENT_CLEANUP_POSTCHECK_FAILED');return [{json:{ok:true,phase:'POST_CHECK',document_absent:true,version_absent:true,events_absent:true,qdrant_absent:true,clinic_preserved:true,residues_remaining:0}}];", 880, 360),
]; chain(post);

const workflow = { name: 'LAB-030 TEMP cleanup documental E2', active: false, versionId: 'lab030-temp-cleanup-documento-e2-v2', settings: { executionOrder: 'v1' }, nodes, connections };
await writeFile(path.join(dir, 'workflow_temporal_cleanup_documento_e2.json'), `${JSON.stringify(workflow, null, 2)}\n`);
console.log(`Generado workflow_temporal_cleanup_documento_e2.json (${nodes.length} nodos, active=false).`);
