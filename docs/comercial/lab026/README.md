# LAB-026 — Cancelación y reprogramación segura de citas confirmadas

**Proyecto:** VetAtiende AI
**Etapa:** piloto comercial listo para implementar/vender
**Estado:** cerrado técnicamente y validado
**Fecha de cierre:** 3 de septiembre de 2026

## Objetivo

LAB-026 incorpora cancelación y reprogramación segura de citas médicas y de peluquería/lavado ya confirmadas, manteniendo aislamiento por clínica, trazabilidad, idempotencia, verificación de Google Calendar y prioridad de urgencias.

## Implementación final

La solución utiliza:

- `lab026_citas` como registro canónico durable;
- `lab026_operaciones_cita` para continuidad e idempotencia;
- `lab026_auditoria_citas` para trazabilidad;
- `appointment_id` únicamente interno;
- `operation_id` para mutaciones idempotentes;
- teléfono reingresado y normalizado para verificar al solicitante;
- selección de cita cuando existen varias reservas futuras asociadas;
- verificación antes y después de operaciones sensibles;
- `hold` temporal sin PII durante reprogramación;
- revisión humana mediante LAB-025 cuando el resultado no puede demostrarse.

El diseño inicial contempló un `appointment_ref` público, pero fue descartado durante LAB-026 para no exigir códigos de reserva al cliente.

## Contrato público

Las respuestas públicas quedan limitadas a:

- `ok`;
- `clinic_id`;
- `session_id`;
- `reply`.

`session_id` mantiene continuidad conversacional y trazabilidad, pero no constituye autorización suficiente.

## Cancelación

La cancelación verifica la cita seleccionada, relee el registro canónico, elimina el evento correcto, verifica su ausencia, persiste el estado cancelado, vuelve a verificarlo y solo después comunica éxito.

Los reintentos terminales no repiten la mutación.

## Reprogramación

La cita original se conserva mientras el nuevo horario no esté asegurado.

La secuencia final relee y valida cita, versión, evento y horario; revalida el candidato; adquiere control lógico; crea y verifica un `hold`; actualiza y verifica el evento original; elimina y verifica el `hold`; persiste y verifica el nuevo estado; audita; y solo entonces comunica éxito.

Cuando no puede demostrarse el resultado final, no se comunica éxito y la operación se deriva a revisión humana.

## Urgencias

LAB-024/LAB-024.1 conserva prioridad. Una urgencia suspende la gestión de cita sin ejecutar la mutación en esa interacción y conserva el estado LAB-026 para continuar después.

## Pruebas aprobadas

Se validaron:

- creación durable;
- cancelación médica y de peluquería;
- reprogramación médica y de peluquería;
- duraciones variables;
- conflictos antes de confirmación;
- carreras y cambios concurrentes;
- fallos parciales de Calendar y persistencia;
- limpieza y rollback;
- idempotencia;
- reintento después de timeout;
- urgencias durante gestión;
- regresiones públicas e internas;
- OIDC, RAG interno y pendientes LAB-025;
- contrato público final.

## Rendimiento

Durante LAB-026 se investigaron demoras de 20 a más de 60 segundos.

La causa principal identificada fue el ciclo de apagado/arranque del runner JavaScript externo de n8n, acompañado de ofertas expiradas.

Para el piloto se dejó:

`N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT=0`

en n8n y task-runners.

Resultados finales en estado estable:

- promedio público: **5,02 s**;
- máximo de la batería pública final: **6,88 s**;
- confirmación durable de reprogramación: **12,18 s**;
- objetivo durable menor a 15 s: aprobado.

La primera ejecución posterior a un reinicio puede incluir calentamiento del runner.

## Seguridad

La credencial de autenticación de Task Runners fue rotada durante el cierre después de que el valor anterior quedara expuesto durante diagnóstico.

La credencial vigente no se documenta, no se incluye en Git y permanece únicamente en la configuración privada del servidor.

El export final fue auditado sin encontrar secretos ni marcadores temporales de inyección de fallos.

## Limpieza final

Se eliminaron:

- eventos ficticios de Calendar;
- `hold` ficticios;
- filas operativas ficticias;
- pendientes, alertas, auditorías, tareas, derivaciones y estados de prueba.

Se conservaron `lab025_usuarios_internos` y `lab025_permisos_roles` como configuración base del piloto interno.

Las estructuras Data Table se mantienen; solo se eliminaron datos ficticios.

## Export oficial

`n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json`

SHA256:

`e0b4cb517ca5c115e3795451e56d89edada2f5ac4d734827dff7898c56f39533`

Validación final:

- workflow activo;
- 303 nodos;
- 102 nodos Code;
- 0 nodos deshabilitados;
- `pinData` vacío;
- sin `appointment_ref`;
- sin marcadores temporales G04–G11;
- sin secretos detectados.

## Cierre

LAB-026 completa la cancelación y reprogramación segura requerida para el primer piloto comercial de VetAtiende AI.

El siguiente laboratorio del roadmap es LAB-027.
