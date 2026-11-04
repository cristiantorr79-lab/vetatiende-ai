import { spawnSync } from 'node:child_process';
import { POSTGRES_INVENTORY_SQL } from './s03_inventory_readonly.mjs';

const fail = (reason) => { throw new Error(`S03_PSQL_${reason}`); };
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$/;
const WRITE = /\b(?:INSERT|UPDATE|DELETE|MERGE|COPY|ALTER|DROP|CREATE|TRUNCATE|GRANT|REVOKE|CALL|DO|VACUUM|REINDEX|CLUSTER)\b/i;
const connectionError = /(?:could not connect|connection (?:refused|timed out)|could not translate host|password authentication failed|no pg_hba\.conf entry|server closed the connection)/i;

function canonical(sql) { return String(sql || '').replace(/\s+/g, ' ').trim().replace(/;$/, ''); }

export function buildPsqlInventoryCommand({ sql, params, timeoutMs = 15000 }) {
  if (canonical(sql) !== canonical(POSTGRES_INVENTORY_SQL) || WRITE.test(sql)) fail('SQL_NO_AUTORIZADO');
  if (!Array.isArray(params) || params.length !== 2 || !params.every((value) => ID.test(String(value)))) fail('PARAMETROS_INVALIDOS');
  const timeout = Number(timeoutMs);
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120000) fail('TIMEOUT_INVALIDO');
  const parameterized = canonical(POSTGRES_INVENTORY_SQL).replaceAll('$1', `:'clinic_id'`).replaceAll('$2', `:'document_id'`);
  const wrapped = `BEGIN READ ONLY; SET LOCAL statement_timeout = '${timeout}ms'; SELECT COALESCE(json_agg(row_to_json(inventory_rows)), '[]'::json)::text FROM (${parameterized}) AS inventory_rows; COMMIT;`;
  return Object.freeze({
    command: 'psql',
    args: ['-X', '--no-psqlrc', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-v', `clinic_id=${params[0]}`, '-v', `document_id=${params[1]}`],
    input: `${wrapped}\n`,
    timeoutMs: timeout,
  });
}

function parseRows(stdout) {
  const lines = String(stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 1) fail('RESPUESTA_MALFORMADA');
  let value; try { value = JSON.parse(lines[0]); } catch { fail('RESPUESTA_MALFORMADA'); }
  if (!Array.isArray(value) || value.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) fail('RESPUESTA_MALFORMADA');
  return value;
}

export function createPsqlInventoryExecutor({ runProcess = (request) => spawnSync(request.command, request.args, request.options), processEnv = process.env } = {}) {
  if (typeof runProcess !== 'function') fail('RUNNER_REQUERIDO');
  return async ({ connection, sql, params, timeoutMs, readOnly }) => {
    if (readOnly !== true) fail('READ_ONLY_REQUERIDO');
    if (!connection || typeof connection !== 'object' || !['database', 'conninfo'].includes(connection.kind) || typeof connection.value !== 'string' || !connection.value) fail('CONEXION_REQUERIDA');
    if (connection.kind === 'database' && !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/.test(connection.value)) fail('BASE_DATOS_INVALIDA');
    if (connection.kind === 'conninfo' && !/^(?:postgres(?:ql)?:\/\/|[a-zA-Z_][a-zA-Z0-9_]*=)/.test(connection.value)) fail('CONNINFO_INVALIDO');
    const request = buildPsqlInventoryCommand({ sql, params, timeoutMs });
    // libpq acepta tanto dbname simple como URI/conninfo en PGDATABASE; se tipan para no confundirlos.
    const env = { ...processEnv, PGDATABASE: connection.value, PGCONNECT_TIMEOUT: String(Math.max(1, Math.ceil(request.timeoutMs / 1000))) };
    let result;
    try { result = await runProcess({ command: request.command, args: request.args, options: { shell: false, windowsHide: true, encoding: 'utf8', timeout: request.timeoutMs, env, input: request.input } }); }
    catch { fail('PROCESO_ERROR'); }
    if (result?.error?.code === 'ETIMEDOUT' || result?.signal === 'SIGTERM') fail('TIMEOUT');
    if (result?.error) fail('PROCESO_ERROR');
    if (result?.status !== 0) {
      if (connectionError.test(String(result?.stderr || ''))) fail('CONEXION_ERROR');
      fail('SQL_ERROR');
    }
    return parseRows(result.stdout);
  };
}

export function postgresConnectionFromEnvironment(env = process.env) {
  const explicitUri = String(env.LAB031_S03_POSTGRES_URI || '');
  const explicitDatabase = String(env.LAB031_S03_POSTGRES_DATABASE || '');
  const legacy = String(env.LAB031_S03_POSTGRES_CONNECTION || '');
  if ([explicitUri, explicitDatabase, legacy].filter(Boolean).length !== 1) fail('CONFIGURACION_AUSENTE_O_AMBIGUA');
  const value = explicitUri || explicitDatabase || legacy;
  const kind = explicitUri || /^(?:postgres(?:ql)?:\/\/|[a-zA-Z_][a-zA-Z0-9_]*=)/.test(legacy) ? 'conninfo' : 'database';
  if (kind === 'database' && !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/.test(value)) fail('BASE_DATOS_INVALIDA');
  if (kind === 'conninfo' && !/^(?:postgres(?:ql)?:\/\/|[a-zA-Z_][a-zA-Z0-9_]*=)/.test(value)) fail('CONNINFO_INVALIDO');
  return Object.freeze({ kind, value });
}
