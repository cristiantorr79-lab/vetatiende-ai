# Plan de implementación de controles — LAB-018

**Proyecto:** VetAtiende AI  
**Rama:** `mvp-comercial`  
**Estado:** Versión inicial completada  
**Ámbito:** Preparación del primer piloto comercial

## Objetivo

Organizar los controles pendientes de LAB-018 en una secuencia práctica de implementación y validación antes de utilizar datos personales reales.

## Regla de trabajo

Cada control deberá avanzar mediante las siguientes etapas:

1. definición;
2. implementación;
3. prueba con datos ficticios;
4. generación de evidencia;
5. actualización de la matriz a `Validado`.

Ningún control deberá considerarse validado solo por estar documentado o configurado parcialmente.

## Fase 1 — Cierre de definiciones jurídicas y contractuales

**Objetivo:** resolver las decisiones documentales que bloquean el diseño definitivo del piloto.

| Orden | Control relacionado | Acción | Resultado esperado |
|---|---|---|---|
| 1 | PRI-005 | Definir plazos específicos de retención por categoría de datos | Matriz de retención aprobada |
| 2 | CON-004 | Completar la revisión individual de proveedores seleccionados | Proveedores aprobados, condicionados o rechazados |
| 3 | CON-006 | Confirmar ubicaciones de tratamiento y condiciones aplicables | Transferencias documentadas y evaluadas |
| 4 | CON-001 | Adaptar la base contractual a la clínica piloto | Versión contractual lista para revisión profesional |
| 5 | CON-002 | Definir las instrucciones de tratamiento de la clínica | Anexo con finalidades, datos y operaciones |
| 6 | PRI-003 | Definir el canal operativo para ejercer derechos | Canal, responsables y registro establecidos |
| 7 | INC-001 | Asignar contactos reales para incidentes | Responsables y medios de contacto documentados |

### Condición de salida

La fase se considerará completada cuando las decisiones pendientes estén documentadas con datos concretos del piloto y no queden proveedores o tratamientos críticos sin evaluar.

La documentación contractual y de privacidad deberá recibir revisión profesional antes de su firma o publicación definitiva.

## Fase 2 — Infraestructura y seguridad del entorno comercial

**Objetivo:** crear un entorno separado de la demo académica y aplicar los controles técnicos mínimos antes de conectar datos reales.

| Orden | Control relacionado | Acción | Resultado esperado |
|---|---|---|---|
| 1 | SEG-004 | Crear recursos separados para prueba y producción comercial | Entornos independientes de la demo académica |
| 2 | SEG-001 | Configurar HTTPS en la interfaz y webhooks comerciales | Comunicaciones cifradas y certificado válido |
| 3 | SEG-003 | Centralizar secretos y eliminar credenciales del código | Secretos almacenados de forma segura |
| 4 | SEG-002 | Implementar autenticación para accesos internos | Accesos restringidos a cuentas autorizadas |
| 5 | SEG-009 | Definir permisos mínimos según función | Matriz de accesos aplicada |
| 6 | SEG-006 | Configurar registros técnicos y trazabilidad | Accesos, ejecuciones y cambios identificables |
| 7 | SEG-008 | Definir actualización de sistema y dependencias | Procedimiento periódico de mantenimiento |
| 8 | OPE-009 | Documentar el mecanismo para detener automatizaciones | Procedimiento de suspensión disponible y probado |

### Condición de salida

La fase se considerará completada cuando el entorno comercial sea independiente, utilice HTTPS, proteja sus credenciales, restrinja los accesos internos y permita suspender sus automatizaciones de forma controlada.

Todos los controles deberán probarse inicialmente con datos ficticios.

## Fase 3 — Aislamiento y ciclo de vida de los datos

**Objetivo:** impedir accesos cruzados entre clínicas y controlar la información desde su recopilación hasta su eliminación.

| Orden | Control relacionado | Acción | Resultado esperado |
|---|---|---|---|
| 1 | SEG-005 | Implementar separación física o lógica entre clínicas | Ninguna clínica puede acceder a datos de otra |
| 2 | OPE-006 | Minimizar datos enviados a modelos de IA y proveedores | Solo se transmite información necesaria |
| 3 | GOV-002 | Aplicar la clasificación de datos en sistemas y procedimientos | Reglas de manejo asociadas a cada categoría |
| 4 | PRI-006 | Implementar eliminación en sistemas activos | Datos eliminados o anonimizados según su finalidad |
| 5 | PRI-006 | Incorporar respaldos y exportaciones al proceso de eliminación | Eliminación verificable en todas las copias controladas |
| 6 | PRI-007 | Crear procedimiento de devolución o eliminación al finalizar el servicio | Salida contractual y técnica controlada |
| 7 | CON-007 | Definir el procedimiento de cambio de proveedor | Migración segura sin pérdida ni exposición de datos |
| 8 | SEG-007 | Configurar respaldos y ejecutar una restauración de prueba | Recuperación comprobada con datos ficticios |

### Condición de salida

La fase se considerará completada cuando el aislamiento entre clínicas haya sido probado, la minimización pueda verificarse y existan procedimientos funcionales de respaldo, restauración, devolución y eliminación.

Las pruebas deberán confirmar que los datos de una clínica no aparecen en consultas, registros, archivos, calendarios o respaldos pertenecientes a otra.

## Fase 4 — Incidentes, continuidad y validación operativa

**Objetivo:** comprobar que VetAtiende AI puede responder ante fallas, incidentes y errores operativos sin exponer datos ni perder el control del servicio.

| Orden | Control relacionado | Acción | Resultado esperado |
|---|---|---|---|
| 1 | INC-002 | Definir y probar el canal interno de reporte de incidentes | Canal disponible y responsables identificados |
| 2 | INC-003 | Crear el registro único de incidentes | Formato operativo con trazabilidad |
| 3 | INC-005 | Ejecutar una prueba de revocación de credenciales | Acceso comprometido bloqueado de forma controlada |
| 4 | INC-007 | Implementar protección de evidencia técnica | Registros preservados y acceso restringido |
| 5 | INC-008 | Ejecutar recuperación segura del servicio | Restauración comprobada con datos ficticios |
| 6 | INC-009 | Realizar una simulación completa de incidente | Flujo de detección, contención, comunicación y cierre validado |
| 7 | OPE-003 | Validar la derivación de urgencias veterinarias | Alertas recibidas por personal autorizado |
| 8 | OPE-004 | Confirmar supervisión humana de operaciones sensibles | Responsables y tiempos de respuesta definidos |
| 9 | OPE-008 | Crear registro y revisión de errores de IA | Errores documentados y acciones correctivas asignadas |

### Condición de salida

La fase se considerará completada cuando exista evidencia de una simulación completa, una recuperación funcional y una respuesta humana comprobada ante urgencias y operaciones sensibles.

Ninguna prueba deberá utilizar datos reales ni generar alertas hacia canales operativos no controlados.

## Fase 5 — Validación final y autorización del piloto

**Objetivo:** comprobar que los controles críticos funcionan en conjunto y decidir formalmente si el primer piloto puede utilizar datos reales.

| Orden | Control relacionado | Acción | Resultado esperado |
|---|---|---|---|
| 1 | GOV-001 | Revisar el mapa de datos contra la arquitectura implementada | Flujos y sistemas actualizados |
| 2 | GOV-006 | Comprobar la separación entre demo, pruebas y producción | Recursos académicos y comerciales aislados |
| 3 | PRI-001 | Publicar la información de privacidad adaptada a la clínica | Aviso accesible y coherente con el tratamiento real |
| 4 | OPE-001 | Incorporar identificación visible del asistente virtual | Usuarios informados de que interactúan con Luna |
| 5 | OPE-002 | Validar límites clínicos y respuestas seguras | Sin diagnósticos, tratamientos ni prescripciones |
| 6 | OPE-005 | Probar agenda comercial y disponibilidad real | Citas confirmadas solo tras validar disponibilidad |
| 7 | OPE-007 | Ejecutar el conjunto completo de pruebas comerciales | Evidencias obtenidas con datos ficticios |
| 8 | CON-003 | Confirmar confidencialidad y capacitación del personal | Personas autorizadas informadas de sus obligaciones |
| 9 | INC-006 | Probar la comunicación de incidentes a la clínica | Contactos y mensajes operativos comprobados |
| 10 | MATRIZ | Revisar todos los controles críticos | Sin controles críticos pendientes o bloqueados |

### Condición de autorización

El piloto con datos reales solo podrá autorizarse cuando:

- no existan controles críticos en estado `Pendiente` o `Bloqueado`;
- las pruebas técnicas y operativas cuenten con evidencia;
- la clínica haya aceptado las condiciones contractuales;
- los proveedores necesarios hayan sido evaluados;
- la política de privacidad refleje el tratamiento implementado;
- exista una aprobación formal registrada.

Si alguna condición no se cumple, el piloto deberá continuar exclusivamente con datos ficticios.

