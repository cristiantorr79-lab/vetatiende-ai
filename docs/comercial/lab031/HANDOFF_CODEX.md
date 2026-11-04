# LAB-031 — HANDOFF CODEX

## Estado

**LAB-031 — ABIERTO / IN_PROGRESS.**

No existe declaración de `PASS`, aptitud para piloto ni autorización para usar datos reales.

## Objetivo

Ejecutar el QA integral y el GAP de VetAtiende AI con evidencia proporcional, sin reabrir trabajo cerrado, para determinar y cerrar las condiciones verificables del `GATE-PILOT`.

## Referencia de trabajo

- Proyecto: VetAtiende AI.
- Issue: **#1 — LAB-031 — QA Integral y GAP de VetAtiende AI**.
- Rama base: `mvp-comercial`.
- Base Git al iniciar la Tarea 2: `54029876dc126fec875597fdfde6deacc65c89e0`.
- `HEAD == origin/mvp-comercial` y working tree limpio antes de los cambios documentales.
- `main` permanece congelada como versión académica.

## Evidencia heredada

- [QA_AUDITORIA_INICIAL de LAB-030](../lab030/QA_AUDITORIA_INICIAL.md).
- [QA_DISENO_FASE2 de LAB-030](../lab030/QA_DISENO_FASE2.md).
- [ALINEACION_EQAB_EWB de LAB-030](../lab030/ALINEACION_EQAB_EWB.md).
- [HANDOFF_CODEX de LAB-030](../lab030/HANDOFF_CODEX.md).
- [roadmap comercial](../roadmap_mvp_comercial.md).
- Baselines aplicables: EPB v1.0, EDPB v1.0, EQAB v1.0 y EWB v1.0.

LAB-030 está **CERRADO — PASS** exclusivamente para su alcance ejecutado: RAG público E2, consistencia PostgreSQL/Qdrant, inventario y `DELETE` exactos, post-check, cero residuos, clínica QA preservada y retiro de temporales. Esa prueba no debe repetirse ni extrapolarse a toda la matriz de piloto.

## Avance de LAB-031

- **Tarea 1 — completada conceptualmente:** inventario consolidado de evidencia existente y reutilizable. No supone ejecución ni recalificación.
- **Tarea 2 — completada documentalmente:** creación de [QA_VETATIENDE_MASTER.md](QA_VETATIENDE_MASTER.md) con alcance, estados oficiales, regla de no repetición y matriz QA-01 a QA-08.
- **Tarea 3 — completada documentalmente:** creación de [QA07_DISENO_AISLAMIENTO_MULTICLINICA.md](QA07_DISENO_AISLAMIENTO_MULTICLINICA.md). Define dos clínicas sintéticas, correlación `LAB031_QA_<run_id>`, oráculos, manifest, cleanup exacto y siete casos E2 mínimos para lectura, mutación, configuración y fail-closed.
- **Tarea 4 — completada localmente:** implementación de `scripts/lab031/qa07_multiclinica.mjs` y `scripts/lab031/probar_qa07_multiclinica.mjs`. El orquestador único separa `PRECHECK_LOCAL`, `PREPARE_MANIFEST`, `INVENTORY`, `EXECUTE`, `CLEANUP` y `POSTCHECK`; los accesos externos requieren un adaptador inyectado y confirmación explícita.
- **Tarea 5 — completada localmente:** creación de [QA07_PREPARACION_E2.md](QA07_PREPARACION_E2.md), con contrato del adaptador, inventario/clasificación de recursos, configuración externa, checklist, responsabilidades y orden de preparación. Se corrigió el contrato local de `runCase` para exigir y persistir `created_resources` antes del caso siguiente, condición necesaria para cleanup seguro.
- **Tarea 6 — completada en alcance read-only local:** creación de [QA07_CADENA_E2_READONLY.md](QA07_CADENA_E2_READONLY.md). Se identificaron propietarios finales esperados, paths compartidos, estados históricos y la verificación manual mínima. No se consultó E2 porque no existe una vía administrativa configurada que sea read-only y utilizable sin credenciales.
- **Tarea 6B — reconciliación visual actual:** Cristian confirmó LAB-029 Público/Management y auxiliares LAB-027/LAB-024 publicados, LAB-026/028 no publicados, LAB-025 Interno publicado y LAB-029 Interno no publicado sobre el mismo path. La comparación local confirma que LAB-029 reemplaza funcionalmente a LAB-025 y conserva su operación, añadiendo RAG persistente/versionado.
- **Tarea 7 — preflight local de remediación:** creación de [QA07_REMEDIACION_INTERNO_PRECHECK.md](QA07_REMEDIACION_INTERNO_PRECHECK.md). Compatibilidad estructural PASS; cutover BLOCKED hasta verificar visualmente credenciales, PostgreSQL, Qdrant, Data Tables y rollback en E2.
- **Tarea 8 — smoke post-cutover bloqueado antes de red:** Cristian reportó LAB-025 Interno `Unpublished` y LAB-029 Interno `Published`, con dependencias visuales PASS. Codex no recibió endpoint/Header Auth/identidad QA en su entorno, por lo que S-01 falló en preflight y S-02 a S-04 quedaron `NOT_RUN`; no hubo E2 ni datos creados.
- **Tarea 8B — adaptador E2 seguro creado localmente:** `scripts/lab031/qa07_adapter_e2.mjs` implementa el contrato obligatorio, preflight sin red y smoke interno de dos lecturas. `scripts/lab031/probar_qa07_adapter_e2.mjs` valida seguridad y compatibilidad. Resultado local: adaptador 7/7 PASS, core 8/8 PASS y cero llamadas reales.
- LAB-031 continúa abierto; no se crearon workflows o datos remotos ni se ejecutó E2.

### Arquitectura y validación local de Tarea 4

- configuración externa, sin URLs, IPs, tokens, credenciales o calendarios reales hardcodeados;
- manifest seguro bajo `private-storage/lab031/<run_id>/manifest.json`, ignorado por Git;
- clínicas sintéticas fijas A/B y selección de los siete casos en un solo orquestador;
- inventory por IDs exactos, cardinalidad y pertenencia de clínica;
- cleanup bloqueado ante diferencias, IDs no inventariados o adaptador incompleto;
- eliminación de clínicas prohibida por contrato del manifest;
- PRECHECK y PREPARE sin red por diseño.

Validaciones locales autorizadas: sintaxis de ambos archivos **PASS**; generación de run/prefix y manifest, separación A/B, rechazo de clínica inválida y recurso cruzado, inventory fail-closed, bloqueo de cleanup antes de DELETE y ausencia de secretos literales **PASS 7/7**. La prueba instrumentada terminó con `network_calls=0`.

Permanece **NOT_VERIFIED**: disponibilidad/publicación de rutas, clínicas y calendarios QA, identidades/permisos, adaptadores reales, inventory remoto, siete casos E2, DELETE exacto remoto, post-check y preservación de recursos ajenos.

### Preparación E2 de Tarea 5

El adaptador debe exponer `inventory`, `runCase`, `deleteExact` y `postcheck`. Las rutas candidatas existen en exports (`vetatiende-comercial-chat-lab024` y `vetatiende-interno-lab025`), pero su propietario y publicación vigentes en E2 no están verificados. También requieren preparación sintética las clínicas A/B, dos calendarios distintos, identidades/permisos mínimos, configuración LAB-028 diferenciada, citas/tareas y documentos/puntos RAG exactos.

Validación local posterior al ajuste: sintaxis **PASS**, pruebas **PASS 8/8** y `network_calls=0`. No se usaron credenciales ni servicios externos.

El primer bloqueo vigente es identificar sin ambigüedad los workflows actualmente publicados que atienden las rutas pública e interna. Hasta resolverlo, `EXECUTE` permanece bloqueado. QA-07 continúa `NOT_VERIFIED` en E2 y `GATE-PILOT` sigue bloqueado.

### Cadena E2 de Tarea 6

Propietarios finales esperados: LAB-029 Público para `vetatiende-comercial-chat-lab024`, LAB-029 Interno para `vetatiende-interno-lab025` y LAB-029 Management como subworkflow sin webhook público. LAB-027 Scheduler es auxiliar; LAB-026, LAB-028 y LAB-025 quedan integrados/históricos cuando los propietarios LAB-029 estén publicados.

Primer fallo real documental: el último inventario remoto registrado muestra LAB-029 Público e Interno inactivos/no publicados, mientras Management estaba activo. LAB-028 y Scheduler LAB-027 constaban activos en evidencia anterior. El estado E2 actual, la ausencia de duplicados y los valores efectivos de Streamlit permanecen `NOT_VERIFIED`; no se usaron credenciales ni red.

La evidencia visual 6B reemplaza ese estado histórico donde corresponde: la ruta pública está reconciliada con LAB-029 Público publicado y LAB-026/028 no publicados. La discrepancia vigente es interna: LAB-025 sigue publicado y LAB-029 Interno no publicado. Se clasifica **GAP OPERACIONAL de criticidad alta**, bloqueante de QA-07 y `GATE-PILOT`.

Cristian encontró además publicados dos temporales LAB-030 —driver Gestión documental y cleanup RAG público— y ya los eliminó. Se registra la discrepancia con el cierre sin reabrir LAB-030 ni repetir la inspección.

Preflight Tarea 7: se conservan path, Header Auth, autorización, operación, acciones LAB-027 y tablas. LAB-029 sustituye la recarga temporal por versiones activas PostgreSQL antes de Qdrant. No hay subworkflows, secretos literales ni placeholders ejecutables. Primer bloqueo pendiente: confirmar visualmente la credencial PostgreSQL nueva y las demás dependencias asignadas en el workflow desplegado.

### Estado de ejecución de Tarea 3

**QA-07 E2: NOT_EXECUTED / NOT_VERIFIED.** QA-07 conserva estado `FAIL` y continúa bloqueando `GATE-PILOT`.

Dominios diseñados:

- lectura RAG, estado conversacional y operación interna en ambas direcciones;
- mutación cruzada de citas/Calendar y tareas internas;
- configuración diferenciada mediante `lab028_configuracion` / `lab028_campanas`;
- fail-closed para clínica inválida, inexistente e inactiva;
- inventory, comparación, DELETE exacto, restauración y post-check transversal.

Piezas candidatas a reutilización: autoridad y runners dirigidos LAB-029, semántica de cleanup exacto LAB-029, rutas LAB-026 de cita/Calendar, acciones protegidas LAB-025/LAB-027 y fixtures/runtime contextual LAB-028. Todas requieren selección o adaptación salvo el health check P/Q; los validadores completos y temporales cerrados permanecen históricos y no deben ejecutarse. Falta código nuevo mínimo para orquestación QA-07, manifest transversal, inventory/cleanup unificado y control reversible de clínica inactiva.

## Estado resumido de la matriz

| QA | Estado vigente |
|---|---|
| QA-01 — Salud técnica y contratos | `WARN` |
| QA-02 — RAG y conocimiento | `WARN` |
| QA-03 — Reservas | `NOT_VERIFIED` |
| QA-04 — Gestión de citas | `NOT_VERIFIED` |
| QA-05 — Urgencias y seguridad funcional | `NOT_VERIFIED` |
| QA-06 — Operación interna y seguimiento | `NOT_VERIFIED` |
| QA-07 — Multiclínica, aislamiento y persistencia | `FAIL` |
| QA-08 — Piloto, rendimiento y regresión global | `FAIL` |

## GAP corporativo: política de repositorios Emactiva

No se identificó entre las fuentes aprobadas ni en el repositorio una política corporativa de repositorios Emactiva versionada y declarada como baseline aplicable. Antes de evaluar cumplimiento debe identificarse o formalizarse la política, su versión, alcance, responsable y evidencia requerida. El hallazgo se conserva como GAP de gobierno; esta tarea no inventa controles ni lo remedia.

EPB v1.0 y EDPB v1.0 sí están reconocidos como aplicables, pero su auditoría GAP formal permanece pendiente antes del gate correspondiente.

## Riesgos conocidos

1. Aislamiento multiclínica integral no acreditado para calendario, configuración y operación.
2. Integración final/operacional completa de rutas críticas pendiente.
3. Cleanup transversal fuera del escenario documental aún pendiente.
4. Reproducción mantenible de LAB-027 pendiente.
5. Objetivo de rendimiento unificado inexistente.
6. Regresión dirigida, ampliada y completa integral todavía no acreditada.
7. Preparación operativa/UI, restore, retención, eliminación, incidentes y responsables pendiente.
8. GAP formal EPB/EDPB y política corporativa de repositorios pendiente.
9. La cadena publicada vigente, calendarios, identidades/permisos y configuración A/B deben verificarse antes de implementar QA-07.
10. No existe cleanup transversal conjunto para Calendar, PostgreSQL, Qdrant y todas las Data Tables afectadas.
11. El caso de clínica inactiva exige ventana sin concurrencia, snapshot y restauración exacta.

## Restricciones vigentes

- No ejecutar E2 ni suites completas sin una tarea posterior explícita.
- No modificar workflows o infraestructura.
- No usar datos reales ni versionar secretos.
- No reabrir LAB-030 ni repetir su escenario documental cerrado.
- No declarar `PASS` o aptitud de piloto sin evidencia.

## Siguiente paso exacto

Abrir una tarea específica para preparar —sin ejecutarlo todavía— un único fixture interno sintético versionado para `clinica_piloto_001` mediante el contrato Management de LAB-029, con manifest de IDs exactos, PRE-CHECK de ausencia, autorización explícita y cleanup/post-check cerrado sobre PostgreSQL y Qdrant. No continuar automáticamente hacia ejecución E2 ni QA-07.

## Registro de continuidad y cierre de sesión — 2026-10-15

- Cutover manual confirmado: LAB-025 Interno `Unpublished`; LAB-029 Interno `Published`; contrato compartido `POST /webhook/vetatiende-interno-lab025`. LAB-025 mantiene capacidad de rollback, pero no existe evidencia actual para ejecutarlo.
- Precheck visual PASS: Header Auth `VetAtiende Internal LAB-025`; PostgreSQL `Postgres account`; Qdrant `VetAtiende Qdrant Comercial`; Cohere `Cohere comercial LAB-021`; Groq `Groq Comercial LAB-020`, modelo `openai/gpt-oss-120b`. Se priorizó el export JSON para evitar revisión manual redundante nodo por nodo.
- Identidad sintética reutilizada: `usr_prueba_veterinario_001`, clínica `clinica_piloto_001`, provider `prueba_oidc`, subject `usuario_veterinario_001`, rol `veterinario`, estado `activo`, con `rag_interno_consultar` y `seguimientos_ver`. No se crearon identidades ni se modificaron Data Tables.
- Conectividad confirmada: el host no alcanzó `127.0.0.1:5678`; n8n estaba `healthy` con binding `10.0.0.97:5678 -> 5678/tcp` y la raíz respondió HTTP 200. No se modificó Docker; `127.0.0.1` sigue siendo válido para self-calls dentro de n8n.
- CLI n8n: la exportación de credenciales con `--user 0` no encontró credenciales; con el usuario normal del contenedor exportó siete. Usar el usuario normal para operaciones CLI de credenciales salvo motivo documentado; no repetir este diagnóstico.
- Drift confirmado de Header Auth: nombre `X-VetAtiende-Internal-Key`; `VETATIENDE_INTERNAL_KEY` existe en n8n pero faltaba en el host. El primer `curl` usó una variable vacía y devolvió 403, sin demostrar fallo del workflow. Comparación segura: `HEADER_NAME=MATCH`, `HEADER_VALUE=MISMATCH` entre entorno y credencial activa. No cambiar ninguna fuente hasta determinar autoridad y dependencias; no registrar valores.
- Smoke LAB-029 Interno: S-01 **PASS funcional** y S-02 **PASS funcional inicial**, HTTP 200, acción `ver_tareas_seguimiento`, identidad sintética existente y credencial n8n activa. No creó datos; cleanup `N/A`. No repetir S-01/S-02 salvo regresión o cambio de configuración.
- Adaptador local disponible con variables `LAB031_INTERNAL_BASE_URL`, `LAB031_INTERNAL_WEBHOOK_PATH`, `LAB031_INTERNAL_HEADER_NAME`, `LAB031_INTERNAL_HEADER_VALUE`, `LAB031_IDENTITY_PROVIDER`, `LAB031_IDENTITY_SUBJECT`, `LAB031_QA_CLINIC_A` y `LAB031_QA_CLINIC_B`. Validación previa: adaptador 7/7 PASS, core 8/8 PASS y cero red real. Las operaciones remotas de mutación/inventory/cleanup continúan fail-closed con `QA07_E2_OPERATION_NOT_IMPLEMENTED` cuando no están implementadas.
- Estado al cierre: LAB-031 `IN_PROGRESS`; cutover operativo según smoke mínimo; S-03 pendiente/no ejecutado; S-04 pendiente/no verificado; QA-07 `NOT_VERIFIED`; `GATE-PILOT` bloqueado; drift de Header Auth registrado como GAP previo al piloto.
- Seguridad: no incluir secretos en Git, HANDOFF, scripts, historial o manifests. La pérdida de variables temporales de PowerShell al cerrar sesión es esperada; reconstruir solo valores no sensibles y obtener secretos desde su autoridad de entorno.

## Tarea 9 — diagnóstico focalizado de persistencia documental interna

### Evidencia previa reutilizada

- S-03 respondió HTTP 200 con fallback seguro por ausencia de información.
- La ejecución n8n `#3940`, en `Leer versiones internas activas LAB-029`, devolvió cero filas.
- Para `clinica_piloto_001` ya constan en cero `documentos_clinica`, `documentos_internal`, `documentos_internal_activos`, `versiones_clinica` y `versiones_activas_internal`.
- La credencial n8n `Postgres account` funciona. El RAG histórico presente en Qdrant no acredita documentos versionados activos en PostgreSQL.
- No se repitieron S-01, S-02, S-03, la ejecución aislada del nodo PostgreSQL ni el diagnóstico de Header Auth.

### Método y resultado

Se revisó únicamente el mecanismo reutilizable `scripts/lab029/verificar_runtime_lab029.mjs`. Su contrato usa `LAB029_POSTGRES_URI` y el binario `psql`, pero solo ejecuta `SELECT 1`; no incluye una vía para consultar los conteos requeridos mediante la credencial n8n.

En el entorno actual de Codex:

- `LAB029_POSTGRES_URI`: ausente;
- `psql`: no disponible.

Por tanto, Codex no tiene acceso seguro suficiente para ejecutar la consulta autorizada. No se usó Docker, no se extrajeron credenciales, no se consultaron contenidos y no se obtuvieron conteos globales. El resultado queda **BLOQUEADO**: todavía no puede confirmarse si `vetatiende_documental.documents` contiene filas bajo otros `clinic_id` o si está vacía.

### Causa e hipótesis pendiente

La causa confirmada de este bloqueo diagnóstico es la ausencia simultánea del URI autorizado y del cliente PostgreSQL en el entorno de Codex. La causa del fallback S-03 continúa pendiente: la evidencia solo confirma ausencia para `clinica_piloto_001`, no el estado global de las tablas.

GAP identificado: falta una vía read-only autorizada y reutilizable desde Codex hacia PostgreSQL. No se crearán credenciales, dependencias ni infraestructura para resolverlo.

### Único procedimiento mínimo desde Ubuntu

Usar el `psql` ya disponible en Ubuntu y obtener `LAB029_POSTGRES_URI` de la autoridad de la credencial existente `Postgres account`, sin imprimirlo, guardarlo en archivos ni incorporarlo al historial. En una shell con historial desactivado para esta operación:

```bash
set +o history
read -r -s -p 'LAB029_POSTGRES_URI: ' LAB029_POSTGRES_URI; printf '\n'
export LAB029_POSTGRES_URI
rows="$(psql "$LAB029_POSTGRES_URI" -X -v ON_ERROR_STOP=1 -At -F '|' -c "SELECT clinic_id, visibility, status, COUNT(*) AS total FROM vetatiende_documental.documents GROUP BY clinic_id, visibility, status ORDER BY clinic_id, visibility, status;")" || { unset LAB029_POSTGRES_URI rows; set -o history; exit 1; }
if [ -n "$rows" ]; then
  printf '%s\n' "$rows"
else
  psql "$LAB029_POSTGRES_URI" -X -v ON_ERROR_STOP=1 -At -c "SELECT COUNT(*) AS total FROM vetatiende_documental.document_versions;"
fi
unset LAB029_POSTGRES_URI rows
set -o history
```

Este procedimiento ejecuta solo el agregado autorizado y, únicamente cuando devuelve cero filas, el total de `document_versions`. La siguiente acción mínima es que Cristian lo ejecute una vez desde Ubuntu y entregue exclusivamente las filas agregadas o el total, sin URI ni otros valores sensibles.

## Tarea 10 — Reconciliación de documentos sintéticos LAB-029

### Evidencia histórica utilizada

- La consulta read-only aportada por Cristian confirma ocho documentos sintéticos activos fuera de `clinica_piloto_001` y diez versiones totales. Para `clinica_piloto_001` hay cero documentos.
- Los manifests de `LAB029_TEST_20260914A`, `LAB029_TEST_20260914B` y `LAB029_TEST_20260914C` identifican exactamente sus clínicas y documentos. Ninguno registra `cleanup.status=PASS`.
- El HANDOFF de LAB-029 ordenó conservar A intacto y, al crear C, declaró A/B intactos como evidencia histórica de fallos anteriores.
- El cleanup final acreditado como `PASS` y con POST-CHECK en cero corresponde exclusivamente a `LAB029_TEST_20260914D`; sus IDs y conteos cerrados no incluyen A, B, C ni los fixtures genéricos.
- `scripts/lab029/fixtures/cargar_fixtures_lab029.sql` crea los tres documentos genéricos de `lab029_test_clinic_a` / `lab029_test_clinic_b`. Su contrato complementario `limpiar_fixtures_lab029.sql` elimina documentos, versiones, eventos y clínicas `LAB029_TEST_%` y falla si queda algún residuo.
- No fue necesario reabrir LAB-030: su cierre permanece intacto y no aporta una decisión adicional sobre estos ocho registros.

### Clasificación de los ocho documentos

| Grupo observado | Documentos | Clasificación | Fundamento |
|---|---:|---|---|
| `lab029_test_20260914a_clinic_a` / `public` | 1 | **PRESERVADO** | El run A debía quedar intacto y no limpiarse en ese punto; después se lo mantuvo como evidencia histórica. |
| `lab029_test_20260914b_clinic_a` / `public` | 1 | **PRESERVADO** | El HANDOFF declara A/B intactos como evidencia histórica al iniciar C. |
| `lab029_test_20260914c_clinic_a` / `internal` y `public`; `lab029_test_20260914c_clinic_b` / `public` | 3 | **NO DETERMINADO** | El manifest prueba pertenencia al run C, pero no se encontró una decisión explícita posterior de preservación ni un cleanup aprobado para esos IDs. |
| `lab029_test_clinic_a` / `internal` y `public`; `lab029_test_clinic_b` / `public` | 3 | **RESIDUO CONFIRMADO** | Son los fixtures genéricos y el cleanup canónico exige eliminarlos y verificar su ausencia; la consulta actual demuestra que permanecen. |

Resultado reconciliado: **2 preservados, 3 residuos confirmados y 3 no determinados**. Que todos sean sintéticos no cambia su clasificación ni autoriza borrado. No debe ejecutarse un cleanup por prefijo: mezclaría grupos con decisiones diferentes y violaría el control por IDs exactos.

### Diagnóstico focalizado de S-03

La causa inmediata del fallback es confirmada: `clinica_piloto_001` no tiene documentos en `vetatiende_documental.documents`, por lo que LAB-029 Interno no obtiene versiones internas activas que habiliten la recuperación documental. Esto es coherente con el diseño multiclínica y con los cleanups históricos: los fixtures observados pertenecen a otras clínicas y el cleanup D fue exacto; ninguna evidencia indica que se hubiera preparado contenido documental LAB-029 para la clínica piloto.

S-03 necesita un documento **nuevo, sintético, interno, activo y versionado** para `clinica_piloto_001`, acompañado por sus puntos Qdrant en `vetatiende_interno` con `clinic_id`, `document_id`, `version_id`, `visibility=internal` y estado compatibles. No basta reutilizar `cargar_fixtures_lab029.sql`: solo crea filas base en PostgreSQL y no acredita versión activa, embeddings ni puntos Qdrant.

El mecanismo reutilizable es el contrato Management de LAB-029 usado por el runtime para G-07/I-05: prepara documento/versionado, embedding, carga Qdrant, activación y consulta interna. Debe dirigirse mediante un fixture exclusivo de S-03, sin reutilizar IDs de A/B/C/D ni recargar el RAG histórico.

Preparación mínima requerida:

1. Manifest privado con `run_id`, `clinic_id=clinica_piloto_001`, un `document_id`, un `version_id`, archivo fuente y contenido sintéticos únicos, más los point IDs efectivamente creados.
2. PRE-CHECK read-only que demuestre ausencia de esos IDs en PostgreSQL y Qdrant y confirme que la clínica/identidad QA autorizadas siguen vigentes.
3. Autorización explícita para ejecutar Management únicamente sobre ese fixture y luego una sola consulta S-03 con una pregunta cuyo resultado esté contenido en el documento sintético.
4. Inventario posterior por IDs exactos en `documents`, `document_versions`, `document_events` y `vetatiende_interno`; no aceptar borrado por clínica o prefijo.
5. Cleanup exacto en orden de dependencias, seguido de POST-CHECK con cero residuos del run y verificación de que los ocho documentos preexistentes y sus puntos permanecen intactos.

La validación mínima de recuperación debe comprobar: HTTP 200; ausencia de fallback por información insuficiente; respuesta compatible con el dato sintético; atribución a `clinica_piloto_001`, `document_id` y `version_id` esperados; ninguna recuperación cruzada; y cleanup/post-check cerrado. No requiere repetir S-01 ni S-02.

### Riesgos y siguiente acción

- Los tres residuos confirmados no autorizan su eliminación dentro de S-03; requieren una tarea de cleanup separada y evidencia previa por IDs exactos.
- Los tres documentos C permanecen `NOT_VERIFIED` hasta localizar una decisión explícita o autorizar una reconciliación adicional.
- Cualquier preparación S-03 sin inventario previo, IDs únicos, point IDs capturados o cleanup exacto debe detenerse fail-closed.
- No deben utilizarse datos reales, secretos versionados ni un borrado amplio por `clinic_id`/prefijo.

Siguiente acción única: abrir una tarea específica para preparar, sin ejecutar, el fixture interno sintético de S-03 mediante Management LAB-029 y su manifest/PRE-CHECK/cleanup exacto para `clinica_piloto_001`.

## Tarea 11 — preparación controlada de fixture documental interno S-03

Se preparó localmente, sin red ni ejecución E2, un contrato independiente de QA-07 para validar RAG interno LAB-029 sobre `clinica_piloto_001`:

- `scripts/lab031/s03_fixture_documental.mjs`: crea un manifest privado bajo `private-storage/lab031/s03/<run_id>/manifest.json`; define PRE-CHECK, creación vía Management, consulta/oráculo, inventario exacto, cleanup separado PostgreSQL/Qdrant y POST-CHECK.
- `scripts/lab031/probar_s03_fixture_documental.mjs`: pruebas focalizadas con mocks locales y cero llamadas de red.

Fixture único propuesto:

- prefijo: `LAB031_S03_<run_id>`;
- documento: `<prefijo>_DOC_INTERNAL`;
- clínica: `clinica_piloto_001`;
- tipo: `administrative_demo`;
- visibilidad: `internal`;
- acceso: `veterinario`;
- contenido sintético: `El código de inventario del material de demostración es QA-S03-742.`;
- consulta: `¿Cuál es el código de inventario del material de demostración?`;
- oráculo: respuesta HTTP 200, sin fallback, con `QA-S03-742` y atribución exacta a clínica, documento y versión creada.

El contrato reutiliza la semántica Management LAB-029 (`action=ingest`) pero no implementa conectividad ni modifica workflows. La ejecución exige confirmación `LAB031_S03_EXECUTE`, PRE-CHECK vacío para los IDs del run y un adaptador explícito con `inventoryExact`, `createViaManagement` y `queryInternal`. Los IDs reales de versión, eventos y puntos deben capturarse desde la respuesta/inventario; no se inventan.

El cleanup exige confirmación independiente `LAB031_S03_CLEANUP`, igualdad estructural entre manifest e inventario actual y métodos separados `deleteExactQdrant` y `deleteExactPostgres`. Qdrant se elimina explícitamente primero; no se asume que Management lo haga. El POST-CHECK debe devolver cero recursos exactos. Una diferencia, ID ajeno, colección distinta, falta de point ID o residuo detiene el proceso antes de continuar.

No se modificaron ni clasificaron nuevamente los ocho documentos preexistentes, no se ejecutó cleanup histórico y no se tocó QA-07. S-03 continúa `NOT_VERIFIED`, E2 `NOT_EXECUTED` y `GATE-PILOT` bloqueado.

Primer bloqueo real: falta implementar/provisionar, bajo una tarea E2 explícita, el adaptador que conecte estas operaciones exactas con Management LAB-029 y las credenciales existentes; hasta entonces creación y cleanup remotos permanecen bloqueados.

Siguiente acción única: revisar y autorizar el contrato preparado antes de implementar el adaptador E2; no ejecutar todavía el fixture.

## Tarea 11B — endurecimiento del fixture S-03

El manifest pasó a esquema `1.1` y ahora es autoridad durable en `private-storage/lab031/s03/<run_id>/manifest.json`. Toda transición relevante se registra antes y después mediante escritura temporal exclusiva, `rename` atómico y permisos `0600` (`0700` para el directorio). La carga rechaza archivos inexistentes, inválidos, symlinks, rutas inconsistentes y runs ya existentes.

La creación persiste `PRECHECK_IN_FLIGHT`, `PRECHECK_PASS` y `CREATION_IN_FLIGHT` antes de operaciones remotas. Si una llamada o la persistencia posterior falla, el estado durable queda `CREATION_IN_FLIGHT` o `CREATION_AMBIGUOUS`; ambos bloquean reintentos. `reconcileCreation` permite únicamente inventario read-only: si observa cero recursos deja `RECONCILED_EMPTY`; si observa el conjunto completo guarda IDs reales y deja `CREATED_INVENTORIED`; un conjunto parcial o ajeno permanece bloqueado.

El cleanup registra inventario y recursos existentes, eliminados y pendientes en etapas separadas para Qdrant y PostgreSQL. Puede reanudarse tras fallo parcial consultando nuevamente el inventario exacto: omite lo ya ausente, no repite Qdrant cuando sus puntos ya no existen y nunca acepta recursos fuera del conjunto sellado. Mantiene confirmación destructiva independiente, borrado por IDs exactos, Qdrant explícito y POST-CHECK obligatorio. Solo `COMPLETE` establece `cleanup.status=PASS`.

### Contrato Management LAB-029

| Dato | Clasificación | Evidencia local |
|---|---|---|
| `document_id`, `clinic_id`, `visibility` | **CONFIRMADO** | Entradas obligatorias, validadas y propagadas como metadata. |
| `version_id` y `event_id` | **NO VERIFICADO** como salida | Se generan dentro de `Preparar contexto e IDs LAB-029`; la rama exitosa termina en PostgreSQL sin contrato de respuesta que garantice exponerlos. |
| estado activo de versión/documento | **CONFIRMADO** como diseño / **NO VERIFICADO** en E2 | La activación PostgreSQL y el cambio de payload Qdrant forman parte del flujo, pero requieren inventario read-only posterior. |
| eventos/auditoría asociados | **NO SOPORTADO** como inventario de salida | Management crea eventos mediante funciones/triggers y `event_id` para `no_changes`, pero no devuelve inventario completo. |
| point IDs Qdrant creados | **NO SOPORTADO** | El Vector Store escribe puntos, pero Management no expone sus IDs contractualmente. |

`createViaManagement` ya no se considera autoridad de IDs. Después de la escritura, `inventoryExact` read-only debe obtener documento, versión, eventos aplicables y todos los point IDs desde PostgreSQL/Qdrant. Sin esa capacidad, la creación queda ambigua y el cleanup no puede autorizarse.

Estado: persistencia y recuperación local `LOCAL_PASS`; E2 `NOT_VERIFIED`. Primer bloqueo real: Management LAB-029 no soporta por sí solo inventario exacto de eventos y point IDs Qdrant. El ajuste mínimo posterior es implementar en el futuro adaptador E2 una consulta read-only exacta por `clinic_id + document_id + version_id`, paginada para Qdrant, sin modificar Management.

Siguiente acción única: revisar y autorizar ese contrato de inventario read-only antes de implementar el adaptador E2. No ejecutar el fixture.

## Tarea 12 — adaptador de inventario read-only para S-03

Se agregó `scripts/lab031/s03_inventory_readonly.mjs`, integrado con el fixture mediante la interfaz existente `inventoryExact(manifest)`. El módulo no contiene transporte, endpoints, credenciales, escrituras ni DELETE: recibe lectores inyectados `postgresRead` y `qdrantScroll`.

PostgreSQL usa una consulta parametrizada exacta por `clinic_id=$1 AND document_id=$2`. Devuelve únicamente identificadores y metadatos operacionales de `documents`, `document_versions` y `document_events`; no consulta contenido ni `details`. Valida clínica, documento, visibilidad interna, estados, relaciones evento-versión, unicidad y máximo de una versión activa.

Qdrant consulta exclusivamente `vetatiende_interno` con filtros simultáneos `metadata.clinic_id` y `metadata.document_id`, pagina hasta agotamiento y devuelve los point IDs reales. Valida metadata, versión acreditada por PostgreSQL, colección, estados, duplicados y paginación completa. Un error de conexión o respuesta inválida lanza error; nunca se representa como inventario vacío.

El inventario vacío válido devuelve `[]`. Recursos Qdrant sin autoridad PostgreSQL, IDs faltantes, clínica/visibilidad ajenas, versiones no acreditadas, documentos duplicados, múltiples versiones activas o continuación de página ambigua bloquean el avance. El resultado normalizado es compatible con el contrato durable de Tarea 11B.

Compatibilidad local: **PREPARADA / E2_NOT_VERIFIED**. El adaptador aún requiere que una tarea posterior implemente los dos lectores contra credenciales existentes y confirme en E2 los formatos reales de respuesta, sin modificar Management.

Siguiente acción única: revisar y autorizar la implementación posterior de los lectores E2 read-only para PostgreSQL y Qdrant; no ejecutar todavía el fixture S-03.

## Tarea 13 — compatibilidad y lectores E2 read-only para S-03

Compatibilidad local clasificada:

- PostgreSQL — columnas, FK y estados de `documents`, `document_versions` y `document_events`: `CONFIRMADO_LOCAL` por migraciones LAB-029. Formato real devuelto por el transporte E2: `NO_VERIFICADO_E2`.
- Qdrant — colección `vetatiende_interno` y metadata `clinic_id`, `document_id`, `version_id`, `visibility`, `status`: `CONFIRMADO_LOCAL` por Management LAB-029. Point IDs y paginación reales en E2: `NO_VERIFICADO_E2`.
- Inventario contractual devuelto por Management: point IDs y eventos completos continúan `NO_SOPORTADO`; el lector independiente sigue siendo obligatorio.

El adaptador distingue `PRE_CREATE`, `POST_CREATE` y `RECOVERY_CLEANUP`. PRE_CREATE solo acepta inventario vacío; POST_CREATE exige documento, versión activa y al menos un punto Qdrant activo acreditado; RECOVERY_CLEANUP permite ausencia parcial únicamente cuando cada recurso restante pertenece al inventario sellado del manifest. Error, truncamiento, offset repetido, página intermedia fallida o recurso inesperado bloquean el avance.

Se agregó `s03_readers_e2.mjs`: Qdrant usa `fetch` inyectable, scroll read-only, timeout y configuración externa. PostgreSQL exige un executor inyectado que recibe SELECT parametrizado, parámetros separados, timeout y marca read-only. No se añadió `pg` ni otra dependencia; por ello el transporte PostgreSQL concreto queda bloqueado hasta que E2 proporcione un executor autorizado o un mecanismo existente equivalente.

Variables conceptuales: `LAB031_S03_POSTGRES_CONNECTION`, `LAB031_S03_POSTGRES_TIMEOUT_MS`, `LAB031_S03_QDRANT_URL`, `LAB031_S03_QDRANT_API_KEY` y `LAB031_S03_QDRANT_TIMEOUT_MS`. No se versionan valores. Errores se reducen a códigos sanitizados y no incluyen endpoints, conexiones o credenciales.

Estado: lectores **PREPARADOS localmente / E2_NOT_VERIFIED**. Primer bloqueo real: falta seleccionar y autorizar el executor PostgreSQL E2 sin instalar dependencias ni extraer credenciales. S-03 sigue `NOT_VERIFIED` y no se ejecutó infraestructura.

Siguiente acción única: decidir el mecanismo autorizado de ejecución del SELECT PostgreSQL parametrizado en E2; no ejecutar todavía S-03.

## Tarea 14 — executor PostgreSQL read-only para S-03

Se agregó `s03_postgres_executor.mjs`, conectado contractualmente a `createPostgresReadonlyReader`. El executor acepta exclusivamente `POSTGRES_INVENTORY_SQL`; rechaza cualquier SQL distinto, keyword de escritura, parámetro extra o identificador inválido antes de iniciar un proceso.

La ejecución preparada usa `spawnSync` sin shell, `psql -X --no-psqlrc`, `ON_ERROR_STOP`, conexión externa mediante `PGDATABASE` en el entorno del proceso y valores `clinic_id`/`document_id` mediante variables `-v`. Dentro del SQL, psql las convierte en literales correctamente escapados con `:'clinic_id'` y `:'document_id'`; nunca se interpolan directamente. La consulta canónica queda envuelta en `BEGIN READ ONLY`, `SET LOCAL statement_timeout` y `COMMIT`, y entrega un único array JSON de filas de inventario.

El timeout del proceso y `PGCONNECT_TIMEOUT` son configurables. Resultado vacío válido devuelve `[]`. Timeout, conexión, SQL, proceso y respuesta malformada tienen códigos diferenciados y sanitizados; no incluyen stderr, URI ni valores secretos. No se consultan contenido documental ni columnas ajenas al inventario.

Configuración conceptual: `LAB031_S03_POSTGRES_CONNECTION`, mantenida fuera de Git. La compatibilidad con `Postgres account` queda preparada pero `NO_VERIFICADO_E2`: esta tarea no exportó ni leyó la credencial n8n y no ejecutó psql real.

Primer bloqueo restante: confirmar de forma supervisada en Ubuntu que la configuración externa autorizada llega a libpq/psql y que el formato JSON real coincide con el contrato, mediante PRE_CREATE read-only únicamente. S-03 continúa `NOT_VERIFIED`.

Siguiente acción única: autorizar una ejecución PRE_CREATE read-only en Ubuntu con el manifest privado, sin crear documentos ni ejecutar S-03.

## Tarea 14B — corrección focalizada del executor psql

Se corrigió el mecanismo de interpolación: el executor ya no usa `psql -c`. El script SQL se entrega mediante `stdin` (`spawnSync.options.input`), vía en la que psql procesa las variables definidas con `-v`. Los argumentos conservan únicamente opciones y los dos valores validados; el SQL referencia `:'clinic_id'` y `:'document_id'`, por lo que psql aplica quoting de literal y los valores no se interpolan manualmente.

La prueba de regresión exige ausencia total de `-c`, presencia de `BEGIN READ ONLY` y referencias parametrizadas en `options.input`, además de `shell=false`. No se ejecutó psql real: este entorno no dispone de una instancia PostgreSQL local autorizada para demostrar la interpolación end-to-end. Por ello el mecanismo queda **CORREGIDO localmente / interpolación runtime NOT_VERIFIED** hasta PRE_CREATE Ubuntu.

La conexión libpq ahora distingue explícitamente `{kind: database}` de `{kind: conninfo}`. Se aceptan `LAB031_S03_POSTGRES_DATABASE` o `LAB031_S03_POSTGRES_URI`; la variable heredada `LAB031_S03_POSTGRES_CONNECTION` se clasifica por formato. Configuraciones ausentes o simultáneas se rechazan. En ambos casos el valor se entrega únicamente como `PGDATABASE` en el entorno del proceso, nunca en argumentos o errores.

Siguiente acción única: ejecutar, bajo autorización separada, PRE_CREATE read-only desde Ubuntu para verificar interpolación psql y configuración libpq reales; no crear documentos ni ejecutar S-03.

## Tarea 15 — integración controlada S-03 Management y cleanup

Se agregó `s03_integration_adapter.mjs`, que compone el fixture durable, `inventoryExact`, consulta interna y delegados de cleanup exacto. No contiene credenciales, endpoints literales, SQL de escritura ni DELETE.

Management LAB-029 permanece un subworkflow con `Execute Workflow Trigger`; no existe un webhook Management contractual que pueda inventarse desde este adaptador. `createViaManagement` exige un `managementInvoke` externo autorizado, valida el payload exacto del fixture y solo acepta confirmación `ok=true`. Su respuesta nunca se usa como autoridad de IDs: POST_CREATE read-only debe acreditar documento, versión, eventos y puntos reales.

La consulta interna prepara `consulta_rag_interno` con provider `prueba_oidc`, subject `usuario_veterinario_001`, sesión correlacionada y pregunta sintética. Exige HTTP 200 y contrato `ok/action/data.fuentes`. No inventa `document_id` ni `version_id`: la atribución usa el `document_id` real de `fuentes` y una única versión activa acreditada por inventario cuando el webhook no expone versión.

El cleanup se integra mediante delegados separados `deleteExactQdrant` y `deleteExactPostgres`; ambos reciben exclusivamente recursos ya validados por el manifest. `postcheckExact` vuelve a ejecutar `RECOVERY_CLEANUP`. Persistencia, AMBIGUOUS, reanudación parcial y confirmaciones destructivas continúan bajo `s03_fixture_documental.mjs`.

Los gates requieren manifest válido, invocador Management, inventario, ambos delegados de cleanup y webhook interno configurado. En ausencia de cualquiera, el estado es `BLOCKED` y no se habilita creación.

Estado: integración local preparada; E2 `NOT_EXECUTED`. Primer bloqueo real: no está provisionado ni autorizado el mecanismo `managementInvoke` para llamar al subworkflow publicado sin modificar Management. Después deberán provisionarse también los delegados de cleanup exacto antes de cualquier escritura.

Siguiente acción única: decidir y autorizar el mecanismo de invocación del subworkflow Management LAB-029; no crear todavía el documento S-03.

## Tarea 16 — invocador temporal QA de Management LAB-029

Se creó `scripts/lab031/s03_management_invoker_qa.json`, importable e inactivo, con Manual Trigger, barrera de evidencia, IF fail-closed, Execute Sub-workflow y salida de continuidad. No contiene webhook, schedule, credenciales, endpoints, IPs ni datos reales.

El contrato de diez campos String coincide con el Execute Sub-workflow Trigger de Management y usa `action=ingest`. El fixture queda fijado a `PRECHECK_20261104A`, `clinica_piloto_001`, documento exacto, contenido `QA-S03-742` y hash esperado.

El ID remoto vigente de Management está `NOT_VERIFIED`: el export local no contiene un ID estable acreditable. El nodo Execute usa `={{ $json.management_workflow_id }}` y la configuración lo deja vacío. También quedan vacía la autorización correlacionada y `cleanup_ready=false`. Estos tres gates duros hacen que la única ejecución importada termine en Stop And Error; no existe camino conectado a Execute sin pasar el IF.

Para habilitarlo en una tarea posterior deben acreditarse simultáneamente: ID remoto vigente, autorización exacta `LAB031_S03_MANAGEMENT_EXECUTE_PRECHECK_20261104A`, PRE_CREATE en cero todavía vigente, ausencia de ejecución previa y cleanup exacto operativo. Un booleano aislado no basta.

La salida conserva la respuesta Management pero marca `resources_accredited=false` y exige POST_CREATE read-only. No presume `version_id`, `event_id` ni point IDs.

Compatibilidad estructural local: preparada. Compatibilidad runtime n8n: `NOT_VERIFIED`; no se importó ni ejecutó E2.

Siguiente acción única: Cristian debe confirmar el ID remoto vigente de `LAB-029 - Gestión documental persistente y versionada` y mantener el invocador bloqueado hasta acreditar cleanup exacto; no importarlo todavía.

## Tarea 17 — cleanup exacto y gates verificables S-03

Se agregaron dos contratos locales focalizados, sin red ni operaciones destructivas reales:

- `s03_cleanup_transports.mjs` acepta transportes inyectados para Qdrant y PostgreSQL. Solo admite recursos presentes en `manifest.resources.created`, exige `clinic_id`, `document_id`, colección `vetatiende_interno`, IDs explícitos y autorización verificada por una autoridad externa inyectada. Qdrant recibe únicamente point IDs exactos. PostgreSQL recibe recursos en orden `event`, `version`, `document`, con transacción obligatoria. La respuesta debe acreditar exactamente cada identidad y cardinalidad solicitada; una respuesta parcial o ambigua bloquea el cierre.
- `s03_execution_gates.mjs` correlaciona manifest `PREPARED`, PRE_CREATE vigente en cero, capacidad real de ambos transportes más POST-CHECK y autorización humana externa de alcance `MANAGEMENT_CREATE_ONCE`. Rechaza evidencia ausente, caducada, inconsistente o de otro run. Una cadena introducida dentro de n8n no es autorización.

El invocador QA ya no contiene `precreate_status=PASS`, conteos estáticos, `cleanup_ready` ni autorización editable. Conserva el contrato de diez strings y el nodo Execute solo como referencia estructural, pero no existe conexión hacia él: ambas ramas del IF terminan en Stop And Error y el código fija `authorized=false`. El ID visual `s0NoyEyVtO9AgJUk` no se hardcodeó porque no existe aún una referencia local verificable/configurable que lo vincule de forma segura.

El manifest durable existente conserva los estados `*_IN_FLIGHT`/`CLEANUP_AMBIGUOUS`, inventario exacto y reanudación read-only. Las pruebas focalizadas cubren autorización ausente o editable no confiable, evidencia de otro run, PRE_CREATE no acreditado/caducado, cleanup ausente, recursos PostgreSQL/Qdrant ajenos, eliminación parcial, orden de dependencias, fallo entre operación y persistencia, reanudación exacta y POST-CHECK con residuos.

Resultado: **PARCIAL / E2_NOT_EXECUTED**. Los contratos de seguridad y transporte están preparados, pero no son todavía transportes E2 operativos: faltan implementaciones autorizadas de `qdrantDeletePoints`, `postgresDeleteOrdered`, proveedor de evidencia y verificador externo. Sin esas cuatro capacidades, la ruta de escritura permanece físicamente desconectada y S-03 continúa `NOT_VERIFIED`; `GATE-PILOT` permanece bloqueado.

Siguiente acción única: implementar y revisar localmente el proveedor/verificador externo y los dos transportes E2 inyectables usando las credenciales existentes, sin conectar todavía el nodo Execute ni realizar DELETE.

## S-03 — solicitud de ejecución funcional y cleanup (2026-11-04)

Resultado: **NOT_VERIFIED / E2_NOT_EXECUTED**. No se repitieron S-01, S-02 ni PRE_CREATE.

Esta sesión corre en el workspace Windows local y no dispone de destino SSH E2 configurado ni de una sesión autorizada sobre `/opt/vetatiende-ab`. Tampoco existe en el repositorio un comando E2 completo reutilizable: Management LAB-029 es un subworkflow sin webhook contractual; el invocador QA está deliberadamente desconectado; y los contratos `qdrantDeletePoints` y `postgresDeleteOrdered` aún no tienen implementaciones E2.

Ejecutar primero la creación podría dejar un documento sin cleanup operativo, contradiciendo la condición de cleanup aun cuando falle la consulta. Por ello no se creó el fixture ni se inventaron resultados.

Secuencia operativa única para Ubuntu, una vez provisionados un driver temporal autorizado y ambos transportes exactos:

```bash
cd /opt/vetatiende-ab

# Una sola creación. Ante retorno ambiguo, no repetir: pasar a inventario.
sudo docker compose exec -T n8n n8n execute --id "$LAB031_S03_DRIVER_WORKFLOW_ID"

# Inventario POST_CREATE exacto. Las variables de conexión se cargan desde el
# almacenamiento privado E2; sus valores no deben imprimirse.
export S03_CLINIC='clinica_piloto_001'
export S03_DOCUMENT='LAB031_S03_PRECHECK_20261104A_DOC_INTERNAL'
PGDATABASE="$LAB031_S03_POSTGRES_URI" psql -X -v ON_ERROR_STOP=1 -v clinic="$S03_CLINIC" -v document="$S03_DOCUMENT" -At > /tmp/lab031_s03_pg_inventory.json <<'SQL'
SELECT jsonb_build_object('documents',COALESCE((SELECT jsonb_agg(jsonb_build_object('document_id',d.document_id,'clinic_id',d.clinic_id,'status',d.status)) FROM vetatiende_documental.documents d WHERE d.clinic_id=:'clinic' AND d.document_id=:'document'),'[]'::jsonb),'versions',COALESCE((SELECT jsonb_agg(jsonb_build_object('version_id',v.version_id,'status',v.status)) FROM vetatiende_documental.document_versions v WHERE v.document_id=:'document'),'[]'::jsonb),'events',COALESCE((SELECT jsonb_agg(jsonb_build_object('event_id',e.event_id,'version_id',e.version_id)) FROM vetatiende_documental.document_events e WHERE e.clinic_id=:'clinic' AND e.document_id=:'document'),'[]'::jsonb));
SQL
curl --fail-with-body --silent --show-error -H "api-key: $LAB031_S03_QDRANT_API_KEY" -H 'content-type: application/json' "$LAB031_S03_QDRANT_URL/collections/vetatiende_interno/points/scroll" --data "{\"filter\":{\"must\":[{\"key\":\"metadata.clinic_id\",\"match\":{\"value\":\"$S03_CLINIC\"}},{\"key\":\"metadata.document_id\",\"match\":{\"value\":\"$S03_DOCUMENT\"}}]},\"limit\":100,\"with_payload\":true,\"with_vector\":false}" > /tmp/lab031_s03_qdrant_inventory.json
jq -e '.documents|length==1' /tmp/lab031_s03_pg_inventory.json
jq -e '.versions|map(select(.status=="active"))|length==1' /tmp/lab031_s03_pg_inventory.json
jq -e '(.result.points|length>0) and (.result.next_page_offset==null)' /tmp/lab031_s03_qdrant_inventory.json
S03_INVENTORY_ACREDITADO=1

# Consulta interna única. Guardar evidencia sin imprimir credenciales.
curl --fail-with-body --silent --show-error -H "$LAB031_INTERNAL_HEADER_NAME: $LAB031_INTERNAL_HEADER_VALUE" -H 'content-type: application/json' -H 'x-vetatiende-identity-provider: prueba_oidc' -H 'x-vetatiende-identity-subject: usuario_veterinario_001' "$LAB031_INTERNAL_BASE_URL/webhook/$LAB031_INTERNAL_WEBHOOK_PATH" --data "{\"internal_session_id\":\"LAB031_S03_PRECHECK_20261104A_INTERNAL_SESSION\",\"accion\":\"consulta_rag_interno\",\"message\":\"¿Cuál es el código de inventario del material de demostración?\"}" > /tmp/lab031_s03_query.json
jq -e '(.ok==true) and (.action=="consulta_rag_interno") and ((.message//"")|contains("QA-S03-742")) and (.data.requiere_revision_humana!=true)' /tmp/lab031_s03_query.json || S03_QUERY_FAILED=1

# Cleanup exacto aunque falle el jq anterior, siempre que ambos inventarios
# hayan acreditado el fixture. Qdrant elimina solo los point IDs observados.
test "${S03_INVENTORY_ACREDITADO:-0}" = 1
jq '{points:[.result.points[].id]}' /tmp/lab031_s03_qdrant_inventory.json > /tmp/lab031_s03_qdrant_delete.json
curl --fail-with-body --silent --show-error -H "api-key: $LAB031_S03_QDRANT_API_KEY" -H 'content-type: application/json' "$LAB031_S03_QDRANT_URL/collections/vetatiende_interno/points/delete?wait=true" --data @/tmp/lab031_s03_qdrant_delete.json > /tmp/lab031_s03_qdrant_delete_result.json
PGDATABASE="$LAB031_S03_POSTGRES_URI" psql -X -v ON_ERROR_STOP=1 -v clinic="$S03_CLINIC" -v document="$S03_DOCUMENT" <<'SQL'
BEGIN;
DELETE FROM vetatiende_documental.document_events WHERE clinic_id=:'clinic' AND document_id=:'document';
DELETE FROM vetatiende_documental.document_versions WHERE document_id=:'document';
DELETE FROM vetatiende_documental.documents WHERE clinic_id=:'clinic' AND document_id=:'document';
COMMIT;
SQL

# POST-CHECK obligatorio: ambos conteos deben ser cero.
PGDATABASE="$LAB031_S03_POSTGRES_URI" psql -X -v ON_ERROR_STOP=1 -v clinic="$S03_CLINIC" -v document="$S03_DOCUMENT" -At <<'SQL'
SELECT ((SELECT count(*) FROM vetatiende_documental.documents WHERE clinic_id=:'clinic' AND document_id=:'document')+(SELECT count(*) FROM vetatiende_documental.document_versions WHERE document_id=:'document')+(SELECT count(*) FROM vetatiende_documental.document_events WHERE clinic_id=:'clinic' AND document_id=:'document'));
SQL
curl --fail-with-body --silent --show-error -H "api-key: $LAB031_S03_QDRANT_API_KEY" -H 'content-type: application/json' "$LAB031_S03_QDRANT_URL/collections/vetatiende_interno/points/scroll" --data "{\"filter\":{\"must\":[{\"key\":\"metadata.clinic_id\",\"match\":{\"value\":\"$S03_CLINIC\"}},{\"key\":\"metadata.document_id\",\"match\":{\"value\":\"$S03_DOCUMENT\"}}]},\"limit\":100,\"with_payload\":false,\"with_vector\":false}" | jq -e '.result.points|length==0'
```

La secuencia usa herramientas ya disponibles o previamente verificadas (`docker compose`, n8n CLI, `psql`, `curl`, `jq`) y no usa el cleanup histórico de cantidades fijas. Su única dependencia no provisionada es `$LAB031_S03_DRIVER_WORKFLOW_ID`: debe corresponder a un driver temporal autorizado que entregue exactamente el fixture al subworkflow `s0NoyEyVtO9AgJUk`; no puede apuntar al workflow Management directamente porque su trigger necesita los diez inputs.

Primer bloqueo real: ausencia de acceso E2 autorizado y de transporte destructivo S-03 operativo; no es seguro crear antes de resolverlo.

Única acción manual indispensable: abrir para Codex una sesión Ubuntu autorizada en `/opt/vetatiende-ab`, manteniendo credenciales solo en E2, para comprobar y usar los mecanismos reales disponibles sin inventar contratos.

## S-03 — desbloqueo final de ejecución E2

Se agregó `scripts/lab031/s03_e2_operation.mjs` como único runner operacional. Reutiliza el manifest, inventario, lectores, executor psql, integración y transportes exactos existentes; no modifica Management LAB-029 ni workflows productivos.

Secuencia implementada:

1. Exige confirmación externa `LAB031_S03_E2_EXECUTE_ONCE` y toda la configuración E2 antes de operar.
2. Comprueba que los transportes PostgreSQL/Qdrant y la autorización destructiva están disponibles antes de crear.
3. Descubre de forma unívoca el workflow temporal desactivado por su nombre exacto, exporta un backup y genera en `/tmp` una variante efímera que conecta una sola rama al Management `s0NoyEyVtO9AgJUk`.
4. Importa y ejecuta el driver una sola vez. En `finally`, restaura siempre la definición bloqueada original. Nunca activa el workflow.
5. Si la salida de n8n es ambigua, no reintenta: ejecuta `RECONCILE_CREATION` read-only. Solo continúa si acredita documento, versión activa, eventos y puntos Qdrant reales.
6. Ejecuta una consulta `consulta_rag_interno` y exige HTTP/contrato válido, ausencia de fallback, clínica correcta y `QA-S03-742`.
7. Incluso si falla la consulta, elimina primero los point IDs Qdrant observados y después, dentro de una transacción PostgreSQL, los event IDs, version IDs y el document ID exactos.
8. Solo declara cleanup `PASS` cuando `RECOVERY_CLEANUP` confirma cero residuos.

Se corrigió el inventario normalizado para incluir `document_id` en el recurso PostgreSQL de tipo `document`. También se añadió el modo `RECONCILE_CREATION`, separado de `RECOVERY_CLEANUP`, para que un retorno ambiguo pueda acreditar recursos antes de que el manifest tenga IDs sellados.

Configuración externa requerida, sin valores en Git: exactamente una de `LAB031_S03_POSTGRES_URI`, `LAB031_S03_POSTGRES_DATABASE` o `LAB031_S03_POSTGRES_CONNECTION`; `LAB031_S03_QDRANT_URL`; `LAB031_S03_QDRANT_API_KEY`; `LAB031_INTERNAL_BASE_URL`; `LAB031_INTERNAL_WEBHOOK_PATH`; `LAB031_INTERNAL_HEADER_NAME`; `LAB031_INTERNAL_HEADER_VALUE`. `LAB031_S03_DRIVER_WORKFLOW_ID` es opcional: si falta, el runner descubre el único temporal desactivado. Ningún secreto se imprime ni se pasa en argumentos de psql.

Comando Ubuntu, desde un shell que ya tenga esas variables cargadas desde almacenamiento privado E2:

```bash
cd /home/ubuntu/vetatiende-lab031 && sudo --preserve-env=LAB031_S03_POSTGRES_URI,LAB031_S03_POSTGRES_DATABASE,LAB031_S03_POSTGRES_CONNECTION,LAB031_S03_QDRANT_URL,LAB031_S03_QDRANT_API_KEY,LAB031_S03_QDRANT_TIMEOUT_MS,LAB031_S03_POSTGRES_TIMEOUT_MS,LAB031_INTERNAL_BASE_URL,LAB031_INTERNAL_WEBHOOK_PATH,LAB031_INTERNAL_HEADER_NAME,LAB031_INTERNAL_HEADER_VALUE,LAB031_S03_DRIVER_WORKFLOW_ID env LAB031_S03_E2_CONFIRM=LAB031_S03_E2_EXECUTE_ONCE node scripts/lab031/s03_e2_operation.mjs
```

Estado: implementación local preparada y focalmente validada; ejecución E2 no realizada desde esta sesión. El comando emite únicamente el resumen JSON final o un código de error sanitizado.
