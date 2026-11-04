import { validateManifest } from './s03_fixture_documental.mjs';

const fail = (reason) => { throw new Error(`S03_CLEANUP_${reason}`); };
const clone = (value) => structuredClone(value);
const key = (item) => `${item.store}:${item.type}:${item.id}`;

function exactSet(resources, manifest, store) {
  validateManifest(manifest);
  if (!Array.isArray(resources) || resources.length === 0) fail('RECURSOS_AUSENTES');
  const seen = new Set();
  for (const item of resources) {
    if (!item?.id || item.store !== store || item.clinic_id !== manifest.clinic_id || item.document_id !== manifest.fixture.document_id) fail('RECURSO_AJENO');
    if (store === 'qdrant' && (item.type !== 'point' || item.collection !== 'vetatiende_interno')) fail('RECURSO_AJENO');
    if (store === 'postgres' && !['event', 'version', 'document'].includes(item.type)) fail('RECURSO_AJENO');
    if (seen.has(key(item))) fail('RECURSO_DUPLICADO');
    seen.add(key(item));
  }
  const accredited = new Set((manifest.resources?.created || []).map(key));
  if ([...seen].some((value) => !accredited.has(value))) fail('RECURSO_NO_ACREDITADO');
  return seen;
}

function validateDeletion(expected, result) {
  if (!result || result.ok !== true || !Array.isArray(result.deleted)) fail('RESULTADO_AMBIGUO');
  const actual = new Set(result.deleted.map((item) => typeof item === 'string' ? item : key(item)));
  if (actual.size !== expected.size || [...expected].some((value) => !actual.has(value))) fail('CARDINALIDAD_IDENTIDAD_DIFIERE');
  return { ok: true, deleted: [...actual] };
}

export function createExactCleanupTransports({ qdrantDeletePoints, postgresDeleteOrdered, verifyExternalAuthorization, authorizationEvidenceProvider } = {}) {
  const capability = () => ({
    qdrant_exact: typeof qdrantDeletePoints === 'function',
    postgres_exact: typeof postgresDeleteOrdered === 'function',
    external_authorization: typeof verifyExternalAuthorization === 'function' && typeof authorizationEvidenceProvider === 'function',
    postcheck_required: true,
  });

  async function authorize(manifest, evidence, operation) {
    if (typeof verifyExternalAuthorization !== 'function') fail('AUTORIZACION_EXTERNA_NO_DISPONIBLE');
    const supplied = evidence ?? (typeof authorizationEvidenceProvider === 'function' ? await authorizationEvidenceProvider({ run_id: manifest.run_id, clinic_id: manifest.clinic_id, document_id: manifest.fixture.document_id, operation }) : undefined);
    if (!supplied) fail('AUTORIZACION_EXTERNA_NO_DISPONIBLE');
    const result = await verifyExternalAuthorization(clone(supplied), { run_id: manifest.run_id, clinic_id: manifest.clinic_id, document_id: manifest.fixture.document_id, operation });
    if (result?.verified !== true || result?.run_id !== manifest.run_id || result?.clinic_id !== manifest.clinic_id || result?.document_id !== manifest.fixture.document_id || result?.operation !== operation) fail('AUTORIZACION_EXTERNA_INVALIDA');
  }

  async function deleteExactQdrant(resources, manifest, { authorizationEvidence } = {}) {
    if (typeof qdrantDeletePoints !== 'function') fail('QDRANT_TRANSPORTE_AUSENTE');
    const expected = exactSet(resources, manifest, 'qdrant');
    await authorize(manifest, authorizationEvidence, 'DELETE_QDRANT_EXACT');
    const pointIds = resources.map((item) => item.id);
    const result = await qdrantDeletePoints({ collection: 'vetatiende_interno', point_ids: clone(pointIds), clinic_id: manifest.clinic_id, document_id: manifest.fixture.document_id });
    return validateDeletion(expected, result);
  }

  async function deleteExactPostgres(resources, manifest, { authorizationEvidence } = {}) {
    if (typeof postgresDeleteOrdered !== 'function') fail('POSTGRES_TRANSPORTE_AUSENTE');
    const expected = exactSet(resources, manifest, 'postgres');
    await authorize(manifest, authorizationEvidence, 'DELETE_POSTGRES_EXACT');
    const ordered = ['event', 'version', 'document'].flatMap((type) => resources.filter((item) => item.type === type).map(clone));
    const result = await postgresDeleteOrdered({ clinic_id: manifest.clinic_id, document_id: manifest.fixture.document_id, resources: ordered, transaction: 'REQUIRED', order: ['event', 'version', 'document'] });
    return validateDeletion(expected, result);
  }

  return Object.freeze({ capability, deleteExactQdrant, deleteExactPostgres });
}
