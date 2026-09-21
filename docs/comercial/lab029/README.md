# LAB-029 — RAG persistente y gestión documental por clínica

## Estado

LAB-029 está técnica y funcionalmente validado. Management, Público, Interno y Persistencia están cerrados; el run final `LAB029_TEST_20260914D` fue eliminado con POST-CHECK en cero. La auditoría de mantenibilidad y la validación multi-clínica final terminaron `PASS`. No se modificaron los workflows históricos LAB-021 a LAB-028.

El único bloque pendiente es la revisión final de Git, seguida de un único commit limpio y el push de `mvp-comercial`.

## Objetivo y resultado

LAB-029 reemplaza el almacenamiento vectorial temporal por un dominio documental persistente y versionado por clínica. PostgreSQL/Aiven mantiene el estado canónico de clínicas, documentos, versiones y eventos. Qdrant conserva chunks y embeddings en colecciones compartidas, siempre aislados por `clinic_id`. Los documentos originales y las evidencias runtime permanecen fuera de Git.

La solución permite:

- cargar documentos públicos e internos;
- crear y validar versiones `staging` antes de activarlas;
- mantener una única versión `active` por documento;
- marcar versiones anteriores como `superseded`;
- conservar la versión activa anterior si una actualización falla;
- reactivar mediante rollback una versión validada anterior;
- auditar `staged`, `validated`, `activated`, `no_changes`, `failed` y `rollback`;
- recuperar el RAG después de reiniciar n8n sin reconstruir embeddings ni ejecutar una recarga completa.

## Arquitectura implementada

### PostgreSQL/Aiven

El esquema `vetatiende_documental` contiene:

- `clinics`: autoridad de clínicas activas;
- `documents`: identidad, tipo, visibilidad y nivel de acceso;
- `document_versions`: número, hash, origen, estado y fechas del ciclo de vida;
- `document_events`: trazabilidad del dominio documental.

La FK compuesta `(document_id, version_id)` impide asociar a un evento una versión de otro documento. El trigger reutilizable `touch_updated_at` mantiene automáticamente `clinics.updated_at` y `documents.updated_at`. La restricción parcial garantiza una sola versión activa por documento.

### Qdrant y embeddings

Las colecciones persistentes compartidas son:

- `vetatiende_publico`;
- `vetatiende_interno`.

Ambas usan vectores de 1024 dimensiones con distancia Cosine y embeddings `embed-multilingual-v3.0` de Cohere. El payload conserva `clinic_id`, `document_id`, `version_id`, `version_number`, `visibility`, `access_level`, `content_hash`, `source_file`, `updated_at` y `status`.

PostgreSQL determina las versiones activas. Cada consulta recupera sus `version_id` y Qdrant filtra por clínica, visibilidad, estado `active` y esas versiones. No se utiliza Simple Vector Store ni el trigger histórico `Recargar RAG al iniciar n8n`.

## Gestión documental

El workflow `lab029_gestion_rag_persistente.json` recibe `ingest` o `rollback`. El contrato exige IDs controlados, visibilidad válida, `source_file` y un `content_hash` SHA-256. La ingesta exige `document_content`; los documentos internos exigen `access_level` y los públicos lo prohíben.

La ingesta sigue esta secuencia:

1. valida el contrato;
2. asegura el documento y consulta el máximo histórico de versión;
3. crea o reutiliza una versión fallida con el mismo hash como `staging`;
4. carga el contenido real y sus embeddings en Qdrant;
5. recupera y valida la misma versión desde Qdrant;
6. marca la versión como validada;
7. sincroniza Qdrant y activa mediante PostgreSQL.

La coordinación PostgreSQL/Qdrant funciona como saga. Los fallos posteriores a staging marcan la nueva versión como `failed`, conservan o restauran la versión activa anterior y evitan una activación parcial. El rollback reactiva la versión objetivo, actualiza `activated_at` a la activación más reciente, limpia `superseded_at` y coordina ambos almacenes.

### Responsabilidad de eventos

| Evento | Responsable único |
| --- | --- |
| `staged` | Trigger PostgreSQL `audit_version_transition` |
| `validated` | Trigger PostgreSQL `audit_version_transition` |
| `activated` | Función `activate_document_version` |
| `no_changes` | Workflow de Gestión |
| `failed` | Trigger PostgreSQL `audit_version_transition` |
| `rollback` | Función `rollback_document_version` |

Activación y rollback revierten la transacción si no pueden registrar su evento. n8n no duplica los eventos que pertenecen a triggers o funciones PostgreSQL.

## RAG Público multi-clínica

El workflow Público final exige un `clinic_id` explícito. El ID debe cumplir el formato del esquema y existir con estado `active` en PostgreSQL. Una clínica ausente, inválida, inexistente o un error al consultar la autoridad termina de forma cerrada; nunca se sustituye silenciosamente por otra clínica.

`clinica_piloto_001` funciona solamente cuando llega explícitamente y está activa. No existe una lista hardcodeada de clínicas ni una dependencia funcional de IDs `LAB029_TEST`. La configuración heredada de peluquería conserva dinámicamente el `clinic_id` autorizado, y los fallbacks LAB-026 ya no atribuyen un contexto perdido a la clínica piloto.

El export Público final contiene cero referencias a `clinica_piloto_001`. Las pruebas automatizadas confirmaron dos clínicas independientes, conservación del ID, aislamiento A/B, fallo cerrado y filtros PostgreSQL/Qdrant por clínica.

## RAG Interno y control de acceso

El workflow Interno mantiene autenticación y autorización separadas. Resuelve identidad, usuario activo, clínica, rol y permiso antes de entregar información a la IA. Qdrant filtra por `clinic_id`, `visibility=internal`, `status=active` y versiones activas.

Debido a la incompatibilidad observada en el filtro multi-valor del nodo Qdrant, los candidatos se filtran de forma determinista inmediatamente después de recuperarlos. Solo los documentos cuyo `metadata.access_level` pertenece a `niveles_acceso_permitidos` llegan al contexto de IA. Si todos quedan excluidos, se usa la ruta segura sin información autorizada.

## Persistencia y runtime

Versiones validadas en E2:

- n8n `2.39.5`;
- task-runners `2.39.5`;
- Qdrant `1.19.0`;
- cliente Qdrant incluido en n8n `1.19.0`.

La actualización eliminó la incompatibilidad previa entre n8n `2.29.8`, su cliente Qdrant `1.16.2` y el servidor `1.19.0`.

PS-01/STATE terminó `PASS` en 9.222 s. El fingerprint PostgreSQL posterior a recrear n8n coincidió exactamente con el baseline real de G-09 anterior al reinicio. El contenido público e interno siguió disponible sin reconstruir vectores ni ejecutar una recarga de RAG.

## Confianza TLS para PostgreSQL Aiven

La solución permanente usa el CA oficial de Aiven. El certificado real permanece fuera de Git en:

`/opt/vetatiende-ab/certs/aiven-ca.pem`

El override versionado es:

`infra/comercial/compose.e2.lab029-aiven-ca.override.yaml`

En E2 se aplica como:

`/opt/vetatiende-ab/compose.lab029-aiven-ca.override.yaml`

El override monta el certificado de solo lectura en n8n y define `NODE_EXTRA_CA_CERTS=/etc/ssl/certs/aiven-ca.pem`. SSL permanece en `Require`; la confianza no depende de `Ignore SSL Issues (Insecure)`. El override no modifica task-runners, Qdrant, Caddy ni Streamlit y no contiene certificados ni secretos.

## Almacenamiento privado y migraciones

Los documentos, payloads y evidencias runtime se conservan bajo `private-storage/`, excluido mediante `.gitignore`. `source_file` almacena una referencia relativa controlada; PostgreSQL no guarda el archivo original y Git no contiene documentos reales, certificados, tokens ni contraseñas.

Las migraciones versionadas son:

- `scripts/lab029/migraciones/001_dominio_documental.sql`;
- `scripts/lab029/migraciones/002_activacion_rollback.sql`.

Las operaciones reales deben ejecutarse con SSL, credenciales externas al repositorio y backup verificado. Nunca debe aplicarse una restauración destructiva sobre producción sin aprobación explícita.

## Cleanup seguro

El cleanup es fail-closed y trabaja sobre un snapshot previamente aprobado. Compara el inventario real con IDs exactos, rechaza diferencias o elementos adicionales, borra en orden de dependencias y exige un POST-CHECK en cero antes de marcar `PASS`. Nunca borra colecciones Qdrant ni usa eliminaciones amplias por prefijo.

El run final `LAB029_TEST_20260914D` terminó con:

- `cleanup_execute`: `PASS`;
- `cleanup_postcheck`: `PASS`;
- 46 auditorías, 2 permisos y 2 usuarios eliminados;
- 16 eventos, 5 versiones, 3 documentos y 2 clínicas eliminados;
- 15 puntos de `vetatiende_publico` y 1 de `vetatiende_interno` eliminados;
- PostgreSQL, Qdrant y Data Tables con cero residuos;
- `temporary_files = 0` y `payloads_deleted = true`.

Las evidencias persistidas en E2 son `cleanup_precheck_snapshot.json`, `cleanup_evidence.json` y `manifest.json`; este último registra `cleanup.status = PASS`.

## Resultado funcional y validaciones

- Management: cerrado funcionalmente.
- Público: P-01 a P-04 `WARN`, P-05 `PASS`, sin fallos funcionales bloqueantes.
- Interno: I-01 e I-02 `WARN`; I-03, I-04 e I-05 `PASS`; 0 `FAIL`.
- Persistencia: `PASS`.
- Cleanup: `PASS`, con cero residuos.
- Auditoría de mantenibilidad del Público: `PASS`, sin hallazgos bloqueantes.
- Validación multi-clínica final: `PASS`.

Validación local final posterior al cambio multi-clínica:

- runtime: 109 pruebas `PASS`;
- validador LAB-029: 1395 checks `PASS`;
- contrato Management: 12/12 `PASS`;
- lógica documental: 26 pruebas `PASS`;
- generación reproducible: 3 workflows `PASS`;
- búsqueda de `clinica_piloto_001` en el export Público: 0 resultados;
- `git diff --check`: `PASS`;
- integridad histórica LAB-021 a LAB-028: confirmada.

## Mantenibilidad y deuda aceptada

El workflow Público acumulado fue auditado con 309 nodos antes de la incorporación de los dos nodos multi-clínica. No presentó hallazgos bloqueantes. La deuda aceptada es su tamaño y la extensión de varios Code nodes heredados. Estas rutas están nombradas, disponen de manejo de errores y ya fueron validadas; no se refactorizan dentro de LAB-029 para evitar ampliar alcance.

## Criterio de cierre

La arquitectura documental, Management, Público, Interno, persistencia, TLS, cleanup, mantenibilidad y multi-clínica están validados. Para el cierre de Git resta únicamente:

1. revisar el diff completo y los archivos que entrarán al commit;
2. confirmar ausencia de secretos y artefactos temporales;
3. ejecutar solo los validadores finales estrictamente justificados por el diff;
4. ejecutar `git diff --check` final;
5. crear un único commit limpio de LAB-029;
6. hacer push de `mvp-comercial`.
