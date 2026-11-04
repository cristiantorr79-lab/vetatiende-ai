const fail = (reason) => { throw new Error(`S03_READERS_${reason}`); };
const positive = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

export function createPostgresReadonlyReader({ executor, connection, timeoutMs = 15000 } = {}) {
  if (typeof executor !== 'function') fail('POSTGRES_EXECUTOR_REQUERIDO');
  if (!connection) fail('POSTGRES_CONFIG_REQUERIDA');
  const timeout = positive(timeoutMs, 15000);
  return async ({ query, params, read_only: readOnly }) => {
    const sql = String(query || '').trim();
    if (readOnly !== true || !/^SELECT\b/i.test(sql) || /\b(?:INSERT|UPDATE|DELETE|MERGE|COPY|ALTER|DROP|CREATE|TRUNCATE|GRANT|REVOKE)\b/i.test(sql)) fail('POSTGRES_NO_READONLY');
    if (!Array.isArray(params) || params.length !== 2 || params.some((x) => !String(x || '').trim())) fail('POSTGRES_PARAMETROS_INVALIDOS');
    try {
      const rows = await executor({ connection, sql, params: [...params], timeoutMs: timeout, readOnly: true });
      if (!Array.isArray(rows)) fail('POSTGRES_RESPUESTA_INVALIDA');
      return rows;
    } catch (error) {
      if (String(error?.message || '').startsWith('S03_READERS_')) throw error;
      fail('POSTGRES_ERROR');
    }
  };
}

export function createQdrantReadonlyReader({ fetchImpl = globalThis.fetch, baseUrl, apiKey, timeoutMs = 15000 } = {}) {
  if (typeof fetchImpl !== 'function') fail('QDRANT_FETCH_REQUERIDO');
  if (!baseUrl || !apiKey) fail('QDRANT_CONFIG_REQUERIDA');
  let root; try { root = new URL(baseUrl); } catch { fail('QDRANT_CONFIG_INVALIDA'); }
  if (!['http:', 'https:'].includes(root.protocol)) fail('QDRANT_CONFIG_INVALIDA');
  root.pathname = root.pathname.replace(/\/$/, '');
  const timeout = positive(timeoutMs, 15000);
  return async ({ collection, filter, offset, limit, with_payload: withPayload, with_vector: withVector, read_only: readOnly }) => {
    if (readOnly !== true || collection !== 'vetatiende_interno') fail('QDRANT_SOLICITUD_INVALIDA');
    if (!filter?.must || !Array.isArray(filter.must) || filter.must.length !== 2) fail('QDRANT_FILTRO_INVALIDO');
    const body = { filter, limit: positive(limit, 128), with_payload: withPayload === true, with_vector: withVector === true, ...(offset !== null && offset !== undefined ? { offset } : {}) };
    try {
      const response = await fetchImpl(`${root.href.replace(/\/$/, '')}/collections/${encodeURIComponent(collection)}/points/scroll`, { method: 'POST', headers: { 'content-type': 'application/json', 'api-key': apiKey }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
      if (!response?.ok) fail('QDRANT_HTTP_ERROR');
      const json = await response.json();
      if (json?.status !== 'ok' || !Array.isArray(json?.result?.points)) fail('QDRANT_RESPUESTA_INVALIDA');
      return json;
    } catch (error) {
      if (String(error?.message || '').startsWith('S03_READERS_')) throw error;
      fail('QDRANT_ERROR');
    }
  };
}

export function readersFromEnvironment({ env = process.env, postgresExecutor, fetchImpl = globalThis.fetch } = {}) {
  const connection = env.LAB031_S03_POSTGRES_CONNECTION;
  const baseUrl = env.LAB031_S03_QDRANT_URL, apiKey = env.LAB031_S03_QDRANT_API_KEY;
  if (!connection || !baseUrl || !apiKey) fail('CONFIGURACION_INCOMPLETA');
  return Object.freeze({
    postgresRead: createPostgresReadonlyReader({ executor: postgresExecutor, connection, timeoutMs: env.LAB031_S03_POSTGRES_TIMEOUT_MS }),
    qdrantScroll: createQdrantReadonlyReader({ fetchImpl, baseUrl, apiKey, timeoutMs: env.LAB031_S03_QDRANT_TIMEOUT_MS }),
  });
}
