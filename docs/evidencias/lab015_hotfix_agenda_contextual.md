# LAB-015 — Corrección final de agenda médica contextual (hotfix)

**Fecha de validación:** 13 de julio de 2026
**Workflow:** `LAB-010 - MVP público operativo`
**Estado:** VALIDADO Y PUBLICADO

## 1. Objetivo

Corregir la continuidad conversacional de la agenda médica para que Luna:

- extraiga correctamente tutor, mascota y teléfono desde mensajes naturales;
- conserve los datos entregados en interacciones anteriores;
- solicite únicamente los datos faltantes;
- recupere la fecha y hora desde el contexto;
- permita seleccionar una alternativa mediante su número;
- confirme la cita en Google Calendar y Google Sheets.

## 2. Problema detectado

Durante la validación final en Streamlit se comprobó que Luna:

- volvía a pedir tutor, mascota y teléfono aunque algunos ya habían sido entregados;
- no interpretaba correctamente expresiones como `para mi perro Toby Demo`;
- perdía la fecha y hora cuando el cliente respondía solamente con el teléfono;
- ofrecía seleccionar una alternativa por número, pero no procesaba respuestas como `Elijo la opción 2`.

## 3. Nodos modificados

### `Preparar Datos Agenda`

Se corrigió la extracción y recuperación contextual de:

- `nombreTutor`;
- `nombreMascota`;
- `telefono`;
- `startTime`;
- `endTime`.

También se conservaron expresiones horarias naturales, entre ellas:

- `mañana a las 3 y media`;
- `3 y 30`;
- `1 y cuarto`;
- horas explícitas como `11:30`.

### `Generar Alternativas Disponibles`

Se agregó lógica para:

- detectar los datos mínimos ya disponibles;
- pedir únicamente los campos faltantes;
- no repetir datos entregados por el cliente;
- conservar tres alternativas reales de Google Calendar;
- permitir respuestas mediante número de opción.

### `Responder Solicitar Datos Mínimos Agenda`

La respuesta fija fue reemplazada por una respuesta dinámica.

Ejemplo validado:

> Para confirmar la consulta necesito solamente teléfono de contacto.

## 4. Pruebas validadas

### Solicitud con datos completos y sin hora específica

Resultado:

- Luna ofreció tres horarios reales;
- no volvió a pedir tutor, mascota ni teléfono;
- solicitó elegir una alternativa.

### Selección mediante número

Entrada validada: `Elijo la opción 2.`

Resultado:

- recuperó la segunda alternativa;
- conservó tutor, mascota y teléfono;
- volvió a validar disponibilidad;
- confirmó la cita en Google Calendar y Google Sheets.

### Solicitud directa con teléfono faltante

Resultado:

- conservó tutor, mascota, fecha y hora;
- solicitó únicamente el teléfono;
- no creó una cita incompleta.

### Continuación respondiendo solo el teléfono

Resultado:

- recuperó tutor, mascota, fecha y hora desde el contexto;
- creó el evento en Google Calendar;
- registró la cita en Google Sheets;
- respondió con confirmación.

### Expresión horaria natural

Entrada: `mañana a las 3 y media`

Resultado: `15:30–16:00`

### Validación final desde Streamlit

Caso validado:

- Tutor: Alura Demo
- Mascota: Nube Challenge
- Hora: martes 14 de julio, 12:30–13:00

Resultado:

- Luna pidió solamente el teléfono faltante;
- el cliente respondió solo con el teléfono;
- la cita fue confirmada;
- Calendar y Sheets fueron actualizados correctamente.

## 5. Evidencia visual

### Agenda contextual confirmada desde Streamlit

![Agenda contextual confirmada](capturas/lab015_streamlit_agenda_contextual_confirmada.png)

### Respuesta RAG desde Streamlit

![Respuesta RAG](capturas/lab015_streamlit_respuesta_rag.png)

### Workflow activo en n8n OCI

![Workflow activo en OCI](capturas/lab015_n8n_workflow_activo_oci.png)

### Instancia OCI activa

![Instancia OCI](capturas/lab015_oci_instancia_activa.png)

## 6. Seguridad del export

El workflow publicado fue exportado y sanitizado antes de incorporarlo al repositorio.

Validación final:

- JSON válido;
- 52 nodos;
- 45 conexiones;
- cero URLs expuestas;
- cero correos expuestos;
- cero direcciones IPv4;
- cero Chat IDs numéricos;
- cero valores sensibles;
- 12 referencias de credenciales reemplazadas por marcadores;
- solo tres nodos presentan cambios funcionales reales;
- conexiones y configuración general sin cambios.

## 7. Resultado

El hotfix quedó publicado y validado de extremo a extremo:

Streamlit → webhook público de producción → continuidad conversacional → disponibilidad real → Google Calendar → Google Sheets → confirmación al cliente.

**Resultado final: VALIDADO.**
