# Matriz de preparación para el primer piloto — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** MVP comercial

## Objetivo

Registrar qué requisitos de privacidad, seguridad, contratos y operación están documentados, cuáles fueron implementados y cuáles siguen bloqueando el uso de datos reales.

## Estados permitidos

- **Pendiente:** todavía no iniciado.
- **Documentado:** existe una definición, política o procedimiento.
- **En implementación:** el control se está configurando o desarrollando.
- **Validado:** existe evidencia de que el control funciona.
- **Bloqueado:** depende de una decisión, proveedor o recurso externo.

## Regla de aprobación

El primer piloto con datos reales solo podrá comenzar cuando todos los requisitos críticos estén validados o exista una excepción formal, justificada y aceptada por la clínica.

## 1. Gobernanza y documentación

| ID | Requisito | Criticidad | Estado | Evidencia | Pendiente |
|---|---|---|---|---|---|
| GOV-001 | Inventario y mapa de datos personales | Crítica | Documentado | `inventario_mapa_datos.md` | Validar contra la arquitectura comercial definitiva |
| GOV-002 | Clasificación de datos y reglas de manejo | Crítica | Documentado | `clasificacion_datos.md` | Incorporar clasificación en sistemas y procedimientos |
| GOV-003 | Política inicial de privacidad | Crítica | Documentado | `politica_privacidad_inicial.md` | Revisión jurídica y adaptación para la clínica piloto |
| GOV-004 | Roles de responsable, encargado y subencargados | Crítica | Documentado | `roles_responsabilidades.md` | Confirmar el modelo contractual con la clínica |
| GOV-005 | Decisiones de arquitectura comercial | Alta | Documentado | `../decisiones_arquitectura_comercial.md` | Mantener actualización ante nuevos cambios |
| GOV-006 | Regla de separación entre entornos | Crítica | Documentado | `reglas_entornos.md` | Comprobar técnicamente la separación |

## 2. Derechos, privacidad y ciclo de vida

| ID | Requisito | Criticidad | Estado | Evidencia | Pendiente |
|---|---|---|---|---|---|
| PRI-001 | Información de privacidad para tutores y usuarios | Crítica | Documentado | `politica_privacidad_inicial.md` | Preparar versión visible adaptada a la clínica piloto |
| PRI-002 | Bases de licitud identificadas por finalidad | Crítica | Documentado | `politica_privacidad_inicial.md` | Validación jurídica antes del piloto |
| PRI-003 | Procedimiento para solicitudes de derechos | Crítica | Documentado | `procedimiento_derechos.md` | Definir canal, responsables y registro operativo |
| PRI-004 | Verificación de identidad del solicitante | Alta | Documentado | `procedimiento_derechos.md` | Implementar método proporcional y seguro |
| PRI-005 | Política de retención y eliminación | Crítica | Documentado | `politica_retencion_eliminacion.md` | Validar jurídicamente y aprobar los plazos operativos propuestos |
| PRI-006 | Eliminación en sistemas y respaldos | Crítica | Pendiente | `politica_retencion_eliminacion.md` | Diseñar, implementar y probar el procedimiento técnico |
| PRI-007 | Devolución o eliminación al terminar el contrato | Alta | Documentado | `base_contractual_responsable_encargado.md` | Incorporar cláusula definitiva y procedimiento técnico |

## 3. Contratos, proveedores y transferencias

| ID | Requisito | Criticidad | Estado | Evidencia | Pendiente |
|---|---|---|---|---|---|
| CON-001 | Contrato entre clínica responsable y VetAtiende AI encargado | Crítica | Documentado | `base_contractual_responsable_encargado.md` | Revisión jurídica y adaptación para la clínica piloto |
| CON-002 | Instrucciones documentadas de tratamiento | Crítica | Documentado | `anexo_instrucciones_tratamiento.md` | Completar con los datos de la clínica piloto y obtener su aprobación |
| CON-003 | Confidencialidad y deberes del personal autorizado | Crítica | Documentado | `roles_responsabilidades.md` | Formalizar compromisos y capacitación |
| CON-004 | Revisión individual de proveedores | Crítica | Documentado | `revision_proveedores.md` | Confirmar contratos, cuentas y configuraciones reales antes del piloto |
| CON-005 | Identificación y autorización de subencargados | Crítica | Documentado | `revision_proveedores.md` | Confirmar lista definitiva antes del piloto |
| CON-006 | Transferencias o tratamiento fuera de Chile | Crítica | Documentado | `registro_transferencias_internacionales.md` | Confirmar contratos, cuentas y configuraciones reales antes del piloto |
| CON-007 | Procedimiento ante cambio de proveedor | Alta | Pendiente | `revision_proveedores.md` | Definir migración, devolución y eliminación segura |

## 4. Seguridad técnica y control de acceso

| ID | Requisito | Criticidad | Estado | Evidencia | Pendiente |
|---|---|---|---|---|---|
| SEG-001 | HTTPS para todos los accesos comerciales | Crítica | Pendiente | `controles_tecnicos_organizativos.md` | Configurar certificado y validar comunicaciones cifradas |
| SEG-002 | Autenticación para accesos internos | Crítica | En implementación | `controles_tecnicos_organizativos.md` | Definir cuentas individuales y comprobar restricciones |
| SEG-003 | Gestión segura de secretos y credenciales | Crítica | En implementación | `controles_tecnicos_organizativos.md` | Eliminar secretos expuestos y validar almacenamiento seguro |
| SEG-004 | Separación técnica entre demo, prueba y producción | Crítica | Pendiente | `reglas_entornos.md` | Crear y comprobar recursos comerciales independientes |
| SEG-005 | Aislamiento de datos entre clínicas | Crítica | Pendiente | `../decisiones_arquitectura_comercial.md` | Diseñar y probar separación física o lógica |
| SEG-006 | Registros de acceso, ejecución y cambios | Alta | Pendiente | `controles_tecnicos_organizativos.md` | Configurar trazabilidad sin datos personales innecesarios |
| SEG-007 | Respaldos y restauración comprobada | Crítica | Pendiente | `controles_tecnicos_organizativos.md` | Definir frecuencia y ejecutar prueba de recuperación |
| SEG-008 | Actualizaciones y gestión de vulnerabilidades | Alta | Pendiente | `controles_tecnicos_organizativos.md` | Definir revisión periódica de n8n, sistema y dependencias |
| SEG-009 | Acceso mínimo según función | Crítica | Pendiente | `roles_responsabilidades.md` | Crear matriz de permisos y validar accesos |

## 5. Incidentes, continuidad y recuperación

| ID | Requisito | Criticidad | Estado | Evidencia | Pendiente |
|---|---|---|---|---|---|
| INC-001 | Plan documentado de respuesta ante incidentes | Crítica | Documentado | `plan_respuesta_incidentes.md` | Asignar contactos y responsables reales |
| INC-002 | Canal interno para reportar incidentes | Crítica | Pendiente | `plan_respuesta_incidentes.md` | Definir canal y probar su disponibilidad |
| INC-003 | Registro único de incidentes | Alta | Pendiente | `plan_respuesta_incidentes.md` | Crear formato o sistema de registro |
| INC-004 | Clasificación de severidad | Alta | Documentado | `plan_respuesta_incidentes.md` | Validar criterios mediante una simulación |
| INC-005 | Contención y revocación de credenciales | Crítica | Pendiente | `plan_respuesta_incidentes.md` | Ejecutar prueba controlada de revocación |
| INC-006 | Comunicación oportuna a la clínica | Crítica | Documentado | `plan_respuesta_incidentes.md` | Definir contactos, canal y plantilla operativa |
| INC-007 | Preservación de evidencia técnica | Alta | Documentado | `plan_respuesta_incidentes.md` | Implementar almacenamiento protegido |
| INC-008 | Recuperación segura del servicio | Crítica | Pendiente | `plan_respuesta_incidentes.md` | Ejecutar prueba de restauración y validación |
| INC-009 | Simulación completa de incidente | Crítica | Pendiente | `plan_respuesta_incidentes.md` | Realizar simulación antes del primer piloto |

## 6. Operación, inteligencia artificial y supervisión humana

| ID | Requisito | Criticidad | Estado | Evidencia | Pendiente |
|---|---|---|---|---|---|
| OPE-001 | Identificación clara del asistente virtual | Alta | Documentado | `politica_privacidad_inicial.md` | Incorporar aviso visible en la interfaz comercial |
| OPE-002 | Prohibición de diagnósticos y tratamientos automatizados | Crítica | Documentado | `../decisiones_arquitectura_comercial.md` | Validar prompts y respuestas del entorno comercial |
| OPE-003 | Derivación segura de urgencias veterinarias | Crítica | En implementación | `../decisiones_arquitectura_comercial.md` | Probar reglas y canal interno del piloto |
| OPE-004 | Supervisión humana de alertas y operaciones sensibles | Crítica | Documentado | `roles_responsabilidades.md` | Definir responsables y tiempos de respuesta |
| OPE-005 | Validación de disponibilidad antes de confirmar citas | Alta | En implementación | `../decisiones_arquitectura_comercial.md` | Validar agenda comercial separada |
| OPE-006 | Minimización de datos enviados a modelos de IA | Crítica | Documentado | `../decisiones_arquitectura_comercial.md` | Inspeccionar entradas reales de cada workflow |
| OPE-007 | Pruebas con datos ficticios antes de producción | Crítica | Documentado | `reglas_entornos.md` | Crear conjunto de pruebas comerciales |
| OPE-008 | Registro y revisión de errores relevantes de IA | Alta | Pendiente | `controles_tecnicos_organizativos.md` | Definir registro, revisión y acciones correctivas |
| OPE-009 | Capacidad de suspender automatizaciones | Crítica | Pendiente | `plan_respuesta_incidentes.md` | Documentar y probar procedimiento de detención |

## 7. Resultado de preparación actual

**Resultado:** No aprobado todavía para utilizar datos reales.

La existencia de políticas y procedimientos documentados no significa que los controles técnicos, contractuales y operativos estén validados.

### Bloqueos principales

- configurar HTTPS en el entorno comercial;
- crear recursos separados de la demo académica;
- confirmar proveedores, ubicaciones y transferencias de datos;
- definir plazos específicos de retención;
- completar y revisar el contrato con la clínica piloto;
- implementar el canal operativo para solicitudes de derechos;
- validar autenticación, permisos y gestión de secretos;
- comprobar respaldos y restauración;
- probar aislamiento entre clínicas;
- realizar una simulación completa de incidente.

Los estados de esta matriz solo deberán cambiar a **Validado** cuando exista evidencia verificable de implementación y prueba.






