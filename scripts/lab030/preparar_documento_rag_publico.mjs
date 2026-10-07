import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, '..', '..');
const fixtureRelative = 'scripts/lab030/fixtures/rag_publico_clinica_piloto_001.txt';

export const DOCUMENT_SPEC = Object.freeze({
  clinic_id: 'clinica_piloto_001',
  document_id: 'LAB030_QA_DOC_PUBLIC_HORARIOS_001',
  document_type: 'faq',
  visibility: 'public',
  access_level: null,
  source_file: fixtureRelative,
});

const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');

export async function prepararDocumento() {
  const raw = await readFile(path.join(repoDir, fixtureRelative), 'utf8');
  const documentContent = raw.trim();
  if (!documentContent) throw new Error('fixture_publico_vacio');
  if (/\b(?:nombre|tel[eé]fono|email|correo|rut|direcci[oó]n de cliente)\b/i.test(documentContent)) {
    throw new Error('fixture_publico_posible_dato_personal');
  }
  const contentHash = sha256(documentContent);
  return {
    mechanism: 'LAB-029 management driver protegido con Header Auth',
    network_executed: false,
    payload: {
      action: 'ingest',
      ...DOCUMENT_SPEC,
      content_hash: contentHash,
      document_content: documentContent,
      target_version_id: '',
    },
  };
}

async function ejecutarE2(prepared) {
  const url = String(process.env.LAB030_MANAGEMENT_WEBHOOK_URL || '').trim();
  const headerName = String(process.env.LAB029_INTERNAL_HEADER_NAME || '').trim();
  const headerValue = String(process.env.LAB029_INTERNAL_HEADER_VALUE || '').trim();
  if (!url || !headerName || !headerValue) throw new Error('configuracion_e2_gestion_incompleta');
  const endpoint = new URL(url);
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new Error('endpoint_e2_gestion_invalido');
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/json', [headerName]: headerValue },
    body: JSON.stringify(prepared.payload),
    signal: AbortSignal.timeout(90000),
  });
  let body = null;
  try { body = await response.json(); } catch {}
  if (!response.ok || body?.ok === false) throw new Error(`gestion_documental_http_${response.status}`);
  return { ok: true, http_status: response.status, document_id: DOCUMENT_SPEC.document_id };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const prepared = await prepararDocumento();
  if (process.argv.includes('--e2')) {
    console.log(JSON.stringify(await ejecutarE2(prepared), null, 2));
  } else {
    console.log(JSON.stringify(prepared, null, 2));
  }
}
