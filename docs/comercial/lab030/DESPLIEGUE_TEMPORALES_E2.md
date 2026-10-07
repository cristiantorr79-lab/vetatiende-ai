# LAB-030 — Procedimiento de despliegue de temporales en E2

Estado final: **PROCEDIMIENTO EJECUTADO Y TEMPORALES RETIRADOS**. Este documento conserva el procedimiento histórico y no autoriza nuevas ejecuciones, ingestiones o borrados.

Los workflows temporales de Gestión, precondición, cleanup documental y post-check fueron utilizados durante la ventana controlada, desactivados y eliminados posteriormente de n8n. Sus scripts, generadores y JSON permanecen únicamente como artefactos reproducibles del LAB.

Los exports de cleanup documental y post-check fueron corregidos posteriormente para reutilización: `INVENTORY` recibe la clínica y documento QA exactos, descubre una única versión activa y genera el manifest de IDs reales. DELETE y POST_CHECK consumen ese mismo manifest; nunca deben reconstruirse manualmente ni reutilizar IDs de una ejecución anterior.

Estado de cierre: los temporales corregidos se utilizaron con el manifest de la ejecución #2887, el cleanup y post-check finalizaron en PASS y todos los workflows temporales fueron retirados. No forman parte de la arquitectura productiva permanente.

## Artefactos

### Driver temporal de Gestión documental

- Archivo: `scripts/lab030/workflow_temporal_gestion_documental.json`.
- Generador reproducible: `scripts/lab030/generar_workflow_temporal_gestion_documental.mjs`.
- Fuente inmutable: `n8n/workflows/comercial/lab029_gestion_rag_persistente.json`.
- Nombre n8n: `LAB-030 TEMP driver Gestión documental`.
- Estado del export: `active: false`.
- Nodos: 40.
- Endpoint: `POST /webhook/lab030-qa-gestion-documental`.
- Autenticación: Header Auth existente `VetAtiende Internal Header Auth`; el JSON contiene solo el placeholder `CONFIGURE_EXISTING_HEADER_AUTH`.
- Dependencias: credenciales existentes `Postgres account`, `VetAtiende Qdrant Comercial` y `Cohere comercial LAB-021`; variable n8n `LAB029_QDRANT_URL`; esquema PostgreSQL `vetatiende_documental`; colección Qdrant `vetatiende_publico`; clínica QA `clinica_piloto_001` existente.

El generador sustituye únicamente el `executeWorkflowTrigger` del export LAB-029 por un webhook protegido y un nodo que extrae `body`. No modifica el workflow fuente.

### Cleanup temporal de la huella de sesión RAG

- Archivo: `scripts/lab030/workflow_temporal_cleanup_rag_publico.json`.
- Nombre n8n: `LAB-030 TEMP cleanup RAG público`.
- Estado del export: `active: false`.
- Nodos: 16.
- Endpoints protegidos dentro del mismo workflow:
  - `POST /webhook/lab030-rag-cleanup-inventory`;
  - `POST /webhook/lab030-rag-cleanup-delete`;
  - `POST /webhook/lab030-rag-cleanup-postcheck`.
- Autenticación: Header Auth existente `VetAtiende Internal Header Auth`; el JSON contiene solo el placeholder `CONFIGURE_EXISTING_HEADER_AUTH`.
- Dependencias: Data Table fija `lab024_estado_urgencia`, ID `WYCc8CjBsmZij4Wn`; no depende de PostgreSQL ni Qdrant.

Este cleanup elimina exclusivamente la fila de sesión del caso RAG mediante igualdad exacta de `state_key`. El cleanup del documento sintético sigue representado por `cleanup_documento_rag_publico.mjs` en modo `PLAN_ONLY`; en 9E no se ingiere el documento y, por tanto, no existe huella documental que borrar.

## Preparación local por Cristian

Ejecutar en PowerShell, sin imprimir variables de autenticación:

```powershell
Set-Location 'C:\Users\DELL\VetAtiendeAI'
node --check scripts/lab030/generar_workflow_temporal_gestion_documental.mjs
node scripts/lab030/generar_workflow_temporal_gestion_documental.mjs
Get-FileHash scripts/lab030/workflow_temporal_gestion_documental.json -Algorithm SHA256
Get-FileHash scripts/lab030/workflow_temporal_cleanup_rag_publico.json -Algorithm SHA256
```

No se requiere SSH, Docker Compose ni copia al host E2: ambos JSON pueden importarse desde el navegador de Cristian. Si la política operativa exige transferencia por SSH, debe definirse antes el host y usuario autorizados; no se incluyen valores inventados.

## Orden exacto en n8n E2

1. Abrir n8n E2 con la cuenta operativa autorizada.
2. Importar `workflow_temporal_cleanup_rag_publico.json` como workflow nuevo. No reemplazar ningún workflow existente.
3. Confirmar nombre, 16 nodos y estado inactivo.
4. En cada uno de los tres nodos Webhook, seleccionar la credencial existente `VetAtiende Internal Header Auth`. No copiar su valor a notas, comandos ni JSON.
5. Confirmar que los cuatro nodos Data Table apuntan a `WYCc8CjBsmZij4Wn` y que el único `deleteRows` filtra por igualdad de `state_key`.
6. Guardar sin publicar/activar.
7. Importar `workflow_temporal_gestion_documental.json` como workflow nuevo. No reemplazar `LAB-029 - Gestión documental persistente y versionada`.
8. Confirmar nombre, 40 nodos y estado inactivo.
9. En el Webhook seleccionar `VetAtiende Internal Header Auth`. Confirmar que PostgreSQL, Qdrant y Cohere resuelven a las credenciales existentes indicadas arriba y que `LAB029_QDRANT_URL` está disponible en n8n.
10. Guardar sin publicar/activar.
11. Capturar los IDs asignados por n8n a ambos workflows; no reutilizar ni editar IDs de LAB-029.

En esta tarea debe quedar **cero workflows temporales publicados o activos**. En la futura ventana de ejecución, activar primero cleanup y luego Gestión. Mantenerlos activos solo durante `ingestión → smoke RAG → cleanup exacto → post-check`; desactivar primero Gestión y luego cleanup al cerrar la ventana.

## Comprobación no destructiva de disponibilidad

La importación y resolución de credenciales se comprueban visualmente sin ejecutar nodos. Si una futura tarea autoriza comprobar los webhooks por HTTP, activar temporalmente ambos y usar únicamente estas llamadas no destructivas:

```powershell
$base = $env:LAB028_N8N_BASE_URL.TrimEnd('/')
$headerName = $env:LAB029_INTERNAL_HEADER_NAME
$headers = @{ $headerName = $env:LAB029_INTERNAL_HEADER_VALUE }

# Debe ser rechazado por contrato antes de PostgreSQL/Qdrant; no ingiere.
Invoke-RestMethod -Method Post -Uri "$base/webhook/lab030-qa-gestion-documental" -Headers $headers -ContentType 'application/json' -Body '{}'

# Solo lectura; usa una sesión sintética que no se usará en el smoke.
$probe = @{ clinic_id='clinica_piloto_001'; session_id='LAB030_QA_DEPLOY_PROBE_NEVER_USED'; state_key='clinica_piloto_001::LAB030_QA_DEPLOY_PROBE_NEVER_USED' } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri "$base/webhook/lab030-rag-cleanup-postcheck" -Headers $headers -ContentType 'application/json' -Body $probe
```

No ejecutar los endpoints de ingestión, inventario o delete durante 9E. No incluir el valor del Header Auth en capturas o transcripciones. La primera llamada debe mostrar rechazo controlado del contrato; la segunda debe confirmar cero coincidencias. Cualquier resultado diferente detiene el procedimiento.

## Rollback

1. Desactivar `LAB-030 TEMP driver Gestión documental` si estuviera activo.
2. Desactivar `LAB-030 TEMP cleanup RAG público` si estuviera activo.
3. Confirmar en n8n que ambos figuran inactivos y que cesaron sus production webhooks.
4. Eliminar únicamente esos dos workflows usando los IDs capturados durante la importación.
5. No editar, importar sobre, publicar, activar o desactivar `LAB-029 - Gestión documental persistente y versionada` ni el workflow público LAB-029.
6. Confirmar que los archivos fuente LAB-029 conservan sus hashes/estado Git y que no se modificó infraestructura.

Como 9E no ejecuta ingestión ni cleanup, el rollback no requiere tocar PostgreSQL, Qdrant o Data Tables.

## Evidencia a capturar

- SHA-256 local de ambos JSON.
- Pantalla de importación con nombre, ID n8n, cantidad de nodos y estado inactivo de cada workflow.
- Pantalla de los cuatro Webhooks mostrando método, path y tipo de autenticación, sin valores secretos.
- Pantalla de credenciales resueltas por nombre y sin revelar contenido.
- Confirmación de Data Table fija y filtro exacto en cleanup.
- Confirmación de dependencias PostgreSQL/Qdrant/Cohere del driver.
- Confirmación de que LAB-029 y su workflow público no cambiaron.
- Si una tarea posterior autoriza probes HTTP: timestamp, HTTP status y resultado redactado; nunca headers.
- Pantalla final con ambos temporales inactivos y ausencia de ejecuciones de ingestión/delete en 9E.
