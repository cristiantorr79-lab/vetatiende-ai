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




---

## Actualización de roadmap posterior a LAB-013

**Fecha:** 2026-07-10

El roadmap original llegaba hasta LAB-012 como etapa de README final y entrega. Sin embargo, durante el desarrollo el MVP operativo avanzó más allá del plan inicial.

Se actualiza el roadmap para reflejar el estado real del proyecto después de LAB-013 y ordenar los siguientes laboratorios antes de la entrega del Challenge Alura / ONE IA for Tech.

## Estado real actualizado

### LAB-011 - Deploy en OCI

**Estado:** Cerrado

Resultado:
- n8n desplegado en Oracle Cloud Infrastructure.
- Workflows principales importados.
- Credenciales configuradas fuera del repositorio.
- RAG público validado en OCI.
- RAG interno protegido validado en OCI.
- Google Calendar y Google Sheets configurados.
- Webhooks públicos e internos operativos.

### LAB-012 - Disponibilidad proactiva de agenda

**Estado:** Cerrado

Resultado:
- Luna ofrece horarios reales disponibles cuando el cliente pide agendar sin fecha u hora exacta.
- Luna propone alternativas reales cuando el horario solicitado está ocupado.
- Luna filtra alternativas según preferencia del cliente.
- Se mejoró el parsing de horarios con expresiones chilenas.
- Google Calendar registra correctamente tutor, mascota y teléfono.

### LAB-013 - Aviso activo de urgencias por Telegram interno

**Estado:** Cerrado

Resultado:
- Urgencias veterinarias detectadas en el flujo público.
- Registro correcto en Google Sheets.
- Aviso activo enviado a grupo privado interno de Telegram.
- Respuesta segura de Luna al cliente.
- Workflow exportado y sanitizado sin exponer token ni chat_id real.

## Próximos laboratorios oficiales actualizados

### LAB-014 - Interfaz mínima Streamlit para Challenge

**Estado:** Próximo

Objetivo:
Crear una interfaz web mínima con Streamlit para que el evaluador pueda interactuar con Luna desde el navegador sin usar PowerShell ni herramientas técnicas.

Prioridad:
- Modo Cliente externo funcionando completo.
- Modo Interno protegido simple solo si no aumenta demasiado la complejidad.

Entregables:
- Aplicación Streamlit simple.
- Campo de consulta para el usuario.
- Botón de envío.
- Visualización de respuesta de Luna.
- Preguntas sugeridas.
- Conexión con Webhook público de n8n en OCI.
- Protección simple para modo interno si se implementa.
- Evidencia de funcionamiento.

Criterio de salida:
Un evaluador puede abrir la interfaz web, escribir una pregunta, enviarla al workflow de n8n y ver la respuesta de Luna en pantalla.

### LAB-015 - README final, evidencias y entrega Challenge

**Estado:** Posterior a LAB-014

Objetivo:
Dejar el repositorio listo para evaluación final del Challenge Alura / ONE IA for Tech.

Entregables:
- README final completo.
- Arquitectura real actualizada.
- Instrucciones de ejecución.
- Ejemplos de preguntas y respuestas.
- Evidencias de n8n en OCI.
- Evidencias de Streamlit funcionando.
- Evidencias de RAG público e interno.
- Evidencias de agenda.
- Evidencias de urgencia con Telegram interno.
- Limitaciones actuales.
- Próximos pasos comerciales.

Criterio de salida:
El repositorio puede ser enviado al challenge y mostrado como MVP operativo inicial.

### LAB-016 - Preparación demo comercial y pilotos

**Estado:** Futuro

Objetivo:
Preparar VetAtiende AI para conversaciones comerciales con clínicas veterinarias pequeñas.

Entregables posibles:
- Guion de demo comercial.
- Casos de uso para mostrar a clínicas.
- Propuesta simple de piloto.
- Lista de requisitos para adaptar el sistema a una clínica real.
- Definición de próximos módulos comerciales: WhatsApp Business, panel interno, seguimientos y stock.

Criterio de salida:
Cristian cuenta con una versión presentable para iniciar conversaciones comerciales después del challenge.
