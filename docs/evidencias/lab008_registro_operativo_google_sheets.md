# Evidencia LAB-008 - Registro operativo básico con Google Sheets

## Objetivo

Crear una fuente operativa para registrar información generada por VetAtiende AI sin mezclar conocimiento público, información interna ni datos operativos.

Google Sheets se usará como registro inicial del MVP para clínicas pequeñas.

No será usado como RAG, base de conocimiento ni fuente para responder consultas.

## Decisión principal

El registro operativo se organizará en tres planillas separadas por tipo de operación:

1. VetAtiende AI - Atención Médica ACTUAL
2. VetAtiende AI - Peluquería y Lavado ACTUAL
3. VetAtiende AI - Registro Interno ACTUAL

Esta separación permite mantener registros homogéneos, más simples de revisar y más fáciles de migrar en el futuro.

Para clínicas medianas o grandes, Google Sheets no será la solución final. El registro deberá migrar o integrarse a una base de datos, dashboard, CRM, sistema veterinario o herramienta equivalente.

## Planilla 1: VetAtiende AI - Atención Médica ACTUAL

Pestañas finales:

- agenda_consultas
- alertas_urgencia
- contactos_pendientes
- seguimientos_consulta

### agenda_consultas

Registra solicitudes médicas, citas confirmadas y horarios no disponibles usando una columna de estado.

Columnas:

- fecha_registro
- canal_origen
- google_calendar_event_id
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- tipo_atencion
- start_time
- end_time
- estado
- motivo
- observacion_cliente
- respuesta_luna

Estados posibles:

- solicitada
- confirmada
- no_disponible
- pendiente_datos
- cancelada

### alertas_urgencia

Registra alertas veterinarias críticas.

La alerta no debe quedar solo en Google Sheets. Debe generar aviso activo hacia la clínica, veterinario, asistente o canal definido.

Columnas:

- fecha_registro
- canal_origen
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- situacion_reportada
- nivel_alerta
- accion_luna
- aviso_enviado
- canal_aviso
- estado
- respuesta_luna

### contactos_pendientes

Registra casos que requieren seguimiento humano.

Google Sheets mantiene trazabilidad, pero el caso debe derivarse al canal interno definido por la clínica.

Columnas:

- fecha_registro
- canal_origen
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- motivo_contacto
- prioridad
- derivado_interno
- canal_derivacion
- estado
- observacion_cliente
- respuesta_luna

### seguimientos_consulta

Registra acciones preconsulta y postconsulta.

Columnas:

- fecha_registro
- canal_origen
- google_calendar_event_id
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- tipo_atencion
- tipo_seguimiento
- fecha_programada_envio
- canal_envio
- estado_envio
- derivado_interno
- canal_derivacion
- observacion_cliente
- respuesta_luna

## Planilla 2: VetAtiende AI - Peluquería y Lavado ACTUAL

Pestañas finales:

- agenda_peluqueria
- contactos_pendientes

### agenda_peluqueria

Registra solicitudes, citas confirmadas y horarios no disponibles para servicios de peluquería y lavado.

Columnas:

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

Estados posibles:

- solicitada
- confirmada
- no_disponible
- pendiente_datos
- cancelada

### contactos_pendientes

Registra casos de peluquería/lavado que requieren seguimiento humano.

Columnas:

- fecha_registro
- canal_origen
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- motivo_contacto
- prioridad
- derivado_interno
- canal_derivacion
- estado
- observacion_cliente
- respuesta_luna

## Planilla 3: VetAtiende AI - Registro Interno ACTUAL

Pestañas finales:

- faltas_stock
- observaciones_internas

### faltas_stock

Registro interno protegido para faltas de stock.

Columnas:

- fecha_registro
- canal_origen
- producto
- categoria
- detalle_producto
- prioridad
- estado
- observacion_interna
- respuesta_luna

### observaciones_internas

Registro de observaciones operativas autorizadas.

Columnas:

- fecha_registro
- canal_origen
- area_interna
- tipo_observacion
- prioridad
- estado
- observacion_interna
- responsable_sugerido
- respuesta_luna

## Reglas de seguridad

- El flujo público no puede leer información interna sensible.
- El flujo público no puede registrar faltas de stock.
- El flujo interno debe seguir protegido.
- Las alertas de urgencia deben registrarse y además generar aviso activo.
- Los contactos pendientes deben registrarse y derivarse al canal interno definido por la clínica.
- Google Sheets es trazabilidad operativa, no base de conocimiento.
- No se deben subir datos reales de clientes al repositorio público.

## Estado

Estructura de planillas creada y ajustada manualmente en Google Sheets.

Pendiente:
- conectar n8n con Google Sheets
- registrar prueba desde flujo de agenda
- registrar prueba de horario no disponible
- registrar prueba de alerta de urgencia
- registrar prueba interna de falta de stock

## Prueba de escritura en agenda_consultas

Se validó escritura desde n8n hacia Google Sheets usando el workflow de prueba:

LAB-008 - Test Registro Operativo Google Sheets

Flujo probado:

Manual Trigger
↓
Code en JavaScript de prueba
↓
Google Sheets Append Row

Planilla utilizada:

VetAtiende AI - Atención Médica ACTUAL

Pestaña utilizada:

agenda_consultas

Resultado:

n8n logró agregar una fila nueva en Google Sheets con los datos de prueba.

Dato validado:

- nombre_tutor: Cliente Prueba
- nombre_mascota: Firulais
- tipo_mascota: perro
- tipo_atencion: consulta general
- estado: solicitada
- motivo: prueba_lab008
- telefono: +56900000000

Ajuste aplicado:

Para conservar correctamente el prefijo telefónico +56, se configuró:

- columna telefono en Google Sheets como Texto sin formato
- opción Cell Format del nodo Google Sheets en n8n como Let n8n format

Conclusión:

La escritura básica desde n8n hacia Google Sheets quedó validada para la pestaña agenda_consultas.


## Prueba de escritura en agenda_peluqueria

Se validó escritura desde n8n hacia Google Sheets usando el workflow de prueba:

LAB-008 - Test Registro Operativo Google Sheets

Flujo probado:

Manual Trigger
↓
Code en JavaScript de prueba
↓
Google Sheets Append Row

Planilla utilizada:

VetAtiende AI - Peluquería y Lavado ACTUAL

Pestaña utilizada:

agenda_peluqueria

Resultado:

n8n logró agregar una fila nueva en Google Sheets con los datos de prueba de peluquería y lavado.

Dato validado:

- nombre_tutor: Cliente Prueba Peluquería
- nombre_mascota: Copito
- tipo_mascota: perro
- servicio_solicitado: baño_y_corte
- estado: solicitada
- motivo: prueba_lab008_peluqueria
- telefono: +56911111111

Conclusión:

La escritura básica desde n8n hacia Google Sheets quedó validada para la pestaña agenda_peluqueria.


## Prueba de escritura en faltas_stock

Se validó escritura desde n8n hacia Google Sheets usando el workflow de prueba:

LAB-008 - Test Registro Operativo Google Sheets

Flujo probado:

Manual Trigger
↓
Code en JavaScript de prueba
↓
Google Sheets Append Row

Planilla utilizada:

VetAtiende AI - Registro Interno ACTUAL

Pestaña utilizada:

faltas_stock

Resultado:

n8n logró agregar una fila nueva en Google Sheets con los datos de prueba de falta de stock.

Dato validado:

- producto: Amoxicilina 250 mg
- categoria: medicamento
- detalle_producto: Caja de prueba para reposición interna
- prioridad: alta
- estado: pendiente
- observacion_interna: Registro de prueba de falta de stock desde n8n

Regla de seguridad:

El registro de faltas de stock pertenece al flujo interno protegido.

El flujo público no debe registrar faltas de stock ni leer información interna de esta planilla.

Conclusión:

La escritura básica desde n8n hacia Google Sheets quedó validada para la pestaña faltas_stock.


## Prueba de escritura en alertas_urgencia

Se validó escritura desde n8n hacia Google Sheets usando el workflow de prueba:

LAB-008 - Test Registro Operativo Google Sheets

Flujo probado:

Manual Trigger
↓
Code en JavaScript de prueba
↓
Google Sheets Append Row

Planilla utilizada:

VetAtiende AI - Atención Médica ACTUAL

Pestaña utilizada:

alertas_urgencia

Resultado:

n8n logró agregar una fila nueva en Google Sheets con los datos de prueba de una alerta veterinaria.

Dato validado:

- nombre_tutor: Cliente Prueba Urgencia
- nombre_mascota: Rex
- tipo_mascota: perro
- situacion_reportada: Mi perro comió chocolate y está decaído
- nivel_alerta: urgencia
- accion_luna: derivacion_inmediata
- aviso_enviado: pendiente_lab009
- canal_aviso: pendiente_definir
- estado: registrada
- telefono: +56922222222

Regla de seguridad:

Una alerta de urgencia no debe quedar solamente registrada en Google Sheets.

Google Sheets funciona como trazabilidad, pero el aviso activo hacia la clínica se implementará en LAB-009.

Conclusión:

La escritura básica desde n8n hacia Google Sheets quedó validada para la pestaña alertas_urgencia, dejando preparada la estructura para aviso activo posterior.


## Prueba de escritura en contactos_pendientes

Se validó escritura desde n8n hacia Google Sheets usando el workflow de prueba:

LAB-008 - Test Registro Operativo Google Sheets

Flujo probado:

Manual Trigger
↓
Code en JavaScript de prueba
↓
Google Sheets Append Row

Planilla utilizada:

VetAtiende AI - Atención Médica ACTUAL

Pestaña utilizada:

contactos_pendientes

Resultado:

n8n logró agregar una fila nueva en Google Sheets con los datos de prueba de un contacto pendiente.

Dato validado:

- nombre_tutor: Cliente Prueba Contacto
- nombre_mascota: Michi
- tipo_mascota: gato
- motivo_contacto: cliente_pide_contacto
- prioridad: normal
- derivado_interno: pendiente_lab009
- canal_derivacion: pendiente_definir
- estado: pendiente
- telefono: +56933333333

Regla operativa:

Un contacto pendiente no debe quedar solamente registrado en Google Sheets.

Google Sheets funciona como trazabilidad, pero la gestión real deberá ocurrir mediante el canal interno definido por la clínica.

Conclusión:

La escritura básica desde n8n hacia Google Sheets quedó validada para la pestaña contactos_pendientes, dejando preparada la estructura para derivación interna posterior.


## Exportación de workflow LAB-008

Se exportó el workflow de prueba desde n8n y se guardó en el repositorio.

Archivo exportado:

n8n/workflows/lab008_vetatiende_test_registro_operativo_google_sheets.json

Workflow n8n:

LAB-008 - Test Registro Operativo Google Sheets

El workflow fue usado para validar escritura desde n8n hacia Google Sheets en las siguientes pestañas:

- agenda_consultas
- agenda_peluqueria
- faltas_stock
- alertas_urgencia
- contactos_pendientes

## Revisión de secretos

Se ejecutó una búsqueda de posibles secretos dentro del workflow exportado usando patrones como:

- access_token
- refresh_token
- client_secret
- client_id
- secret
- api_key
- password
- token

Resultado:

No se encontraron coincidencias.

Conclusión:

El workflow exportado no contiene secretos sensibles detectables por la revisión realizada y puede mantenerse dentro del repositorio.


## Cierre LAB-008

LAB-008 queda validado como registro operativo básico con Google Sheets.

Se creó y validó una estructura de registro separada en tres planillas:

- VetAtiende AI - Atención Médica ACTUAL
- VetAtiende AI - Peluquería y Lavado ACTUAL
- VetAtiende AI - Registro Interno ACTUAL

Se validó escritura desde n8n hacia Google Sheets en las siguientes pestañas:

- agenda_consultas
- agenda_peluqueria
- faltas_stock
- alertas_urgencia
- contactos_pendientes

Se confirmó que Google Sheets será usado como registro operativo y trazabilidad, no como RAG, base de conocimiento ni fuente para responder consultas.

Se validó que el flujo público puede registrar datos operativos autorizados, pero no debe leer información interna sensible ni registrar faltas de stock.

Se validó que faltas_stock pertenece al flujo interno protegido.

Se dejó preparada la estructura para que alertas_urgencia y contactos_pendientes puedan derivarse a un canal interno en LAB-009.

Se exportó el workflow de prueba:

n8n/workflows/lab008_vetatiende_test_registro_operativo_google_sheets.json

Se revisó que el workflow exportado no contenga secretos sensibles detectables.

## Resultado final

LAB-008 queda cerrado como base operativa de registro en Google Sheets.

Pendiente para LAB-009:

- integrar seguridad veterinaria completa
- activar aviso interno para alertas de urgencia
- activar derivación interna para contactos pendientes
- conectar registros operativos al flujo real público/interno cuando corresponda

