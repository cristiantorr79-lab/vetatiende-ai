# Anexo de instrucciones de tratamiento — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** Clínica piloto y MVP comercial

## Objetivo

Documentar las instrucciones bajo las cuales VetAtiende AI podrá procesar datos personales por cuenta de una clínica veterinaria.

Este anexo deberá completarse y aprobarse junto con la clínica antes de utilizar datos personales reales.

## Partes

- **Clínica responsable:** por identificar.
- **Encargado del tratamiento:** VetAtiende AI.
- **Servicio:** asistente virtual de recepción y apoyo operativo veterinario.
- **Fecha de inicio:** por definir.
- **Duración:** durante la vigencia del servicio y los periodos de conservación autorizados.

VetAtiende AI solo podrá realizar las operaciones expresamente definidas en este anexo y en el contrato aplicable.

## 1. Finalidades autorizadas

La clínica podrá autorizar a VetAtiende AI a tratar datos exclusivamente para las siguientes finalidades:

- responder consultas sobre servicios, precios, horarios y funcionamiento de la clínica;
- recibir solicitudes de atención veterinaria;
- consultar disponibilidad y gestionar citas;
- registrar confirmaciones, cambios y cancelaciones;
- detectar señales de posible urgencia mediante reglas preventivas;
- enviar alertas mínimas al personal autorizado de la clínica;
- entregar orientación general y derivación segura;
- apoyar tareas operativas internas expresamente autorizadas;
- mantener registros técnicos necesarios para seguridad, continuidad y solución de errores;
- atender solicitudes de acceso, corrección, eliminación u otros derechos;
- generar estadísticas anónimas para evaluar el funcionamiento del servicio.

VetAtiende AI no podrá utilizar los datos para publicidad propia, venta de información, entrenamiento de modelos ni finalidades distintas sin una instrucción adicional, expresa y documentada de la clínica.

El servicio no estará autorizado para realizar diagnósticos, prescripciones, tratamientos ni decisiones clínicas autónomas.

## 2. Categorías de datos autorizadas

Según los servicios contratados por la clínica, VetAtiende AI podrá tratar únicamente las siguientes categorías de información:

### Datos del tutor

- nombre;
- teléfono;
- correo electrónico, cuando sea necesario;
- contenido de la consulta;
- preferencias de contacto;
- datos necesarios para gestionar una cita.

### Datos de la mascota

- nombre;
- especie;
- raza, cuando sea relevante;
- edad aproximada;
- motivo general de consulta;
- servicio solicitado;
- señales de posible urgencia comunicadas por el tutor.

### Datos operativos de la clínica

- servicios disponibles;
- horarios;
- precios autorizados;
- disponibilidad de agenda;
- profesionales o áreas asignadas;
- estados de atención;
- identificadores internos necesarios para gestionar la solicitud.

### Datos técnicos y de seguridad

- fecha y hora de las operaciones;
- identificador de clínica;
- identificador de sesión o solicitud;
- resultado de ejecución;
- errores técnicos;
- registros de acceso estrictamente necesarios;
- información relacionada con incidentes de seguridad.

No deberán solicitarse ni almacenarse documentos de identidad, datos financieros, antecedentes clínicos completos ni otra información sensible que no sea indispensable para la finalidad autorizada.

Los mensajes de texto libre deberán minimizarse y revisarse técnicamente para evitar su almacenamiento o envío completo cuando no sea necesario.

## 3. Operaciones de tratamiento autorizadas

VetAtiende AI podrá realizar únicamente las operaciones necesarias para prestar el servicio contratado:

- recopilar datos ingresados directamente por el tutor o personal autorizado;
- recibir consultas mediante la interfaz o canales habilitados;
- validar, ordenar y estructurar la información recibida;
- consultar documentos públicos o internos según el canal autorizado;
- consultar disponibilidad de agenda;
- crear, modificar o cancelar citas según las reglas de la clínica;
- registrar solicitudes, citas, alertas y estados operativos;
- transmitir información mínima a proveedores tecnológicos autorizados;
- generar respuestas automatizadas dentro de los límites definidos;
- enviar alertas mínimas al personal autorizado;
- almacenar temporalmente información según los plazos aprobados;
- consultar registros para solucionar errores o incidentes;
- corregir, exportar, anonimizar o eliminar datos siguiendo instrucciones;
- generar estadísticas que no permitan identificar a personas.

Toda operación deberá mantener asociado el identificador de la clínica correspondiente y respetar los permisos del usuario que la ejecuta.

VetAtiende AI no podrá:

- combinar datos de clínicas diferentes;
- entregar datos a personas no autorizadas;
- crear perfiles comerciales propios de tutores;
- vender, arrendar o intercambiar información;
- utilizar los datos para entrenar modelos;
- conservar información después de vencer el plazo autorizado;
- ejecutar una operación no contemplada sin una nueva instrucción documentada.

## 4. Sistemas y proveedores autorizados

La clínica deberá aprobar previamente los sistemas y proveedores que podrán intervenir en el tratamiento.

La configuración inicial podrá incluir:

- Oracle Cloud Infrastructure para alojar el entorno comercial;
- n8n autohospedado para coordinar workflows e integraciones;
- Streamlit autohospedado para la interfaz del servicio;
- Google Workspace para agenda y registros operativos;
- GroqCloud para generación de respuestas;
- Cohere para embeddings y búsqueda semántica;
- Telegram únicamente para alertas mínimas y bajo las restricciones aprobadas.

La autorización de un proveedor deberá indicar:

- servicio utilizado;
- finalidad;
- categorías de datos recibidas;
- ubicación conocida o posible del tratamiento;
- medidas de minimización;
- condiciones de retención;
- controles contractuales y técnicos;
- restricciones específicas;
- fecha de aprobación.

VetAtiende AI no podrá incorporar un nuevo proveedor ni modificar sustancialmente el uso de uno existente sin:

- realizar una evaluación previa;
- actualizar el registro de transferencias;
- informar a la clínica;
- obtener la autorización requerida;
- actualizar este anexo y la documentación contractual.

Los proveedores permanecerán sujetos a las restricciones registradas en `revision_proveedores.md` y `registro_transferencias_internacionales.md`.

## 5. Conservación, devolución y eliminación

VetAtiende AI deberá conservar los datos únicamente durante los plazos aprobados por la clínica y documentados en la política de retención.

Las instrucciones iniciales serán:

- aplicar un plazo definido a cada categoría de datos;
- eliminar o anonimizar la información cuando termine su finalidad;
- incluir registros, archivos, exportaciones y respaldos en el procedimiento;
- suspender temporalmente la eliminación cuando exista una obligación legal, contractual, judicial o de seguridad documentada;
- registrar las eliminaciones relevantes;
- impedir la recuperación ordinaria de datos eliminados;
- limitar el acceso a la información pendiente de eliminación;
- revisar periódicamente que no existan datos conservados sin justificación.

Al terminar el servicio, la clínica deberá indicar si corresponde:

- devolver una copia de los datos en un formato acordado;
- transferirlos a otro proveedor autorizado;
- eliminar los datos y sus copias controladas;
- conservar temporalmente una parte por una obligación vigente.

VetAtiende AI deberá documentar la ejecución de la instrucción final y comunicar a la clínica cualquier copia que no pueda eliminarse inmediatamente, indicando su ubicación, motivo y plazo previsto de eliminación.

Los plazos operativos propuestos se encuentran en `politica_retencion_eliminacion.md` y deberán aprobarse antes del primer piloto.

## 6. Seguridad, confidencialidad y control de acceso

VetAtiende AI deberá aplicar medidas técnicas y organizativas proporcionales a los riesgos del tratamiento.

Como mínimo deberá:

- utilizar HTTPS en todos los accesos comerciales;
- proteger credenciales, tokens y claves fuera del código;
- restringir el acceso según función y necesidad;
- utilizar cuentas individuales para personal autorizado;
- impedir el uso compartido de credenciales administrativas;
- mantener separados los datos y recursos de cada clínica;
- registrar accesos, cambios y operaciones relevantes;
- proteger respaldos y claves de cifrado;
- mantener sistemas y dependencias actualizados;
- eliminar accesos cuando una persona deje de estar autorizada;
- revisar periódicamente permisos, usuarios y configuraciones;
- utilizar datos ficticios en pruebas y desarrollo;
- limitar la información enviada a proveedores externos;
- conservar evidencia de las pruebas y controles aplicados.

Toda persona que acceda a datos personales deberá estar sujeta a obligaciones de confidencialidad y utilizar la información únicamente para las funciones autorizadas.

La clínica podrá solicitar información razonable sobre los controles aplicados y las evidencias disponibles, sin que ello implique revelar secretos, credenciales o configuraciones que puedan debilitar la seguridad del servicio.

Los controles definidos se encuentran detallados en `controles_tecnicos_organizativos.md` y deberán validarse antes del primer piloto.

## 7. Atención de solicitudes de derechos

Cuando VetAtiende AI reciba una solicitud relacionada con datos tratados por cuenta de la clínica, deberá:

- registrar la fecha, canal y contenido de la solicitud;
- identificar la clínica responsable de los datos;
- informar a la clínica sin demora indebida;
- no responder de fondo sin autorización, salvo instrucciones previamente acordadas;
- colaborar en la búsqueda, corrección, exportación, bloqueo o eliminación de información;
- aplicar una verificación de identidad proporcional al riesgo;
- limitar el acceso a la solicitud y sus antecedentes;
- documentar las acciones realizadas y sus responsables;
- informar cualquier dificultad técnica que pueda afectar la respuesta;
- conservar únicamente la evidencia mínima durante el plazo aprobado.

La clínica será responsable de decidir la respuesta que corresponda, mientras VetAtiende AI prestará la asistencia técnica necesaria dentro de los sistemas bajo su control.

VetAtiende AI no deberá modificar ni eliminar información solicitada sin conservar evidencia suficiente de la instrucción recibida y de la acción ejecutada.

El procedimiento operativo se encuentra definido en `procedimiento_derechos.md`.

## 8. Gestión de incidentes

Cuando VetAtiende AI detecte o sospeche un incidente que pueda afectar datos de una clínica, deberá:

- contener el incidente sin destruir evidencia;
- registrar fecha, hora, sistemas y datos posiblemente afectados;
- identificar la clínica o clínicas involucradas;
- revocar credenciales, tokens o accesos comprometidos;
- preservar registros técnicos relevantes;
- informar a la clínica sin demora indebida;
- entregar antecedentes suficientes para evaluar el impacto;
- mantener a la clínica informada durante la investigación;
- aplicar medidas de corrección y recuperación;
- documentar causas, decisiones y acciones preventivas;
- comprobar que el riesgo quedó controlado antes de cerrar el incidente.

La clínica decidirá las comunicaciones externas o notificaciones que correspondan, con asistencia técnica de VetAtiende AI.

VetAtiende AI deberá comunicar también los incidentes originados en proveedores o subencargados cuando puedan afectar los datos tratados por cuenta de la clínica.

El procedimiento completo se encuentra definido en `plan_respuesta_incidentes.md`.

## 9. Cambios, cooperación y revisión

Cualquier cambio en las finalidades, datos, proveedores, operaciones o medidas de seguridad deberá:

- quedar documentado;
- ser evaluado antes de aplicarse;
- actualizar este anexo y los registros relacionados;
- contar con autorización de la clínica cuando corresponda.

VetAtiende AI deberá colaborar razonablemente con la clínica en revisiones, solicitudes de información, incidentes y comprobación de los controles aplicados.

Este anexo deberá revisarse antes del primer piloto y cada vez que cambie de forma importante la arquitectura o el servicio.

## 10. Aprobación

Antes de utilizar datos reales deberán completarse:

- identificación de la clínica;
- responsables y contactos;
- servicios contratados;
- proveedores efectivamente utilizados;
- plazos de retención aprobados;
- controles técnicos validados;
- fecha de vigencia;
- aceptación de ambas partes.

Esta versión constituye una base inicial de trabajo y deberá recibir revisión profesional antes de su firma definitiva.


