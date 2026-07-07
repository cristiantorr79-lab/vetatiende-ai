
# Evidencia LAB-009 - Seguridad veterinaria integrada

## Objetivo

Asegurar que las urgencias veterinarias corten el flujo normal de atención.

Luna no debe tratar una urgencia como una consulta común, una oportunidad comercial o una simple solicitud de agenda.

## Roadmap validado

LAB-009 define como casos críticos iniciales:

- ingesta de chocolate
- atropello
- dificultad respiratoria
- convulsiones
- envenenamiento
- hemorragia abundante
- no puede orinar
- golpe de calor
- pérdida de conciencia

Criterio de salida:

Luna deriva de inmediato, no diagnostica, no entrega tratamientos y no intenta vender o agendar como si fuera una consulta normal.

## Decisión arquitectónica

Se documentó DA-022:

LAB-009: seguridad veterinaria integrada y avisos internos.

Regla central:

Si se detecta una urgencia, el flujo debe cortar antes de Google Calendar.

## Workflow de trabajo

Se duplicó el workflow validado de LAB-007 para no modificar el flujo original de agenda.

Nuevo workflow:

LAB-009 - Seguridad veterinaria integrada

## Webhook LAB-009

Se configuró una ruta propia para evitar confusión con LAB-007:

- vetatiende-agenda-lab009

URL local de prueba:

- http://localhost:5678/webhook-test/vetatiende-agenda-lab009

## Detección inicial

La primera detección de urgencias se hará mediante reglas explícitas en n8n, no solamente por interpretación del modelo de IA.

Campos considerados:

- situacionReportada
- observacionCliente
- mensajeCliente

Campo normalizado para detección:

- textoUrgencia

Se validó que el flujo genera textoUrgencia desde el mensaje del cliente.

Ejemplo probado:

Mi perro comió chocolate y está decaído

Resultado esperado:

- textoUrgencia contiene la situación reportada en minúsculas
- la palabra chocolate permite activar la detección de urgencia

## Simplificación de columnas

Durante LAB-009 se simplificaron las columnas de alertas_urgencia y contactos_pendientes para facilitar lectura operativa y mapeo desde n8n.

### alertas_urgencia

Nueva estructura oficial:

- fecha_registro
- canal_origen
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- situacion_reportada
- tipo_urgencia
- respuesta_luna
- estado_gestion
- canal_aviso

### contactos_pendientes

Nueva estructura oficial:

- fecha_registro
- canal_origen
- nombre_tutor
- telefono
- nombre_mascota
- tipo_mascota
- motivo_contacto
- prioridad
- observacion_cliente
- respuesta_luna
- estado_gestion
- canal_derivacion

Esta estructura se aplicó en:

- VetAtiende AI - Atención Médica ACTUAL / alertas_urgencia
- VetAtiende AI - Atención Médica ACTUAL / contactos_pendientes
- VetAtiende AI - Peluquería y Lavado ACTUAL / contactos_pendientes

## Estado actual

Pendiente:

- preparar registro de urgencia en n8n
- escribir alerta real en Google Sheets desde rama true del IF
- responder derivación inmediata con Respond to Webhook
- validar que una urgencia no consulte Google Calendar
- validar que un caso normal siga el flujo de agenda


## Incidencia corregida - Registro de urgencia con expresiones literales

Durante la prueba del flujo LAB-009 se detectó que el nodo Preparar Registro Urgencia estaba enviando algunas expresiones como texto literal hacia Google Sheets.

Ejemplo del problema:

- {{ $now.toISO() }}
- {{ $json.nombreTutor }}
- {{ $json.telefono }}

Causa:

El JSON del nodo Preparar Registro Urgencia no estaba evaluando correctamente las expresiones.

Además, el nodo Detectar Urgencia estaba conservando solo los campos de detección:

- esUrgencia
- tipoUrgencia

y no estaba manteniendo todos los datos originales del cliente.

Correcciones aplicadas:

1. En el nodo Detectar Urgencia se activó la opción Include Other Input Fields para conservar los datos originales del flujo.

2. En el nodo Preparar Registro Urgencia se ajustó el JSON para que las expresiones se evalúen correctamente.

Resultado validado:

Se ejecutó una nueva prueba con el caso:

Mi perro fue atropellado y esta sangrando

El flujo registró correctamente en Google Sheets:

- nombre_tutor: Cliente Prueba Urgencia 2
- telefono: +56944444444
- nombre_mascota: Max
- tipo_mascota: perro
- situacion_reportada: Mi perro fue atropellado y esta sangrando
- tipo_urgencia: atropellado
- estado_gestion: registrada_pendiente_aviso
- canal_aviso: pendiente_definir

Conclusión:

La rama de urgencia del workflow LAB-009 ya prepara y registra datos reales correctamente en alertas_urgencia.


## Validación de ramas LAB-009

Se validó que el workflow LAB-009 separa correctamente los casos de urgencia y los casos normales.

### Caso 1: urgencia veterinaria

Entrada de prueba:

Mi perro tiene dificultad respiratoria

Resultado:

- El flujo detectó urgencia.
- Se ejecutó la rama true del nodo Es Urgencia.
- Se registró la alerta en Google Sheets.
- Se respondió por Webhook con mensaje de derivación inmediata.
- No se ejecutó el flujo normal de agenda.
- No se consultó disponibilidad en Google Calendar.
- No se creó cita.

Respuesta validada por PowerShell:

- tipo: urgencia_detectada
- registrado: True
- estado_gestion: registrada_pendiente_aviso
- canal_aviso: pendiente_definir

### Caso 2: solicitud normal de agenda

Entrada de prueba:

Quiero agendar una consulta general para mi perro

Datos de prueba:

- nombre_tutor: Cliente Prueba Normal LAB009
- nombre_mascota: Toby
- tipo_mascota: perro
- tipo_atencion: consulta general
- telefono: +56977777777

Resultado:

- El flujo no detectó urgencia.
- Se ejecutó la rama false del nodo Es Urgencia.
- El flujo continuó hacia Google Calendar.
- Se validó disponibilidad.
- Se creó la cita en Google Calendar.
- Se respondió confirmación normal de agenda.

Respuesta validada:

Tu hora para consulta general de Toby fue confirmada correctamente en la agenda de la clínica. Te esperamos en Clínica Veterinaria Patitas del Sur.

Conclusión:

La seguridad veterinaria integrada funciona correctamente como barrera previa a la agenda.

Una urgencia corta el flujo normal.

Una solicitud normal continúa hacia Google Calendar.


## Exportación de workflow LAB-009

Se exportó el workflow final de LAB-009 desde n8n y se guardó en el repositorio.

Archivo exportado:

n8n/workflows/lab009_vetatiende_seguridad_veterinaria_integrada.json

Workflow n8n:

LAB-009 - Seguridad veterinaria integrada

El workflow implementa:

- detección inicial de urgencias por reglas
- campo normalizado textoUrgencia
- nodo Detectar Urgencia
- nodo IF Es Urgencia
- rama true para urgencias
- registro en Google Sheets / alertas_urgencia
- respuesta inmediata por Webhook
- rama false hacia flujo normal de agenda Google Calendar

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


## Cierre LAB-009

LAB-009 queda validado como seguridad veterinaria integrada.

Se implementó una barrera previa al flujo normal de agenda para detectar urgencias veterinarias mediante reglas explícitas en n8n.

El flujo validado quedó así:

Webhook Solicitud Agenda
↓
Preparar Datos Agenda
↓
Detectar Urgencia
↓
IF Es Urgencia

Rama true:
urgencia detectada
↓
Preparar Registro Urgencia
↓
Registrar Alerta Urgencia
↓
Responder Urgencia

Rama false:
no hay urgencia
↓
Consultar Disponibilidad Agenda
↓
Evaluar Disponibilidad Agenda
↓
Crear cita o responder horario no disponible
↓
Responder Solicitud Agenda

## Validaciones realizadas

### Urgencia

Caso probado:

Mi perro tiene dificultad respiratoria

Resultado:

- se detectó urgencia
- se ejecutó la rama true
- se registró la alerta en Google Sheets
- se respondió con derivación inmediata
- no se consultó Google Calendar
- no se creó cita

### Caso normal

Caso probado:

Quiero agendar una consulta general para mi perro

Resultado:

- no se detectó urgencia
- se ejecutó la rama false
- se consultó disponibilidad en Google Calendar
- se creó cita correctamente
- se respondió confirmación normal de agenda

## Resultado final

LAB-009 cumple el criterio de salida:

Luna deriva de inmediato, no diagnostica, no entrega tratamientos y no intenta vender o agendar como si fuera una consulta normal.

## Pendiente futuro

Queda preparado para un ajuste posterior:

- activar aviso interno real hacia la clínica
- definir canal final de aviso: WhatsApp interno, correo, Telegram, panel interno o aplicación interna
- mejorar la lista de palabras críticas
- agregar pruebas integrales en LAB-010

