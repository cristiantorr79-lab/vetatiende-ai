export const usuariosInternosFixtureValidos=(input,rows)=>{
  const lower=String(input?.prefix||'').toLowerCase(),ids=input?.ids||{};
  const expected=[
    {user_id:`${lower}_user_a`,clinic_id:ids.clinic_a,identity_subject:`${lower}_subject_a`},
    {user_id:`${lower}_user_b`,clinic_id:ids.clinic_b,identity_subject:`${lower}_subject_b`}
  ];
  const fixtures=(Array.isArray(rows)?rows:[]).filter(row=>expected.some(item=>item.user_id===row.user_id));
  return fixtures.length===2&&expected.every(item=>fixtures.some(row=>row.user_id===item.user_id&&row.clinic_id===item.clinic_id&&row.identity_provider==='lab029_runtime'&&row.identity_subject===item.identity_subject&&row.rol==='veterinario'&&row.estado==='activo'));
};
export const permisosInternosFixtureValidos=(input,rows)=>{
  const ids=input?.ids||{},expected=[ids.clinic_a,ids.clinic_b];
  const fixtures=(Array.isArray(rows)?rows:[]).filter(row=>expected.includes(row.clinic_id)&&row.rol==='veterinario'&&row.permiso==='rag_interno_consultar');
  return fixtures.length===2&&expected.every(clinicId=>fixtures.some(row=>row.clinic_id===clinicId&&row.rol==='veterinario'&&row.permiso==='rag_interno_consultar'&&row.estado==='activo'));
};

const ASSERTIONS_CODE=`const safeAll=n=>{try{return $(n).all().map(x=>x.json||{});}catch{return [];}};
const safeRead=n=>{try{return $(n).first()?.json||{};}catch{return {};}};
const usuariosInternosFixtureValidos=${usuariosInternosFixtureValidos.toString()};
const permisosInternosFixtureValidos=${permisosInternosFixtureValidos.toString()};
const input=safeRead('Validar solicitud verificador LAB-029');
const pg=safeAll('Consultar estado PostgreSQL LAB-029');
const docs=pg.filter(x=>x.record_type==='version'&&x.version_id);
const events=Object.fromEntries(pg.filter(x=>x.record_type==='event').map(x=>[x.event_type,Number(x.event_count)]));
const identityRows=safeAll('Verificar usuarios internos runtime LAB-029').filter(x=>x.user_id);
const permissionRows=safeAll('Verificar permisos internos runtime LAB-029').filter(x=>x.clinic_id);
const status=(documentId,hash)=>docs.find(x=>x.document_id===documentId&&(!hash||x.content_hash===hash))?.status;
const count=documentId=>docs.filter(x=>x.document_id===documentId).length;
const ids=input.ids||{},hashes=input.hashes||{};
const a=ids.document_public_a,b=ids.document_public_b,i=ids.document_internal_a;
const h1=hashes.gestion_public_v1,h2=hashes.gestion_public_v2,hb=hashes.gestion_public_b,hi=hashes.gestion_internal_a;
const assertions=[];const check=(name,ok)=>assertions.push({name,ok:Boolean(ok)});
check('solicitud_valida',input.request_valid===true);
check('postgres_disponible',pg.length>0&&!pg.some(x=>x.error));
const cp=input.checkpoint;
if(cp==='setup'){
  check('clinicas_fixture_preparadas',pg.filter(x=>x.record_type==='clinic').length===2);
  check('usuarios_internos_fixture_preparados',usuariosInternosFixtureValidos(input,identityRows));
  check('permisos_internos_fixture_preparados',permisosInternosFixtureValidos(input,permissionRows));
}
if(cp==='cleanup_identities'){check('usuarios_internos_fixture_eliminados',identityRows.length===0);check('permisos_internos_fixture_eliminados',permissionRows.length===0);}
if(cp==='prepare_g02')check('g02_preparado',pg.some(x=>x.record_type==='prepared'&&x.document_id===a&&x.status==='ready'));
if(cp==='g01')check('cero_residuos_postgres',docs.length===0&&Object.keys(events).length===0);
if(cp==='g02'){check('v1_active_postgres',count(a)===1&&status(a,h1)==='active');for(const t of ['staged','validated','activated'])check('evento_'+t,events[t]>=1);}
if(cp==='g03'){check('una_version_postgres',count(a)===1);check('evento_no_changes',events.no_changes>=1);}
if(cp==='g04'){check('v1_superseded_postgres',status(a,h1)==='superseded');check('v2_active_postgres',status(a,h2)==='active');}
if(cp==='g05'){check('v2_preservada_postgres',status(a,h2)==='active');check('failed_postgres',docs.some(x=>x.document_id===a&&x.status==='failed'));check('evento_failed',events.failed>=1);}
if(cp==='g06'){check('v1_reactivada_postgres',status(a,h1)==='active');check('v2_superseded_postgres',status(a,h2)==='superseded');check('evento_rollback',events.rollback>=1);}
if(cp==='g07')check('internal_active_postgres',status(i,hi)==='active');
if(cp==='g08')check('public_b_active_postgres',status(b,hb)==='active');
if(cp==='g09')for(const t of ['staged','no_changes','validated','activated','failed','rollback'])check('evento_'+t,events[t]>=1);
if(cp==='p05'){check('public_a_active_postgres',status(a,h1)==='active');check('public_b_active_postgres',status(b,hb)==='active');}
if(cp==='i05')check('internal_active_postgres',status(i,hi)==='active');
const versions={public_a_v1:docs.find(x=>x.document_id===a&&x.content_hash===h1)?.version_id||null,public_a_v2:docs.find(x=>x.document_id===a&&x.content_hash===h2)?.version_id||null,public_b:docs.find(x=>x.document_id===b&&x.content_hash===hb)?.version_id||null,internal_a:docs.find(x=>x.document_id===i&&x.content_hash===hi)?.version_id||null,failed:docs.find(x=>x.document_id===a&&x.status==='failed')?.version_id||null};
const fingerprint=JSON.stringify(docs.map(x=>[x.document_id,x.version_id,x.status,x.content_hash]).sort());
if(cp==='persistence')check('fingerprint_postgres_persistente',input.persistence_baseline?.fingerprint===fingerprint);
return [{json:{ok:assertions.every(x=>x.ok),checkpoint:String(cp||''),assertions,versions,postgres_rows:docs.length,event_counts:events,fingerprint,metrics:{public_a_versions:count(a)}}}];`;

export function crearWorkflowVerificadorRuntime({name,path,prefix,headerCredentials}){
  const table={__rl:true,value:'tTLj4q6JRRta8bdH',mode:'list',cachedResultName:'lab025_usuarios_internos',cachedResultUrl:'/projects/WS8DFPmFaG2eZFOj/datatables/tTLj4q6JRRta8bdH'};
  const permissionTable={__rl:true,value:'ZIV6jWevCteTInzo',mode:'list',cachedResultName:'lab025_permisos_roles',cachedResultUrl:'/projects/WS8DFPmFaG2eZFOj/datatables/ZIV6jWevCteTInzo'};
  const schema=['user_id','clinic_id','identity_provider','identity_subject','rol','estado'].map(id=>({id,displayName:id,required:false,defaultMatch:false,display:true,type:'string',readOnly:false,removed:false}));
  const userValue=side=>({user_id:`={{ $('Preparar operación identidades runtime LAB-029').first().json.identity_users.user_${side} }}`,clinic_id:`={{ $('Preparar operación identidades runtime LAB-029').first().json.ids.clinic_${side} }}`,identity_provider:'lab029_runtime',identity_subject:`={{ $('Preparar operación identidades runtime LAB-029').first().json.identity_subjects.subject_${side} }}`,rol:'veterinario',estado:'activo'});
  const upsert=(side,x)=>({id:`${prefix}_identity_upsert_${side}`,name:`Crear o actualizar usuario interno ${side.toUpperCase()} LAB-029`,type:'n8n-nodes-base.dataTable',typeVersion:1.1,position:[x,-180],parameters:{operation:'upsert',dataTableId:table,filters:{conditions:[{keyName:'user_id',keyValue:`={{ $('Preparar operación identidades runtime LAB-029').first().json.identity_users.user_${side} }}`}]},columns:{mappingMode:'defineBelow',value:userValue(side),matchingColumns:[],schema,attemptToConvertTypes:false,convertFieldsToString:false},options:{}}});
  const remove=(side,x)=>({id:`${prefix}_identity_delete_${side}`,name:`Eliminar usuario interno ${side.toUpperCase()} LAB-029`,type:'n8n-nodes-base.dataTable',typeVersion:1.1,position:[x,180],alwaysOutputData:true,parameters:{operation:'deleteRows',dataTableId:table,filters:{conditions:[{keyName:'user_id',keyValue:`={{ $('Preparar operación identidades runtime LAB-029').first().json.identity_users.user_${side} }}`}]}}});
  const permissionSchema=['clinic_id','rol','permiso','estado','fecha_actualizacion'].map(id=>({id,displayName:id,required:false,defaultMatch:false,display:true,type:'string',readOnly:false,removed:false}));
  const permissionFilters=side=>[{keyName:'clinic_id',keyValue:`={{ $('Preparar operación identidades runtime LAB-029').first().json.ids.clinic_${side} }}`},{keyName:'rol',keyValue:'veterinario'},{keyName:'permiso',keyValue:'rag_interno_consultar'}];
  const upsertPermission=(side,x)=>({id:`${prefix}_permission_upsert_${side}`,name:`Crear o actualizar permiso interno ${side.toUpperCase()} LAB-029`,type:'n8n-nodes-base.dataTable',typeVersion:1.1,position:[x,-180],parameters:{operation:'upsert',dataTableId:permissionTable,matchType:'allConditions',filters:{conditions:permissionFilters(side)},columns:{mappingMode:'defineBelow',value:{clinic_id:`={{ $('Preparar operación identidades runtime LAB-029').first().json.ids.clinic_${side} }}`,rol:'veterinario',permiso:'rag_interno_consultar',estado:'activo',fecha_actualizacion:'={{ $now.toISO() }}'},matchingColumns:[],schema:permissionSchema,attemptToConvertTypes:false,convertFieldsToString:false},options:{}}});
  const removePermission=(side,x)=>({id:`${prefix}_permission_delete_${side}`,name:`Eliminar permiso interno ${side.toUpperCase()} LAB-029`,type:'n8n-nodes-base.dataTable',typeVersion:1.1,position:[x,180],alwaysOutputData:true,parameters:{operation:'deleteRows',dataTableId:permissionTable,matchType:'allConditions',filters:{conditions:permissionFilters(side)}}});
  const nodes=[
    {id:`${prefix}_hook`,name:'Entrada verificador runtime LAB-029',type:'n8n-nodes-base.webhook',typeVersion:2,position:[0,0],parameters:{httpMethod:'POST',path,authentication:'headerAuth',responseMode:'responseNode',options:{}},credentials:headerCredentials,webhookId:`${prefix}_hook`},
    {id:`${prefix}_input`,name:'Validar solicitud verificador LAB-029',type:'n8n-nodes-base.code',typeVersion:2,position:[220,0],alwaysOutputData:true,parameters:{jsCode:"const b=$json.body||{};const prefix=String(b.prefix||'');const lower=prefix.toLowerCase();const ids=b.ids||{};const controlled=/^LAB029_TEST_[A-Za-z0-9][A-Za-z0-9_-]{5,51}$/.test(prefix)&&ids.clinic_a===lower+'_clinic_a'&&ids.clinic_b===lower+'_clinic_b';const valid=controlled&&b.hashes&&b.checkpoint;return [{json:{...b,ids,hashes:b.hashes||{},checkpoint:String(b.checkpoint||''),request_valid:Boolean(valid)}}];"}},
    {id:`${prefix}_pg`,name:'Consultar estado PostgreSQL LAB-029',type:'n8n-nodes-base.postgres',typeVersion:2.6,position:[440,0],alwaysOutputData:true,onError:'continueRegularOutput',parameters:{operation:'executeQuery',query:"WITH fixture_input(clinic_id,name) AS (VALUES ($1::text,$4::text),($2::text,$5::text)), ensured AS (INSERT INTO vetatiende_documental.clinics(clinic_id,name,status) SELECT clinic_id,name,'active' FROM fixture_input WHERE $3='setup' AND clinic_id LIKE 'lab029_test\\_%' ESCAPE '\\' ON CONFLICT (clinic_id) DO UPDATE SET name=EXCLUDED.name,status='active' RETURNING clinic_id), authorized_g02 AS (SELECT $1::text clinic_id,$6::text document_id WHERE $3='prepare_g02' AND $7 LIKE 'LAB029_TEST\\_%' ESCAPE '\\' AND $1=lower($7)||'_clinic_a' AND $6=$7||'_DOC_PUBLIC_A' AND NOT EXISTS (SELECT 1 FROM vetatiende_documental.document_versions v WHERE v.document_id=$6 AND v.status NOT IN ('staging','failed'))), deleted_events AS (DELETE FROM vetatiende_documental.document_events e USING authorized_g02 a WHERE e.clinic_id=a.clinic_id AND e.document_id=a.document_id RETURNING e.event_id), deleted_versions AS (DELETE FROM vetatiende_documental.document_versions v USING authorized_g02 a WHERE v.document_id=a.document_id AND v.status IN ('staging','failed') AND (SELECT count(*) FROM deleted_events)>=0 RETURNING v.version_id), deleted_document AS (DELETE FROM vetatiende_documental.documents d USING authorized_g02 a WHERE d.clinic_id=a.clinic_id AND d.document_id=a.document_id AND NOT EXISTS (SELECT 1 FROM vetatiende_documental.document_versions v WHERE v.document_id=d.document_id) AND (SELECT count(*) FROM deleted_versions)>=0 RETURNING d.document_id), prepared AS (SELECT 'prepared'::text record_type,a.document_id,NULL::text version_id,'ready'::text status,NULL::text content_hash,NULL::text event_type,NULL::bigint event_count FROM authorized_g02 a WHERE (SELECT count(*) FROM deleted_document)>=0) SELECT 'clinic'::text record_type,NULL::text document_id,NULL::text version_id,NULL::text status,NULL::text content_hash,NULL::text event_type,NULL::bigint event_count FROM ensured UNION ALL SELECT * FROM prepared UNION ALL SELECT 'version',d.document_id,v.version_id::text,v.status::text,v.content_hash,NULL,NULL FROM vetatiende_documental.documents d LEFT JOIN vetatiende_documental.document_versions v USING(document_id) WHERE d.clinic_id IN ($1,$2) UNION ALL SELECT 'event',e.document_id,e.version_id::text,NULL,NULL,e.event_type::text,count(*) FROM vetatiende_documental.document_events e WHERE e.clinic_id IN ($1,$2) GROUP BY e.document_id,e.version_id,e.event_type",options:{queryReplacement:"={{ [$json.ids.clinic_a||null,$json.ids.clinic_b||null,$json.checkpoint||'',($json.prefix||'')+' Clínica A',($json.prefix||'')+' Clínica B',$json.ids.document_public_a||null,$json.prefix||''] }}"}},credentials:{postgres:{id:'vpbKJO7irGofixTr',name:'Postgres account'}}},
    {id:`${prefix}_identity_context`,name:'Preparar operación identidades runtime LAB-029',type:'n8n-nodes-base.code',typeVersion:2,position:[660,0],alwaysOutputData:true,parameters:{jsCode:"const input=$('Validar solicitud verificador LAB-029').first().json;const lower=String(input.prefix||'').toLowerCase();if(!input.request_valid)throw new Error('identidad_runtime_no_autorizada');return [{json:{...input,identity_action:input.checkpoint==='setup'?'setup':input.checkpoint==='cleanup_identities'?'cleanup':'none',identity_users:{user_a:lower+'_user_a',user_b:lower+'_user_b'},identity_subjects:{subject_a:lower+'_subject_a',subject_b:lower+'_subject_b'}}}];"}},
    {id:`${prefix}_identity_setup_if`,name:'¿Preparar identidades runtime LAB-029?',type:'n8n-nodes-base.if',typeVersion:2.2,position:[880,0],parameters:{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:3},conditions:[{id:`${prefix}_identity_setup_condition`,leftValue:"={{ $json.identity_action === 'setup' }}",rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}},
    upsert('a',1100),upsert('b',1320),upsertPermission('a',1540),upsertPermission('b',1760),
    {id:`${prefix}_identity_cleanup_if`,name:'¿Eliminar identidades runtime LAB-029?',type:'n8n-nodes-base.if',typeVersion:2.2,position:[1100,90],parameters:{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:3},conditions:[{id:`${prefix}_identity_cleanup_condition`,leftValue:"={{ $json.identity_action === 'cleanup' }}",rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}},
    removePermission('a',1320),removePermission('b',1540),remove('a',1760),remove('b',1980),
    {id:`${prefix}_identity_verify`,name:'Verificar usuarios internos runtime LAB-029',type:'n8n-nodes-base.dataTable',typeVersion:1.1,position:[2200,-60],alwaysOutputData:true,executeOnce:true,parameters:{operation:'get',dataTableId:table,matchType:'anyCondition',filters:{conditions:[{keyName:'user_id',keyValue:"={{ $('Preparar operación identidades runtime LAB-029').first().json.identity_users.user_a }}"},{keyName:'user_id',keyValue:"={{ $('Preparar operación identidades runtime LAB-029').first().json.identity_users.user_b }}"}]}}},
    {id:`${prefix}_permission_verify`,name:'Verificar permisos internos runtime LAB-029',type:'n8n-nodes-base.dataTable',typeVersion:1.1,position:[2420,0],alwaysOutputData:true,executeOnce:true,parameters:{operation:'get',dataTableId:permissionTable,matchType:'anyCondition',filters:{conditions:[{keyName:'clinic_id',keyValue:"={{ $('Preparar operación identidades runtime LAB-029').first().json.ids.clinic_a }}"},{keyName:'clinic_id',keyValue:"={{ $('Preparar operación identidades runtime LAB-029').first().json.ids.clinic_b }}"}]}}},
    {id:`${prefix}_assert`,name:'Evaluar assertions runtime LAB-029',type:'n8n-nodes-base.code',typeVersion:2,position:[2640,0],alwaysOutputData:true,parameters:{jsCode:ASSERTIONS_CODE}},
    {id:`${prefix}_response`,name:'Responder verificación runtime LAB-029',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.4,position:[2860,0],parameters:{respondWith:'json',responseBody:"={{ { ok: $json.ok === true, checkpoint: String($json.checkpoint || ''), assertions: Array.isArray($json.assertions) ? $json.assertions : [], summary: { versions: $json.versions || {}, postgres_rows: Number($json.postgres_rows || 0), event_counts: $json.event_counts || {}, fingerprint: String($json.fingerprint || ''), metrics: $json.metrics || {} } } }}",options:{responseCode:'={{ $json.ok ? 200 : 409 }}'}}}
  ];
  const connections={
    'Entrada verificador runtime LAB-029':{main:[[{node:'Validar solicitud verificador LAB-029',type:'main',index:0}]]},
    'Validar solicitud verificador LAB-029':{main:[[{node:'Consultar estado PostgreSQL LAB-029',type:'main',index:0}]]},
    'Consultar estado PostgreSQL LAB-029':{main:[[{node:'Preparar operación identidades runtime LAB-029',type:'main',index:0}]]},
    'Preparar operación identidades runtime LAB-029':{main:[[{node:'¿Preparar identidades runtime LAB-029?',type:'main',index:0}]]},
    '¿Preparar identidades runtime LAB-029?':{main:[[{node:'Crear o actualizar usuario interno A LAB-029',type:'main',index:0}],[{node:'¿Eliminar identidades runtime LAB-029?',type:'main',index:0}]]},
    'Crear o actualizar usuario interno A LAB-029':{main:[[{node:'Crear o actualizar usuario interno B LAB-029',type:'main',index:0}]]},
    'Crear o actualizar usuario interno B LAB-029':{main:[[{node:'Crear o actualizar permiso interno A LAB-029',type:'main',index:0}]]},
    'Crear o actualizar permiso interno A LAB-029':{main:[[{node:'Crear o actualizar permiso interno B LAB-029',type:'main',index:0}]]},
    'Crear o actualizar permiso interno B LAB-029':{main:[[{node:'Verificar usuarios internos runtime LAB-029',type:'main',index:0}]]},
    '¿Eliminar identidades runtime LAB-029?':{main:[[{node:'Eliminar permiso interno A LAB-029',type:'main',index:0}],[{node:'Evaluar assertions runtime LAB-029',type:'main',index:0}]]},
    'Eliminar permiso interno A LAB-029':{main:[[{node:'Eliminar permiso interno B LAB-029',type:'main',index:0}]]},
    'Eliminar permiso interno B LAB-029':{main:[[{node:'Eliminar usuario interno A LAB-029',type:'main',index:0}]]},
    'Eliminar usuario interno A LAB-029':{main:[[{node:'Eliminar usuario interno B LAB-029',type:'main',index:0}]]},
    'Eliminar usuario interno B LAB-029':{main:[[{node:'Verificar usuarios internos runtime LAB-029',type:'main',index:0}]]},
    'Verificar usuarios internos runtime LAB-029':{main:[[{node:'Verificar permisos internos runtime LAB-029',type:'main',index:0}]]},
    'Verificar permisos internos runtime LAB-029':{main:[[{node:'Evaluar assertions runtime LAB-029',type:'main',index:0}]]},
    'Evaluar assertions runtime LAB-029':{main:[[{node:'Responder verificación runtime LAB-029',type:'main',index:0}]]}
  };
  return {name,active:false,nodes,connections,settings:{executionOrder:'v1'}};
}
