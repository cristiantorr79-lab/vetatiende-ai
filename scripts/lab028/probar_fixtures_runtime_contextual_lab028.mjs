import assert from 'node:assert/strict';
import { crearClienteFixturesLab028, FIXTURES_LAB028 } from './fixtures_runtime_contextual_lab028.mjs';

let tests = 0;
async function test(name, fn) { try { await fn(); tests += 1; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } }
const definitions = [{ id: 'config', name: 'lab028_configuracion' }, { id: 'campaigns', name: 'lab028_campanas' }];
function response(status, data) { return { ok: status >= 200 && status < 300, status, async json() { return JSON.parse(JSON.stringify(data)); } }; }
function mockFetch() {
  const rows = { config: [{ id: 'real-config', clinic_id: 'otra_clinica', habilitado: 'true', updated_by: 'REAL' }], campaigns: [{ id: 'real-campaign', clinic_id: 'otra_clinica', campana_id: 'REAL' }] };
  let id = 0;
  return { rows, fetchImpl: async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname === '/api/v1/data-tables') return response(200, { data: definitions });
    const match = parsed.pathname.match(/^\/api\/v1\/data-tables\/(config|campaigns)\/rows(?:\/(update|delete))?$/);
    if (!match) return response(404, {});
    const table = rows[match[1]];
    if (!options.method || options.method === 'GET') return response(200, { data: table });
    if (options.method === 'POST') { for (const row of JSON.parse(options.body).data) table.push({ id: `test-${++id}`, ...row }); return response(201, { data: table }); }
    let filter, data;
    if (options.method === 'DELETE') filter = JSON.parse(parsed.searchParams.get('filter'));
    else { const body = JSON.parse(options.body); filter = body.filter; data = body.data; }
    const indexes = table.map((row, index) => ({ row, index })).filter(({ row }) => filter.filters.every((item) => row[item.columnName] === item.value)).map(({ index }) => index);
    if (options.method === 'PATCH') for (const index of indexes) table[index] = { id: table[index].id, ...data };
    if (options.method === 'DELETE') for (const index of indexes.sort((a, b) => b - a)) table.splice(index, 1);
    return response(200, { data: indexes });
  } };
}

const mock = mockFetch();
const client = crearClienteFixturesLab028({ baseUrl: 'https://mock.invalid', apiToken: 'mock', fetchImpl: mock.fetchImpl });
await test('fixtures cubren configuración y avisos mínimos', () => { assert.equal(FIXTURES_LAB028.lab028_configuracion.length, 1); assert.equal(FIXTURES_LAB028.lab028_campanas.length, 5); assert.ok(FIXTURES_LAB028.lab028_campanas.some((row) => row.tipo === 'medicamento')); assert.ok(FIXTURES_LAB028.lab028_campanas.every((row) => row.campana_id.startsWith('LAB028_TEST_'))); });
await test('carga seis fixtures', async () => { const result = await client.ejecutar('cargar'); assert.equal(result.ok, true); assert.equal(result.cantidad_filas_afectadas, 6); });
await test('verificación pasa tras carga', async () => { const result = await client.ejecutar('verificar'); assert.equal(result.ok, true); assert.equal(result.cantidad_filas_afectadas, 6); });
await test('carga repetida no duplica', async () => { const before = mock.rows.config.length + mock.rows.campaigns.length; const result = await client.ejecutar('cargar'); assert.equal(result.cantidad_filas_afectadas, 0); assert.equal(mock.rows.config.length + mock.rows.campaigns.length, before); });
await test('limpieza elimina solo LAB028_TEST', async () => { const result = await client.ejecutar('limpiar'); assert.equal(result.ok, true); assert.equal(result.cantidad_filas_afectadas, 6); assert.deepEqual(mock.rows.config, [{ id: 'real-config', clinic_id: 'otra_clinica', habilitado: 'true', updated_by: 'REAL' }]); assert.deepEqual(mock.rows.campaigns, [{ id: 'real-campaign', clinic_id: 'otra_clinica', campana_id: 'REAL' }]); });
await test('verificación final confirma cero residuos', async () => { const result = await client.ejecutar('verificar_limpieza'); assert.equal(result.ok, true); assert.deepEqual(result.detalle.residuos, []); });
await test('protege configuración real de la clínica piloto', async () => { const isolated = mockFetch(); isolated.rows.config.push({ id: 'pilot-real', clinic_id: 'clinica_piloto_001', updated_by: 'REAL' }); const result = await crearClienteFixturesLab028({ baseUrl: 'https://mock.invalid', apiToken: 'mock', fetchImpl: isolated.fetchImpl }).ejecutar('cargar'); assert.equal(result.ok, false); assert.equal(result.causa, 'configuracion_real_en_conflicto'); });

process.stdout.write(`PASS ${tests} pruebas utilidad fixtures runtime LAB-028\n`);
