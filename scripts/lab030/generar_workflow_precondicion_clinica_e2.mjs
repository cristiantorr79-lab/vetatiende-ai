import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(scriptDir, 'fixtures', 'asegurar_clinica_piloto_001.sql');
const outputPath = path.join(scriptDir, 'workflow_temporal_precondicion_clinica_e2.json');
const sql = (await readFile(sqlPath, 'utf8')).trim();

assert.match(sql, /INSERT INTO vetatiende_documental\.clinics \(clinic_id, name, status\)/);
assert.match(sql, /ON CONFLICT \(clinic_id\) DO NOTHING/);
assert.match(sql, /ALREADY_EXISTS_UNCHANGED/);
assert.match(sql, /post_check_valid/);
assert.doesNotMatch(sql, /DO UPDATE|DELETE FROM|UPDATE\s+vetatiende_documental\.clinics/i);

const workflow = {
  name: 'LAB-030 TEMP precondición clínica QA E2',
  active: false,
  settings: { executionOrder: 'v1' },
  versionId: 'lab030-temp-precondicion-clinica-e2-v1',
  nodes: [
    {
      id: 'lab030-clinic-webhook',
      name: 'Entrada protegida precondición clínica LAB-030',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 0],
      webhookId: 'lab030-qa-ensure-clinic',
      parameters: {
        httpMethod: 'POST',
        path: 'lab030-qa-ensure-clinic',
        authentication: 'headerAuth',
        responseMode: 'lastNode',
        options: {},
      },
      credentials: {
        httpHeaderAuth: {
          id: 'CONFIGURE_EXISTING_HEADER_AUTH',
          name: 'VetAtiende Internal Header Auth',
        },
      },
    },
    {
      id: 'lab030-clinic-pg',
      name: 'Asegurar clínica sintética PostgreSQL LAB-030',
      type: 'n8n-nodes-base.postgres',
      typeVersion: 2.6,
      position: [240, 0],
      parameters: {
        operation: 'executeQuery',
        query: sql,
        options: {},
      },
      credentials: {
        postgres: {
          id: 'CONFIGURE_EXISTING_POSTGRES',
          name: 'Postgres account',
        },
      },
    },
    {
      id: 'lab030-clinic-validate',
      name: 'Validar evidencia clínica sintética LAB-030',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [480, 0],
      parameters: {
        mode: 'runOnceForAllItems',
        jsCode: "const rows=$input.all().map(x=>x.json);if(rows.length!==1)throw new Error('LAB030_QA_CLINIC_RESULT_AMBIGUOUS');const x=rows[0];if(x.clinic_id!=='clinica_piloto_001'||x.name!=='LAB030_QA Clínica Piloto 001'||x.status!=='active'||x.post_check_valid!==true||!['CREATED','ALREADY_EXISTS_UNCHANGED'].includes(x.fixture_result))throw new Error('LAB030_QA_CLINIC_FINAL_STATE_INVALID');return [{json:{ok:true,clinic_id:x.clinic_id,name:x.name,status:x.status,fixture_result:x.fixture_result,post_check_valid:true}}];",
      },
    },
  ],
  connections: {
    'Entrada protegida precondición clínica LAB-030': {
      main: [[{ node: 'Asegurar clínica sintética PostgreSQL LAB-030', type: 'main', index: 0 }]],
    },
    'Asegurar clínica sintética PostgreSQL LAB-030': {
      main: [[{ node: 'Validar evidencia clínica sintética LAB-030', type: 'main', index: 0 }]],
    },
  },
};

await writeFile(outputPath, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
console.log(`Generado ${path.relative(scriptDir, outputPath)} (${workflow.nodes.length} nodos, active=${workflow.active}).`);
