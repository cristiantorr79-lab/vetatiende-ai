# Evidencia LAB-007 - Agenda operativa con Google Calendar

Fecha: 06-07-2026

## Objetivo

Implementar agenda operativa usando Google Calendar como fuente real de disponibilidad.

La regla principal del laboratorio es que Luna no debe inventar horarios ni confirmar citas sin validación previa en Google Calendar.

## Arquitectura validada

Solicitud externa de agenda
→ Webhook Solicitud Agenda
→ Preparar Datos Agenda
→ Consultar Disponibilidad Agenda
→ Evaluar Disponibilidad Agenda
→ Crear cita si hay disponibilidad
→ Responder confirmación o no disponibilidad

## Workflow implementado

Archivo exportado:

n8n/workflows/lab007_vetatiende_agenda_operativa_google_calendar.json

## Nodos principales

- Webhook Solicitud Agenda
- Preparar Datos Agenda
- Consultar Disponibilidad Agenda
- Evaluar Disponibilidad Agenda
- Crear Cita en Google Calendar
- Respuesta Cita Confirmada
- Respuesta Horario No Disponible
- Responder Solicitud Agenda

## Validaciones realizadas

### Prueba 1 - Google Calendar conectado

Resultado:
APROBADO

Detalle:
Se creó un calendario separado llamado VetAtiende AI - Agenda Clínica y se conectó n8n mediante credencial OAuth de Google Calendar.

### Prueba 2 - Consulta de disponibilidad libre

Resultado:
APROBADO

Detalle:
El nodo Consultar Disponibilidad Agenda devolvió available = true cuando el horario consultado estaba libre.

### Prueba 3 - Consulta de disponibilidad ocupada

Resultado:
APROBADO

Detalle:
Al consultar un horario ocupado en Google Calendar, el nodo devolvió available = false.

### Prueba 4 - Evaluación con nodo IF

Resultado:
APROBADO

Detalle:
El nodo Evaluar Disponibilidad Agenda envió el flujo por la rama True cuando available = true y por la rama False cuando available = false.

### Prueba 5 - Creación de cita

Resultado:
APROBADO

Detalle:
Cuando el horario estaba disponible, el flujo creó correctamente una cita en Google Calendar.

### Prueba 6 - Bloqueo de duplicidad

Resultado:
APROBADO

Detalle:
Al ejecutar dos veces la misma solicitud de agenda, la primera ejecución creó la cita y la segunda respondió que el horario no estaba disponible.

### Prueba 7 - Respuesta por Webhook

Resultado:
APROBADO

Detalle:
El workflow respondió correctamente por HTTP usando Respond to Webhook, devolviendo una respuesta de confirmación o no disponibilidad.

### Prueba 8 - Zona horaria

Resultado:
APROBADO

Detalle:
Se configuró n8n y el contenedor Docker con la zona horaria America/Santiago mediante variables de entorno en compose.yaml.

Variables agregadas:

- GENERIC_TIMEZONE=America/Santiago
- TZ=America/Santiago

Se verificó dentro del contenedor que ambas variables estaban aplicadas correctamente.

## Criterio de salida LAB-007

Cumplido.

VetAtiende AI puede recibir una solicitud estructurada de agenda, consultar disponibilidad real en Google Calendar, crear una cita solo si el horario está libre y rechazar la solicitud si el horario ya está ocupado.

## Nota de producto

Este laboratorio valida el motor operativo de agenda.

En una etapa posterior, Luna podrá extraer los datos desde lenguaje natural y enviar solicitudes estructuradas a este workflow. Para el MVP actual, el flujo queda preparado como servicio de agenda mediante Webhook.
