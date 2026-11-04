import { createHash } from 'node:crypto';
import { validateManifest } from './s03_fixture_documental.mjs';

const fail = (reason) => { throw new Error(`S03_GATES_${reason}`); };
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function correlated(value, manifest) {
  return value?.run_id === manifest.run_id && value?.clinic_id === manifest.clinic_id && value?.document_id === manifest.fixture.document_id;
}

export async function verifyExecutionGates({ manifest, precreateEvidence, cleanupCapability, authorizationEvidence, verifyAuthorization, now = Date.now() } = {}) {
  validateManifest(manifest);
  if (manifest.status !== 'PREPARED' || manifest.management?.executed !== false) fail('ESTADO_NO_EJECUTABLE');
  if (!correlated(precreateEvidence, manifest) || precreateEvidence.status !== 'PASS' || precreateEvidence.postgres_documents !== 0 || precreateEvidence.qdrant_points !== 0) fail('PRECREATE_NO_ACREDITADO');
  const observedAt = Date.parse(precreateEvidence.observed_at), expiresAt = Date.parse(precreateEvidence.expires_at);
  if (!Number.isFinite(observedAt) || !Number.isFinite(expiresAt) || observedAt > now || expiresAt <= now) fail('PRECREATE_CADUCADO');
  if (!correlated(cleanupCapability, manifest) || cleanupCapability.status !== 'READY' || cleanupCapability.qdrant_exact !== true || cleanupCapability.postgres_exact !== true || cleanupCapability.postcheck_required !== true) fail('CLEANUP_NO_DISPONIBLE');
  if (!correlated(authorizationEvidence, manifest) || authorizationEvidence.decision !== 'APPROVED' || authorizationEvidence.scope !== 'MANAGEMENT_CREATE_ONCE') fail('AUTORIZACION_AUSENTE');
  if (typeof verifyAuthorization !== 'function') fail('VERIFICADOR_AUTORIZACION_AUSENTE');
  const verified = await verifyAuthorization(structuredClone(authorizationEvidence), { run_id: manifest.run_id, clinic_id: manifest.clinic_id, document_id: manifest.fixture.document_id, scope: 'MANAGEMENT_CREATE_ONCE' });
  if (verified?.verified !== true || !correlated(verified, manifest) || verified.scope !== 'MANAGEMENT_CREATE_ONCE') fail('AUTORIZACION_NO_VERIFICADA');
  const evidence = { run_id: manifest.run_id, clinic_id: manifest.clinic_id, document_id: manifest.fixture.document_id, manifest_updated_at: manifest.updated_at, precreate_observed_at: precreateEvidence.observed_at, precreate_expires_at: precreateEvidence.expires_at, cleanup_contract: cleanupCapability.contract_version, authorization_reference: authorizationEvidence.reference };
  return Object.freeze({ status: 'VERIFIED', ...evidence, evidence_digest: digest(evidence) });
}
