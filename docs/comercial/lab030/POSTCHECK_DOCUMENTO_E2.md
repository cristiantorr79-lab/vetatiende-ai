# LAB-030 — Post-check único del documento sintético en E2

Estado final: **PASS E2 / workflow temporal retirado**.

Evidencia final confirmada: el post-check previo al cleanup validó documento, versión, evento y un punto Qdrant con `POSTCHECK_OK=true` y `CONSISTENCY_OK=true` en 4566 ms. Después del DELETE, el runner corregido confirmó documento, versión, eventos y punto ausentes; clínica presente con snapshot válido; `POSTCHECK_OK=true` y `CONSISTENCY_OK=true` en 2963 ms. El post-check específico del cleanup confirmó además `residues_remaining=0` en 6540 ms.

Artefacto: `scripts/lab030/workflow_temporal_postcheck_documento_e2.json`, generado por `generar_workflow_postcheck_documento_e2.mjs`. Es un workflow independiente de cinco nodos, `active: false`, con `POST /webhook/lab030-qa-document-postcheck` y Header Auth existente.

La consulta PostgreSQL es exclusivamente `SELECT` y siempre devuelve exactamente una fila mediante cinco expresiones `EXISTS`: `document_found`, `version_found`, `events_found`, `clinic_found` y `clinic_snapshot_valid`. El estado esperado después del DELETE es `false`, `false`, `false`, `true`, `true`. El snapshot de la clínica exige ID, nombre, estado y timestamps exactos. El nodo PostgreSQL ya no usa `Always Output Data`.

La consulta Qdrant conserva `scroll`, `with_vector: false` y filtros exactos sobre colección `vetatiende_publico`, clínica, documento, versión y hash eliminados. El resultado final exige cero puntos y produce `POSTCHECK_OK=true` y `CONSISTENCY_OK=true` solo cuando ambos almacenes confirman ausencia y la clínica permanece intacta.

El workflow temporal fue desactivado y eliminado de n8n después de capturar la evidencia. El JSON y su generador permanecen en el repositorio como artefactos reproducibles. El DELETE ya fue ejecutado y no debe repetirse.

## Reutilización con IDs dinámicos

Corrección local del 2026-10-06: el runner ya no contiene un `version_id` histórico. Recibe `expected_state`, `selectors` y `clinic_snapshot` del manifest actual. `PRESENT` exige documento, versión, tres eventos y un punto Qdrant; `ABSENT` exige su ausencia. En ambos modos la clínica y su snapshot deben permanecer válidos. El `version_id` se valida contra el documento QA y se usa dinámicamente en PostgreSQL y Qdrant.

## Cierre formal

La ejecución final con IDs dinámicos quedó **PASS** para la versión `ver_LAB030_QA_DOC_PUBLIC_HORARIOS_001_2887_1791320682925`. Después del DELETE, el post-check confirmó documento, versión, eventos y punto Qdrant ausentes, clínica preservada y `residues_remaining=0`. El workflow temporal fue retirado de n8n. No existe una ejecución pendiente de este post-check para LAB-030.
