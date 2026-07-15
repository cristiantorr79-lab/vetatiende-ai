# Política de retención y eliminación — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** MVP comercial

Este documento define cuánto tiempo se conservarán los datos y cómo deberán eliminarse o anonimizarse cuando dejen de ser necesarios.

## 1. Principios de retención

La conservación de datos en VetAtiende AI se regirá por los siguientes principios:

- no conservar datos personales de manera indefinida;
- mantenerlos solo mientras sean necesarios para la finalidad informada;
- definir un plazo para cada categoría de datos;
- eliminar o anonimizar la información cuando termine su finalidad;
- conservar por más tiempo únicamente cuando exista una obligación legal o contractual válida;
- aplicar también la eliminación a copias operativas y respaldos cuando corresponda;
- documentar toda excepción al plazo definido.

## 2. Categorías sujetas a retención

La política deberá establecer plazos diferenciados para las siguientes categorías:

- mensajes y conversaciones con Luna;
- solicitudes y citas veterinarias;
- citas de peluquería y lavado;
- registros y alertas de urgencia;
- datos de tutores y mascotas asociados a una atención;
- registros de acceso, errores y seguridad;
- solicitudes de ejercicio de derechos;
- respaldos y copias de recuperación;
- datos contractuales, comerciales y de soporte de las clínicas.

Cada categoría tendrá una finalidad, un responsable, un plazo y una acción final definida.

## 3. Criterios para definir los plazos

El plazo de cada categoría deberá evaluarse considerando:

- la finalidad concreta del dato;
- si la atención o solicitud ya terminó;
- las necesidades operativas de la clínica;
- las obligaciones legales o contractuales aplicables;
- el riesgo para el titular si el dato se conserva demasiado tiempo;
- la posibilidad de anonimizar la información;
- los tiempos de respaldo y recuperación;
- las solicitudes de supresión o bloqueo;
- la necesidad de conservar evidencia ante incidentes o reclamos.

La conveniencia técnica o el bajo costo de almacenamiento no serán razones suficientes para conservar datos personales.

## 4. Matriz inicial de retención

Los siguientes plazos constituyen una propuesta operativa inicial. Deberán validarse jurídicamente y adaptarse a las finalidades y obligaciones de la clínica piloto antes de utilizar datos reales.

| Categoría | Plazo operativo propuesto | Acción final | Estado |
|---|---|---|---|
| Conversaciones generales con Luna | 90 días desde la última interacción | Eliminar o anonimizar | Propuesta para validación |
| Solicitudes de cita no confirmadas | 90 días desde su cierre o abandono | Eliminar | Propuesta para validación |
| Citas confirmadas o canceladas | 12 meses desde la atención o cancelación | Eliminar o anonimizar | Propuesta para validación |
| Alertas de urgencia | 12 meses desde el cierre de la alerta | Eliminar datos personales y conservar solo estadísticas anónimas | Propuesta para validación |
| Registros técnicos sin incidentes | 90 días desde su generación | Eliminación automática | Propuesta para validación |
| Registros asociados a incidentes | 24 meses desde el cierre del incidente | Eliminar o anonimizar | Propuesta para validación |
| Solicitudes de derechos | 24 meses desde el cierre de la solicitud | Eliminar o conservar evidencia mínima anonimizada | Propuesta para validación |
| Respaldos operativos | Ciclo rotativo máximo de 30 días | Sobrescritura o eliminación segura | Propuesta para validación |
| Contactos comerciales sin contrato | 12 meses desde el último contacto | Eliminar o anonimizar | Propuesta para validación |
| Contratos y evidencia del servicio | Vigencia del contrato más 5 años | Eliminación segura, salvo obligación vigente | Propuesta sujeta a revisión jurídica |
| Documentos tributarios y contables | 6 años o el plazo mayor que corresponda legalmente | Eliminación segura | Validar según el tipo de documento |

Cuando un registro pertenezca a más de una categoría, se aplicará el plazo mayor que tenga una justificación vigente y documentada.

Una solicitud de supresión podrá anticipar la eliminación, salvo que exista una obligación legal, contractual, judicial o de seguridad que justifique conservar temporalmente la información.

Los plazos deberán aprobarse antes del primer piloto y revisarse cuando cambien las finalidades, proveedores o requisitos legales.

## 5. Métodos de eliminación

La eliminación deberá aplicarse de forma verificable en todos los sistemas donde se encuentre la información.

Las acciones podrán incluir:

- eliminación directa del registro;
- anonimización irreversible;
- eliminación de archivos y documentos asociados;
- revocación de accesos y credenciales;
- eliminación programada de registros técnicos;
- sobrescritura automática de respaldos vencidos;
- solicitud de eliminación a proveedores cuando corresponda.

No se considerará eliminada una información si continúa disponible en otro sistema operativo sin justificación.

## 6. Respaldos y copias de recuperación

Los respaldos deberán tener un ciclo de conservación definido y no podrán mantenerse indefinidamente.

Reglas obligatorias:

- definir la frecuencia y duración de los respaldos;
- protegerlos con controles de acceso y cifrado;
- impedir su uso como base operativa permanente;
- sobrescribir o eliminar los respaldos vencidos;
- registrar las restauraciones realizadas;
- evitar restaurar datos que ya fueron eliminados legítimamente;
- aplicar nuevamente las eliminaciones pendientes después de una recuperación.

## 7. Término del servicio con una clínica

Al finalizar el contrato, VetAtiende AI deberá ejecutar un proceso controlado de cierre.

Este proceso deberá incluir:

- bloquear nuevos tratamientos de datos;
- revocar accesos de usuarios de la clínica;
- exportar o devolver la información acordada;
- eliminar los datos operativos cuando corresponda;
- solicitar eliminación a los proveedores involucrados;
- gestionar los respaldos según su ciclo definido;
- conservar únicamente la información exigida por obligaciones legales o contractuales;
- dejar evidencia del cierre y de las acciones ejecutadas.

## 8. Control y revisión

La política de retención deberá revisarse antes del primer piloto y posteriormente de forma periódica.

La revisión deberá comprobar:

- que cada categoría tenga un plazo definido;
- que las eliminaciones automáticas funcionen;
- que no existan datos conservados sin finalidad;
- que los proveedores respeten los plazos acordados;
- que los respaldos vencidos sean eliminados;
- que las excepciones estén justificadas y documentadas;
- que los cambios legales o técnicos hayan sido incorporados.

Toda modificación deberá registrar su fecha, responsable y motivo.



