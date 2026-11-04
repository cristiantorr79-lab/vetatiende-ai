import assert from 'node:assert/strict';
import { POSTGRES_INVENTORY_SQL } from './s03_inventory_readonly.mjs';
import { createPostgresReadonlyReader } from './s03_readers_e2.mjs';
import { buildPsqlInventoryCommand, createPsqlInventoryExecutor, postgresConnectionFromEnvironment } from './s03_postgres_executor.mjs';

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; process.stdout.write(`LOCAL_PASS ${name}\n`); }
const params = ['clinica_piloto_001', 'LAB031_S03_RUN_DOC_INTERNAL'];
const success = (rows = []) => ({ status: 0, stdout: `${JSON.stringify(rows)}\n`, stderr: '' });

await test('SELECT canónico usa psql sin shell y parámetros exactos', async () => {
  let request; const executor = createPsqlInventoryExecutor({ processEnv: {}, runProcess: async (value) => { request = value; return success(); } });
  await executor({ connection: { kind: 'conninfo', value: 'postgresql://external-secret' }, sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 5000, readOnly: true });
  assert.equal(request.command, 'psql'); assert.equal(request.options.shell, false);
  assert.ok(request.args.includes(`clinic_id=${params[0]}`)); assert.ok(request.args.includes(`document_id=${params[1]}`));
  assert.equal(request.args.includes('-c'), false); assert.equal(request.args.join(' ').includes('external-secret'), false);
  assert.equal(request.options.env.PGDATABASE, 'postgresql://external-secret'); assert.match(request.options.input, /BEGIN READ ONLY/); assert.match(request.options.input, /:'clinic_id'/);
});

await test('SQL arbitrario o escritura se rechazan antes del proceso', async () => {
  let calls = 0; const executor = createPsqlInventoryExecutor({ runProcess: async () => { calls += 1; return success(); } });
  await assert.rejects(() => executor({ connection: { kind: 'database', value: 'x' }, sql: 'SELECT 1', params, timeoutMs: 5000, readOnly: true }), /SQL_NO_AUTORIZADO/);
  await assert.rejects(() => executor({ connection: { kind: 'database', value: 'x' }, sql: `${POSTGRES_INVENTORY_SQL} DELETE FROM x`, params, timeoutMs: 5000, readOnly: true }), /SQL_NO_AUTORIZADO/); assert.equal(calls, 0);
});

await test('clínica o parámetros inesperados se rechazan', async () => {
  assert.throws(() => buildPsqlInventoryCommand({ sql: POSTGRES_INVENTORY_SQL, params: ['clinica inválida', params[1]], timeoutMs: 5000 }), /PARAMETROS_INVALIDOS/);
  assert.throws(() => buildPsqlInventoryCommand({ sql: POSTGRES_INVENTORY_SQL, params: [...params, 'extra'], timeoutMs: 5000 }), /PARAMETROS_INVALIDOS/);
});

await test('consulta queda dentro de transacción READ ONLY y statement timeout', async () => {
  const built = buildPsqlInventoryCommand({ sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 4321 }), command = built.input;
  assert.match(command, /^BEGIN READ ONLY;/); assert.match(command, /SET LOCAL statement_timeout = '4321ms'/); assert.match(command, /:'clinic_id'/); assert.match(command, /:'document_id'/); assert.doesNotMatch(command, /clinica_piloto_001/);
});

await test('salida JSON estructurada integra el lector PostgreSQL', async () => {
  const rows = [{ record_type: 'document', id: params[1] }];
  const executor = createPsqlInventoryExecutor({ runProcess: async () => success(rows) });
  const reader = createPostgresReadonlyReader({ executor, connection: { kind: 'database', value: 'external' }, timeoutMs: 5000 });
  assert.deepEqual(await reader({ query: POSTGRES_INVENTORY_SQL, params, read_only: true }), rows);
});

await test('resultado válido vacío se conserva como []', async () => {
  const executor = createPsqlInventoryExecutor({ runProcess: async () => success([]) });
  assert.deepEqual(await executor({ connection: { kind: 'database', value: 'x' }, sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 5000, readOnly: true }), []);
});

await test('error de conexión se clasifica sin detalle', async () => {
  const executor = createPsqlInventoryExecutor({ runProcess: async () => ({ status: 2, stdout: '', stderr: 'connection refused host=secret' }) });
  await assert.rejects(() => executor({ connection: { kind: 'database', value: 'secret-db' }, sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 5000, readOnly: true }), /^Error: S03_PSQL_CONEXION_ERROR$/);
});

await test('timeout se clasifica', async () => {
  const executor = createPsqlInventoryExecutor({ runProcess: async () => ({ status: null, signal: 'SIGTERM', error: { code: 'ETIMEDOUT' }, stdout: '', stderr: '' }) });
  await assert.rejects(() => executor({ connection: { kind: 'database', value: 'x' }, sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 5000, readOnly: true }), /S03_PSQL_TIMEOUT/);
});

await test('error SQL se distingue de conexión', async () => {
  const executor = createPsqlInventoryExecutor({ runProcess: async () => ({ status: 1, stdout: '', stderr: 'syntax error at or near secret' }) });
  await assert.rejects(() => executor({ connection: { kind: 'database', value: 'x' }, sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 5000, readOnly: true }), /^Error: S03_PSQL_SQL_ERROR$/);
});

await test('salida malformada se rechaza', async () => {
  for (const stdout of ['not-json\n', '{}\n', '[]\n[]\n']) {
    const executor = createPsqlInventoryExecutor({ runProcess: async () => ({ status: 0, stdout, stderr: '' }) });
    await assert.rejects(() => executor({ connection: { kind: 'database', value: 'x' }, sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 5000, readOnly: true }), /RESPUESTA_MALFORMADA/);
  }
});

await test('configuración externa es obligatoria y secretos no aparecen en errores', async () => {
  assert.throws(() => postgresConnectionFromEnvironment({}), /CONFIGURACION_AUSENTE_O_AMBIGUA/);
  assert.deepEqual(postgresConnectionFromEnvironment({ LAB031_S03_POSTGRES_DATABASE: 'vetatiende' }), { kind: 'database', value: 'vetatiende' });
  assert.deepEqual(postgresConnectionFromEnvironment({ LAB031_S03_POSTGRES_URI: 'postgresql://secret-value' }), { kind: 'conninfo', value: 'postgresql://secret-value' });
  assert.throws(() => postgresConnectionFromEnvironment({ LAB031_S03_POSTGRES_DATABASE: 'db', LAB031_S03_POSTGRES_URI: 'postgresql://x' }), /AMBIGUA/);
  const executor = createPsqlInventoryExecutor({ runProcess: async () => { throw new Error('secret-value'); } });
  await assert.rejects(() => executor({ connection: { kind: 'database', value: 'secret-value' }, sql: POSTGRES_INVENTORY_SQL, params, timeoutMs: 5000, readOnly: true }), (error) => error.message === 'S03_PSQL_PROCESO_ERROR' && !error.message.includes('secret-value'));
});

process.stdout.write(`RESULT LOCAL_PASS=${passed}/11 E2_NOT_VERIFIED psql_calls_real=0 network_calls=0\n`);
