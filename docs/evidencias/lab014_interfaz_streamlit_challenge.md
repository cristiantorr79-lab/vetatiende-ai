# LAB-014 - Interfaz mínima Streamlit para Challenge

## Estado inicial

LAB-014 comienza después del cierre correcto de LAB-013.

Último commit validado:

```text
2f4a448 feat: implementa aviso activo urgencias Telegram LAB-013
```

Estado esperado al iniciar:

- Rama main limpia y sincronizada con origin/main.
- n8n desplegado en OCI.
- Workflow público activo y probado por Production URL.
- RAG público funcionando.
- RAG interno protegido funcionando.
- Agenda Google Calendar funcionando.
- Google Sheets registrando agenda y urgencias.
- Telegram interno recibiendo alertas de urgencia.
- Export LAB-013 sanitizado y versionado.

## Objetivo LAB-014

Crear una interfaz mínima con Streamlit para interactuar con VetAtiende AI desde el navegador.

El objetivo es dejar de depender de PowerShell como medio de prueba o demostración, entregando una pantalla simple para evaluación del challenge.

## Alcance prioritario

### Prioridad 1 - Modo Cliente externo

El modo cliente externo debe funcionar completo.

Debe permitir probar:

- Preguntas públicas sobre horarios.
- Preguntas públicas sobre precios.
- Preguntas públicas sobre servicios.
- Consultas de peluquería.
- Consultas de farmacia y Pet Shop presencial.
- Solicitudes de agenda.
- Casos de urgencia.
- Bloqueo de información interna desde el flujo público.

### Prioridad 2 - Modo Interno protegido simple

Se implementará solo si no aumenta demasiado la complejidad.

Debe considerar:

- Campo de clave interna.
- Llamada al Webhook interno protegido.
- Respuesta de Luna Interna en pantalla.
- No exposición de claves, tokens ni URLs sensibles en el repositorio.

## Arquitectura esperada

```text
Streamlit
├── Modo Cliente externo -> Webhook público n8n -> Luna recepción
└── Modo Interno protegido -> Webhook interno protegido -> Luna Interna
```

## Fuera de alcance

- App comercial definitiva.
- WhatsApp Business.
- Login robusto.
- Dashboard.
- Multiusuario.
- Multi-clínica.
- Panel interno avanzado.

## Criterios de éxito

- El evaluador puede abrir una interfaz web simple.
- El evaluador puede escribir una pregunta.
- Streamlit envía la consulta al workflow público de n8n.
- Luna responde en pantalla.
- No se requiere PowerShell para interactuar con el agente.
- No se exponen claves, tokens, chat_id, IP real ni URLs sensibles en archivos versionados.
- El modo cliente externo queda validado como interfaz principal del challenge.

## Estado

Pendiente de implementación.

## Validación funcional Streamlit + n8n OCI

Fecha de validación: 2026-07-10

### Alcance validado

LAB-014 implementa una interfaz mínima en Streamlit para evaluación del Challenge. La interfaz no corresponde a la app comercial final, sino a una capa simple para evitar que el evaluador use PowerShell o llamadas manuales al webhook.

La interfaz se conecta al webhook público de n8n desplegado en OCI mediante variables de entorno locales. No se registran URLs reales, IPs, tokens, claves internas ni datos sensibles en el repositorio.

### Componentes agregados

- `app/streamlit_app.py`: interfaz Streamlit mínima.
- `requirements.txt`: dependencias Python.
- `.env.example`: plantilla segura con placeholders.
- `.env`: archivo local privado, ignorado por Git.
- Memoria conversacional básica en modo cliente externo usando `st.session_state`.
- Modo interno protegido simple, sin memoria conversacional, para evitar arrastre de contexto interno sensible.

### Pruebas realizadas

#### TC-014-01 - Apertura de interfaz

Resultado:
- Streamlit abrió correctamente en navegador local.
- Se visualizó el título `VetAtiende AI - Challenge`.
- Se visualizaron los modos `Cliente externo` e `Interno protegido`.

Estado: OK

#### TC-014-02 - Consulta pública desde Streamlit

Entrada:
`Hola, quiero saber el precio de una consulta general.`

Resultado:
- Streamlit envió la consulta al webhook público.
- Luna respondió con información pública de consulta general.
- No se usó PowerShell para probar el agente.

Estado: OK

#### TC-014-03 - Detección de agenda desde Streamlit

Entrada:
`Quiero agendar una hora veterinaria para mañana a las 15:30.`

Resultado inicial:
- El flujo detectó agenda.
- Se identificó fecha/hora.
- Se corrigió la lógica para evitar confirmar citas sin datos mínimos.

Resultado final:
- Luna solicitó nombre del tutor, nombre de la mascota y teléfono de contacto.
- No se creó evento en Google Calendar.
- No se registró cita confirmada.

Estado: OK

#### TC-014-04 - Bloqueo de confirmación sin datos mínimos

Regla validada:
Para confirmar una cita médica deben existir al menos:
- nombre del tutor
- nombre de la mascota
- teléfono de contacto
- fecha/hora válida

Resultado:
- Si faltan datos mínimos, el workflow responde solicitando información faltante.
- El flujo no crea evento en Google Calendar.
- El flujo no registra cita confirmada en Google Sheets.

Estado: OK

#### TC-014-05 - Agenda completa con datos mínimos en un solo mensaje

Entrada:
`Hola, quiero agendar una consulta para mañana a las 15:30. Mi nombre es Cristian Torres, mi perro se llama Toby y mi teléfono es 912345678.`

Resultado:
- Se extrajo correctamente nombre del tutor.
- Se extrajo correctamente nombre de mascota.
- Se extrajo correctamente teléfono.
- Se corrigió extracción de mascota para evitar capturar texto extra como `y mi teléfono`.
- Se creó evento en Google Calendar con tutor, mascota y teléfono.
- Se registró cita confirmada en Google Sheets.

Estado: OK

#### TC-014-06 - Agenda sin hora específica

Entrada:
`Hola quiero agendar una hora para mi perro`

Resultado:
- Luna ofreció alternativas reales disponibles.
- Luna no confirmó cita.
- Luna pidió datos mínimos para confirmar:
  - nombre del tutor
  - nombre de la mascota
  - teléfono de contacto

Estado: OK

#### TC-014-07 - Memoria conversacional básica

Flujo probado:

Mensaje 1:
`Hola quiero agendar una hora para mi perro`

Respuesta:
- Luna ofreció horarios disponibles.
- Luna pidió datos mínimos.

Mensaje 2:
`Elijo sábado 11 de julio a las 11:00. Mi nombre es Cristian Torres, mi perro se llama Toby y mi teléfono es 912345678.`

Resultado:
- Streamlit mantuvo el contexto de conversación usando `st.session_state`.
- n8n recibió `chatInput` con contexto previo y `mensajeActual` con el mensaje nuevo.
- Se corrigió la extracción de fecha/hora para priorizar `mensajeActual` sobre el contexto completo.
- El evento se creó en la hora elegida por el cliente, no en la primera alternativa del contexto.
- Google Calendar creó la cita de 11:00 a 11:30.
- Google Sheets registró la cita confirmada.

Estado: OK

### Ajustes realizados durante LAB-014

1. Streamlit inicialmente enviaba el texto solo como `body.mensaje`.
2. El workflow público esperaba `body.chatInput`.
3. Se ajustó Streamlit para enviar:
   - `mensaje`
   - `mensajeActual`
   - `chatInput`
   - `contextoConversacional`
   - `canal`
   - `canal_origen`

4. Se agregó memoria conversacional básica en modo cliente externo.
5. Se mantuvo el modo interno protegido simple, sin memoria.
6. Se agregó validación de datos mínimos antes de consultar disponibilidad y confirmar citas.
7. Se ajustó la respuesta de alternativas para pedir datos mínimos.
8. Se corrigió extracción de nombre de tutor y mascota desde lenguaje natural.
9. Se corrigió extracción de fecha/hora para priorizar el mensaje actual sobre el historial conversacional.

### Decisión de seguridad

El archivo `.env` local contiene URLs reales y claves locales, pero no se sube al repositorio.

El archivo `.env.example` queda como plantilla segura con placeholders.

No se documentan IPs reales, URLs sensibles, claves, tokens ni identificadores privados.

### Resultado LAB-014

La interfaz mínima Streamlit queda funcional para el Challenge en modo cliente externo. El evaluador puede probar consultas públicas y flujo de agenda desde navegador, sin usar PowerShell.

El modo interno protegido queda disponible como modo simple, usando variables de entorno locales, pero sin memoria conversacional para evitar arrastre accidental de contexto interno sensible.

Estado general: VALIDADO

## Ampliación operativa: agenda de peluquería y lavado

**Fecha de validación:** 2026-07-11

Durante la validación final de la interfaz Streamlit se detectó que las solicitudes de peluquería y lavado estaban siendo tratadas como solicitudes de agenda médica.

Se corrigió el diseño para mantener ambas operaciones separadas.

### Arquitectura implementada

Agenda médica:

Cliente
→ detección de consulta veterinaria
→ Google Calendar de Atención Médica
→ registro en Google Sheets de Atención Médica

Agenda de peluquería y lavado:

Cliente
→ detección de solicitud de peluquería/lavado
→ extracción de datos y servicio
→ cálculo de duración
→ Google Calendar exclusivo de Peluquería y Lavado
→ registro en Google Sheets agenda_peluqueria
→ respuesta de confirmación al cliente

Calendario creado:

- VetAtiende AI - Peluquería y Lavado

La agenda médica y la agenda de peluquería no comparten disponibilidad ni eventos.

### Reglas operativas implementadas

- La primera atención de peluquería puede comenzar a las 09:00 de lunes a viernes.
- Los sábados se usa el horario configurado para la clínica.
- Cada cita bloquea su duración estimada completa.
- La siguiente atención puede comenzar cuando finaliza el evento anterior.
- No se ofrecen horarios que terminen fuera de la jornada.
- La cantidad de citas diarias depende de la duración de los servicios reservados.
- La hora confirmada corresponde al ingreso de la mascota.
- La duración puede variar según tamaño, condición del pelaje y comportamiento.

### Duraciones iniciales

- Servicio de baño: 90 minutos.
- Servicio de baño y corte: 120 minutos.
- Corte de pelo: 120 minutos.
- Si el servicio no está definido, Luna solicita aclaración antes de buscar disponibilidad.

### Datos mínimos

Para revisar y confirmar disponibilidad de peluquería se consideran:

- nombre del tutor
- nombre de la mascota
- teléfono
- tipo de mascota
- tamaño
- servicio solicitado
- fecha u horario preferido

### Nodos principales agregados

- Es Solicitud Peluquería/Lavado
- Preparar Datos Peluquería
- Tiene Datos Mínimos Peluquería
- Responder Datos Faltantes Peluquería
- Tiene Horario Seleccionado Peluquería
- Preparar Búsqueda Peluquería
- Consultar Disponibilidad Peluquería
- Generar Horarios Disponibles Peluquería
- Responder Opciones Peluquería
- Preparar Horario Seleccionado Peluquería
- Validar Horario Peluquería
- Horario Peluquería Disponible
- Crear Cita Peluquería
- Registrar Cita Peluquería
- Responder Cita Peluquería Confirmada
- Responder Horario Peluquería No Disponible
- Responder Webhook Peluquería

### Registro en Google Sheets

Planilla:

- VetAtiende AI - Peluquería y Lavado ACTUAL

Pestaña:

- agenda_peluqueria

Columnas utilizadas:

- fecha_registro
- canal_origen
- google_calendar_event_id
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- servicio_solicitado
- start_time
- end_time
- estado
- motivo
- observacion_cliente
- respuesta_luna

### Pruebas validadas

#### TC-014-P01 - Consulta informativa de precio

Entrada:

¿Cuánto cuesta el baño y corte para un perro pequeño?

Resultado:

- El mensaje fue derivado al RAG público.
- Luna respondió precio y duración referencial.
- No se consultó Calendar.
- No se creó una cita.

Estado: VALIDADO

#### TC-014-P02 - Solicitud con datos incompletos

Entrada:

Necesito una hora para peluquería.

Resultado:

- Luna solicitó nombre del tutor, mascota, teléfono, tamaño, servicio y preferencia.
- No se consultó Calendar.
- No se creó un evento.

Estado: VALIDADO

#### TC-014-P03 - Solicitud completa sin horario

Entrada de referencia:

Mi nombre es Leticia, mi mascota es Oliver, es un perro pequeño, mi teléfono es 988998899 y necesito una hora para baño sanitario.

Resultado:

- Se detectó servicio de 90 minutos.
- Se consultó el calendario exclusivo.
- Se ofrecieron tres horarios reales.
- Luna indicó cómo responder con fecha y hora completas.

Estado: VALIDADO

#### TC-014-P04 - Duración variable

Servicios probados:

- servicio de baño: 90 minutos
- baño y corte: 120 minutos

Resultado:

- Los bloques fueron calculados correctamente.
- No se generaron superposiciones.

Estado: VALIDADO

#### TC-014-P05 - Confirmación conversacional

Entrada:

martes 14 de julio, de 12:00 a 13:30

Resultado:

- Se conservaron tutor, mascota, teléfono, tamaño y servicio desde el contexto.
- Se validó nuevamente la disponibilidad.
- Se creó el evento en Google Calendar.
- Se agregó la fila en agenda_peluqueria.
- Luna respondió con fecha y hora legibles.

Estado: VALIDADO

#### TC-014-P06 - Solicitud directa en un mensaje

Entrada de referencia:

Mi nombre es Leticia, mi mascota es Oliver, es un perro pequeño, mi teléfono es 988998899 y necesito una hora para baño sanitario el lunes 13 de julio a las 3.

Resultado:

- La expresión “a las 3” se interpretó como 15:00.
- Se validó el intervalo 15:00–16:30.
- Calendar y Sheets registraron la cita.
- Luna confirmó correctamente.

Estado: VALIDADO

#### TC-014-P07 - Horario ocupado

Resultado:

- El horario solicitado fue detectado como ocupado.
- No se creó un evento duplicado.
- Luna informó que el horario ya no estaba disponible.

Estado: VALIDADO

#### TC-014-P08 - Preferencia de día

Entrada:

Me acomoda el día martes en cualquier horario.

Resultado:

- Las alternativas se filtraron para el martes solicitado.
- No se ofrecieron horarios de otros días.

Estado: VALIDADO

#### TC-014-P09 - Agenda sin tipo definido

Entrada:

Hola, necesito agendar.

Resultado:

Luna preguntó si el cliente necesitaba una consulta veterinaria o un servicio de peluquería y lavado.

No se ofrecieron horarios antes de aclarar el tipo de atención.

Estado: VALIDADO

#### TC-014-P10 - Cierre conversacional

Entrada:

Ok, gracias, ahí estaremos.

Resultado:

Luna respondió con despedida personalizada y no volvió a buscar ni ofrecer horarios.

Estado: VALIDADO

### Pruebas de regresión

#### Agenda médica

- Se confirmó una consulta general de 30 minutos.
- Se creó el evento en el calendario médico.
- Se registró la fila en Google Sheets.
- La nueva rama de peluquería no afectó la agenda clínica.

Estado: VALIDADO

#### Urgencia veterinaria

- Se detectó dificultad respiratoria.
- Se cortó el flujo de agenda.
- Se registró la alerta en Google Sheets.
- Se envió aviso activo por Telegram interno.
- Streamlit mostró la respuesta segura de Luna.

Estado: VALIDADO

### Resultado

La interfaz Streamlit permite actualmente:

- consultar información pública
- agendar atención médica
- agendar peluquería y lavado en calendario separado
- utilizar duraciones variables
- conservar contexto conversacional
- detectar horarios ocupados
- registrar operaciones en Google Sheets
- manejar urgencias con aviso por Telegram
- cerrar la conversación de forma natural

La ampliación de peluquería y lavado queda funcional y validada como parte del MVP operativo.

