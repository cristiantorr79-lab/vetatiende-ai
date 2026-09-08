import { pathToFileURL } from 'node:url';

const TABLES = Object.freeze(['lab028_configuracion', 'lab028_campanas']);
const MARKER = 'LAB028_TEST';
const CLINIC = 'clinica_piloto_001';
const BASE_URL_ENV = 'LAB028_N8N_BASE_URL';
const TOKEN_ENV = 'LAB028_N8N_API_TOKEN';

export const FIXTURES_LAB028 = Object.freeze({
  lab028_configuracion: [Object.freeze({
    clinic_id: CLINIC,
    habilitado: 'true',
    canal: 'contextual',
    updated_at: '2026-09-07T12:00:00.000Z',
    updated_by: MARKER,
  })],
  lab028_campanas: [
    ['medico', 'servicio', 'medica', 'Aviso LAB028_TEST médico literal autorizado.', 'activa', '2026-01-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z'],
    ['peluqueria', 'servicio', 'peluqueria', 'Aviso LAB028_TEST peluquería literal autorizado.', 'activa', '2026-01-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z'],
    ['general', 'producto', 'general', 'Aviso LAB028_TEST general literal autorizado.', 'activa', '2026-01-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z'],
    ['medicamento', 'medicamento', 'medica', 'Medicamento LAB028_TEST disponible según texto literal autorizado por la clínica.', 'activa', '2026-01-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z'],
    ['inactivo', 'producto', 'general', 'Aviso LAB028_TEST inactivo para prueba negativa.', 'inactiva', '2026-01-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z'],
  ].map(([id, tipo, categoria, texto, estado, inicio, fin]) => Object.freeze({
    clinic_id: CLINIC,
    campana_id: `${MARKER}_${id}`,
    tipo,
    categoria,
    texto,
    inicio,
    fin,
    programada_at: inicio,
    estado,
    autorizado_por: MARKER,
    autorizado_at: '2026-09-07T12:00:00.000Z',
    sello: `${MARKER}_TEXTO_LITERAL_AUTORIZADO_${id}`,
    updated_at: '2026-09-07T12:00:00.000Z',
    updated_by: MARKER,
  })),
});

function result(ok, accion, detalle = {}, affected = 0, causa = '') {
  return { ok, accion, 'PASS/FAIL': ok ? 'PASS' : 'FAIL', detalle, cantidad_filas_afectadas: affected, causa };
}

function selector(table, row) {
  return table === 'lab028_configuracion'
    ? { clinic_id: row.clinic_id, updated_by: MARKER }
    : { clinic_id: row.clinic_id, campana_id: row.campana_id };
}

function exactFilter(values) {
  return { type: 'and', filters: Object.entries(values).map(([columnName, value]) => ({ columnName, condition: 'eq', value })) };
}

function matches(row, values) {
  return Object.entries(values).every(([key, value]) => row?.[key] === value);
}

function equalsFixture(row, fixture) {
  return Object.entries(fixture).every(([key, value]) => row?.[key] === value);
}

function isFixture(table, row) {
  if (table === 'lab028_configuracion') return row?.clinic_id === CLINIC && row?.updated_by === MARKER;
  return row?.clinic_id === CLINIC && typeof row?.campana_id === 'string'
    && row.campana_id.startsWith(`${MARKER}_`)
    && FIXTURES_LAB028.lab028_campanas.some((fixture) => fixture.campana_id === row.campana_id);
}

export function crearClienteFixturesLab028({ baseUrl, apiToken, fetchImpl = globalThis.fetch } = {}) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim() || typeof apiToken !== 'string' || !apiToken.trim() || typeof fetchImpl !== 'function') throw new Error('configuracion_faltante');
  let parsed;
  try { parsed = new URL(baseUrl); } catch { throw new Error('configuracion_invalida'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('configuracion_invalida');
  const root = parsed.href.replace(/\/$/, '');
  let tableMap;

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetchImpl(`${root}${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiToken } });
    } catch { throw new Error('conexion_n8n_fallida'); }
    if (!response?.ok) throw new Error(`n8n_http_${Number(response?.status) || 0}`);
    if (response.status === 204) return null;
    try { return await response.json(); } catch { throw new Error('respuesta_n8n_invalida'); }
  }

  async function tables() {
    if (!tableMap) {
      const payload = await request('/api/v1/data-tables');
      const list = Array.isArray(payload) ? payload : payload?.data;
      if (!Array.isArray(list)) throw new Error('respuesta_n8n_invalida');
      tableMap = new Map(list.filter((table) => TABLES.includes(table?.name)).map((table) => [table.name, String(table.id)]));
      if (tableMap.size !== TABLES.length) throw new Error('tabla_no_encontrada');
    }
    return tableMap;
  }

  async function rows(table) {
    if (!TABLES.includes(table)) throw new Error('tabla_fuera_de_scope');
    const id = (await tables()).get(table), output = [];
    let cursor = '';
    do {
      const payload = await request(`/api/v1/data-tables/${encodeURIComponent(id)}/rows${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
      const page = Array.isArray(payload) ? payload : payload?.data;
      if (!Array.isArray(page)) throw new Error('respuesta_n8n_invalida');
      output.push(...page);
      cursor = typeof payload?.nextCursor === 'string' ? payload.nextCursor : '';
    } while (cursor);
    return output;
  }

  async function upsert(table, row) {
    const id = (await tables()).get(table), key = selector(table, row), existing = (await rows(table)).filter((item) => matches(item, key));
    if (existing.length > 1) throw new Error('fixture_duplicado');
    if (existing.length === 1) {
      if (equalsFixture(existing[0], row)) return false;
      await request(`/api/v1/data-tables/${encodeURIComponent(id)}/rows/update`, { method: 'PATCH', body: JSON.stringify({ filter: exactFilter(key), data: row, returnType: 'all' }) });
      return true;
    }
    await request(`/api/v1/data-tables/${encodeURIComponent(id)}/rows`, { method: 'POST', body: JSON.stringify({ data: [row], returnType: 'all' }) });
    return true;
  }

  async function execute(accion) {
    try {
      if (accion === 'cargar') {
        const configs = await rows('lab028_configuracion');
        if (configs.some((row) => row.clinic_id === CLINIC && row.updated_by !== MARKER)) return result(false, accion, {}, 0, 'configuracion_real_en_conflicto');
        let affected = 0;
        for (const table of TABLES) for (const row of FIXTURES_LAB028[table]) if (await upsert(table, row)) affected += 1;
        return result(true, accion, { fixtures: 6 }, affected);
      }
      if (accion === 'verificar') {
        let valid = 0;
        const detail = {};
        for (const table of TABLES) {
          const current = await rows(table);
          detail[table] = FIXTURES_LAB028[table].map((fixture) => {
            const found = current.filter((row) => matches(row, selector(table, fixture)));
            const ok = found.length === 1 && equalsFixture(found[0], fixture);
            if (ok) valid += 1;
            return { selector: selector(table, fixture), cantidad: found.length, valido: ok };
          });
        }
        return result(valid === 6, accion, detail, valid, valid === 6 ? '' : 'fixtures_incompletos');
      }
      if (accion === 'limpiar' || accion === 'verificar_limpieza') {
        const residue = [];
        for (const table of TABLES) for (const row of await rows(table)) if (isFixture(table, row)) residue.push({ table, row, selector: selector(table, row), fingerprint: JSON.stringify(row) });
        if (accion === 'verificar_limpieza') return result(residue.length === 0, accion, { residuos: residue.map(({ table, selector: key }) => ({ table, selector: key })) }, 0, residue.length ? 'residuos_detectados' : '');
        let affected = 0;
        for (const item of residue) {
          const current = (await rows(item.table)).filter((row) => matches(row, item.selector));
          if (current.length !== 1 || JSON.stringify(current[0]) !== item.fingerprint) throw new Error('fila_cambio_antes_de_eliminar');
          const id = (await tables()).get(item.table);
          const filter = encodeURIComponent(JSON.stringify(exactFilter(item.selector)));
          await request(`/api/v1/data-tables/${encodeURIComponent(id)}/rows/delete?filter=${filter}&returnData=true`, { method: 'DELETE' });
          affected += 1;
        }
        const verification = await execute('verificar_limpieza');
        return result(verification.ok, accion, { verificacion: verification.detalle }, affected, verification.ok ? '' : 'residuos_posteriores');
      }
      return result(false, accion ?? '', {}, 0, 'accion_no_soportada');
    } catch { return result(false, accion ?? '', { mensaje: 'Operación runtime no completada.' }, 0, 'error_runtime'); }
  }
  return Object.freeze({ ejecutar: execute });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let output;
  try {
    const client = crearClienteFixturesLab028({ baseUrl: process.env[BASE_URL_ENV], apiToken: process.env[TOKEN_ENV] });
    output = await client.ejecutar(process.argv[2]);
  } catch { output = result(false, process.argv[2] ?? '', {}, 0, 'configuracion_faltante'); }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.ok) process.exitCode = 1;
}
