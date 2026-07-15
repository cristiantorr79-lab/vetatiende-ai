# Revisión de proveedores tecnológicos — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** MVP comercial

Este documento evalúa los proveedores que pueden recibir, almacenar o procesar datos durante la operación de VetAtiende AI.

## 1. Oracle Cloud Infrastructure

| Aspecto | Evaluación inicial |
|---|---|
| Función | Alojar n8n, workflows, configuraciones y registros técnicos |
| Datos posibles | Mensajes, citas, registros de ejecución, direcciones IP y credenciales cifradas |
| Rol previsto | Subencargado de infraestructura |
| Ubicación | OCI ofrece las regiones `sa-santiago-1` y `sa-valparaiso-1`; falta confirmar la región exacta de la instancia de VetAtiende AI |
| Contrato | Oracle publica un acuerdo de tratamiento de datos aplicable cuando procesa información personal como encargado para prestar los servicios contratados |
| Seguridad disponible | Cifrado, aislamiento, gestión de identidades, redes privadas y controles de acceso |
| Riesgo principal | Configuración incorrecta del servidor, puertos, permisos, respaldos o registros |
| Estado inicial | Apto de manera condicionada |

Condiciones antes de producción:

- confirmar la región exacta donde se encuentra la instancia;
- habilitar HTTPS para todos los accesos externos;
- cerrar puertos y servicios innecesarios;
- limitar accesos administrativos;
- proteger claves y credenciales fuera del repositorio;
- definir respaldos, cifrado y ciclo de eliminación;
- conservar el acuerdo contractual y de tratamiento aplicable.

### Verificación oficial consultada

**Fecha de revisión:** 15 de julio de 2026

Se comprobó en documentación oficial de Oracle que:

- OCI mantiene las regiones `sa-santiago-1` en Santiago y `sa-valparaiso-1` en Valparaíso;
- el acuerdo de tratamiento de Oracle regula su procesamiento de información personal como encargado;
- Oracle declara cifrado de datos en reposo, APIs públicas mediante HTTPS, controles IAM y registros para auditoría;
- la disponibilidad de estas funciones no reemplaza la configuración segura que debe realizar VetAtiende AI.

**Fuentes oficiales:**

- [Regiones y dominios de disponibilidad de OCI](https://docs.oracle.com/es-ww/iaas/Content/General/Concepts/regions.htm)
- [Data Processing Agreement for Oracle Services](https://www.oracle.com/contracts/docs/data-processing-agreement-oracle-services-081425.pdf)
- [OCI Security Guide](https://docs.oracle.com/en-us/iaas/Content/Security/Concepts/security_guide.htm)

**Pendiente de validación propia:**

- confirmar la región exacta de la instancia utilizada;
- conservar la versión contractual aplicable a la cuenta;
- comprobar HTTPS, puertos, permisos, respaldos y registros en la configuración real.

## 2. Google Workspace — Calendar y Sheets

| Aspecto | Evaluación inicial |
|---|---|
| Función | Gestionar citas, disponibilidad y registros operativos |
| Datos posibles | Nombre y teléfono del tutor, mascota, servicio, fecha, hora, urgencias y estados de gestión |
| Rol previsto | Subencargado de almacenamiento y servicios colaborativos |
| Cuenta requerida | Cuenta corporativa exclusiva de Google Workspace, no cuenta personal |
| Ubicación | Google Workspace no ofrece una región de datos exclusiva en Chile; para datos cubiertos, las opciones disponibles son Estados Unidos, Europa o sin preferencia, según la edición contratada |
| Contrato | El Cloud Data Processing Addendum regula las obligaciones de tratamiento y seguridad, identificando a Google como encargado y al cliente como responsable o encargado, según corresponda |
| Seguridad disponible | Cifrado, autenticación, permisos, registros de actividad y controles administrativos según el plan |
| Riesgo principal | Hojas o calendarios compartidos públicamente, permisos excesivos y cuentas sin protección suficiente |
| Estado inicial | Apto de manera condicionada |

Condiciones antes de producción:

- contratar y configurar una cuenta corporativa de Google Workspace;
- activar verificación en dos pasos para usuarios administradores;
- utilizar calendarios y hojas exclusivos para cada clínica;
- restringir el uso compartido y evitar enlaces públicos;
- aplicar permisos según rol y necesidad;
- revisar los registros de acceso y modificaciones disponibles;
- definir plazos y procedimientos de eliminación;
- documentar las transferencias internacionales aplicables;
- conservar las condiciones contractuales y de tratamiento vigentes.

### Verificación oficial de Google Workspace

**Fecha de revisión:** 15 de julio de 2026

Se comprobó en documentación oficial de Google que:

- Google Workspace se encuentra cubierto por el Cloud Data Processing Addendum vigente;
- Google actúa como encargado respecto de los datos personales contenidos en los datos del cliente;
- el cliente conserva responsabilidad sobre la configuración, credenciales, permisos y uso de los controles de seguridad;
- las regiones disponibles para datos cubiertos son Estados Unidos, Europa o sin preferencia;
- Google Workspace no ofrece una opción de residencia exclusiva en Chile;
- la selección de región, los informes y algunos controles avanzados dependen de la edición contratada;
- el acuerdo contempla cifrado, controles de acceso, gestión de incidentes, eliminación, exportación y subencargados.

**Fuentes oficiales:**

- [Cloud Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum)
- [Regiones de datos de Google Workspace](https://support.google.com/a/answer/7630496)

**Pendiente de validación propia:**

- definir la edición corporativa que se contratará;
- verificar qué controles están incluidos en esa edición;
- conservar las condiciones contractuales aceptadas por la cuenta;
- configurar verificación en dos pasos y cuentas administrativas;
- comprobar permisos de Calendar y Sheets;
- impedir enlaces públicos y accesos entre clínicas;
- documentar el tratamiento y almacenamiento fuera de Chile.

## 3. GroqCloud

| Aspecto | Evaluación inicial |
|---|---|
| Función | Interpretar consultas y generar respuestas mediante modelos de inteligencia artificial |
| Datos posibles | Mensajes del tutor, datos de agenda y situaciones reportadas |
| Rol previsto | Subencargado de procesamiento mediante inteligencia artificial |
| Retención | Las entradas y respuestas de inferencia pueden conservarse hasta 30 días para confiabilidad y control de abuso, salvo que se active Zero Data Retention |
| Ubicación | Los datos retenidos por GroqCloud se almacenan en infraestructura de Google Cloud ubicada en Estados Unidos |
| Entrenamiento | Groq no puede utilizar entradas o respuestas para entrenar o ajustar modelos sin permiso o instrucción expresa del cliente |
| Contrato | El Customer Data Processing Addendum regula a Groq como encargado o subencargado respecto de los datos personales del cliente |
| Control recomendado | Activar Zero Data Retention y deshabilitar funciones que requieran persistencia cuando no sean necesarias |
| Riesgo principal | Envío de conversaciones completas o datos personales innecesarios a un proveedor extranjero |
| Estado inicial | Apto de manera condicionada |

Condiciones antes de producción:

- utilizar una cuenta corporativa exclusiva;
- activar Zero Data Retention;
- evitar funciones que requieran almacenamiento persistente;
- enviar solamente los datos necesarios para generar la respuesta;
- evitar el envío de credenciales o información interna;
- documentar la transferencia internacional;
- conservar el acuerdo de procesamiento aplicable;
- revisar periódicamente la configuración y los subencargados.

### Verificación oficial de GroqCloud

**Fecha de revisión:** 15 de julio de 2026

Se comprobó en documentación oficial de Groq que:

- las entradas y respuestas de inferencia pueden conservarse hasta 30 días para confiabilidad del sistema y control de abuso;
- Zero Data Retention puede habilitarse desde los controles de la organización;
- con Zero Data Retention, Groq no conserva datos del cliente para confiabilidad o control de abuso;
- las funciones que necesitan persistencia pueden quedar deshabilitadas al activar este control;
- los datos retenidos se almacenan en infraestructura de Google Cloud ubicada en Estados Unidos;
- Groq no puede utilizar entradas o respuestas para entrenamiento o ajuste de modelos sin permiso o instrucción expresa;
- el Customer Data Processing Addendum regula su actuación como encargado o subencargado;
- Groq mantiene una lista de subencargados y compromisos de seguridad, eliminación y respuesta ante incidentes.

**Fuentes oficiales:**

- [Your Data in GroqCloud](https://console.groq.com/docs/your-data)
- [Customer Data Processing Addendum](https://console.groq.com/docs/legal/customer-data-processing-addendum)
- [Groq Services Agreement](https://console.groq.com/docs/legal/services-agreement)

**Pendiente de validación propia:**

- confirmar que Zero Data Retention esté disponible y activado en la organización utilizada;
- verificar que no se utilicen funciones de persistencia innecesarias;
- inspeccionar qué campos envían realmente los workflows;
- eliminar nombres, teléfonos y otros identificadores cuando no sean indispensables;
- conservar la versión contractual aplicable;
- documentar el tratamiento y almacenamiento en Estados Unidos.

## 4. Cohere

| Aspecto | Evaluación inicial |
|---|---|
| Función | Generar embeddings para la búsqueda semántica del RAG |
| Datos posibles | Consultas del usuario y fragmentos de documentos enviados para generar vectores |
| Rol previsto | Subencargado de procesamiento mediante inteligencia artificial |
| Cuenta requerida | Cuenta comercial de pago; las claves de prueba no deberán utilizarse con datos personales reales |
| Retención | En la plataforma SaaS, Cohere elimina normalmente los prompts y resultados registrados después de 30 días, salvo obligaciones legales, contractuales o investigaciones de uso indebido |
| Entrenamiento | Los clientes empresariales pueden desactivar desde Data Controls el uso de prompts y resultados para entrenamiento de modelos |
| Contrato | Cohere ofrece un Data Processing Addendum para clientes SaaS que pretendan enviar datos personales de usuarios finales |
| Control recomendado | Solicitar Zero Data Retention y evaluar un despliegue privado o mediante una plataforma de nube de terceros |
| Riesgo principal | Envío de consultas o documentos con datos personales a la plataforma SaaS |
| Estado inicial | Apto de manera condicionada |

Condiciones antes de producción:

- utilizar una cuenta empresarial corporativa;
- desactivar el uso de datos para entrenamiento;
- solicitar y conservar el acuerdo de procesamiento;
- evaluar y solicitar Zero Data Retention;
- no enviar documentos internos con datos personales innecesarios;
- limitar los fragmentos enviados al mínimo necesario;
- documentar la ubicación y transferencia internacional;
- revisar periódicamente la lista de subencargados;
- evaluar el uso de Cohere mediante OCI o un despliegue privado.

### Verificación oficial de Cohere

**Fecha de revisión:** 15 de julio de 2026

Se comprobó en documentación oficial de Cohere que:

- los compromisos empresariales de datos se aplican a clientes comerciales de pago;
- las claves gratuitas o de prueba se rigen por las condiciones generales y no deberán utilizarse con datos personales reales;
- en la plataforma SaaS, los prompts y resultados registrados se eliminan normalmente después de 30 días, salvo excepciones;
- los clientes empresariales pueden desactivar el uso de prompts y resultados para entrenamiento mediante Data Controls;
- Zero Data Retention evita el registro de prompts y resultados, pero solo está disponible previa aprobación para clientes empresariales;
- Zero Data Retention no elimina la recopilación de datos generales de uso;
- Cohere indica que su infraestructura SaaS se encuentra en servidores de Google Cloud en la región US-Central;
- Cohere ofrece un Data Processing Addendum que debe solicitarse antes de enviar datos personales de usuarios finales;
- en despliegues privados o mediante plataformas de nube de terceros, Cohere declara no recibir ni procesar los prompts y resultados del cliente.

**Fuentes oficiales:**

- [Enterprise Data Commitments](https://cohere.com/enterprise-data-commitments)
- [Cohere Trust Center](https://trustcenter.cohere.com/)
- [Cohere Privacy Policy](https://cohere.com/privacy)
- [Cohere Platform deployment options](https://docs.cohere.com/docs/the-cohere-platform)

**Pendiente de validación propia:**

- contratar una cuenta comercial corporativa;
- solicitar y revisar el Data Processing Addendum;
- desactivar el uso de datos para entrenamiento;
- solicitar Zero Data Retention y confirmar su aprobación;
- confirmar contractualmente cómo se tratan los textos enviados al servicio Embed;
- inspeccionar qué fragmentos y consultas envían realmente los workflows;
- evitar nombres, teléfonos y otros identificadores en las consultas de embeddings;
- evaluar una plataforma de nube de terceros o despliegue privado;
- documentar el tratamiento de datos en Estados Unidos.

## 5. Telegram

| Aspecto | Evaluación inicial |
|---|---|
| Función | Avisar al personal autorizado cuando VetAtiende detecta una posible urgencia |
| Datos posibles | Categoría de urgencia, identificador interno y datos mínimos para gestionar el caso |
| Rol previsto | Proveedor externo de comunicación; su adecuación como subencargado deberá revisarse antes de enviar datos personales reales |
| Almacenamiento | Los mensajes enviados mediante bots, grupos y canales se gestionan como chats en la nube y se almacenan cifrados en servidores de Telegram |
| Cifrado | Los chats en la nube utilizan cifrado cliente-servidor; el cifrado de extremo a extremo se limita a Secret Chats individuales y no protege las alertas enviadas por bots a grupos |
| Riesgo principal | Exposición, reenvío, captura de pantalla o permanencia de datos personales y detalles de urgencias en un chat en la nube |
| Estado inicial | Uso restringido y condicionado |

Condiciones antes de producción:

- utilizar un canal o grupo privado exclusivo para cada clínica;
- limitar sus integrantes al personal estrictamente autorizado;
- activar verificación en dos pasos en las cuentas administradoras;
- configurar el bot únicamente con los permisos necesarios;
- enviar una alerta mínima, sin copiar la conversación completa;
- evitar incluir el teléfono completo del tutor;
- utilizar un identificador interno para consultar el detalle en un sistema protegido;
- definir y aplicar la eliminación periódica de mensajes;
- revocar inmediatamente el token si existe una exposición;
- evaluar su reemplazo futuro por un canal interno con mejores garantías contractuales y de auditoría.

### Verificación oficial de Telegram

**Fecha de revisión:** 15 de julio de 2026

Se comprobó en documentación oficial de Telegram que:

- los mensajes, fotografías, videos y documentos de chats en la nube se almacenan cifrados en servidores de Telegram;
- los chats en la nube utilizan cifrado cliente-servidor y servidor-cliente;
- el cifrado de extremo a extremo se limita a Secret Chats individuales;
- las alertas enviadas por bots a grupos o canales no deben considerarse cifradas de extremo a extremo;
- los bots son aplicaciones de terceros operadas por sus desarrolladores;
- el desarrollador debe cumplir la normativa de privacidad aplicable;
- cada bot debe disponer de una política de privacidad accesible que explique qué datos recopila, almacena y utiliza;
- Telegram no garantiza que la plataforma permanezca disponible o sin interrupciones;
- los mensajes pueden ser reenviados, copiados o capturados por integrantes autorizados del grupo.

**Fuentes oficiales:**

- [Telegram Privacy Policy](https://telegram.org/privacy)
- [Telegram FAQ — Encryption](https://telegram.org/faq)
- [Telegram Bot Platform Developer Terms](https://telegram.org/tos/bot-developers)
- [Standard Bot Privacy Policy](https://telegram.org/privacy-tpa)

**Pendiente de validación propia:**

- crear una política de privacidad específica para el bot de VetAtiende AI;
- limitar las alertas a una categoría de urgencia y un identificador interno;
- no enviar conversaciones completas, teléfonos, correos ni antecedentes clínicos;
- configurar un grupo privado independiente para cada clínica;
- limitar integrantes y permisos administrativos;
- definir eliminación periódica de mensajes;
- proteger y rotar el token del bot;
- comprobar la suspensión inmediata del workflow y del bot;
- determinar jurídicamente si las condiciones de Telegram son suficientes para el piloto;
- evaluar un canal interno alternativo con mejores garantías contractuales y de auditoría.

**Decisión provisional:**

Telegram podrá mantenerse únicamente como canal transitorio de alertas mínimas durante el primer piloto, siempre que no contenga datos personales directos ni detalles clínicos. Su uso deberá reevaluarse antes de ampliar el servicio.

## 6. Streamlit

| Aspecto | Evaluación inicial |
|---|---|
| Función | Proporcionar la interfaz web de conversación con Luna |
| Datos posibles | Mensajes, datos de agenda, identificadores de sesión y registros técnicos |
| Decisión comercial | Streamlit se mantiene para el MVP comercial y el primer piloto |
| Demo académica | Streamlit Community Cloud continuará usando únicamente datos ficticios o simulados |
| Producción comercial | Streamlit será autohospedado en Oracle Cloud |
| Seguridad requerida | HTTPS mediante proxy inverso o balanceador, autenticación, protección CORS y XSRF, control de sesiones y separación entre clínicas |
| Evolución visual | La interfaz deberá mejorar identidad, navegación, botones, horarios y avisos de privacidad |
| Riesgo principal | Exponer datos reales en una interfaz pública, confiar en Session State como almacenamiento permanente, mezclar sesiones o guardar secretos en el código |
| Estado inicial | Apto de manera condicionada |

Condiciones antes de producción:

- mantener Community Cloud exclusivamente para la demo académica;
- desplegar la interfaz comercial en Oracle Cloud;
- habilitar HTTPS y autenticación;
- separar sesiones, usuarios y datos de cada clínica;
- no almacenar datos personales en cachés globales;
- guardar secretos fuera del código y del repositorio;
- limitar los registros que puedan contener conversaciones;
- mejorar la interfaz para facilitar agenda, servicios, urgencias y privacidad;
- aplicar actualizaciones de seguridad a Streamlit y sus dependencias;
- realizar pruebas de acceso antes de activar una clínica.

### Verificación oficial de Streamlit

**Fecha de revisión:** 15 de julio de 2026

Se comprobó en documentación oficial de Streamlit que:

- para producción autohospedada se recomienda terminar HTTPS mediante un proxy inverso o balanceador;
- la configuración SSL incorporada directamente en Streamlit no es la opción recomendada para producción;
- Streamlit permite usar `st.secrets`, variables de entorno y gestores externos de secretos;
- los archivos con secretos no deberán incluirse en Git ni en el repositorio;
- las protecciones CORS y XSRF están habilitadas de forma predeterminada y no deberán desactivarse en producción;
- Streamlit dispone de autenticación mediante proveedores compatibles con OpenID Connect;
- la cookie de identidad de la autenticación nativa puede permanecer hasta 30 días si el usuario no cierra sesión;
- `st.session_state` está asociado a una conexión WebSocket y puede reiniciarse al recargar o abandonar la página;
- Session State no deberá actuar como repositorio permanente de citas, conversaciones o permisos;
- si en el futuro se utilizan varias réplicas, el proxy deberá mantener afinidad de sesión;
- los límites de carga de archivos y mensajes WebSocket deberán reducirse según las necesidades reales del MVP.

**Fuentes oficiales:**

- [HTTPS support](https://docs.streamlit.io/develop/concepts/configuration/https-support)
- [Secrets management](https://docs.streamlit.io/develop/concepts/connections/secrets-management)
- [Authentication](https://docs.streamlit.io/develop/concepts/connections/authentication)
- [Session State](https://docs.streamlit.io/develop/api-reference/caching-and-state/st.session_state)
- [Configuración del servidor](https://docs.streamlit.io/develop/api-reference/configuration/config.toml)
- [Trust and Security de Community Cloud](https://docs.streamlit.io/deploy/streamlit-community-cloud/get-started/trust-and-security)

**Pendiente de validación propia:**

- desplegar Streamlit comercial en recursos separados de Community Cloud;
- configurar un proxy inverso con certificado HTTPS válido;
- decidir el proveedor de identidad y los roles autorizados;
- definir cierre de sesión y duración operativa de las sesiones;
- mantener activadas las protecciones CORS y XSRF;
- almacenar secretos fuera del código y restringir sus permisos;
- comprobar que ningún dato se comparte mediante cachés o variables globales;
- persistir citas y operaciones únicamente en sistemas autorizados;
- limitar tamaño de cargas y mensajes;
- probar separación entre clínicas, usuarios y sesiones;
- revisar registros para evitar conversaciones o identificadores innecesarios.

**Decisión provisional:**

Streamlit es apto de manera condicionada para el MVP y el primer piloto autohospedado. Community Cloud continuará limitado a la demostración académica con datos ficticios.

## 7. n8n autohospedado

| Aspecto | Evaluación inicial |
|---|---|
| Función | Coordinar webhooks, inteligencia artificial, agenda, registros y alertas |
| Datos posibles | Mensajes, datos de tutores y mascotas, citas, urgencias, credenciales y registros de ejecución |
| Modalidad | Instalación autohospedada en Oracle Cloud |
| Rol previsto | Componente interno de procesamiento administrado por VetAtiende AI |
| Almacenamiento | Los workflows, credenciales y ejecuciones permanecen en la infraestructura administrada por VetAtiende AI; las credenciales se cifran mediante la clave de cifrado de la instancia |
| Responsabilidad | VetAtiende AI debe administrar TLS, cifrado en reposo, usuarios, nodos permitidos, actualizaciones, registros, respaldos, retención y eliminación |
| Riesgo principal | Exponer la clave de cifrado, habilitar nodos peligrosos o conservar ejecuciones completas y mensajes durante más tiempo del necesario |
| Estado inicial | Apto de manera condicionada |

Condiciones antes de producción:

- mantener n8n autohospedado en Oracle Cloud;
- proteger el acceso mediante HTTPS y proxy inverso;
- exigir autenticación y restringir usuarios administrativos;
- utilizar una clave de cifrado estable y protegida;
- cifrar el almacenamiento donde reside n8n y su base de datos;
- configurar la eliminación automática de ejecuciones antiguas;
- evitar guardar ejecuciones exitosas cuando no sean necesarias;
- limitar los datos almacenados en errores y registros;
- desactivar la telemetría cuando corresponda;
- mantener n8n y sus dependencias actualizadas;
- respaldar y probar la recuperación de la base de datos;
- auditar periódicamente workflows, credenciales y accesos.

### Verificación oficial de n8n

**Fecha de revisión:** 15 de julio de 2026

Se comprobó en documentación oficial de n8n que:

- en una instalación autohospedada, el administrador es responsable de proteger el código, la infraestructura y los datos;
- n8n recomienda utilizar un proxy inverso para terminar TLS y cifrar las comunicaciones;
- la base de datos y los archivos de n8n deberán almacenarse en particiones o dispositivos cifrados;
- n8n crea una clave de cifrado aleatoria durante el primer inicio y la utiliza para proteger las credenciales guardadas;
- puede definirse una clave estable mediante `N8N_ENCRYPTION_KEY`;
- la clave de cifrado deberá protegerse y respaldarse separadamente de la base de datos;
- n8n permite configurar la eliminación automática de ejecuciones terminadas;
- `EXECUTIONS_DATA_MAX_AGE` permite establecer la antigüedad máxima de las ejecuciones conservadas;
- puede configurarse qué ejecuciones exitosas, fallidas o manuales se almacenan;
- n8n dispone de una auditoría de seguridad para detectar configuraciones y nodos de riesgo;
- pueden bloquearse nodos como Execute Command o SSH y restringirse módulos disponibles en nodos Code;
- la telemetría diagnóstica puede desactivarse mediante `N8N_DIAGNOSTICS_ENABLED=false`;
- los responsables de una instalación autohospedada deben establecer sus propios procesos de eliminación y atención de derechos.

**Fuentes oficiales:**

- [Privacy and security — What you can do](https://docs.n8n.io/privacy-security/what-you-can-do/)
- [Set a custom encryption key](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/set-a-custom-encryption-key/)
- [Manage execution data](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/manage-execution-data/)
- [Run security audits](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/run-security-audits/)
- [Control telemetry](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/control-telemetry/)
- [Rotate encryption keys](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/rotate-encryption-keys/)

**Pendiente de validación propia:**

- confirmar que existe una clave `N8N_ENCRYPTION_KEY` estable y no expuesta;
- crear un respaldo protegido de la clave de cifrado;
- comprobar el cifrado del volumen donde residen n8n y su base de datos;
- configurar HTTPS mediante proxy inverso;
- definir qué tipos de ejecuciones deben almacenarse;
- aplicar el plazo operativo de 90 días o uno menor a los registros sin incidentes;
- desactivar el almacenamiento de ejecuciones exitosas cuando no sea necesario;
- revisar si los datos de ejecución pueden redactarse o minimizarse;
- ejecutar y documentar la auditoría de seguridad;
- bloquear nodos y módulos que no sean necesarios;
- decidir y documentar la configuración de telemetría;
- realizar una copia de seguridad y una restauración de prueba;
- establecer un procedimiento de actualización y reversión;
- revisar usuarios, permisos, credenciales y workflows antes del piloto.

**Decisión provisional:**

n8n autohospedado es apto de manera condicionada para el MVP comercial. Su aprobación dependerá principalmente de la configuración y de las pruebas realizadas por VetAtiende AI.

## 8. Conclusión general

Ningún proveedor queda aprobado de forma automática para producción.

La evaluación inicial establece:

- Oracle Cloud, Google Workspace, Groq, Cohere, Streamlit y n8n son aptos de manera condicionada;
- Telegram queda autorizado únicamente como canal auxiliar de aviso con información mínima;
- las cuentas gratuitas o personales no deben utilizarse para procesar datos reales;
- todos los proveedores deben configurarse mediante cuentas corporativas y controles de seguridad;
- las transferencias internacionales deberán quedar informadas y documentadas;
- los contratos, acuerdos de tratamiento y subencargados deberán revisarse antes del piloto;
- cualquier cambio de proveedor deberá generar una nueva evaluación.

La aprobación definitiva de cada proveedor dependerá de verificar técnicamente estas condiciones antes de activar producción.









