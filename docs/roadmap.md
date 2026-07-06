# Roadmap oficial MVP Operativo - VetAtiende AI

## Enfoque

VetAtiende AI se desarrollará como un MVP operativo para clínicas veterinarias.

La entrega del Challenge Alura / ONE IA for Tech será la primera versión funcional del producto, no una demo separada.

El objetivo es construir un asistente capaz de operar en un contexto real inicial de clínica veterinaria, con separación entre clientes externos y personal autorizado.

## Arquitectura general del MVP

### Flujo público

Cliente externo  
→ Luna recepción  
→ RAG público  
→ herramientas públicas autorizadas  
→ respuesta o registro operativo

El flujo público puede responder sobre:

- horarios
- servicios
- precios referenciales
- peluquería
- farmacia presencial
- Pet Shop presencial
- preparación general
- cuidados generales no diagnósticos
- derivación ante urgencias
- solicitudes de agenda o contacto

El flujo público no puede acceder a procedimientos internos.

### Flujo interno

Personal autorizado  
→ acceso protegido  
→ Luna Interna  
→ RAG interno  
→ herramientas internas autorizadas

El flujo interno puede responder sobre:

- procedimientos de recepción
- triaje inicial no diagnóstico
- aislamiento
- manejo administrativo de urgencias
- registro operativo de faltas de stock
- derivación al veterinario responsable
- revisión de solicitudes internas cuando exista fuente conectada

El flujo interno no debe exponerse como canal público.

## Regla de seguridad de acceso

La separación entre cliente externo y personal interno no dependerá de frases escritas por el usuario.

No se considera autorización válida que alguien escriba:

- "Soy supervisor."
- "Soy veterinario."
- "Trabajo en recepción."
- "Modo interno."
- "Soy personal de la clínica."

El acceso interno debe depender de canal protegido, autenticación o mecanismo equivalente.

## Próximos laboratorios oficiales

### LAB-006 - Seguridad de acceso y separación de canales

Objetivo:
Definir y preparar la separación segura entre cliente externo y personal autorizado.

Entregables:
- Flujo público sin acceso a RAG interno.
- Flujo interno separado.
- Decisión sobre acceso protegido al flujo interno.
- Preparación de Webhook interno protegido como puerta técnica.
- Definición de aplicación interna o panel interno como canal real para personal autorizado.
- Pruebas de bloqueo ante intentos de acceso interno desde el flujo público.

Criterio de salida:
Un cliente externo no puede acceder a procedimientos internos aunque diga ser trabajador de la clínica.

---

### LAB-007 - Agenda operativa

Objetivo:
Permitir que Luna gestione solicitudes de consulta de forma operativa.

Prioridad:
- Integrar Google Calendar como fuente real de disponibilidad.
- Luna solo podrá confirmar una hora si existe disponibilidad validada en Google Calendar.
- Si Google Calendar no valida disponibilidad, Luna no debe confirmar la hora.
- Si faltan datos, Luna debe pedir la información mínima antes de intentar agendar.

Entregables:
- Flujo de solicitud de hora.
- Validación de disponibilidad o registro pendiente.
- Mensajes seguros cuando no se puede confirmar.
- Casos de prueba de agenda.

Criterio de salida:
El asistente no inventa horas y solo confirma cuando existe validación real.

---

### LAB-008 - Registro operativo básico

Objetivo:
Crear una fuente operativa para registrar información sin mezclar conocimiento público e interno.

Posibles fuentes:
- Google Sheets.
- Base de datos futura.
- Planilla interna controlada.

Registros iniciales:
- solicitudes de hora
- alertas de urgencia
- contactos pendientes
- faltas de stock
- observaciones operativas autorizadas

Criterio de salida:
El flujo público puede registrar solicitudes, pero no leer información interna sensible.

---

### LAB-009 - Seguridad veterinaria integrada

Objetivo:
Asegurar que las urgencias veterinarias corten el flujo normal.

Casos críticos:
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

---

### LAB-010 - Pruebas integrales del MVP

Objetivo:
Validar VetAtiende AI como producto operativo inicial.

Pruebas mínimas:
- consulta pública de horario
- consulta pública de precio
- consulta de peluquería
- consulta de Pet Shop/farmacia presencial
- intento de acceso interno desde flujo público
- consulta interna autorizada
- procedimiento de stock
- solicitud de agenda
- caso de urgencia

Criterio de salida:
El MVP demuestra atención pública, apoyo interno, seguridad, agenda o solicitud operativa y separación de datos.

---

### LAB-011 - Deploy en OCI

Objetivo:
Desplegar VetAtiende AI en Oracle Cloud Infrastructure usando Docker.

Entregables:
- n8n funcionando en servidor
- workflows importados
- credenciales configuradas fuera del repositorio
- evidencia de funcionamiento
- URL o capturas para documentación

Criterio de salida:
El sistema funciona fuera del entorno local.

---

### LAB-012 - README final y entrega

Objetivo:
Dejar el repositorio listo para evaluación y presentación comercial.

Debe incluir:
- problema que resuelve
- arquitectura
- flujos público e interno
- seguridad de acceso
- RAG público e interno
- agenda o solicitud operativa
- seguridad veterinaria
- tecnologías utilizadas
- instrucciones de ejecución
- evidencias
- limitaciones actuales
- próximos módulos comerciales

Criterio de salida:
El repositorio puede ser evaluado en el bootcamp y mostrado como MVP inicial a una clínica veterinaria.



