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
