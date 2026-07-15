# Plan de respuesta ante incidentes — VetAtiende AI

**LAB:** LAB-018
**Estado:** Versión inicial completada
**Ámbito:** MVP comercial

Este documento define cómo detectar, contener, investigar, comunicar y corregir incidentes que afecten datos, sistemas o continuidad del servicio.

## 1. Definición y ejemplos de incidente

Se considera incidente cualquier evento que comprometa o pueda comprometer la confidencialidad, integridad, disponibilidad o trazabilidad de los datos y sistemas de VetAtiende AI.

Ejemplos:

- acceso de una clínica a datos de otra;
- exposición de credenciales, tokens o claves;
- envío de información al canal de Telegram equivocado;
- calendario u hoja compartida públicamente;
- pérdida o modificación no autorizada de registros;
- malware, vulnerabilidad o acceso administrativo sospechoso;
- interrupción prolongada del servicio;
- eliminación accidental de datos;
- proveedor que informa una filtración o falla de seguridad;
- registros técnicos que exponen conversaciones o datos personales.

## 2. Clasificación de severidad

| Nivel | Descripción | Ejemplos |
|---|---|---|
| Bajo | Evento sin exposición confirmada de datos y con impacto limitado | Error aislado sin acceso indebido |
| Medio | Incidente con afectación operativa o posible exposición limitada | Falla de permisos detectada y contenida |
| Alto | Exposición confirmada, pérdida de datos o acceso no autorizado relevante | Filtración de teléfonos, citas o conversaciones |
| Crítico | Incidente grave, masivo o que afecta varias clínicas o sistemas esenciales | Cruce de datos entre clínicas, compromiso de credenciales maestras o caída prolongada |

La clasificación deberá revisarse a medida que aparezca nueva información durante la investigación.

## 3. Roles durante un incidente

| Participante | Responsabilidad principal |
|---|---|
| VetAtiende AI | Detectar, contener, investigar, documentar y comunicar el incidente |
| Clínica afectada | Evaluar el impacto sobre sus titulares y decidir las comunicaciones necesarias |
| Proveedor tecnológico | Informar fallas de su servicio y colaborar con la investigación |
| Personal autorizado | Reportar incidentes y seguir las instrucciones de contención |

Toda persona que detecte un incidente deberá informarlo inmediatamente por el canal interno definido.

Nadie deberá intentar ocultar, borrar o modificar evidencia relacionada con el incidente.

## 4. Flujo de respuesta

Todo incidente deberá gestionarse siguiendo este orden:

1. detectar y registrar el evento;
2. contener el incidente;
3. proteger la evidencia;
4. identificar datos, sistemas y clínicas afectadas;
5. clasificar la severidad;
6. informar a la clínica afectada;
7. aplicar medidas de corrección y recuperación;
8. evaluar comunicaciones o notificaciones necesarias;
9. documentar causas, impacto y acciones;
10. cerrar el incidente y aplicar mejoras preventivas.

El incidente no deberá considerarse cerrado hasta comprobar que la causa fue corregida y el riesgo quedó controlado.

## 5. Medidas inmediatas de contención

Según el tipo de incidente, VetAtiende AI deberá aplicar una o más de las siguientes acciones:

- bloquear cuentas o usuarios comprometidos;
- revocar tokens, claves y credenciales expuestas;
- desactivar temporalmente workflows afectados;
- cerrar accesos o puertos inseguros;
- aislar sistemas o recursos comprometidos;
- detener integraciones con proveedores afectados;
- restringir temporalmente el acceso a datos;
- preservar registros y evidencia técnica;
- activar respaldos o mecanismos de recuperación cuando corresponda.

Las medidas de contención deberán aplicarse sin destruir evidencia necesaria para investigar el incidente.

## 6. Comunicación del incidente

VetAtiende AI deberá informar a la clínica afectada sin demora indebida cuando un incidente pueda comprometer datos personales o la continuidad del servicio.

La comunicación inicial deberá incluir:

- fecha y hora de detección;
- descripción breve del incidente;
- sistemas y datos posiblemente afectados;
- clínicas involucradas;
- nivel de severidad preliminar;
- medidas de contención aplicadas;
- riesgos identificados;
- próximos pasos de investigación y recuperación.

La información deberá actualizarse cuando aparezcan nuevos antecedentes.

La clínica decidirá las comunicaciones externas o notificaciones que correspondan, con asistencia técnica de VetAtiende AI.

## 7. Investigación y evidencia

La investigación deberá determinar qué ocurrió, cómo ocurrió, qué datos fueron afectados y qué medidas deben aplicarse.

Se deberá conservar:

- registros de acceso y ejecución;
- cambios de configuración;
- direcciones IP y marcas de tiempo relevantes;
- cuentas, credenciales o tokens involucrados;
- sistemas y proveedores afectados;
- decisiones tomadas durante la contención;
- comunicaciones con la clínica y proveedores;
- copias de respaldo necesarias para la investigación.

La evidencia deberá protegerse contra alteraciones y su acceso quedará limitado al personal autorizado.

## 8. Recuperación y cierre

La recuperación deberá restablecer el servicio de forma segura y verificar que la causa del incidente fue corregida.

Antes de cerrar el incidente se deberá:

- restaurar los sistemas afectados;
- reemplazar credenciales comprometidas;
- corregir configuraciones o vulnerabilidades;
- validar la integridad de los datos;
- comprobar que no persistan accesos indebidos;
- confirmar el funcionamiento de respaldos y controles;
- informar el resultado final a la clínica;
- documentar las medidas preventivas adoptadas.

El cierre deberá quedar aprobado por la persona responsable de la gestión del incidente.

## 9. Registro del incidente

Todo incidente deberá quedar documentado, incluso cuando no produzca una exposición confirmada de datos.

El registro deberá incluir:

- identificador del incidente;
- fecha y hora de detección;
- persona o sistema que lo detectó;
- nivel de severidad;
- clínicas, sistemas y datos afectados;
- medidas de contención aplicadas;
- comunicaciones realizadas;
- causa identificada;
- acciones de recuperación;
- fecha y responsable del cierre;
- mejoras preventivas definidas.

El acceso a este registro deberá limitarse al personal autorizado.

## 10. Revisión y simulación

El plan deberá revisarse antes del primer piloto y después de cambios importantes en la arquitectura, proveedores o controles de seguridad.

Se deberá realizar periódicamente:

- una prueba simulada de incidente;
- una revisión de contactos y responsables;
- una prueba de revocación de credenciales;
- una prueba de restauración desde respaldo;
- una revisión del canal de comunicación con la clínica;
- una actualización de las medidas de contención;
- una revisión de las mejoras pendientes.

Toda simulación deberá dejar evidencia de sus resultados y acciones correctivas.

