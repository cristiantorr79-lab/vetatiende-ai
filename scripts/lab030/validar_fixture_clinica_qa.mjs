import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const migrationPath = path.join(repoRoot, 'scripts', 'lab029', 'migraciones', '001_dominio_documental.sql');
const createPath = path.join(scriptDir, 'fixtures', 'asegurar_clinica_piloto_001.sql');
const cleanupPath = path.join(scriptDir, 'fixtures', 'cleanup_clinica_piloto_001.sql');
const [migration, createSql, cleanupSql] = await Promise.all([
  readFile(migrationPath, 'utf8'),
  readFile(createPath, 'utf8'),
  readFile(cleanupPath, 'utf8'),
]);

assert.match(migration, /CREATE TABLE IF NOT EXISTS clinics\s*\(/);
assert.match(migration, /clinic_id text PRIMARY KEY CHECK/);
assert.match(migration, /name text NOT NULL CHECK/);
assert.match(migration, /status text NOT NULL CHECK \(status IN \('active', 'inactive'\)\)/);
assert.match(migration, /created_at timestamptz NOT NULL DEFAULT now\(\)/);
assert.match(migration, /updated_at timestamptz NOT NULL DEFAULT now\(\)/);

assert.match(createSql, /INSERT INTO vetatiende_documental\.clinics \(clinic_id, name, status\)/);
assert.match(createSql, /ON CONFLICT \(clinic_id\) DO NOTHING/);
assert.doesNotMatch(createSql, /DO UPDATE/i);
assert.match(createSql, /post_check_valid/);
assert.match(createSql, /c\.name = 'LAB030_QA Clínica Piloto 001'/);
assert.match(createSql, /c\.status = 'active'/);
assert.equal((createSql.match(/clinica_piloto_001/g) || []).length >= 3, true);

assert.match(cleanupSql, /LAB030_QA_CLINIC_NOT_OWNED_BY_FIXTURE/);
assert.match(cleanupSql, /LAB030_QA_CLINIC_HAS_DEPENDENCIES/);
assert.match(cleanupSql, /DELETE FROM clinics/);
assert.match(cleanupSql, /post_check_zero/);
assert.doesNotMatch(cleanupSql, /LIKE|ILIKE|SIMILAR TO/);

for (const sql of [createSql, cleanupSql]) {
  assert.doesNotMatch(sql, /postgres(?:ql)?:\/\/|password\s*=|api[_-]?key|bearer\s+/i);
}

console.log(JSON.stringify({
  ok: true,
  network_executed: false,
  clinic_id: 'clinica_piloto_001',
  create_policy: 'INSERT_ON_CONFLICT_DO_NOTHING',
  cleanup_policy: 'EXACT_ID_EXACT_FIXTURE_NAME_NO_DEPENDENCIES',
}, null, 2));
