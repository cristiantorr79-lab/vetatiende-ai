# Clasificación de datos — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** MVP comercial

Este documento clasifica la información tratada por VetAtiende AI según su naturaleza, nivel de confidencialidad y riesgo asociado.

## 1. Niveles de clasificación

| Nivel | Descripción | Ejemplos |
|---|---|---|
| Público | Información que puede mostrarse sin riesgo a clientes o visitantes | Horarios, servicios y precios públicos |
| Interno | Información operativa accesible solo para personal autorizado | Protocolos internos y configuración de agenda |
| Confidencial | Datos personales o comerciales que requieren acceso controlado | Nombre, teléfono, citas y datos de la clínica |
| Restringido | Información cuyo acceso indebido puede causar un daño importante | Credenciales, claves, alertas de urgencia y registros de seguridad |

## 2. Clasificación de datos del tutor

| Dato | Tipo de dato | Nivel | Riesgo principal |
|---|---|---|---|
| Nombre del tutor | Dato personal | Confidencial | Identificación y exposición indebida |
| Teléfono | Dato personal de contacto | Confidencial | Contacto no autorizado, fraude o suplantación |
| Mensaje enviado | Dato personal potencial | Confidencial | Puede contener información privada no solicitada |

## 3. Clasificación de datos de la mascota

| Dato | Tipo de dato | Nivel | Riesgo principal |
|---|---|---|---|
| Nombre de la mascota | Dato operativo vinculado al tutor | Confidencial | Permite relacionar atenciones con una persona identificada |
| Tipo de mascota | Dato operativo vinculado al tutor | Confidencial | Puede revelar información asociada a una atención concreta |
| Tamaño de la mascota | Dato operativo vinculado al tutor | Confidencial | Exposición de antecedentes de una cita o servicio |
| Situación reportada | Dato operativo potencialmente delicado | Restringido | Puede incluir detalles de urgencia y datos personales escritos libremente |

## 4. Clasificación de datos de agenda y operación

| Dato | Tipo de dato | Nivel | Riesgo principal |
|---|---|---|---|
| Fecha y hora solicitada | Dato personal vinculado a una atención | Confidencial | Exposición de hábitos, disponibilidad o relación con la clínica |
| Servicio solicitado | Dato operativo vinculado al tutor | Confidencial | Revelación de una atención o necesidad concreta |
| Duración estimada | Dato operativo | Interno | Alteración de la agenda o uso indebido de reglas comerciales |
| Estado de la cita | Dato operativo vinculado al tutor | Confidencial | Exposición o modificación no autorizada de reservas |
| Canal de origen | Dato técnico y operativo | Interno | Seguimiento indebido o pérdida de trazabilidad |

## 5. Clasificación de datos de urgencias

| Dato | Tipo de dato | Nivel | Riesgo principal |
|---|---|---|---|
| Situación reportada | Información operativa potencialmente delicada | Restringido | Puede contener datos personales, detalles privados o información escrita libremente |
| Tipo de urgencia | Dato operativo vinculado a una atención | Restringido | Exposición de una situación crítica asociada al tutor y su mascota |
| Fecha de registro | Dato de trazabilidad | Confidencial | Permite relacionar a una persona con un evento concreto |
| Estado de gestión | Dato operativo interno | Restringido | Manipulación o exposición de la gestión de una alerta |
| Canal de aviso | Dato técnico interno | Interno | Revelación de mecanismos internos de comunicación |

## 6. Clasificación de datos técnicos y de acceso

| Dato | Tipo de dato | Nivel | Riesgo principal |
|---|---|---|---|
| Dirección IP | Dato técnico potencialmente personal | Confidencial | Seguimiento, identificación técnica o exposición de actividad |
| Registros de ejecución | Dato técnico y operativo | Restringido | Pueden contener errores, fragmentos de mensajes o datos personales |
| Identificadores de usuario interno | Dato personal y de control de acceso | Confidencial | Suplantación o acceso indebido |
| Credenciales y claves de integración | Secreto técnico | Restringido | Acceso total o parcial a sistemas y datos |
| Identificador del canal de Telegram | Dato técnico interno | Restringido | Envío no autorizado de mensajes o exposición del canal interno |

## 7. Clasificación de datos de la clínica y personal autorizado

| Dato | Tipo de dato | Nivel | Riesgo principal |
|---|---|---|---|
| Nombre y contacto de la clínica | Dato comercial | Confidencial | Exposición de información contractual o comercial |
| Nombre y correo del representante | Dato personal y comercial | Confidencial | Contacto no autorizado, fraude o suplantación |
| Usuarios internos | Dato personal y de acceso | Confidencial | Acceso indebido o suplantación |
| Rol o perfil de acceso | Dato de autorización | Interno | Asignación incorrecta de permisos |
| Registros de acceso y acciones | Dato técnico y de auditoría | Restringido | Exposición de actividad interna o alteración de evidencias |

## 8. Reglas mínimas de manejo

| Nivel | Regla de manejo |
|---|---|
| Público | Puede mostrarse sin autenticación, siempre que esté validado y actualizado |
| Interno | Solo debe estar disponible para personal autorizado de la clínica o de VetAtiende |
| Confidencial | Requiere control de acceso, transmisión segura, retención definida y prohibición de exposición pública |
| Restringido | Requiere acceso mínimo, cifrado, registro de accesos, revisión periódica y respuesta inmediata ante incidentes |

## 9. Criterio para mensajes libres

Aunque VetAtiende no solicite datos sensibles del tutor, una persona puede escribirlos voluntariamente dentro de una conversación.

Por esta razón:

- los mensajes deben tratarse como información confidencial;
- los mensajes de urgencia deben tratarse como información restringida;
- Luna debe evitar solicitar antecedentes personales innecesarios;
- los registros y errores no deben exponer conversaciones completas sin necesidad;
- el acceso a conversaciones debe limitarse al personal autorizado.

