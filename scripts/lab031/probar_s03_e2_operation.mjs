import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPostgresDelete, createQdrantDelete, executeS03E2, prepareRuntimeWorkflow } from './s03_e2_operation.mjs';

let passed=0; async function test(name,fn){await fn();passed++;process.stdout.write(`LOCAL_PASS ${name}\n`);}

await test('driver runtime conecta una sola rama, fija Management y permanece inactivo',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'s03-driver-test-'));
  try {
    const path=await prepareRuntimeWorkflow({driverId:'tempDriver123',directory}); const [workflow]=JSON.parse(await readFile(path,'utf8'));
    assert.equal(workflow.id,'tempDriver123'); assert.equal(workflow.active,false);
    const values=Object.fromEntries(workflow.nodes.find((n)=>n.name==='Configurar gates bloqueados S-03').parameters.assignments.assignments.map((x)=>[x.name,x.value]));
    assert.equal(values.management_workflow_id,'s0NoyEyVtO9AgJUk');
    assert.equal(workflow.connections['¿Gates completos S-03?'].main[0][0].node,'Invocar Management LAB-029 S-03');
    assert.equal(workflow.connections['¿Gates completos S-03?'].main[1][0].node,'Detener invocador S-03 bloqueado');
  } finally { await rm(directory,{recursive:true,force:true}); }
});

await test('cleanup PostgreSQL usa stdin, transacción y orden exacto',async()=>{
  let request; const run=(value)=>{request=value;return {status:0,stdout:'["event-1"]\n["version-1"]\n["DOC"]\n',stderr:''};};
  const remove=createPostgresDelete({connection:{kind:'conninfo',value:'postgresql://private'},run,processEnv:{}});
  const resources=[{store:'postgres',type:'document',id:'DOC'},{store:'postgres',type:'version',id:'version-1'},{store:'postgres',type:'event',id:'event-1'}];
  const result=await remove({clinic_id:'clinic_001',document_id:'DOC',resources});
  assert.equal(result.deleted.length,3); assert.equal(request.command,'psql'); assert.equal(request.options.shell,false);
  assert.match(request.options.input,/BEGIN;/); assert.ok(request.options.input.indexOf('document_events')<request.options.input.indexOf('document_versions')); assert.ok(request.options.input.indexOf('document_versions')<request.options.input.indexOf('documents WHERE'));
  assert.equal(request.options.env.PGDATABASE,'postgresql://private'); assert.doesNotMatch(request.args.join(' '),/postgresql:\/\//);
});

await test('cleanup PostgreSQL rechaza cardinalidad parcial',async()=>{
  const remove=createPostgresDelete({connection:{kind:'database',value:'db'},run:()=>({status:0,stdout:'["event-1"]\n[]\n["DOC"]\n',stderr:''}),processEnv:{}});
  await assert.rejects(()=>remove({clinic_id:'clinic_001',document_id:'DOC',resources:[{type:'document',id:'DOC'},{type:'version',id:'version-1'},{type:'event',id:'event-1'}]}),/DELETE_DIFIERE/);
});

await test('cleanup Qdrant envía exclusivamente point IDs observados',async()=>{
  let request; const remove=createQdrantDelete({env:{LAB031_S03_QDRANT_URL:'https://qdrant.invalid',LAB031_S03_QDRANT_API_KEY:'private'},fetchImpl:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({status:'ok'})};}});
  const result=await remove({collection:'vetatiende_interno',point_ids:['p1','p2']});
  assert.deepEqual(result.deleted,['qdrant:point:p1','qdrant:point:p2']); assert.deepEqual(JSON.parse(request.options.body),{points:['p1','p2']}); assert.match(request.url,/points\/delete\?wait=true$/);
});

await test('sin confirmación externa bloquea antes de E2',async()=>{
  let calls=0; await assert.rejects(()=>executeS03E2({env:{},run:()=>{calls++;}}),/CONFIGURACION_INCOMPLETA/); assert.equal(calls,0);
});

process.stdout.write(`RESULT LOCAL_PASS=${passed}/5 E2_NOT_EXECUTED network_calls_real=0 destructive_calls_real=0\n`);
