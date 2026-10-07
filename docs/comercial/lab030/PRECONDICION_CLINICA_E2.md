# LAB-030 — Precondición temporal `clinica_piloto_001` en E2

Estado final: **PASS E2 / workflow temporal retirado**.

La verificación E2 confirmó `clinica_piloto_001`, nombre `LAB030_QA Clínica Piloto 001`, estado `active`, `post_check_valid=true` y `fixture_result=ALREADY_EXISTS_UNCHANGED`. El workflow temporal fue desactivado y eliminado de n8n; la clínica QA permanece intacta.

## Artefacto

- JSON: `scripts/lab030/workflow_temporal_precondicion_clinica_e2.json`.
- Generador: `scripts/lab030/generar_workflow_precondicion_clinica_e2.mjs`.
- SQL canónico: `scripts/lab030/fixtures/asegurar_clinica_piloto_001.sql`.
- Nombre n8n: `LAB-030 TEMP precondición clínica QA E2`.
- Estado del export: `active: false`.
- Nodos: 3.
- Endpoint: `POST /webhook/lab030-qa-ensure-clinic`.
- Autenticación: Header Auth existente `VetAtiende Internal Header Auth`.
- Base de datos: credencial existente `Postgres account`.

El SQL no acepta parámetros ni nombres de clínica desde el request. Solo ejecuta un `INSERT` fijo de `clinica_piloto_001` con `ON CONFLICT DO NOTHING`, seguido en la misma sentencia por la lectura exacta de la fila. El nodo final exige una única fila con ID, nombre y estado esperados y devuelve `CREATED` o `ALREADY_EXISTS_UNCHANGED`.

## Importación y configuración en n8n E2

1. Regenerar localmente con `node scripts/lab030/generar_workflow_precondicion_clinica_e2.mjs`.
2. Importar `workflow_temporal_precondicion_clinica_e2.json` como workflow nuevo; no reemplazar otro workflow.
3. Confirmar el nombre, tres nodos y estado inactivo.
4. En el nodo Webhook seleccionar `VetAtiende Internal Header Auth`.
5. En el nodo PostgreSQL seleccionar `Postgres account`.
6. Revisar que la consulta contiene exclusivamente el ID fijo `clinica_piloto_001` y `ON CONFLICT DO NOTHING`.
7. Guardar y capturar el ID asignado por n8n.
8. Activar/publicar únicamente durante la llamada controlada de precondición.

## Ejecución futura autorizada

Usar variables ya cargadas, sin imprimir sus valores:

```powershell
$base = $env:LAB028_N8N_BASE_URL.TrimEnd('/')
$headerName = $env:LAB029_INTERNAL_HEADER_NAME
$headers = @{ $headerName = $env:LAB029_INTERNAL_HEADER_VALUE }
Invoke-RestMethod -Method Post -Uri "$base/webhook/lab030-qa-ensure-clinic" -Headers $headers -ContentType 'application/json' -Body '{}'
```

Aceptar únicamente una respuesta con `ok=true`, `clinic_id=clinica_piloto_001`, nombre `LAB030_QA Clínica Piloto 001`, `status=active`, `post_check_valid=true` y `fixture_result` igual a `CREATED` o `ALREADY_EXISTS_UNCHANGED`. Luego desactivar el workflow y detenerse. No ejecutar ingestión ni cleanup en la misma tarea.

## Retirada

Desactivar y eliminar exclusivamente `LAB-030 TEMP precondición clínica QA E2` usando su ID n8n capturado. Esto retira el runner, no la fila creada. El cleanup de la fila permanece separado en `scripts/lab030/fixtures/cleanup_clinica_piloto_001.sql` y requiere autorización independiente.
