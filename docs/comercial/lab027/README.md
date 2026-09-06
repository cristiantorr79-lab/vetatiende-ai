# LAB-027 — Seguimientos, recordatorios y pendientes

## Estado final

LAB-027 queda cerrado funcionalmente para el piloto comercial. La batería runtime en n8n 2.29.8 terminó con **40/40 PASS**, sin fallos ni advertencias de rendimiento. Los tiempos observados fueron 0,48 s mínimo, 2,20 s promedio y 6,35 s máximo. La limpieza controlada posterior terminó **3/3 PASS** (`dry_run`, `ejecutar` y `verificar`) y confirmó cero residuos de datos ficticios incluidos en su lista permitida.

Los workflows permanentes son:

- `lab027_seguimientos_recordatorios_pendientes.json`: núcleo LAB-027, 96 nodos y 33 Code.
- `lab027_adaptador_canal_simulado.json`: contrato de canal simulado, 10 nodos y 3 Code.
- `lab024_urgencias_medicas_alerta_interna.json`: receptor interno de urgencias usado por LAB-027, 18 nodos y 6 Code.
- `lab025_operacion_interna_protegida_rag_interno.json`: gestión humana, permisos y auditoría reutilizados.
- `lab026_cancelacion_reprogramacion_citas_confirmadas.json`: autoridad de citas y propietario del canal público comercial.

Las utilidades temporales de construcción, fixtures, permisos, verificación y limpieza fueron retiradas del repositorio después de completar las pruebas runtime.

## Arquitectura

El scheduler único se ejecuta cada 30 minutos. LAB-027 no usa Wait nodes: persiste cada transición y la ejecución siguiente recupera el trabajo exigible. El núcleo genera seguimientos, prepara envíos, procesa respuestas y deriva trabajo humano o urgencias mediante contratos cerrados. El adaptador simulado aísla el transporte y conserva los resultados `accepted`, `rejected` y `uncertain`.

LAB-027 solo crea y administra dos tablas propias:

- `lab027_seguimientos`, con identidad determinista por clínica, cita, versión, tipo y etapa.
- `lab027_instrucciones`, catálogo autorizado por clínica, servicio y categoría de atención.

Las citas se leen desde `lab026_citas`. LAB-027 nunca cancela, reprograma ni modifica directamente una cita. Toda correlación usa `clinic_id`, `appointment_id` y `appointment_version` canónicos; un valor aportado por el body no puede sustituir la clínica autenticada ni la versión de la cita.

## Recordatorios previos a la cita

Solo se consideran citas confirmadas y configuraciones activas. Las reglas finales son:

| Categoría | Recordatorios |
|---|---|
| `rutina` | 24 horas |
| `examen_procedimiento` | 48 y 24 horas |
| `cirugia` | 72 y 24 horas |

Cada seguimiento y envío tiene una identidad determinista. Una versión nueva de la cita genera una identidad nueva y cierra de forma segura el pendiente obsoleto cuando corresponde. Una cita cancelada, reprogramada, vencida o incompatible no produce un nuevo envío. Estados intermedios como `enviando` impiden reenvíos ambiguos.

Las respuestas pre-cita válidas se correlacionan con el seguimiento enviado. Una confirmación clara cierra el pendiente. Una solicitud de cancelación o reprogramación se entrega a la semántica protegida de LAB-026. LAB-027 no ejecuta esa mutación.

Cuando el recordatorio final de 24 horas queda sin respuesta durante el plazo aprobado, el seguimiento pasa a contacto humano y se crea una sola tarea determinista en `lab025_tareas`. Repetir el scheduler reutiliza la tarea y no reescribe el seguimiento.

## Resultado de cita y seguimiento postatención

`registrar_resultado_cita` y `programar_seguimiento_clinico` se ejecutan a través de LAB-025 con usuario autenticado, clínica canónica y permiso activo. El resultado de cita admite el contrato aprobado y queda aislado por clínica, cita y versión. Programar seguimiento acepta únicamente `post_tratamiento` o `post_cirugia`, exige una cita canónica válida y un resultado `atencion_realizada`, y toma la versión desde esa cita.

Los seguimientos postatención usan etapa `post_atencion`. Antes del envío se releen cita e instrucción; el texto procede literalmente del catálogo autorizado y no se inventan indicaciones clínicas. El mensaje no incluye diagnóstico, medicamentos, dosis, historial completo ni identificadores internos. Una adquisición única protege contra envíos duplicados.

Los estados terminales relevantes son:

- `contactado`: envío clínico aceptado y listo para correlacionar respuesta.
- `respuesta_recibida`: respuesta normal registrada sin tarea.
- `requiere_revision_humana`: respuesta preocupante o ambigua, o fallback seguro.
- `derivado_urgencia`: LAB-024 confirmó la recepción real.

Una respuesta repetida idéntica devuelve `ya_registrada` sin reescribir timestamps, crear tareas ni repetir auditorías. Una respuesta contradictoria o una correlación incompatible se rechaza sin escritura. `respuesta_texto` nunca se persiste en `lab027_seguimientos`.

## Urgencias y fallback humano

LAB-024/LAB-024.1 mantiene prioridad absoluta. LAB-027 entrega `posible_urgencia` de forma síncrona al workflow interno LAB-024 mediante `Execute Workflow`, con clínica, seguimiento, envío, cita, versión y `derivacion_id` determinista. No envía texto clínico libre.

LAB-024 registra y verifica idempotentemente la alerta prioritaria, el intento/historial y la alerta operativa. Solo una respuesta `accepted` con identidad coincidente permite que LAB-027 marque `derivado_urgencia`. Un resultado `rejected`, `uncertain`, una excepción o una salida incompatible deja `requiere_revision_humana`, crea o reutiliza una tarea veterinaria urgente y registra un motivo de auditoría controlado.

LAB-024 interno no contiene webhook público. LAB-026 permanece activo como único propietario de `POST /webhook/vetatiende-comercial-chat-lab024` y conserva la detección pública y la semántica cerrada de urgencias. Así ambos workflows pueden publicarse simultáneamente sin conflicto de paths.

## Gestión humana y permisos

LAB-025 expone las acciones protegidas `ver_tareas_seguimiento`, `cerrar_tarea_seguimiento`, `registrar_resultado_cita` y `programar_seguimiento_clinico`. La fuente de autoridad es el usuario autenticado, su clínica y la matriz persistida en `lab025_permisos_roles`.

Permisos finales para `clinica_piloto_001`:

- `seguimientos_ver` y `seguimientos_operar`: recepción, veterinario y administrador.
- `seguimientos_clinicos_programar`: veterinario.

El cierre humano verifica la transición y persiste una auditoría antes de comunicar éxito. No-show solo puede registrarse manualmente por personal autorizado después de la hora de la cita; el scheduler no lo infiere.

## Seguridad e invariantes

- Scheduler: 30 minutos.
- Wait nodes: 0.
- Tablas propias LAB-027: exactamente 2.
- Sin nuevas credenciales ni secretos en los exports.
- Sin confianza en `clinic_id` o `appointment_version` externos.
- Sin escritura directa sobre citas LAB-026.
- Sin duplicación del motor de urgencias.
- IDs, tareas, alertas y auditorías idempotentes.
- `N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT=0` permanece como configuración aprobada.

Los scripts `generar_workflows_lab027.mjs`, `validar_workflows_lab027.mjs` y `probar_logica_lab027.mjs` reproducen y verifican los tres workflows afectados por LAB-027, sus contratos, conexiones, Code nodes, tablas autorizadas, ausencia de Wait, scheduler, aislamiento, idempotencia, integración LAB-024, gestión LAB-025 y protección LAB-026.
