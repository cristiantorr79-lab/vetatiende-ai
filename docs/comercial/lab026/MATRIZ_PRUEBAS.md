# Matriz de pruebas LAB-026

## Convenciones

- Todas las personas, mascotas, teléfonos, citas y eventos son ficticios.
- Cada prueba debe verificar respuesta pública, Data Tables, Google Calendar y auditoría cuando corresponda.
- Una respuesta HTTP correcta no basta para aprobar una mutación: se requiere lectura posterior de Calendar y persistencia local.
- Las pruebas destructivas utilizan eventos creados específicamente para LAB-026.

## A. Inicialización y creación durable

| ID | Prueba | Resultado esperado |
|---|---|---|
| A01 | Ejecutar inicialización sin tablas LAB-026 | Crea las tres tablas con esquema esperado |
| A02 | Repetir inicialización | Reutiliza tablas existentes sin duplicarlas |
| A03 | Crear cita médica ficticia | Guarda `appointment_id`, `calendar_id` y `event_id`; verifica persistencia antes de responder |
| A04 | Crear cita de peluquería ficticia | En la primera respuesta agrupa datos de servicio + tutor + mascota + teléfono; luego guarda identificadores, duración y detalles antes de confirmar |
| A05 | Calendar crea, pero falla persistencia canónica | No confirma éxito; compensa o genera revisión humana trazable |
| A06 | Calendar no devuelve `event_id` | No confirma la cita y no crea registro durable inválido |
| A07 | Conversación multimensaje con pausas normales | El runner permanece disponible durante cinco minutos; no incurre en un arranque en frío por cada respuesta |

## B. Identificación y aislamiento

| ID | Prueba | Resultado esperado |
|---|---|---|
| B01 | Solicitud de cancelación sin teléfono | Luna solicita el teléfono asociado |
| B02 | Teléfono válido con una cita futura | Presenta resumen limitado y solicita confirmación |
| B03 | Teléfono válido con varias citas | Enumera `Cita 1`, `Cita 2...` sin mostrar IDs internos |
| B04 | Selección válida `Cita 2` | Vincula exactamente el `appointment_id` guardado en la segunda opción |
| B05 | Selección fuera de rango | No modifica nada y vuelve a pedir una opción válida |
| B06 | Teléfono sin citas futuras | Respuesta neutra; no revela datos de otros clientes |
| B07 | Mismo teléfono en otra clínica | No devuelve ni modifica citas de la otra clínica |
| B08 | `event_id` inventado en el mensaje | Se ignora como entrada de autorización |
| B09 | `appointment_id` inventado en el mensaje | Se ignora como entrada de autorización |
| B10 | Misma sesión con teléfono incorrecto | `session_id` no autoriza; no muestra ni modifica la cita |
| B11 | Cita pasada | No se ofrece como modificable |
| B12 | Operación expirada | Requiere iniciar nuevamente la verificación |

## C. Cancelación

| ID | Prueba | Resultado esperado |
|---|---|---|
| C01 | Rechazar confirmación | Conserva la cita; cierra o devuelve la operación sin mutación |
| C02 | Confirmar cancelación válida | Elimina evento, verifica ausencia, persiste `cancelada` y audita |
| C03 | Doble confirmación de la misma cancelación | No ejecuta una segunda eliminación ni informa un éxito nuevo falso |
| C04 | Cita ya cancelada | Respuesta idempotente/controlada; Calendar no se muta |
| C05 | Evento no existe antes de cancelar | Marca inconsistencia y deriva a revisión humana |
| C06 | Falla eliminación en Calendar | No persiste `cancelada`; revierte bloqueo o deriva a revisión |
| C07 | Eliminación exitosa y lectura posterior ambigua | No confirma éxito; crea pendiente LAB-025 |
| C08 | Calendar eliminado y falla persistencia local | `requiere_revision` + pendiente humano + auditoría técnica |
| C09 | Dos cancelaciones concurrentes | Solo una adquiere el bloqueo lógico |
| C10 | Versión de cita cambió antes de confirmar | Rechaza la mutación y obliga a releer la cita |

## D. Reprogramación

| ID | Prueba | Resultado esperado |
|---|---|---|
| D01 | Nueva fecha/hora válida y libre | Presenta horario y solicita confirmación |
| D02 | Mensaje contiene solo fecha | Conserva fecha y solicita hora |
| D03 | Mensaje contiene solo hora | Conserva hora y solicita fecha |
| D04 | Horario fuera de jornada | No muta; informa restricción y ofrece nueva selección |
| D05 | Horario que termina después del cierre | No muta; ofrece alternativa válida |
| D06 | Horario no respeta intervalo | Ajusta/ofrece alternativas según configuración |
| D07 | Horario ocupado | Enumera alternativas reales |
| D08 | Selección de alternativa válida | Guarda internamente inicio/término exactos |
| D09 | Conflicto aparece al confirmar | Conserva cita original y ofrece nuevas alternativas |
| D10 | Reprogramación médica exitosa | Mantiene el mismo `event_id`, actualiza horario y audita |
| D11 | Reprogramación de peluquería exitosa | Conserva duración completa y el mismo `event_id` |
| D12 | Rechazar confirmación de nuevo horario | Cita original permanece sin cambios |
| D13 | Falla creación del bloqueo temporal | No modifica evento original |
| D14 | Bloqueo creado pero no verificable | No modifica original; deriva si no puede reconciliarse |
| D15 | Falla actualización del evento original | Cita original permanece o se deriva con estado verificable |
| D16 | Evento actualizado pero falla eliminación del bloqueo | Cita queda `requiere_revision`; pendiente humano |
| D17 | Evento actualizado y falla persistencia local | No confirma; registra pendiente y evidencia |
| D18 | Doble reprogramación concurrente | Solo una adquiere el bloqueo lógico |
| D19 | Reintento tras timeout ambiguo | Relee Calendar/estado antes de decidir; no duplica cambios |

## E. Auditoría y revisión humana

| ID | Prueba | Resultado esperado |
|---|---|---|
| E01 | Cancelación aprobada | Auditoría contiene acción, estados, cita y resultado |
| E02 | Reprogramación aprobada | Auditoría conserva horario anterior/nuevo y mismo evento lógico |
| E03 | Verificación fallida repetida | Registra resultado controlado sin exponer datos sensibles |
| E04 | Fallo parcial | Crea un único pendiente LAB-025 correlacionado con `operation_id` |
| E05 | Reintento del mismo fallo | No crea pendientes duplicados |
| E06 | Error técnico público | Mensaje sanitizado sin URLs internas, nodos, secretos ni stack trace |

## F. Prioridad y regresión

| ID | Prueba | Resultado esperado |
|---|---|---|
| F01 | Urgencia durante cancelación | LAB-024 responde; cita no cambia; gestión queda retomable |
| F02 | Urgencia durante reprogramación | LAB-024 responde; no se crea bloqueo ni se actualiza Calendar |
| F03 | Consulta RAG pública | Respuesta normal sin entrar a LAB-026 |
| F04 | Nueva agenda médica | Continúa funcionando y ahora persiste cita durable |
| F05 | Nueva agenda peluquería | Continúa funcionando y ahora persiste cita durable |
| F06 | Cancelar solicitud abierta | Abandona solo la conversación; no busca ni elimina cita confirmada |
| F07 | Integración de alerta LAB-024 → LAB-025 | Permanece operativa |
| F08 | App interna OIDC y recursos LAB-025 | Permanecen sin regresión |
| F09 | Latencia de agenda sin IA ni Calendar | Se mide por turno y no debe superar 20 segundos con el runner caliente; cualquier exceso se investiga antes del cierre |

## G. Limpieza y cierre

| ID | Prueba | Resultado esperado |
|---|---|---|
| G01 | Revisar export final | JSON válido, conexiones válidas y sin secretos incrustados |
| G02 | Limpiar citas/eventos ficticios | Calendar y tablas quedan sin datos de prueba innecesarios |
| G03 | Revisar Git | Solo cambios de LAB-026; un único commit de cierre |
