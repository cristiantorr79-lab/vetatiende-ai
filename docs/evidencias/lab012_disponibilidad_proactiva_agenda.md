# LAB-012 - Disponibilidad proactiva de agenda

## Objetivo

Implementar disponibilidad proactiva de agenda y alternativas automáticas reales desde Google Calendar.

## Estado inicial

LAB-011 cerrado y validado en OCI productivo.

Último commit LAB-011:

- fe810cb feat: valida despliegue OCI LAB-011

## Alcance LAB-012

Luna debe consultar Google Calendar y ofrecer horarios reales disponibles cuando:

1. El cliente solicita agendar sin indicar fecha u hora específica.
2. El cliente solicita un horario que ya está ocupado.
3. El cliente rechaza las alternativas ofrecidas y pide otras opciones.

## Reglas funcionales

- No inventar horarios.
- Ofrecer idealmente 3 opciones claras.
- Consulta general dura 30 minutos.
- Respetar horario de clínica:
  - Lunes a viernes: 09:00 a 18:30.
  - Sábado: 10:00 a 14:00.
  - Domingo y festivos: sin atención regular.
- No ofrecer horarios ocupados en Google Calendar.
- No crear cita ni registrar cita confirmada hasta que el cliente elija una opción concreta.

## Manejo de rechazo de alternativas

Para el MVP, no se implementará todavía una tabla persistente de estado conversacional.

Si el cliente rechaza las alternativas:

- Si indica preferencia, Luna buscará 3 nuevas opciones reales filtradas por esa preferencia.
- Si no indica preferencia, Luna preguntará si prefiere mañana, tarde u otro día específico.

## Casos de prueba previstos

### TC-012-001 - Solicitud de agenda sin fecha/hora

El cliente pide agendar una consulta sin indicar fecha ni hora.

Resultado esperado:

- Luna consulta Google Calendar.
- Ofrece 3 horarios reales disponibles.
- No crea evento todavía.
- No registra cita confirmada en Sheets.

### TC-012-002 - Horario solicitado ocupado

El cliente solicita una fecha/hora ocupada.

Resultado esperado:

- Luna informa que el horario no está disponible.
- Ofrece 3 alternativas reales disponibles.
- No crea cita falsa.
- No registra cita confirmada falsa.

### TC-012-003 - Horario específico disponible

El cliente solicita una fecha/hora disponible.

Resultado esperado:

- Luna crea evento en Google Calendar.
- Registra cita en Google Sheets.
- Confirma al cliente.

### TC-012-004 - Domingo o fuera de horario

El cliente solicita atención regular en domingo o fuera del horario permitido.

Resultado esperado:

- Luna no ofrece atención regular en horario inválido.
- Propone alternativas reales dentro del horario permitido.

### TC-012-005 - Urgencia veterinaria intacta

El cliente reporta una urgencia veterinaria.

Resultado esperado:

- Luna no agenda.
- Registra alerta de urgencia.
- Mantiene respuesta segura.
- No rompe la lógica validada en LAB-011.

### TC-012-006 - Rechazo con preferencia

El cliente rechaza alternativas y pide otro bloque, por ejemplo tarde o sábado.

Resultado esperado:

- Luna consulta Google Calendar.
- Ofrece 3 horarios reales filtrados por la preferencia.
- No crea evento todavía.
- No registra cita confirmada.

### TC-012-007 - Rechazo sin preferencia

El cliente dice que no le sirven las alternativas, sin indicar preferencia.

Resultado esperado:

- Luna no inventa horarios.
- Pregunta si prefiere mañana, tarde u otro día específico.
- No crea evento.
- No registra cita confirmada.

## Validación funcional LAB-012

Fecha de validación: 2026-07-09

### Cambios implementados

- Se agregó el nodo Tiene Fecha y Hora Solicitada después de Es Solicitud Agenda.
- Se mantuvo la ruta original para agenda con fecha/hora específica.
- Se agregó la ruta para solicitudes de agenda sin fecha/hora:
  - Buscar Eventos Próximos Agenda
  - Generar Alternativas Disponibles
  - Respuesta Alternativas Agenda
- Se cambió la ruta de horario ocupado para ofrecer alternativas reales.
- Se eliminó el nodo obsoleto Respuesta Horario No Disponible, ya que fue reemplazado por la nueva respuesta con alternativas reales.
- Se ajustó Preparar Datos Agenda para interpretar expresiones naturales usadas en Chile:
  - "mañana a las 3 y media"
  - "hoy a las 3 y 30"
  - "a la 1 y cuarto"
  - "a las 2 y media"
- Se ajustó Detectar Intención Pública para reconocer rechazo de alternativas como intención de agenda:
  - "no me sirven"
  - "otras horas"
  - "algo en la tarde"
  - "algo en la mañana"
- Se corrigió Crear Cita en Google Calendar para tomar tutor, mascota y teléfono desde Preparar Datos Agenda.

### TC-012-001 - Solicitud de agenda sin fecha/hora

Mensaje probado:

Quiero agendar una consulta para mi perro

Resultado:

- El flujo entró por agenda.
- Tiene Fecha y Hora Solicitada salió por alse.
- Se consultaron eventos próximos en Google Calendar.
- Se generaron 3 horarios reales disponibles.
- No se creó cita.
- No se registró cita confirmada en Sheets.

Estado: OK

### TC-012-002 - Horario solicitado ocupado

Mensaje probado:

Quiero agendar una consulta para mi perro mañana a las 10:00

Resultado:

- El flujo detectó fecha y hora.
- Se consultó disponibilidad en Google Calendar.
- El horario solicitado estaba ocupado.
- No se creó cita falsa.
- Se ofrecieron 3 alternativas reales disponibles.
- No se ofreció el horario ocupado.

Estado: OK

### TC-012-003 - Horario específico disponible

Mensaje probado:

Quiero agendar una consulta para mi perro el 10 de julio de 2026 a las 11:00

Datos enviados:

- Tutor: Cliente Prueba LAB012
- Teléfono: +56 9 1234 5678
- Mascota: Copito

Resultado:

- El flujo detectó fecha y hora.
- El horario estaba disponible.
- Se creó evento en Google Calendar.
- Se registró cita confirmada en Google Sheets.
- Luna respondió confirmación al cliente.
- Google Calendar mostró correctamente tutor, mascota y teléfono.

Estado: OK

### TC-012-005 - Urgencia veterinaria intacta

Mensaje probado:

Mi perro Firulais comió chocolate y está vomitando

Datos enviados:

- Tutor: Cliente Urgencia LAB012
- Teléfono: +56 9 8765 4321

Resultado:

- El flujo entró por la rama de urgencia.
- No pasó por agenda.
- No creó cita.
- Registró alerta de urgencia en Google Sheets.
- Registró mascota Firulais.
- Registró tipo mascota perro.
- Registró urgencia chocolate.
- Estado registrado: registrada_pendiente_aviso.
- Canal aviso: pendiente_definir.
- Luna respondió mensaje seguro de urgencia veterinaria.

Estado: OK

### TC-012-006 - Rechazo con preferencia

Mensaje probado:

No me sirven esas horas, tienes algo en la tarde

Resultado:

- El mensaje fue reconocido como solicitud de agenda.
- Tiene Fecha y Hora Solicitada salió por alse.
- Se consultó Google Calendar.
- Se generaron 3 alternativas reales filtradas en la tarde.
- No se creó cita.
- No se registró cita confirmada.

Estado: OK

### TC-012-007 - Rechazo sin preferencia

Mensaje probado:

No me sirven esas opciones

Resultado:

- El mensaje fue reconocido como solicitud de agenda.
- Luna no inventó horarios.
- Luna preguntó si el cliente prefiere mañana, tarde o un día específico.
- No se creó cita.
- No se registró cita confirmada.
- No se fue al RAG público.

Estado: OK

### Resultado general

LAB-012 cumple el objetivo funcional de disponibilidad proactiva de agenda:

- Ofrece horarios reales desde Google Calendar.
- No inventa disponibilidad.
- Respeta horarios ocupados.
- Entrega alternativas cuando una hora está ocupada.
- Maneja rechazo de alternativas en versión MVP.
- Mantiene intactas urgencias, agenda específica, Calendar, Sheets y RAG público.
- El workflow queda más limpio al eliminar el nodo obsoleto Respuesta Horario No Disponible.

