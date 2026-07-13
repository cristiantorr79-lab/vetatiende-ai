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


## DA-022 - LAB-009: seguridad veterinaria integrada y avisos internos

En LAB-009 se integrará una capa de seguridad veterinaria para asegurar que Luna corte el flujo normal cuando detecte una urgencia o signo crítico.

El objetivo principal es evitar que una urgencia veterinaria sea tratada como una consulta común, una oportunidad comercial o una simple solicitud de agenda.

Casos críticos iniciales:

- ingesta de chocolate
- atropello
- dificultad respiratoria
- convulsiones
- envenenamiento
- hemorragia abundante
- no puede orinar
- golpe de calor
- pérdida de conciencia

Cuando Luna detecte un caso crítico deberá:

- detener el flujo normal
- no diagnosticar
- no entregar tratamiento médico
- no vender productos o servicios
- no ofrecer agenda como primera respuesta
- derivar de inmediato a contacto directo con la clínica o atención veterinaria presencial
- registrar la alerta en Google Sheets
- preparar o activar aviso interno hacia la clínica

La alerta se registrará en:

VetAtiende AI - Atención Médica ACTUAL

Pestaña:

- alertas_urgencia

Google Sheets funcionará como trazabilidad, pero no será suficiente como mecanismo de aviso.

Una alerta crítica deberá generar además un aviso activo hacia el canal definido por la clínica.

Canales posibles:

- WhatsApp interno
- correo electrónico
- Telegram
- SMS
- panel interno
- aplicación interna

Para el MVP, si el canal de aviso activo aún no está implementado, la alerta deberá registrarse con:

- aviso_enviado: pendiente_lab009
- canal_aviso: pendiente_definir

La implementación inicial de LAB-009 podrá partir validando detección, corte de flujo, respuesta segura y registro operativo.

La activación completa del aviso interno podrá implementarse como parte del mismo LAB-009 si el canal elegido está disponible, o quedar preparada para el siguiente ajuste operativo.

Esta decisión mantiene la regla central del producto:

VetAtiende AI no reemplaza criterio veterinario profesional y debe priorizar seguridad sobre agenda, venta o automatización.


### Ajuste DA-022 - Detección inicial de urgencias por reglas

Para LAB-009 se define que la primera capa de detección de urgencias veterinarias será por reglas explícitas dentro del workflow de n8n.

La detección de urgencias no dependerá solamente de la interpretación del modelo de IA.

La razón es que los casos críticos requieren una barrera dura de seguridad. Si el mensaje del cliente contiene señales claras de urgencia, el flujo debe cortar inmediatamente la atención normal.

Campos de entrada considerados para evaluar urgencia:

- situacionReportada
- observacionCliente
- mensajeCliente

El flujo deberá revisar el texto entregado por el cliente y detectar palabras o frases críticas como:

- chocolate
- atropello
- atropellado
- convulsión
- convulsiones
- envenenamiento
- veneno
- intoxicación
- dificultad respiratoria
- no puede respirar
- asfixia
- hemorragia
- sangrado abundante
- no puede orinar
- golpe de calor
- pérdida de conciencia
- inconsciente

Si se detecta una urgencia, el flujo deberá:

- no consultar Google Calendar
- no intentar agendar
- no ofrecer productos o servicios
- no pasar por flujo comercial
- no entregar diagnóstico ni tratamiento
- registrar la alerta en Google Sheets
- responder con derivación inmediata
- preparar aviso interno hacia la clínica

La alerta deberá registrarse en:

VetAtiende AI - Atención Médica ACTUAL

Pestaña:

- alertas_urgencia

Para el MVP, el flujo podrá registrar:

- aviso_enviado: pendiente_lab009
- canal_aviso: pendiente_definir

Esta capa de reglas podrá complementarse más adelante con clasificación mediante IA, pero la regla dura seguirá siendo prioritaria para seguridad veterinaria.


### Ajuste DA-022 - Webhook propio para LAB-009

Durante la configuración de LAB-009 se detectó que el workflow duplicado desde LAB-007 no tenía configurada la misma ruta de Webhook usada en las pruebas anteriores.

Para evitar confusión con el workflow LAB-007 y mantener separación entre laboratorios, el workflow LAB-009 usará una ruta de Webhook propia.

Ruta definida para pruebas de LAB-009:

- vetatiende-agenda-lab009

URL de prueba local esperada:

- http://localhost:5678/webhook-test/vetatiende-agenda-lab009

Esta separación permite probar seguridad veterinaria integrada sin modificar ni interferir con el workflow validado de LAB-007.


### Ajuste DA-022 - Simplificación de columnas para alertas y contactos pendientes

Durante LAB-009 se revisó la estructura de las pestañas alertas_urgencia y contactos_pendientes.

Se decidió simplificar columnas para que el registro sea más claro para una clínica pequeña y más fácil de mapear desde n8n.

El objetivo es evitar columnas repetidas o demasiado técnicas, manteniendo trazabilidad suficiente.

## Nueva estructura para alertas_urgencia

La pestaña alertas_urgencia quedará con las siguientes columnas:

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

Se eliminan o fusionan conceptos anteriores:

- nivel_alerta se elimina porque toda fila en alertas_urgencia ya representa una urgencia.
- accion_luna se elimina porque la acción queda reflejada en respuesta_luna.
- aviso_enviado y estado se fusionan en estado_gestion.

Estados posibles para estado_gestion en alertas_urgencia:

- registrada_pendiente_aviso
- aviso_enviado
- en_revision
- cerrada

Canales posibles para canal_aviso:

- pendiente_definir
- whatsapp_interno
- correo
- panel_interno
- app_interna

## Nueva estructura para contactos_pendientes

La pestaña contactos_pendientes quedará con las siguientes columnas:

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

Se eliminan o fusionan conceptos anteriores:

- derivado_interno se elimina porque toda fila en contactos_pendientes ya representa un caso que requiere gestión humana o revisión interna.
- estado se reemplaza por estado_gestion para describir mejor la situación operativa del caso.

Estados posibles para estado_gestion en contactos_pendientes:

- registrado_pendiente_derivacion
- derivado
- en_revision
- contactado
- cerrado

Canales posibles para canal_derivacion:

- pendiente_definir
- whatsapp_interno
- correo
- panel_interno
- app_interna

Esta simplificación mejora la lectura operativa de Google Sheets y reduce el riesgo de errores al mapear datos desde n8n.


---

## DA-023 - LAB-010: pruebas integrales del MVP operativo

Fecha: 2026-07-07

Se define LAB-010 como el laboratorio destinado a validar VetAtiende AI como MVP operativo inicial.

El objetivo de LAB-010 no es agregar nuevas funcionalidades principales, sino comprobar que los componentes construidos funcionan de manera integrada, coherente, segura y demostrable.

LAB-010 debe validar como mínimo los siguientes casos:

- consulta pública de horario
- consulta pública de precio
- consulta de peluquería
- consulta de Pet Shop/farmacia presencial
- intento de acceso interno desde flujo público
- consulta interna autorizada
- procedimiento de stock
- solicitud de agenda
- caso de urgencia veterinaria

La validación debe demostrar que VetAtiende AI puede atender consultas públicas, apoyar consultas internas autorizadas, proteger información interna, gestionar solicitudes de agenda cuando corresponde, cortar el flujo normal ante urgencias veterinarias y registrar alertas internas.

El criterio de salida de LAB-010 será que el MVP demuestre atención pública, apoyo interno, seguridad veterinaria, agenda o solicitud operativa y separación de datos.

Esta decisión marca a LAB-010 como una etapa de pruebas integrales, evidencia y cierre funcional del MVP operativo antes del deploy.

## DA-024 - LAB-012 disponibilidad proactiva de agenda

Se decide no ampliar más el alcance de LAB-011. LAB-011 queda enfocado en despliegue productivo OCI y validación operativa del MVP: n8n público, RAG público, Google Calendar, Google Sheets, agenda, bloqueo de horario ocupado y urgencias veterinarias.

La mejora de experiencia para agenda se separa como LAB-012.

Objetivo LAB-012:
- Cuando el cliente solicite agendar sin indicar hora específica, Luna deberá consultar disponibilidad real en Google Calendar y ofrecer alternativas concretas.
- Cuando el cliente solicite un horario ocupado, Luna deberá informar que no está disponible y proponer horarios alternativos reales.
- No se deben inventar horarios.
- Las alternativas deben respetar horario de atención, duración del servicio y disponibilidad real de Google Calendar.
- Para el MVP se priorizarán 3 alternativas simples y claras.

Motivo:
Separar esta mejora evita mezclar despliegue productivo con evolución funcional, mantiene LAB-011 cerrable y deja LAB-012 como una mejora concreta de producto vendible.


## DA-025 - Disponibilidad proactiva de agenda LAB-012

**Fecha:** 2026-07-09

**Contexto:**  
Hasta LAB-011, Luna puede agendar una hora específica si está disponible, bloquear horarios ocupados, registrar citas en Google Calendar y Google Sheets, y derivar urgencias veterinarias sin agendar.

**Decisión:**  
En LAB-012 se implementará disponibilidad proactiva de agenda usando Google Calendar como fuente real de disponibilidad.

Luna deberá ofrecer horarios reales disponibles en tres situaciones:

1. Cuando el cliente solicita agendar sin indicar fecha u hora específica.
2. Cuando el cliente solicita un horario que ya está ocupado.
3. Cuando el cliente rechaza las alternativas ofrecidas y pide otras opciones.

**Reglas:**  

- Luna no debe inventar horarios.
- Luna debe consultar Google Calendar antes de ofrecer opciones.
- Se deben ofrecer idealmente 3 alternativas claras.
- La consulta general mantiene duración de 30 minutos.
- Se debe respetar el horario de clínica:
  - Lunes a viernes: 09:00 a 18:30.
  - Sábado: 10:00 a 14:00.
  - Domingo y festivos: sin atención regular.
- No se debe crear evento ni registrar cita confirmada hasta que el cliente elija una hora concreta.
- Si el cliente rechaza alternativas y entrega una preferencia, Luna debe buscar nuevas opciones reales filtradas por esa preferencia.
- Si el cliente rechaza alternativas sin entregar preferencia, Luna debe preguntar si prefiere mañana, tarde u otro día específico.

**Alcance MVP:**  
Para LAB-012 no se implementará todavía una tabla persistente de estado conversacional.  
La detección de rechazo de alternativas se hará mediante lógica simple de intención y preferencia.

**Motivo:**  
Esta decisión mejora la experiencia del cliente, reduce fricción en la agenda y evita que el usuario tenga que adivinar horarios disponibles. También mantiene el MVP liviano y vendible sin agregar complejidad innecesaria en esta etapa.

**Impacto esperado:**  

- Mejor respuesta ante solicitudes incompletas de agenda.
- Menos conversaciones repetitivas.
- Menor riesgo de horarios inventados.
- Continuidad con la lógica validada en LAB-011.
- Base para una futura mejora con estado conversacional persistente.


---

## DA-026 - Aviso activo de urgencias por Telegram interno

**Fecha:** 2026-07-09  
**LAB asociado:** LAB-013  
**Estado:** Aprobada para implementación MVP

### Contexto

Hasta LAB-012, VetAtiende AI ya detecta casos de urgencia veterinaria, evita agendar una hora normal para esos casos y registra la alerta en Google Sheets.

Sin embargo, registrar una urgencia en una planilla no es suficiente para operación real. Una clínica necesita un aviso activo que llegue rápidamente al equipo interno, especialmente cuando el cliente reporta señales de riesgo como intoxicación, dificultad respiratoria, sangrado, convulsiones, atropello u otros síntomas graves.

### Decisión

Para el MVP operativo, se implementará un aviso activo de urgencias mediante un canal privado interno de Telegram.

El flujo esperado será:

1. Luna detecta una posible urgencia veterinaria.
2. El sistema registra la alerta en Google Sheets.
3. El sistema envía un mensaje activo a un canal o grupo privado de Telegram del equipo interno.
4. Luna responde al cliente con orientación segura, sin diagnosticar ni indicar tratamientos.

### Justificación

Telegram se elige como canal MVP porque permite implementar avisos internos de forma rápida, económica y suficientemente robusta para una primera versión vendible.

También permite separar claramente el canal público del cliente y el canal privado interno de la clínica, manteniendo la lógica de seguridad ya definida en LAB-006 y LAB-010.

### Alcance LAB-013

LAB-013 implementará:

- Envío de alerta interna por Telegram ante urgencias detectadas.
- Uso de bot privado de Telegram.
- Mensaje estructurado con datos relevantes de la urgencia.
- Mantención del registro en Google Sheets.
- Mantención de la respuesta segura al cliente.
- Protección de tokens, claves y datos sensibles mediante credenciales/configuración privada.

### Fuera de alcance por ahora

WhatsApp Business queda fuera del MVP inicial de LAB-013.

Se considera una mejora futura según requerimientos reales de cada clínica, costos, aprobación de Meta, complejidad operacional y necesidad comercial.

### Criterio de éxito

LAB-013 será considerado exitoso cuando una urgencia detectada por el flujo público genere:

- Registro correcto en Google Sheets.
- Aviso activo correcto en Telegram interno.
- Respuesta segura al cliente.
- Sin exposición de información interna, tokens, claves ni datos sensibles.


---

## DA-027 - Interfaz mínima Streamlit para Challenge

**Fecha:** 2026-07-10
**LAB asociado:** LAB-014
**Estado:** Aprobada para implementación

### Contexto

Hasta LAB-013, VetAtiende AI ya cuenta con workflows funcionales en n8n, deploy en OCI, RAG público, RAG interno protegido, agenda con Google Calendar, registros en Google Sheets y aviso activo de urgencias por Telegram interno.

Durante el desarrollo se usó PowerShell para pruebas técnicas de webhooks, validación de respuestas y evidencia operativa. Sin embargo, PowerShell no es un canal adecuado para evaluación del challenge ni para demostración a usuarios no técnicos.

El challenge requiere una solución funcional, documentada y desplegada, pero no exige una aplicación comercial completa. Por lo tanto, se implementará una interfaz mínima web que permita interactuar con Luna desde el navegador.

### Decisión

Se implementará una interfaz mínima con Streamlit para LAB-014.

La interfaz tendrá como prioridad:

1. Modo Cliente externo funcionando completo.
2. Modo Interno protegido simple, solo si no aumenta demasiado la complejidad.

### Arquitectura definida

```text
Usuario / Evaluador
-> Streamlit
-> Modo Cliente o Modo Interno
-> Webhook público o Webhook interno protegido
-> n8n en OCI
-> Luna responde
-> Streamlit muestra la respuesta
```

### Modo Cliente externo

El modo cliente permitirá consultar el flujo público de Luna recepción.

Casos esperados:

- Consulta de horarios.
- Consulta de precios.
- Consulta de servicios.
- Consulta de peluquería.
- Consulta de farmacia y Pet Shop presencial.
- Solicitud de agenda.
- Caso de urgencia con derivación segura y aviso interno.
- Intento de acceso a información interna, que debe ser bloqueado.

### Modo Interno protegido

El modo interno podrá agregarse de forma simple usando una clave interna o campo protegido en Streamlit.

Este modo deberá llamar al Webhook interno protegido existente y no depender de frases como "soy veterinario", "soy recepción" o "modo interno".

Si el modo interno aumenta demasiado la complejidad de LAB-014, se dejará preparado o documentado para una fase posterior, priorizando el modo cliente externo para la entrega del challenge.

### Fuera de alcance LAB-014

- App comercial final.
- Login multiusuario robusto.
- Dashboard administrativo.
- WhatsApp Business.
- Panel interno avanzado.
- Gestión multi-clínica.

### Criterio de éxito

LAB-014 será exitoso cuando un evaluador pueda abrir una interfaz web simple, escribir una pregunta, enviarla al workflow público de n8n en OCI y ver la respuesta de Luna en pantalla, sin usar PowerShell ni herramientas técnicas.

Si se implementa el modo interno, este deberá requerir una clave simple o mecanismo equivalente y llamar al canal interno protegido sin exponer credenciales en el repositorio.

## DA-028 - Agenda separada para peluquería y lavado

Fecha: 2026-07-11

Se define que las solicitudes de peluquería y lavado usarán un Google Calendar separado de la agenda médica.

Calendarios operativos:

- Atención médica: calendario clínico.
- Peluquería y lavado: calendario exclusivo de grooming.

La atención médica no se mezclará con peluquería, lavado, baño o corte.

Reglas iniciales de agenda para peluquería y lavado:

- La primera atención de lunes a viernes podrá comenzar a las 09:00.
- Cada cita bloqueará en Google Calendar la duración estimada real del servicio.
- La siguiente cita podrá comenzar cuando finalice la cita anterior.
- La cantidad de atenciones diarias dependerá de la duración de los servicios reservados.
- No se ofrecerá una cita si su hora de término queda fuera del horario de atención.
- La hora confirmada corresponde al ingreso de la mascota.
- La duración y hora de término son estimadas y pueden variar según tamaño, condición del pelaje y comportamiento de la mascota.
- Antes de agendar, Luna deberá conocer el servicio solicitado y el tamaño de la mascota.
- Las citas confirmadas se registrarán también en Google Sheets, en la pestaña agenda_peluqueria de la planilla VetAtiende AI - Peluquería y Lavado ACTUAL.

Duraciones iniciales de referencia:

- Baño sanitario perro pequeño: 90 minutos.
- Baño sanitario perro mediano: 90 minutos.
- Baño y corte perro pequeño: 120 minutos.
- Baño y corte perro mediano: 120 minutos.
- Si el servicio o tamaño no está definido, Luna deberá solicitar esa información antes de ofrecer disponibilidad.

Flujo definido:

Solicitud de peluquería o lavado
→ detectar servicio y tamaño
→ determinar duración
→ consultar Google Calendar de Peluquería y Lavado
→ ofrecer horarios reales disponibles
→ confirmar selección
→ crear evento en Calendar
→ registrar cita en agenda_peluqueria
→ responder confirmación al cliente.
---

## DA-029 - Demo pública separada y segura LAB-016

**Fecha:** 2026-07-13
**LAB asociado:** LAB-016
**Estado:** Aprobada para diseño e implementación

### Contexto

Hasta LAB-015, VetAtiende AI cuenta con un MVP operativo desplegado, validado y documentado.

La interfaz actual `app/streamlit_app.py` permite utilizar el flujo público y el canal interno protegido, pero se ejecuta localmente. Los compañeros del bootcamp y los evaluadores todavía no pueden conversar con Luna mediante una URL pública.

Publicar directamente la interfaz y los recursos operativos actuales produciría riesgos, porque usuarios externos podrían crear citas reales, escribir en planillas operativas o generar alertas falsas en el canal interno de Telegram.

La demo pública debe permitir evaluar las principales capacidades de VetAtiende AI sin exponer información interna ni producir efectos reales sobre la operación de la clínica.

### Decisión

LAB-016 implementará una demo pública separada y segura, destinada exclusivamente a compañeros del bootcamp, evaluadores y usuarios externos de prueba.

La interfaz pública se desarrollará en:

- `app/streamlit_public_app.py`

Esta aplicación será distinta de `app/streamlit_app.py`.

La aplicación pública no incluirá:

- selector de modo interno;
- formulario de acceso interno;
- claves internas;
- opciones administrativas;
- acceso al RAG interno;
- acceso al webhook interno protegido.

La demo utilizará únicamente una configuración equivalente a:

- `N8N_DEMO_WEBHOOK_URL`

Esta variable deberá apuntar a un webhook exclusivo de demostración y se configurará mediante Secrets en la plataforma de despliegue.

El valor real de la variable no deberá almacenarse en GitHub ni escribirse directamente dentro del código Python.

### Exclusión total del modo interno

La demo pública no deberá utilizar, mostrar ni permitir acceso a:

- `N8N_INTERNAL_WEBHOOK_URL`;
- `VETATIENDE_INTERNAL_KEY`;
- credenciales internas;
- tokens;
- claves privadas;
- identificadores externos;
- direcciones IP operativas visibles;
- documentos internos;
- procedimientos internos;
- RAG interno;
- workflows internos protegidos.

No existirá ninguna navegación, botón, formulario ni ruta desde la aplicación pública hacia el modo interno.

### Separación entre demo y producción

El entorno de demostración deberá quedar aislado de los recursos operativos reales.

Los usuarios de la demo no podrán:

- crear citas en los calendarios operativos reales;
- registrar citas en las planillas operativas reales;
- llenar hojas de solicitudes reales;
- generar alertas en la planilla real de urgencias;
- enviar mensajes al grupo interno real de Telegram;
- consultar información interna;
- acceder al canal interno protegido.

La demo utilizará un webhook distinto del webhook público de producción.

Antes de construir ese webhook se deberá revisar y documentar cuál estrategia técnica se utilizará:

1. workflow demo completamente separado;
2. rama demo aislada dentro de otro workflow;
3. Google Calendar y Google Sheets exclusivos para demostración;
4. simulación controlada de las acciones con efectos externos.

La opción preferida inicialmente es crear un workflow demo separado.

Esta alternativa reduce el riesgo de modificar producción, facilita las pruebas y permite activar o desactivar la demo sin afectar el MVP operativo.

La estrategia definitiva deberá ser revisada y aprobada antes de modificar n8n.

### Arquitectura prevista

    Usuario público
    → Streamlit Community Cloud
    → app/streamlit_public_app.py
    → webhook exclusivo de demostración
    → reglas públicas y RAG público
    → agenda simulada o recursos exclusivos de demostración
    → orientación segura de urgencias sin Telegram real
    → respuesta de Luna

El flujo interno continuará completamente separado:

    Personal autorizado
    → interfaz local o canal privado
    → webhook interno protegido
    → RAG interno

No existirá conexión desde la aplicación pública hacia el flujo interno.

### Contenido mínimo de la interfaz pública

La pantalla deberá mostrar:

- nombre VetAtiende AI;
- subtítulo de asistente virtual para clínicas veterinarias;
- explicación breve del propósito de Luna;
- lista de capacidades disponibles;
- preguntas sugeridas o botones de ejemplo;
- historial de conversación durante la sesión;
- opción para limpiar la conversación;
- advertencia visible sobre los límites de la demo.

Descripción base:

> Luna ayuda a clientes de una clínica veterinaria a consultar servicios y precios, solicitar horas médicas o de peluquería y recibir orientación segura ante posibles urgencias.

La pantalla deberá indicar que el usuario puede:

- consultar servicios, precios y horarios;
- solicitar una hora veterinaria;
- consultar peluquería y lavado;
- recibir orientación segura ante una posible urgencia.

Preguntas sugeridas:

- ¿Cuánto cuesta una consulta general?
- Quiero agendar una consulta para mi perro mañana.
- ¿Tienen horas para peluquería esta semana?
- Mi perro tiene dificultad para respirar.

Advertencia base:

> Esta es una demo académica. Luna no realiza diagnósticos ni reemplaza la atención de un veterinario.

### Seguridad de urgencias

La demo deberá continuar detectando mensajes que describan posibles urgencias y entregar orientación segura.

Sin embargo, la demo:

- no enviará mensajes al Telegram interno real;
- no registrará alertas en la planilla operativa real;
- no se presentará como un canal atendido en tiempo real;
- no entregará diagnósticos;
- no indicará tratamientos;
- recomendará contactar inmediatamente a un centro veterinario cuando corresponda.

### Despliegue previsto

La opción preferida para publicar la interfaz será Streamlit Community Cloud, conectada al repositorio público de GitHub.

La configuración privada deberá realizarse mediante Streamlit Secrets.

No se deberá:

- subir archivos `.env`;
- escribir secretos directamente en Python;
- guardar credenciales en el repositorio;
- mostrar la URL real del webhook en la interfaz;
- imprimir secretos en pantalla o registros;
- reutilizar las credenciales del modo interno;
- exponer direcciones IP públicas operativas.

### Criterios de validación

LAB-016 solo podrá considerarse validado cuando:

- exista una URL pública funcional;
- la pantalla explique claramente qué es VetAtiende AI;
- Luna responda consultas públicas;
- la conversación se mantenga durante la sesión;
- las preguntas sugeridas funcionen;
- no exista acceso visible al modo interno;
- no exista conexión técnica con el webhook interno;
- no se creen citas reales;
- no se modifiquen planillas operativas reales;
- no se envíen alertas reales por Telegram;
- no se expongan claves, tokens, credenciales, IP ni identificadores privados;
- el repositorio continúe sin archivos `.env`;
- la demo pueda desactivarse sin afectar producción;
- las pruebas queden documentadas antes del commit final.

### Fuera de alcance de LAB-016

- convertir Streamlit en la aplicación comercial definitiva;
- publicar el canal interno;
- implementar usuarios y roles empresariales;
- atender urgencias reales desde la demo;
- conectar WhatsApp Business;
- reemplazar la infraestructura operativa actual;
- modificar producción antes de validar el aislamiento de la demo.

---

## DA-030 - Workflow demo separado y acciones simuladas LAB-016

**Fecha:** 2026-07-13
**LAB asociado:** LAB-016
**Estado:** Aprobada para implementación

### Contexto

DA-029 estableció que VetAtiende AI necesita una demo pública separada y segura para que compañeros del bootcamp y evaluadores puedan conversar con Luna desde una URL pública.

Después de revisar `app/streamlit_app.py`, se confirmó que la aplicación actual contiene tanto el modo cliente externo como el modo interno protegido.

También se confirmó que el workflow público operativo puede:

- crear eventos reales en Google Calendar;
- registrar información en Google Sheets;
- enviar alertas reales al canal interno de Telegram;
- utilizar recursos y credenciales del entorno operativo.

Publicar directamente esos componentes produciría un riesgo innecesario para producción.

### Decisión técnica definitiva

LAB-016 utilizará una aplicación Streamlit pública independiente y un workflow n8n de demostración completamente separado del workflow operativo.

La arquitectura aprobada será:

    Usuario público
    → Streamlit Community Cloud
    → app/streamlit_public_app.py
    → webhook exclusivo de demostración
    → workflow n8n demo separado
    → reglas públicas y RAG público
    → agenda médica simulada
    → agenda de peluquería simulada
    → orientación segura de urgencias
    → respuesta de Luna

El workflow demo no tendrá conexiones hacia los recursos operativos reales.

### Aplicación Streamlit pública

La demo utilizará:

- `app/streamlit_public_app.py`

Esta aplicación será independiente de `app/streamlit_app.py`.

No importará ni reutilizará directamente la lógica del modo interno existente.

La aplicación pública:

- mostrará solamente funciones para clientes externos;
- mantendrá la conversación mediante `st.session_state`;
- enviará contexto conversacional al webhook demo;
- incluirá preguntas sugeridas;
- permitirá limpiar la conversación;
- mostrará los límites de la demo;
- leerá configuración desde Streamlit Secrets o variables de entorno locales;
- no mostrará errores técnicos completos al usuario.

La única variable de conexión prevista será:

- `N8N_DEMO_WEBHOOK_URL`

En la demo pública, esta variable apuntará exclusivamente al webhook de demostración.

### Workflow n8n de demostración

Se creará un workflow separado del workflow público operativo.

El workflow demo podrá reutilizar conceptualmente:

- detección de intención pública;
- reglas de seguridad veterinaria;
- RAG público;
- extracción de datos de agenda;
- continuidad conversacional;
- generación de alternativas;
- formato de respuestas de Luna.

No reutilizará conexiones hacia:

- Google Calendar operativo;
- Google Sheets operativo;
- Telegram interno;
- webhook interno protegido;
- RAG interno;
- procedimientos internos.

El workflow demo deberá poder activarse, desactivarse o eliminarse sin afectar producción.

### Agenda médica simulada

La demo permitirá probar una conversación completa de agenda médica.

Luna podrá:

- solicitar tutor, mascota y teléfono;
- recuperar datos desde el contexto;
- interpretar fecha y hora;
- ofrecer alternativas de demostración;
- permitir seleccionar una alternativa;
- entregar una confirmación simulada.

La confirmación deberá indicar claramente que:

- corresponde a una simulación;
- no crea una reserva real;
- no bloquea horarios en la clínica;
- no registra información en Calendar ni Sheets.

No se utilizará Google Calendar de producción ni un calendario real de demostración durante LAB-016.

### Peluquería y lavado simulados

La demo permitirá consultar y solicitar horas para peluquería o lavado.

Luna podrá:

- reconocer la intención;
- solicitar los datos necesarios;
- ofrecer alternativas simuladas;
- responder con una confirmación de demostración.

No se crearán eventos reales ni registros en las planillas operativas.

### Urgencias en modo demostración

El workflow demo conservará las reglas de detección y orientación segura ante posibles urgencias.

Luna deberá:

- advertir cuando el mensaje describa una posible urgencia;
- recomendar atención veterinaria inmediata;
- evitar diagnósticos;
- evitar tratamientos específicos;
- aclarar que la demo no es un canal monitoreado en tiempo real.

La demo no deberá:

- enviar mensajes a Telegram;
- registrar alertas en Google Sheets;
- afirmar que personal de la clínica fue notificado;
- simular una derivación humana real.

### RAG público

La demo podrá utilizar exclusivamente la documentación pública autorizada.

Podrá responder sobre:

- servicios;
- precios;
- horarios;
- preguntas frecuentes;
- orientación pública y segura.

No tendrá acceso a:

- manuales internos;
- protocolos privados;
- información de stock interno;
- procedimientos operativos;
- RAG interno.

### Separación de credenciales

Las credenciales de producción no deberán incorporarse al workflow demo salvo aquellas estrictamente necesarias para ejecutar el RAG público y el modelo de lenguaje dentro del entorno privado de n8n.

La aplicación Streamlit pública no conocerá ni recibirá:

- credenciales de n8n;
- credenciales de Google;
- tokens de Telegram;
- claves del modo interno;
- identificadores de Calendar o Sheets;
- direcciones IP visibles;
- información operativa privada.

La URL del webhook demo se configurará mediante Streamlit Secrets y no se almacenará en el repositorio.

### Razones de la decisión

Se descarta agregar una rama demo dentro del workflow operativo porque una conexión o condición incorrecta podría ejecutar acciones reales.

Se descarta utilizar Calendar y Sheets exclusivos para demostración durante LAB-016 porque:

- agregaría credenciales y configuración innecesarias;
- aumentaría el tiempo de implementación;
- agregaría nuevos puntos de falla;
- no aportaría una diferencia relevante para la evaluación académica.

La simulación controlada permite demostrar el comportamiento completo sin producir efectos externos.

### Criterios técnicos de validación

La decisión se considerará correctamente implementada cuando:

- exista una aplicación pública independiente;
- exista un webhook exclusivo de demostración;
- exista un workflow demo separado;
- el workflow demo no tenga nodos conectados a Calendar operativo;
- el workflow demo no tenga nodos conectados a Sheets operativo;
- el workflow demo no tenga nodos conectados a Telegram;
- no exista acceso al webhook interno;
- no exista acceso al RAG interno;
- las citas médicas se confirmen como simuladas;
- las citas de peluquería se confirmen como simuladas;
- las urgencias entreguen orientación segura sin alertas externas;
- el historial se conserve durante la sesión;
- la demo pueda desactivarse sin afectar producción;
- no se expongan secretos ni identificadores privados.

### Impacto

Esta decisión prioriza seguridad, aislamiento y facilidad de validación.

La demo pública mostrará las capacidades funcionales de VetAtiende AI sin convertirse en un segundo entorno operativo ni generar información falsa dentro de la clínica.