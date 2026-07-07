# Decisiones de Arquitectura - VetAtiende AI

Este documento registra decisiones de diseño tomadas durante el desarrollo del proyecto.  
Su objetivo es evitar cambios de rumbo, mantener trazabilidad y complementar el Documento Maestro.

## DA-001 - Nombre del proyecto

El proyecto se trabajará comercialmente como **VetAtiende AI**.

El Documento Maestro v1.1 usa el nombre inicial VetAssist AI, pero desde LAB-000 se adopta VetAtiende AI como nombre de trabajo del repositorio, README y ejecución técnica.

## DA-002 - Clínica base del caso

Para el desarrollo del challenge se usará una clínica veterinaria realista llamada:

**Clínica Veterinaria Patitas del Sur**

Ubicación de referencia: Purranque, Región de Los Lagos.

No se usará información real de una clínica existente sin autorización.

## DA-003 - Separación entre cliente externo y personal interno

El asistente debe separar claramente dos modos de uso:

1. Cliente externo:
   - Consulta horarios, servicios, precios referenciales, peluquería, farmacia, pet shop, preparación y cuidados generales.
   - No accede a procedimientos internos.
   - No registra stock.
   - No compra productos.

2. Personal interno:
   - Consulta procedimientos autorizados.
   - Registra faltas de stock.
   - Usa comandos internos.
   - Puede activar flujos administrativos.

## DA-004 - Pet Shop y farmacia presencial

La farmacia y el Pet Shop de la clínica funcionarán solo como venta presencial.

VetAtiende AI no será un carrito de compra.

El asistente no debe:

- Procesar pagos online.
- Tomar pedidos de productos.
- Reservar productos.
- Gestionar despacho.
- Confirmar stock exacto sin una fuente actualizada.

El asistente sí puede:

- Informar categorías generales de productos.
- Recordar que la clínica cuenta con Pet Shop.
- Sugerir al cliente consultar productos durante su visita.
- Apoyar la venta presencial mediante recordatorios comerciales contextuales.

## DA-005 - Publicidad contextual dentro del asistente

El asistente podrá incluir recordatorios comerciales naturales después de ciertas respuestas.

Ejemplo:

"Tu hora quedó confirmada. Además, el día de tu visita puedes consultar por alimentos, antiparasitarios, accesorios, arena sanitaria y productos de higiene disponibles en la clínica."

Esta sugerencia debe ser breve, prudente y no invasiva.

## DA-006 - Agenda y confirmación de horas

El asistente solo puede confirmar una hora si existe una herramienta de agenda conectada o una validación real de disponibilidad.

Si no hay calendario conectado, el asistente solo debe registrar una solicitud e indicar que queda pendiente de confirmación por parte de la clínica.

Herramientas futuras posibles:

- Google Calendar.
- Cal.com.
- Calendly.
- Google Sheets como registro inicial de solicitudes.

## DA-007 - Registro interno de faltas de stock

El registro de faltas de stock es una función interna.

Cuando una encargada, recepcionista o persona autorizada detecte que un medicamento, alimento, accesorio o producto se acabó, podrá registrar la falta usando lenguaje natural.

Ejemplos:

- "Registrar sin stock Amoxicilina 250 mg."
- "Anotar falta de alimento cachorro 10 kilos."
- "Agregar a pedido antiparasitario para gato."
- "Sin stock arena sanitaria aglomerante."

El asistente debe interpretar estos mensajes como comandos internos de stock.

## DA-008 - Destino de registros de stock

Las faltas de stock deben enviarse a una fuente de reposición, como:

- Google Sheets.
- Base de datos interna.
- Planilla de proveedores.
- Sistema de pedidos futuro.

El objetivo es que el producto quede registrado para considerarlo en el próximo pedido a proveedores.

## DA-009 - Seguimiento pre consulta

El asistente podrá realizar seguimiento antes de una consulta agendada.

Ejemplos de uso:

- Recordar día y hora de la consulta.
- Indicar que el cliente debe llevar carnet sanitario.
- Recordar antecedentes médicos previos.
- Entregar instrucciones generales según el tipo de atención.

El seguimiento pre consulta dependerá de una agenda o registro de horas.

## DA-010 - Seguimiento post consulta

El asistente podrá realizar seguimiento posterior a la atención.

Objetivo:

- Preguntar cómo ha evolucionado la mascota.
- Recordar cuidados generales indicados.
- Detectar señales de alerta.
- Derivar al equipo veterinario cuando corresponda.

El asistente no debe diagnosticar, modificar tratamientos ni entregar indicaciones médicas de riesgo.

## DA-011 - Signos de alerta y derivación

Si el cliente informa signos preocupantes, el asistente debe recomendar contacto directo con la clínica o atención veterinaria presencial.

Ejemplos de alerta:

- Dificultad respiratoria.
- Sangrado abundante.
- Convulsiones.
- Decaimiento extremo.
- Dolor intenso.
- Vómitos repetidos.
- No puede orinar.
- Ingesta de tóxicos.
- Pérdida de conciencia.

## DA-012 - Regla de trabajo del proyecto

Antes de ejecutar cambios técnicos importantes se debe revisar si la decisión está alineada con el Documento Maestro.

Si una idea nueva mejora el diseño sin romper el alcance, debe registrarse primero en este documento antes de implementarse.

Flujo de trabajo:

Idea o duda
↓
Decisión de diseño
↓
Registro documental
↓
Ejecución técnica
↓
Validación
↓
Commit

## DA-013 - RAG público LAB-004

En LAB-004 se implementará el primer RAG público de VetAtiende AI.

Este RAG estará orientado exclusivamente a consultas de clientes externos sobre:

- Servicios disponibles.
- Precios referenciales.
- Horarios.
- Peluquería canina.
- Farmacia y Pet Shop presencial.
- Preguntas frecuentes.
- Preparación general antes de una atención.
- Cuidados generales no diagnósticos.

Fuentes autorizadas para LAB-004:

- data/servicios_precios.csv
- data/faq_clientes.pdf
- data/manual_seguridad_y_derivacion.pdf solo como apoyo para derivación y seguridad.

El RAG público no debe responder procedimientos internos, registrar stock, confirmar horas médicas, procesar compras, reservar productos ni entregar diagnósticos o tratamientos veterinarios.

Si la información no está en los documentos, el asistente debe indicar que no puede confirmarlo y recomendar contactar directamente a la clínica.


## DA-014 - Método de trabajo paso a paso

El desarrollo de VetAtiende AI se realizará por laboratorios y micro-pasos.
No se entregarán múltiples instrucciones técnicas juntas salvo que Cristian lo solicite.
Cada paso debe ser ejecutado, revisado y validado antes de avanzar al siguiente.


## DA-015 - RAG interno autorizado LAB-005

En LAB-005 se implementará un RAG interno orientado exclusivamente a procedimientos autorizados para el personal de Clínica Veterinaria Patitas del Sur.

Este RAG interno debe mantenerse separado del RAG público implementado en LAB-004.

Fuentes internas autorizadas para LAB-005:

- data/manual_procedimientos_internos.pdf
- data/protocolo_stock.csv
- data/manual_seguridad_y_derivacion.pdf como apoyo para criterios de derivación, seguridad y urgencias.

El asistente solo debe usar el RAG interno cuando el usuario indique explícitamente que está en modo interno o que pertenece al personal de la clínica.

Ejemplos de activación interna:

- "Modo interno."
- "Soy recepción."
- "Soy personal de la clínica."
- "Consulta interna."
- "Necesito revisar un procedimiento interno."

El RAG interno podrá responder sobre:

- Flujo de recepción.
- Triaje inicial no diagnóstico.
- Manejo administrativo de urgencias.
- Procedimiento de aislamiento.
- Registro operativo de faltas de stock.
- Información que debe recopilar recepción antes de una atención.
- Derivación a veterinario responsable cuando corresponda.

El RAG interno no debe:

- Entregar diagnósticos veterinarios definitivos.
- Indicar tratamientos médicos.
- Modificar tratamientos.
- Confirmar stock real sin una fuente actualizada.
- Exponer procedimientos internos a clientes externos.
- Reemplazar criterio profesional veterinario.

En LAB-005 no se implementará todavía el registro real de stock en Google Sheets, base de datos o sistema externo. Esa integración queda para un laboratorio posterior.

El objetivo de LAB-005 es validar que el agente puede consultar documentación interna autorizada, responder de forma segura y mantener separada la información pública de la información interna.

## DA-016 - Separación y acceso protegido para flujo interno

VetAtiende AI mantendrá separado el flujo público del flujo interno.

El flujo público estará orientado a clientes externos y solo tendrá acceso al RAG público.

El flujo interno estará orientado al personal autorizado de la clínica y tendrá acceso al RAG interno de procedimientos autorizados.

No se permitirá que el acceso interno dependa únicamente de frases escritas por el usuario, como:

- "Soy supervisor."
- "Soy veterinario."
- "Soy recepción."
- "Trabajo en la clínica."
- "Modo interno."

La autodeclaración del usuario no será considerada autenticación válida.

Para el MVP operativo, el flujo interno deberá funcionar como workflow separado y con acceso protegido.

La primera opción de protección será un Webhook interno autenticado, por ejemplo mediante Basic Auth, Header Auth o un mecanismo equivalente disponible en n8n.

Arquitectura definida:

Flujo público:
Cliente externo → Luna recepción → RAG público

Flujo interno:
Personal autorizado → acceso protegido → Luna interna → RAG interno

El flujo público nunca debe tener conectada la herramienta RAG interna.

El flujo interno podrá consultar procedimientos autorizados, recepción, triaje no diagnóstico, aislamiento, manejo administrativo de urgencias, registro operativo de faltas de stock y derivación al veterinario responsable.

Esta decisión se adopta para reducir el riesgo de fuga de información interna y construir un MVP vendible, no solo una prueba técnica.

## DA-017 - Challenge como MVP operativo vendible

VetAtiende AI no se desarrollará como una demo separada para cumplir el challenge.

La entrega del Challenge Alura / ONE IA for Tech será la primera versión operativa del producto, diseñada también como MVP inicial vendible para clínicas veterinarias.

Desde LAB-006 en adelante, el desarrollo debe priorizar un sistema útil para operación real de una clínica, no solo una demostración técnica.

El producto debe avanzar hacia un asistente operativo capaz de:

- Atender consultas frecuentes de clientes.
- Consultar documentación pública mediante RAG.
- Proteger información interna.
- Separar clientes externos de personal autorizado.
- Apoyar al personal interno con procedimientos autorizados.
- Gestionar solicitudes de atención o agenda.
- Registrar información operativa básica.
- Manejar urgencias veterinarias con derivación segura.

Antes de implementar agenda, stock u otras automatizaciones internas, se debe definir la seguridad de acceso y la separación de canales entre cliente externo y trabajador autorizado.

La prioridad inmediata después de LAB-005 será:

1. Seguridad de acceso y separación de canales.
2. Agenda operativa.
3. Registro operativo básico.
4. Seguridad veterinaria integrada.
5. Pruebas integrales.
6. Deploy en OCI.
7. README final y entrega.

Esta decisión corrige y ordena el rumbo del proyecto: challenge y MVP comercial no son caminos separados, sino una misma versión operativa inicial.

## DA-018 - LAB-006: acceso interno mediante Webhook protegido

En LAB-006 se define que el flujo interno de VetAtiende AI no será accesible desde el mismo canal público usado por clientes externos.

El flujo público seguirá orientado a clientes externos y solo tendrá acceso al RAG público.

El flujo interno se preparará como un workflow separado con entrada protegida mediante Webhook autenticado.

Para el MVP operativo, la opción inicial será usar Header Auth en el Webhook interno de n8n.

La autenticación por Header Auth permitirá que solo solicitudes que incluyan una clave interna válida puedan ingresar al flujo Luna Interna.

No se considerará autenticación válida que una persona escriba frases como:

- "Soy veterinario."
- "Soy recepción."
- "Soy supervisor."
- "Trabajo en la clínica."
- "Modo interno."

Estas frases podrán servir como contexto conversacional dentro de un canal ya protegido, pero nunca como prueba de autorización.

Arquitectura LAB-006:

Flujo público:
Cliente externo → Luna recepción → RAG público

Flujo interno:
Personal autorizado → Webhook interno con Header Auth → Luna Interna → RAG interno

El flujo público no debe tener conectada ninguna herramienta, documento ni vector store interno.

El flujo interno podrá consultar documentación interna autorizada, pero no debe entregar diagnósticos definitivos, tratamientos médicos ni reemplazar criterio veterinario profesional.

Esta decisión deja preparado el proyecto para integrar después agenda, stock, solicitudes internas y otros módulos operativos sin exponer información interna a clientes externos.

## DA-019 - Canal interno mediante aplicación interna

En LAB-006 se aclara que el Webhook protegido no será considerado el canal final de uso para el personal interno.

El Webhook protegido funcionará como una puerta técnica segura para recibir solicitudes internas, pero el personal de la clínica no interactuará directamente con URLs, Postman, PowerShell ni herramientas técnicas.

Para el MVP operativo, el canal interno recomendado será una aplicación interna simple o panel interno de VetAtiende AI.

Arquitectura interna corregida:

Personal autorizado → Aplicación interna VetAtiende → Webhook protegido → Luna Interna → RAG interno

La aplicación interna podrá ser inicialmente una interfaz web simple con:

- campo para escribir la consulta interna
- botón para enviar
- respuesta de Luna Interna
- acceso protegido mediante clave, login simple o mecanismo equivalente

El canal interno no debe mezclarse con el WhatsApp público de clientes.

WhatsApp será tratado como canal principal para clientes externos, consultas frecuentes, solicitudes de hora y atención inicial.

Si en el futuro se habilita un canal interno por WhatsApp, deberá usar un número, grupo, autorización o mecanismo separado que no dependa de frases escritas por el usuario.

Esta decisión permite construir un MVP operativo más realista para clínicas veterinarias, donde los clientes usan WhatsApp y el personal interno accede a una herramienta separada de trabajo.

## DA-020 - LAB-007: agenda operativa con Google Calendar

En LAB-007 se implementará agenda operativa usando Google Calendar como fuente real de disponibilidad.

VetAtiende AI no debe inventar horarios ni confirmar citas sin validación previa.

La regla principal será:

Luna solo puede confirmar una hora si existe disponibilidad validada en Google Calendar.

Si Google Calendar no está disponible, si la credencial falla, si el horario solicitado está ocupado o si la información entregada por el cliente es insuficiente, Luna no debe confirmar la hora.

En esos casos debe responder que la solicitud queda pendiente de revisión por parte de la clínica o pedir los datos faltantes.

Para el MVP operativo se usará un calendario separado de prueba o calendario clínico controlado, no el calendario personal principal de Cristian.

Datos mínimos para una solicitud de agenda:

- nombre del tutor
- nombre de la mascota
- tipo de atención
- día u horario solicitado
- teléfono o canal de contacto si corresponde

Tipos iniciales de atención:

- consulta general
- vacunación
- peluquería canina
- control
- urgencia o caso delicado, que debe derivarse con prioridad y no tratarse como agenda normal

La agenda no reemplaza el criterio de recepción ni del equipo veterinario.

Si el cliente describe una urgencia veterinaria, Luna debe cortar el flujo normal de agenda y derivar a contacto inmediato o atención presencial.

## DA-021 - LAB-008: registro operativo básico con Google Sheets

En LAB-008 se implementará un registro operativo básico usando Google Sheets como primera fuente operativa del MVP.

Google Sheets será usado como bitácora operativa inicial para clínicas pequeñas y para validar rápidamente el flujo de datos de VetAtiende AI.

Esta decisión no define a Google Sheets como solución definitiva para clínicas medianas o grandes. Para escenarios con mayor volumen operativo, el registro deberá migrar o integrarse a una base de datos, dashboard, CRM, sistema de gestión veterinaria o herramienta equivalente.

Google Sheets no será usado como RAG, base de conocimiento ni fuente para responder consultas públicas o internas. Su función será registrar eventos operativos generados por los flujos de VetAtiende AI.

La planilla inicial se llamará:

VetAtiende AI - Registro Operativo ACTUAL

La información se organizará por pestañas separadas para mantener orden operativo:

- solicitudes_consulta_medica
- solicitudes_peluqueria_lavado
- citas_medicas_confirmadas
- citas_peluqueria_confirmadas
- horarios_no_disponibles
- alertas_urgencia
- contactos_pendientes
- faltas_stock
- observaciones_internas

La separación entre consultas médicas y servicios de peluquería/lavado permitirá evitar mezcla operativa entre atenciones clínicas y servicios estéticos o comerciales.

Durante el mes, n8n agregará nuevos registros mediante filas nuevas. La regla inicial será registrar sin sobrescribir datos existentes.

Al cierre de cada mes, la clínica podrá respaldar la planilla mensual en Google Drive y comenzar el mes siguiente con una planilla o pestañas limpias.

El flujo público podrá registrar:

- solicitudes de consulta médica
- solicitudes de peluquería o lavado
- horarios no disponibles
- alertas de urgencia
- contactos pendientes

El flujo público no podrá leer información interna sensible ni registrar faltas de stock.

El flujo interno protegido podrá registrar:

- faltas de stock
- observaciones operativas autorizadas

El flujo interno seguirá dependiendo de canal protegido, aplicación interna o mecanismo equivalente. No se permitirá acceso interno solo por frases escritas por el usuario.

Esta decisión permite que VetAtiende AI tenga trazabilidad operativa real desde el MVP, manteniendo separación entre clientes externos, personal autorizado y registros internos.


### Ajuste DA-021 - Separación por planillas operativas homogéneas

Se ajusta la decisión DA-021 para organizar el registro operativo inicial de Google Sheets en planillas separadas por tipo de operación.

El objetivo es evitar una planilla única demasiado grande o muchas pestañas mezcladas.

Para el MVP se usarán tres planillas principales:

1. VetAtiende AI - Atención Médica ACTUAL

Uso:
Registrar solicitudes, disponibilidad, citas confirmadas, urgencias y contactos pendientes relacionados con atención médica veterinaria.

Pestañas iniciales:
- solicitudes_consulta
- citas_confirmadas
- horarios_no_disponibles
- alertas_urgencia
- contactos_pendientes

2. VetAtiende AI - Peluquería y Lavado ACTUAL

Uso:
Registrar solicitudes, disponibilidad, citas confirmadas y contactos pendientes relacionados con baño, corte de pelo, corte de uñas, limpieza de oídos y servicios de grooming.

Pestañas iniciales:
- solicitudes_peluqueria
- citas_confirmadas
- horarios_no_disponibles
- contactos_pendientes

3. VetAtiende AI - Registro Interno ACTUAL

Uso:
Registrar información operativa autorizada del flujo interno protegido.

Pestañas iniciales:
- faltas_stock
- observaciones_internas

Esta separación permite que cada área de trabajo mantenga registros más homogéneos y fáciles de revisar.

La atención médica no se mezclará con peluquería y lavado.

El registro interno seguirá separado del flujo público y solo podrá ser usado desde canal protegido.

Google Sheets seguirá siendo una solución inicial para MVP y clínicas pequeñas. Para clínicas medianas o grandes, el registro deberá migrar o integrarse a una base de datos, dashboard, CRM, sistema de gestión veterinaria o herramienta equivalente.


### Ajuste DA-021 - Alertas de urgencia con aviso activo

Se aclara que las alertas de urgencia veterinaria no deben quedar solamente registradas en Google Sheets.

Google Sheets funcionará como registro y trazabilidad, pero una alerta crítica debe generar además un aviso activo hacia la clínica, veterinario, asistente o canal definido por la clínica.

Canales futuros posibles:

- WhatsApp interno
- correo electrónico
- Telegram
- SMS
- panel interno
- aplicación interna

Para el MVP, la pestaña alertas_urgencia incluirá campos que permitan registrar si el aviso fue enviado y por qué canal.

Columnas consideradas:

- aviso_enviado
- canal_aviso

La implementación del aviso activo podrá completarse en LAB-009, junto con la seguridad veterinaria integrada.


### Ajuste DA-021 - Contactos pendientes con derivación interna

Se aclara que los contactos pendientes no deben quedar solamente registrados en Google Sheets.

Google Sheets funcionará como registro y trazabilidad, pero todo contacto pendiente deberá derivarse al canal interno definido por la clínica para que pueda ser gestionado por una persona responsable.

La diferencia con una alerta de urgencia es el nivel de prioridad:

- una alerta de urgencia requiere aviso inmediato
- un contacto pendiente requiere derivación interna para seguimiento

Casos posibles de contacto pendiente:

- faltan datos para completar una solicitud
- el cliente pidió que lo contacten
- no se pudo confirmar un horario
- la consulta requiere revisión humana
- el asistente no tiene información suficiente en los documentos
- el caso debe ser revisado por recepción o administración

Canales futuros posibles:

- WhatsApp interno
- correo electrónico
- Telegram
- panel interno
- aplicación interna

Para el MVP, la pestaña contactos_pendientes incluirá campos que permitan registrar si el caso fue derivado y por qué canal.

Columnas consideradas:

- derivado_interno
- canal_derivacion

Google Sheets mantendrá la trazabilidad del caso, pero la gestión real deberá ocurrir en el canal interno elegido por la clínica.


### Ajuste DA-021 - Seguimientos preconsulta y postconsulta

Se agrega a LAB-008 el registro operativo de seguimientos asociados a citas médicas.

Los mensajes preconsulta y postconsulta no deben mezclarse directamente con la pestaña citas_confirmadas, porque una cita confirmada representa la reserva de hora, mientras que el seguimiento representa una acción posterior o relacionada con esa atención.

Para mantener orden operativo, la planilla:

VetAtiende AI - Atención Médica ACTUAL

incluirá una nueva pestaña llamada:

- seguimientos_consulta

Esta pestaña registrará acciones como:

- recordatorio preconsulta
- mensaje postconsulta
- seguimiento posterior a una atención
- derivación humana por respuesta preocupante
- estado del mensaje enviado
- canal usado para el seguimiento

La relación operativa será:

cita médica confirmada
↓
registro o programación de seguimiento
↓
envío de mensaje preconsulta o postconsulta
↓
registro del estado del seguimiento

Para el MVP, esta funcionalidad quedará preparada en la estructura de Google Sheets, aunque la automatización completa podrá implementarse en un laboratorio posterior.

El seguimiento postconsulta no debe entregar diagnósticos, modificar tratamientos ni reemplazar criterio veterinario profesional.

Si durante un seguimiento el cliente informa signos de alerta, Luna deberá derivar a contacto directo con la clínica o atención veterinaria presencial.


### Ajuste DA-021 - Simplificación de planilla Atención Médica

Se ajusta la estructura de la planilla:

VetAtiende AI - Atención Médica ACTUAL

El objetivo es evitar demasiadas pestañas operativas y mantener una estructura más simple para clínicas pequeñas.

Se unificarán las pestañas relacionadas con agenda médica:

- solicitudes_consulta
- citas_confirmadas
- horarios_no_disponibles

en una sola pestaña llamada:

- agenda_consultas

La pestaña agenda_consultas registrará solicitudes, citas confirmadas y horarios no disponibles usando una columna de estado.

Estados iniciales posibles:

- solicitada
- confirmada
- no_disponible
- pendiente_datos
- cancelada

Con este ajuste, la planilla Atención Médica quedará organizada en cuatro pestañas principales:

- agenda_consultas
- alertas_urgencia
- contactos_pendientes
- seguimientos_consulta

Las pestañas alertas_urgencia, contactos_pendientes y seguimientos_consulta se mantienen separadas porque representan operaciones distintas:

- alertas_urgencia requiere registro y aviso activo
- contactos_pendientes requiere derivación interna para seguimiento humano
- seguimientos_consulta registra acciones preconsulta y postconsulta

Esta simplificación mejora la operación del MVP, reduce el desorden visual en Google Sheets y mantiene trazabilidad sin crear una planilla demasiado fragmentada.

Las pestañas antiguas podrán eliminarse después de confirmar que están vacías o que su información fue migrada correctamente.


### Ajuste DA-021 - Simplificación de planilla Peluquería y Lavado

Se ajusta la estructura de la planilla:

VetAtiende AI - Peluquería y Lavado ACTUAL

El objetivo es aplicar la misma lógica usada en la planilla de Atención Médica, evitando demasiadas pestañas operativas y manteniendo una estructura simple para clínicas pequeñas.

Se unificarán las pestañas relacionadas con agenda de peluquería y lavado:

- solicitudes_peluqueria
- citas_confirmadas
- horarios_no_disponibles

en una sola pestaña llamada:

- agenda_peluqueria

La pestaña agenda_peluqueria registrará solicitudes, citas confirmadas y horarios no disponibles usando una columna de estado.

Estados iniciales posibles:

- solicitada
- confirmada
- no_disponible
- pendiente_datos
- cancelada

Con este ajuste, la planilla Peluquería y Lavado quedará organizada en dos pestañas principales:

- agenda_peluqueria
- contactos_pendientes

La pestaña contactos_pendientes se mantiene separada porque representa casos que requieren derivación interna o revisión humana.

Esta simplificación permite mantener una estructura homogénea entre Atención Médica y Peluquería/Lavado, facilita la revisión operativa y reduce el desorden visual en Google Sheets.

Las pestañas antiguas podrán eliminarse después de confirmar que están vacías o que su información fue migrada correctamente.


### Ajuste técnico LAB-008 - Code Node de prueba en JavaScript

Durante LAB-008 se intentó usar el nodo Code de n8n con lenguaje Python para generar datos de prueba destinados a Google Sheets.

El intento falló porque el contenedor actual de n8n no tiene disponible el runner de Python.

Error observado:

Python runner unavailable: Python 3 is missing from this system

Para no desviar el laboratorio hacia configuración avanzada de Docker o task runners, se decidió usar JavaScript únicamente como código temporal de prueba dentro del nodo Code de n8n.

Esta decisión no cambia la regla general del proyecto:

- si se crea código propio para el challenge, se priorizará Python
- las expresiones o código interno de n8n podrán usar JavaScript solo cuando sea necesario por limitación técnica de n8n
- el uso de JavaScript en este caso se considera pegamento temporal de automatización, no código principal del producto

El objetivo del nodo Code en LAB-008 fue generar un registro falso para validar la escritura en Google Sheets.

