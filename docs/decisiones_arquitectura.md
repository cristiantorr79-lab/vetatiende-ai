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
