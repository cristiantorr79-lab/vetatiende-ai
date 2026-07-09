# LAB-011 - Despliegue OCI y validación operativa en producción

## Objetivo

Validar VetAtiende AI como MVP operativo en un servidor OCI con n8n self-hosted accesible públicamente.

El laboratorio valida:

- n8n funcionando en OCI.
- Workflows importados y activos.
- RAG público operativo.
- Google Calendar operativo.
- Google Sheets operativo.
- Agenda médica productiva.
- Bloqueo de horarios ocupados.
- Registro de urgencias veterinarias.
- Canal interno protegido LAB-006.
- Separación entre canal público e interno.

## Entorno

- Proyecto local: C:\Users\DELL\VetAtiendeAI
- Servidor: OCI Ubuntu.
- Carpeta servidor: /home/ubuntu/vetatiende-ai-oci
- Contenedor n8n: etatiende-n8n
- n8n público: http://IP_PUBLICA:5678
- n8n por túnel temporal OAuth: http://localhost:5679
- Compose público respaldado como: compose.yaml.ip_publica_ok

## Workflows importados en n8n OCI

- LAB-010 - MVP público operativo
- LAB-006 - Seguridad de acceso y separación de canales

## Credenciales configuradas en OCI

- Groq API nueva para OCI.
- Cohere API nueva para OCI.
- Google Calendar conectado correctamente vía túnel OAuth localhost:5679.
- Google Sheets conectado correctamente vía túnel OAuth localhost:5679.
- Header Auth del webhook interno LAB-006 configurado nuevamente en OCI.

## Correcciones aplicadas durante LAB-011

### Entrada real de webhook producción

Se corrigieron nodos para leer correctamente la entrada real recibida por webhook productivo desde:

ody.chatInput

Nodos ajustados:

- Preparar Pregunta RAG Público
- Detectar Intención Pública
- Preparar Datos Agenda
- Detectar Urgencia
- Preparar Registro Urgencia

### RAG público

Se corrigió el selector de documentos públicos para evitar cargar documentos internos en el RAG público.

Documentos permitidos para RAG público:

- aq_clientes.pdf
- manual_seguridad_y_derivacion.pdf
- servicios_precios.csv

Documentos excluidos del RAG público:

- manual_procedimientos_internos.pdf
- protocolo_stock.csv

Se recargó el RAG público en OCI y se validó respuesta de horario y precio.

### Modelo Groq

Se cambió el modelo Groq usado por el Agente VetAtiende debido a errores ailed_generation con el modelo anterior al usar herramientas/RAG.

### Teléfono Chile

Se normalizó teléfono en formato chileno:

+56 9 XXXX XXXX

Para Google Sheets, el teléfono se envía como texto usando comilla simple inicial, evitando error de fórmula cuando comienza con +56.

### UTF-8 en pruebas PowerShell

Para preservar acentos en pruebas por PowerShell, se validó el envío JSON como UTF-8:

Content-Type: application/json; charset=utf-8

## Pruebas validadas

### TC-011-01 - n8n público activo

Resultado:

- n8n público responde correctamente.
- Production URL de LAB-010 funcional.

Estado: OK.

### TC-011-02 - RAG público: horario

Pregunta:

Hola, ¿cuál es el horario de atención de la clínica?

Resultado:

- Luna responde horario de atención desde RAG público.

Estado: OK.

### TC-011-03 - RAG público: precio consulta general

Pregunta:

¿Cuál es el precio de una consulta general?

Resultado:

- Luna responde valor de consulta general: $25.000 CLP.
- Se valida uso de servicios_precios.csv.

Estado: OK.

### TC-011-04 - Agenda médica disponible

Solicitud:

Quiero agendar una consulta general para el viernes 10 de julio de 2026 a las 18:00. Tutor: Test LAB-011 Sheets Telefono. Mascota: Firulais Sheets Telefono. Teléfono: +56 9 9999 9999.

Resultado:

- Google Calendar crea cita.
- Google Sheets registra cita confirmada.
- Teléfono queda registrado sin #ERROR!.

Estado: OK.

### TC-011-05 - Horario ocupado

Solicitud repetida para una hora ya agendada:

iernes 10 de julio de 2026 a las 18:00

Resultado:

- El flujo detecta horario ocupado.
- No crea segunda cita en Google Calendar.
- No registra cita confirmada duplicada en Google Sheets.
- Responde que el horario no está disponible.

Estado: OK.

### TC-011-06 - Urgencia veterinaria

Solicitud:

Mi perro Firulais comió chocolate hace 20 minutos. Tutor: Test LAB-011 Urgencia UTF8. Teléfono: +56 9 9999 9999.

Resultado:

- El flujo toma rama de urgencia.
- No agenda.
- Registra alerta en Google Sheets.
- Registra tutor, teléfono, mascota, tipo de mascota, situación reportada, tipo de urgencia y estado.
- Respuesta segura de derivación veterinaria.

Datos validados:

- Mascota: Firulais
- Tipo mascota: perro
- Tipo urgencia: chocolate
- Estado gestión: egistrada_pendiente_aviso
- Canal aviso: pendiente_definir

Estado: OK.

### TC-011-07 - LAB-006 canal interno sin clave

Solicitud al webhook interno sin Header Auth.

Resultado:

- Respuesta HTTP: 403 Prohibido.
- No entrega información interna.

Estado: OK.

### TC-011-08 - LAB-006 canal interno con clave

Solicitud al webhook interno usando Header Auth:

x-vetatiende-interno-key

Resultado:

- El flujo responde correctamente.
- RAG interno entrega información de procedimiento interno autorizado.
- Se valida consulta sobre protocolo de aislamiento.

Estado: OK.

### TC-011-09 - Configuración Webhook interno

Validación:

- Nodo Webhook Interno Protegido configurado con Respond: Using Respond to Webhook Node.

Estado: OK.

## Resultado general

LAB-011 queda validado como despliegue productivo operativo en OCI.

El MVP público LAB-010 funciona desde servidor externo con:

- RAG público.
- Agenda Google Calendar.
- Registro Google Sheets.
- Bloqueo de horarios ocupados.
- Urgencias veterinarias.
- Corrección UTF-8.
- Teléfono chileno compatible con Sheets.

El canal interno LAB-006 queda validado con:

- Bloqueo sin clave.
- Acceso autorizado con Header Auth.
- RAG interno operativo.
- Separación público/interno funcional.

## Pendiente separado para LAB-012

Se decide separar la mejora de experiencia de agenda en LAB-012:

- Cuando el cliente quiera agendar sin indicar hora, Luna deberá ofrecer horarios disponibles reales.
- Cuando el cliente pida una hora ocupada, Luna deberá ofrecer alternativas reales.
- No se deben inventar horarios.
- Las alternativas deben venir desde Google Calendar.

Ver DA-024.
