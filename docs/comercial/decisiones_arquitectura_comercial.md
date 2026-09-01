# Decisiones de arquitectura comercial — VetAtiende AI

**LAB:** LAB-018 a LAB-025
**Estado:** Actualizado con el cierre de LAB-025
**Ámbito:** MVP comercial

Este documento registra las decisiones técnicas, comerciales, de privacidad y seguridad adoptadas para la evolución comercial de VetAtiende AI.

## DAC-001 — Separación entre Challenge y MVP comercial

**Fecha:** 14 de julio de 2026

**Decisión:**

La versión entregada al Challenge permanece congelada en la rama `main`, el commit `9b425b2` y el tag `v1.0.0-challenge`.

Todo el desarrollo comercial se realizará exclusivamente en la rama `mvp-comercial` y en archivos nuevos identificados como comerciales.

**Reglas:**

- no modificar archivos históricos del Challenge;
- no realizar commits comerciales sobre `main`;
- no alterar el tag `v1.0.0-challenge`;
- no modificar funcionalmente la demo académica;
- mantener separados los recursos, datos, workflows y documentación comercial.

**Motivo:**

Proteger la versión actualmente en evaluación y mantener trazabilidad clara entre la entrega académica y la evolución comercial.

---

## DAC-002 — Prohibición de datos reales antes de LAB-018

**Fecha:** 14 de julio de 2026

**Decisión:**

VetAtiende AI no podrá recibir, almacenar ni procesar datos reales de clínicas, trabajadores, tutores o mascotas antes de completar y validar LAB-018.

**Condiciones mínimas previas:**

- inventario y clasificación de datos;
- política de privacidad;
- bases de licitud;
- procedimiento de derechos;
- retención y eliminación;
- revisión de proveedores;
- roles y contratos;
- controles técnicos;
- plan de respuesta ante incidentes.

**Motivo:**

Evitar que el MVP comercial comience a operar con datos personales sin una base legal, contractual y técnica suficiente.

---

## DAC-003 — Despliegue separado y controlado del MVP comercial

**Fecha:** 14 de julio de 2026

**Decisión:**

El MVP comercial y el primer piloto mantendrán Streamlit como interfaz inicial, pero deberán ejecutarse en infraestructura controlada y separada de la demo académica.

**Arquitectura inicial:**

- Streamlit para la interfaz del MVP y del primer piloto;
- n8n autoalojado para la automatización;
- Oracle Cloud como infraestructura inicial;
- conexión mediante HTTPS;
- autenticación para accesos internos;
- separación de recursos por entorno y por clínica;
- secretos almacenados fuera del código;
- registros y respaldos controlados.

La versión alojada en Streamlit Community Cloud seguirá utilizándose únicamente como demostración académica con datos ficticios.

**Motivo:**

Aprovechar la interfaz ya desarrollada sin exponer datos reales en una plataforma de demostración ni mezclar recursos académicos con la operación comercial.

---

## DAC-004 — Privacidad y seguridad desde el diseño

**Fecha:** 14 de julio de 2026

**Decisión:**

Toda nueva función, integración o almacenamiento del MVP comercial deberá evaluarse antes de ser incorporado, considerando privacidad, seguridad y necesidad real del dato.

**Criterios obligatorios:**

- recopilar solo los datos necesarios para la finalidad definida;
- evitar datos personales en registros técnicos cuando no sean indispensables;
- limitar el acceso según función y responsabilidad;
- separar datos de distintas clínicas;
- proteger credenciales, secretos y configuraciones;
- definir retención y eliminación antes de almacenar nuevos datos;
- revisar proveedores antes de enviarles información;
- registrar cambios relevantes de arquitectura y seguridad;
- probar nuevas funciones con datos ficticios antes de usar datos reales.

**Motivo:**

Evitar que la privacidad y la seguridad se agreguen tardíamente como correcciones y asegurar que formen parte de cada decisión técnica del producto.

---

## DAC-005 — Roles de responsable y encargado del tratamiento

**Fecha:** 14 de julio de 2026

**Decisión:**

Como modelo inicial del servicio, cada clínica será responsable de las decisiones sobre los datos personales de sus clientes y trabajadores, mientras que VetAtiende AI actuará como encargado cuando procese esos datos siguiendo instrucciones de la clínica.

**Aplicación inicial:**

- la clínica define las finalidades del tratamiento;
- la clínica determina qué datos solicita a sus clientes;
- VetAtiende AI procesa los datos únicamente para prestar el servicio contratado;
- VetAtiende AI no podrá reutilizar los datos de una clínica para fines propios;
- las obligaciones de ambas partes deberán quedar establecidas en contrato;
- los proveedores tecnológicos serán tratados como posibles subencargados;
- cada clínica conservará control sobre acceso, corrección, exportación y eliminación de sus datos.

Cuando VetAtiende AI trate datos para sus propias finalidades administrativas, comerciales o de seguridad, deberá identificar y documentar separadamente ese tratamiento.

**Motivo:**

Definir desde el inicio quién toma las decisiones sobre los datos y evitar usos incompatibles o responsabilidades ambiguas.


---

## DAC-006 — Aislamiento de datos entre clínicas

**Fecha:** 14 de julio de 2026

**Decisión:**

El MVP comercial deberá impedir que una clínica pueda acceder, consultar, modificar o recibir información perteneciente a otra clínica.

**Aplicación inicial:**

- cada registro deberá quedar asociado a una clínica identificable;
- las credenciales y permisos deberán limitarse a la clínica correspondiente;
- los workflows deberán validar la clínica antes de consultar o registrar datos;
- los calendarios, hojas de cálculo, archivos y canales internos deberán mantenerse separados;
- los registros técnicos deberán permitir identificar qué clínica originó cada operación;
- las exportaciones y respaldos deberán conservar la separación entre clínicas;
- ninguna prueba deberá ejecutarse utilizando datos reales de otra clínica.

Durante el primer piloto podrá utilizarse una separación física de recursos. Una arquitectura compartida solo se permitirá cuando exista aislamiento lógico validado y probado.

**Motivo:**

Evitar accesos cruzados, errores operativos y exposición de datos entre clientes distintos del servicio.

---

## DAC-007 — Minimización de datos enviados a servicios de IA

**Fecha:** 14 de julio de 2026

**Decisión:**

VetAtiende AI deberá reducir al mínimo la información enviada a modelos de inteligencia artificial y servicios externos de procesamiento.

**Aplicación inicial:**

- no enviar nombres completos, teléfonos, correos ni identificadores cuando no sean necesarios;
- no enviar historiales completos cuando baste una consulta limitada;
- separar los datos de agenda de las consultas informativas cuando sea posible;
- utilizar identificadores internos o datos seudonimizados;
- impedir que documentos internos sean consultados desde canales públicos;
- revisar qué información recibe cada proveedor;
- evitar incluir secretos, credenciales o configuraciones en mensajes enviados a modelos;
- registrar y justificar cualquier nueva categoría de datos enviada a un proveedor de IA.

Los modelos de IA no deberán utilizarse como repositorio permanente de información de clientes o clínicas.

**Motivo:**

Reducir la exposición de datos personales, limitar el impacto de posibles incidentes y mantener el tratamiento ajustado a la finalidad del servicio.

---

## DAC-008 — Retención y eliminación por finalidad

**Fecha:** 14 de julio de 2026

**Decisión:**

Los datos personales no deberán conservarse indefinidamente. Cada categoría de información deberá contar con una finalidad, un criterio de retención y un método de eliminación definido.

**Aplicación inicial:**

- identificar la finalidad de cada categoría de datos;
- conservar los datos solo durante el tiempo necesario;
- eliminar o anonimizar información cuando finalice su finalidad;
- considerar obligaciones legales o contractuales antes de eliminar;
- definir plazos específicos antes del primer piloto;
- incluir respaldos, registros técnicos y archivos exportados en el proceso de eliminación;
- documentar excepciones y suspensiones de eliminación;
- permitir que la clínica solicite devolución o eliminación de sus datos al terminar el servicio.

La eliminación deberá ser verificable y abarcar los sistemas bajo control de VetAtiende AI.

**Motivo:**

Reducir la acumulación innecesaria de información, limitar riesgos y asegurar que la conservación de datos responda a una finalidad vigente.

---

## DAC-009 — Evaluación previa de proveedores

**Fecha:** 14 de julio de 2026

**Decisión:**

Ningún proveedor tecnológico podrá recibir datos reales del MVP comercial sin una revisión previa de sus condiciones de privacidad, seguridad, ubicación del tratamiento y obligaciones contractuales.

**Aplicación inicial:**

- identificar qué categorías de datos recibe cada proveedor;
- confirmar la finalidad y necesidad del envío;
- revisar condiciones de uso y tratamiento de datos;
- identificar los países o regiones donde podrían tratarse o almacenarse los datos;
- verificar medidas de seguridad y gestión de incidentes;
- revisar políticas de retención, eliminación y uso para entrenamiento;
- documentar posibles subencargados;
- evaluar alternativas con menor exposición de datos;
- registrar la aprobación o rechazo antes de habilitar el proveedor en producción.

Cuando exista tratamiento o almacenamiento fuera de Chile, deberán documentarse las condiciones y garantías aplicables antes del primer piloto.

**Motivo:**

Evitar transferencias no evaluadas, usos secundarios de información y dependencias con proveedores que no ofrezcan garantías suficientes.

---

## DAC-010 — Gestión de incidentes y trazabilidad

**Fecha:** 14 de julio de 2026

**Decisión:**

El MVP comercial deberá contar con mecanismos para detectar, contener, investigar y documentar incidentes de seguridad o privacidad.

**Aplicación inicial:**

- mantener registros de accesos, ejecuciones y cambios relevantes;
- evitar incluir datos personales innecesarios en los registros técnicos;
- asignar un identificador único a cada incidente;
- clasificar los incidentes según su severidad;
- preservar evidencia sin alterarla;
- revocar credenciales o desactivar integraciones comprometidas;
- informar oportunamente a la clínica afectada;
- documentar causas, impacto, recuperación y medidas preventivas;
- probar periódicamente el procedimiento de respuesta;
- no cerrar un incidente hasta comprobar que el riesgo quedó controlado.

Los registros deberán mantenerse protegidos y accesibles únicamente para personal autorizado.

**Motivo:**

Permitir una respuesta ordenada, reducir el impacto de incidentes y conservar evidencia suficiente para corregir sus causas.

---

## DAC-011 — Límites de la inteligencia artificial y supervisión humana

**Fecha:** 14 de julio de 2026

**Decisión:**

VetAtiende AI funcionará como asistente de recepción y apoyo operativo. No reemplazará el criterio profesional veterinario ni realizará diagnósticos, prescripciones o decisiones clínicas autónomas.

**Aplicación inicial:**

- informar claramente al usuario que interactúa con un asistente virtual;
- limitar las respuestas veterinarias a orientación general y derivación segura;
- identificar señales de urgencia mediante reglas conservadoras;
- derivar los casos urgentes al personal de la clínica;
- no indicar medicamentos, dosis ni tratamientos;
- no confirmar atenciones sin validar disponibilidad;
- permitir revisión humana de alertas, registros y decisiones operativas;
- registrar errores relevantes para mejorar reglas y controles;
- mantener canales para que la clínica intervenga o suspenda la automatización.

Las decisiones que puedan afectar la salud del animal deberán permanecer bajo responsabilidad de profesionales veterinarios.

**Motivo:**

Reducir riesgos para los animales y usuarios, evitar decisiones clínicas automatizadas y mantener una supervisión humana efectiva.


---

## DAC-012 — Infraestructura comercial contenedorizada y exposición mínima

**Fecha:** 21 de julio de 2026

**Decisión:**

El MVP comercial utilizará una infraestructura contenedorizada y separada del Challenge, desplegada inicialmente en Oracle Cloud mediante Docker Compose.

**Implementación validada en LAB-019:**

- Caddy funciona como único punto de entrada público mediante los puertos 80 y 443;
- Streamlit, n8n y los task runners se comunican dentro de la red privada de Docker;
- los puertos internos de n8n, Streamlit y task runners no se publican directamente hacia Internet;
- n8n utiliza task runners externos separados para JavaScript y Python;
- las imágenes y versiones principales quedan fijadas para evitar cambios inesperados;
- los secretos reales se almacenan en el archivo .env del servidor y permanecen fuera del repositorio;
- el repositorio conserva solamente .env.example con valores de reemplazo;
- la plantilla reutilizable se mantiene en infra/comercial/;
- el acceso SSH utiliza llave pública, sin contraseña y sin ingreso directo como root;
- las reglas del firewall permanecen después de reiniciar la instancia;
- los servicios tienen reinicio automático configurado;
- se validaron respaldo completo, comprobación de integridad y restauración de prueba;
- la validación se realizó exclusivamente con datos ficticios.

**Límites pendientes:**

- autenticación de usuarios de la interfaz;
- aislamiento lógico completo entre clínicas;
- dominio comercial definitivo y subdominios separados;
- integración funcional Streamlit, n8n, Luna y agenda;
- autorización para utilizar datos personales reales.

**Motivo:**

Reducir la superficie pública de ataque, mantener separados los componentes internos, proteger los secretos y disponer de una base reproducible antes de incorporar funciones comerciales y datos reales.
---

## DAC-013 — Integración funcional comercial desacoplada

**Fecha:** 22 de julio de 2026

**Decisión:**

La primera integración funcional comercial utilizará Streamlit como interfaz pública, n8n como orquestador y Groq como proveedor del modelo utilizado por Luna.

**Implementación validada en LAB-020:**

- Streamlit y n8n se ejecutan como servicios separados;
- la comunicación entre ambos ocurre dentro de la red privada de Docker;
- Streamlit no accede directamente a credenciales de Groq;
- las credenciales de Groq permanecen exclusivamente en el gestor de credenciales de n8n;
- el webhook comercial utiliza una ruta permanente;
- cada navegador genera una sesión ficticia independiente;
- la solicitud conserva los campos `clinic_id`, `session_id`, `message` y `channel`;
- la respuesta conserva los campos `ok`, `clinic_id`, `session_id` y `reply`;
- Streamlit muestra la respuesta devuelta por Luna y conserva el historial visual de la sesión;
- los secretos no se incluyen en prompts, exports, documentación ni repositorio;
- la validación inicial utiliza únicamente datos ficticios.

**Límites pendientes:**

- autenticación completa de usuarios;
- autorización por roles;
- aislamiento lógico completo entre varias clínicas;
- retención y eliminación de conversaciones;
- habilitación para utilizar datos personales reales.

**Motivo:**

Mantener desacoplada la interfaz del motor de automatización, proteger las credenciales y establecer un contrato estable que pueda reutilizarse en las siguientes funciones comerciales.

---

## DAC-014 — RAG público comercial separado por clínica

**Fecha:** 23 de julio de 2026

**Decisión:**

La información pública utilizada por Luna se administrará mediante una base documental comercial separada por `clinic_id`, sin reutilizar directamente las rutas operativas ni los workflows históricos del Challenge.

**Implementación validada en LAB-021:**

- los documentos controlados y versionados se almacenan bajo `data/comercial/clinica_piloto_001/publico/`;
- la copia operativa del servidor se almacena bajo `/opt/vetatiende-comercial/data/rag/clinica_piloto_001/publico/`;
- n8n accede a los documentos mediante `/home/node/.n8n-files/data/clinica_piloto_001/publico/`;
- el volumen documental está montado en modo de solo lectura para n8n;
- la carpeta RAG operativa de la infraestructura permanece excluida de Git;
- se versionan copias HTML, PDF y CSV, pero la carga operativa inicial utiliza PDF y CSV para evitar contenido duplicado;
- Cohere utiliza un modelo multilingüe para generar embeddings de documentos y consultas en español;
- Luna consulta la información pública mediante una herramienta RAG antes de responder horarios, servicios, precios y preguntas frecuentes;
- cuando la documentación no contiene una respuesta suficiente, Luna debe reconocer que no puede confirmarla y evitar inventar información;
- el workflow comercial se mantiene separado y conserva únicamente los nodos necesarios para el RAG público;
- el contrato de entrada y respuesta definido en LAB-020 se conserva;
- las credenciales de Cohere y Groq permanecen únicamente en n8n;
- no se cargan documentos internos ni datos personales reales.

**Limitación técnica aceptada:**

El almacén vectorial inicial reside en memoria y puede perder su contenido cuando n8n se reinicia. Mientras se mantenga esta solución, los documentos deberán cargarse nuevamente después de una pérdida del almacén.

Antes de ampliar el uso comercial deberá evaluarse una solución vectorial persistente, con separación efectiva entre clínicas, respaldos y controles de acceso.

**Motivo:**

Separar la información pública por clínica, reducir el riesgo de mezclar conocimiento entre clientes y permitir que Luna responda usando documentación controlada en lugar de depender de información fija escrita en el prompt.

## DAC-015 — Agenda médica comercial parametrizable

**Fecha:** 29 de julio de 2026

**Decisión:**

La agenda médica comercial utilizará configuración estructurada por clínica y servicio, estado conversacional persistente y un calendario exclusivo para atenciones médicas.

**Implementación validada en LAB-022:**

- identificación mediante `clinic_id` y `session_id`;
- configuración de duración, intervalo de inicio, jornada, zona horaria, días de búsqueda, alternativas y fechas bloqueadas;
- Google Calendar exclusivo para la agenda médica comercial;
- Data Table exclusiva para el estado conversacional;
- conservación de fecha y hora entregadas por separado;
- validación de fechas pasadas, jornada, duración e intervalo;
- consulta de disponibilidad real;
- presentación de alternativas;
- revalidación antes de confirmar;
- creación del evento solamente cuando la disponibilidad continúa vigente;
- cancelación y reinicio de solicitudes todavía no confirmadas;
- conservación del estado mientras Luna responde consultas informativas;
- respuesta pública limitada a `ok`, `clinic_id`, `session_id` y `reply`.

**Limitaciones aceptadas:**

- no existe todavía cancelación o reprogramación de citas confirmadas;
- no existe bloqueo transaccional distribuido;
- no existe expiración automática de estados;
- no se utilizarán datos personales reales antes de completar la preparación para el piloto.

**Motivo:**

Permitir que distintas clínicas adapten su agenda sin reescribir la lógica central y reducir confirmaciones incorrectas mediante validación y revalidación.

---

## DAC-016 — Agenda separada para peluquería y lavado

**Fecha:** 29 de julio de 2026

**Decisión:**

La agenda comercial de peluquería y lavado permanecerá completamente separada de la agenda médica.

**Implementación validada en LAB-023 el 30 de julio de 2026:**

- Google Calendar exclusivo para peluquería y lavado;
- Data Table exclusiva `lab023_estado_peluqueria`;
- estado conversacional separado mediante `clinic_id::session_id`;
- catálogo propio con baño, corte y baño y corte;
- `lavado` normalizado inicialmente como sinónimo de baño;
- automatización inicial limitada a perros;
- tamaño obligatorio: pequeño, mediano o grande;
- duración determinada únicamente por servicio y tamaño;
- tipo de pelaje opcional y sin efecto en la duración inicial;
- intervalo de inicio configurable e independiente, validado inicialmente en 30 minutos;
- jornada propia de lunes a sábado y domingo sin atención;
- búsqueda inicial de 7 días y entrega de 3 alternativas;
- cálculo completo del término según la duración del servicio;
- prohibición de ofrecer horarios que terminen fuera de la jornada;
- capacidad simultánea inicial igual a 1;
- posibilidad de iniciar una atención cuando termina exactamente la anterior;
- alternativas compatibles con la duración completa;
- revalidación de disponibilidad antes de crear el evento;
- manejo de conflictos y errores sin confirmaciones falsas;
- revisión humana para especies distintas de perro y solicitudes fuera del catálogo;
- conservación del estado de peluquería durante consultas al RAG público;
- separación de calendarios, Data Tables, configuraciones y estados respecto de medicina;
- integración de la rama médica dentro del workflow vigente de LAB-023;
- workflow LAB-022 inactivo y conservado como referencia histórica.

**Motivo:**

Los servicios de peluquería tienen duraciones variables y reglas operativas diferentes de una consulta médica. Mezclar ambas agendas produciría conflictos de capacidad y horarios incorrectos.

---

## DAC-017 — Prioridad de urgencias y alerta interna activa

**Fecha:** 29 de julio de 2026

**Estado:** ampliada y aprobada para LAB-024 el 31 de julio de 2026; reforzada mediante LAB-024.1 el 8 de agosto de 2026.

**Decisión:**

La detección de posibles señales de urgencia tendrá prioridad sobre:

- el RAG público;
- la agenda médica;
- la agenda de peluquería y lavado;
- consultas generales;
- seguimientos;
- respuestas comerciales;
- precios y promociones;
- continuaciones de reservas abiertas.

La detección se ejecutará después de normalizar la entrada y validar `session_id` y `clinic_id`, pero antes de cargar, leer o procesar cualquier estado de agenda.

**Clasificación aprobada:**

La estrategia será híbrida y conservadora:

- reglas deterministas con prioridad;
- contexto breve de la misma sesión;
- IA controlada únicamente para casos ambiguos;
- fallback conservador cuando la IA falle o entregue una salida inválida;
- imposibilidad de que la IA rebaje una señal determinista clara.

Las prioridades operativas serán:

- `prioridad_inmediata`;
- `prioridad_preventiva`;
- `sin_prioridad`.

Estos estados son operativos y no representan diagnóstico ni triaje veterinario profesional.

La detección deberá diferenciar:

- caso actual;
- caso negado;
- caso histórico;
- pregunta informativa;
- situación hipotética;
- contexto insuficiente.

**Contexto conversacional inicial:**

- máximo de tres mensajes recientes del usuario;
- ventana inicial de 30 minutos;
- aislamiento mediante `clinic_id::session_id`;
- las respuestas de Luna no se utilizarán como evidencia clínica.

**Respuesta pública:**

La respuesta deberá:

- ser breve, clara y segura;
- recomendar contacto o atención veterinaria inmediata cuando corresponda;
- indicar que no se debe esperar una confirmación de agenda;
- indicar que no se debe esperar una respuesta por el chat antes de buscar atención;
- excluir publicidad, promociones y mensajes comerciales;
- usar plantillas controladas por clínica.

La respuesta no deberá:

- diagnosticar;
- asegurar o descartar gravedad;
- prescribir medicamentos o tratamientos;
- recomendar provocar vómito;
- prometer que un profesional responderá;
- afirmar que el equipo fue avisado;
- reemplazar atención urgente por una cita normal.

**Datos mínimos:**

La alerta deberá poder generarse con los datos ya disponibles.

No será obligatorio solicitar:

- nombre del tutor;
- teléfono;
- nombre de la mascota;
- datos completos de ficha.

El teléfono no será un dato prioritario en una urgencia.

Cuando exista un identificador de contacto o conversación entregado por el canal público, se utilizará esa referencia sin volver a solicitar el número.

Solo se podrá solicitar una pregunta breve de seguridad o una ubicación general cuando sea realmente necesario, sin retrasar la recomendación de atención.

**Arquitectura de canales:**

La lógica central de urgencias será independiente del canal público y del canal interno.

VetAtiende AI deberá permitir implementaciones según los requerimientos de cada clínica.

Canales públicos posibles:

- Streamlit;
- WhatsApp;
- sitio web;
- aplicación propia;
- otro canal integrado.

Canales internos posibles:

- Telegram;
- WhatsApp;
- correo electrónico;
- aplicación interna;
- webhook;
- otro canal configurado.

Para el piloto de LAB-024 se utilizará:

- Streamlit como canal público;
- Telegram como adaptador interno de alertas.

Telegram no será una dependencia comercial definitiva.

**Configuración privada aprobada para el adaptador Telegram del piloto:**

- el identificador real del destino se mantiene únicamente en el `.env` operativo mediante `VETATIENDE_TELEGRAM_ALERT_CHAT_ID`;
- `infra/comercial/compose.yaml` referencia `${VETATIENDE_TELEGRAM_ALERT_CHAT_ID}` sin contener el valor real;
- ambos nodos Telegram del workflow utilizan `{{ $env.VETATIENDE_TELEGRAM_ALERT_CHAT_ID }}`;
- `N8N_BLOCK_ENV_ACCESS_IN_NODE` se establece en `"false"` para permitir la resolución de la variable durante la ejecución;
- el destino privado no se exporta ni se versiona;
- el acceso a variables del contenedor queda limitado operacionalmente a workflows administrados por editores de confianza y no deberá utilizarse para exponer otros secretos de infraestructura.

**Estructuras internas aprobadas:**

Se utilizarán tres Data Tables separadas:

- `lab024_estado_urgencia`;
- `lab024_alertas_urgencia`;
- `lab024_intentos_notificacion`.

Sus responsabilidades serán:

- contexto y episodio activo por sesión;
- historial trazable de aperturas, actualizaciones y escalaciones;
- registro independiente de cada intento de notificación.

**Deduplicación:**

La deduplicación se realizará por episodio.

Configuración operativa inicial:

- contexto de 30 minutos;
- supresión de avisos idénticos durante 10 minutos;
- máximo de tres mensajes recientes.

Una repetición sin empeoramiento:

- conservará el mismo episodio;
- registrará una actualización;
- no enviará un aviso interno idéntico;
- mantendrá la respuesta pública segura.

Un escalamiento:

- conservará el episodio;
- registrará un nuevo evento;
- generará un nuevo aviso interno.

**Reservas abiertas:**

Ante una señal prioritaria:

- la reserva médica no se eliminará ni modificará;
- la reserva de peluquería no se eliminará ni modificará;
- no se consultará Calendar;
- no se ofrecerán alternativas;
- no se confirmarán citas;
- el flujo comercial quedará suspendido.

Una cita normal nunca sustituirá la atención veterinaria urgente.

**Errores internos:**

Un fallo interno nunca deberá impedir la recomendación pública de buscar atención.

Se deberán manejar de forma independiente:

- errores de lectura o guardado del estado;
- errores del registro histórico;
- errores de la tabla de intentos;
- fallos de IA;
- fallos de Telegram;
- canal no configurado;
- credenciales inválidas;
- errores transitorios.

La respuesta pública no dependerá del éxito del registro o la notificación.

Nunca se afirmará que el equipo fue avisado cuando no exista confirmación real del envío.

**Contrato público:**

Las respuestas mantendrán únicamente:

- `ok`;
- `clinic_id`;
- `session_id`;
- `reply`.

No se expondrán:

- identificadores de alertas o episodios;
- prioridad;
- categoría;
- reglas activadas;
- resultado de Telegram;
- estado de notificación;
- errores técnicos;
- nombres de nodos;
- nombres de Data Tables;
- configuraciones internas.

Una urgencia procesada y respondida correctamente utilizará `ok = true`, aunque una operación interna haya fallado.

**Seguridad y validación:**

- utilizar exclusivamente datos ficticios durante el desarrollo y las pruebas;
- no incorporar credenciales o secretos al JSON exportado;
- sanitizar errores técnicos;
- probar falsos positivos y falsos negativos;
- probar deduplicación y escalamiento;
- probar fallos de IA, Data Tables y Telegram;
- repetir la regresión completa de RAG, agenda médica y peluquería;
- limpiar todos los datos ficticios antes del cierre;
- mantener LAB-023 activo hasta la validación completa de LAB-024.

**Motivo:**

Una posible urgencia requiere una ruta prioritaria, conservadora y honesta.

La automatización no debe retrasar la derivación, entregar una falsa sensación de atención profesional ni depender de un canal específico elegido para el piloto.

La separación entre lógica de urgencias, canal público y canal interno permite adaptar VetAtiende AI a las necesidades operativas de cada clínica sin rediseñar el núcleo del sistema.
### Ampliación LAB-024.1

La auditoría complementaria posterior al cierre de LAB-024 confirmó que la estrategia híbrida aprobada en DAC-017 continúa siendo válida, pero el gate previo a la clasificación IA requería mayor cobertura para determinados eventos críticos.

Se aprueban los siguientes refuerzos:

- el gate hacia IA puede ampliarse para situaciones clínicas o accidentales potencialmente prioritarias que no queden resueltas por reglas deterministas;
- la ampliación debe ser específica y no debe convertir síntomas comunes aislados en alertas internas automáticas;
- las negaciones deben neutralizar únicamente la señal negada y no cancelar otras señales positivas presentes en el mismo mensaje;
- una señal prioritaria actual debe prevalecer sobre un antecedente histórico;
- un antecedente histórico acompañado de bienestar actual no debe abrir un episodio urgente;
- las preguntas informativas, situaciones hipotéticas, casos negados y referencias exclusivas a animales ajenos deben permanecer fuera de la ruta urgente cuando no exista otra señal prioritaria activa;
- la IA continúa subordinada a las reglas deterministas y no puede rebajar una señal determinista clara.

Las regresiones de LAB-024.1 validaron además:

- detección controlada de asfixia mediante IA con resultado `prioridad_inmediata` y categoría `respiratoria`;
- exclusión correcta de una electrocución explícitamente negada;
- conservación de dificultad respiratoria activa aunque otra señal del mismo mensaje esté negada;
- diferenciación entre electrocución histórica con bienestar actual y electrocución histórica seguida de dificultad respiratoria actual;
- ausencia de activación prioritaria para tos aislada;
- exclusión de casos referidos únicamente a otro animal ajeno.

LAB-024.1 no modifica:

- las prioridades operativas de DAC-017;
- el contrato público;
- la arquitectura de canales;
- el modelo de episodios y deduplicación;
- las Data Tables aprobadas;
- la cantidad total de 208 nodos del workflow.

El reconocimiento humano de alertas, temporizadores de respuesta, escalamiento y demás funciones internas protegidas no forman parte de LAB-024.1 y permanecen como evolución posterior de la operación interna.

---## DAC-018 — Operación interna protegida y RAG interno comercial

**Fecha:** 29 de julio de 2026

**Decisión:**

Las funciones internas de la clínica utilizarán acceso autenticado, permisos por rol y recursos separados del canal público.

**Aplicación prevista para LAB-025:**

- acceso interno protegido;
- RAG interno separado del RAG público;
- documentos internos identificados por clínica;
- procedimientos, protocolos, stock y operación disponibles solamente para personal autorizado;
- gestión de alertas, derivaciones, pendientes y tareas internas;
- rutas y controles diferentes del webhook público;
- registro de operaciones relevantes;
- prohibición de recuperar información interna desde Luna pública;
- revisión humana de casos que la automatización no pueda completar con seguridad.

**Motivo:**

La operación interna contiene información y acciones que no deben quedar expuestas a clientes ni mezclarse con el conocimiento público.

### Ampliación aprobada para LAB-025 — 13 de agosto de 2026

**Separación física y workflows:**
- LAB-025 será un workflow interno independiente de LAB-024/LAB-024.1;
- LAB-024/LAB-024.1 permanecerá como workflow público vigente mientras se construye LAB-025;
- la aplicación interna será separada de Streamlit público;
- no existirá un modo interno activable desde el canal público;
- el RAG interno no tendrá ninguna ruta accesible desde Luna pública.

**Autenticación e identidad:**
- el acceso interno utilizará OIDC mediante un proveedor de identidad configurable;
- el proveedor de identidad autentica quién es la persona y VetAtiende decide qué puede hacer;
- la arquitectura no quedará acoplada a un proveedor específico;
- n8n no gestionará contraseñas de trabajadores;
- la identidad interna se resolverá mediante `user_id`, `clinic_id`, rol, estado y permisos;
- no se confiará en roles o identidades declarados en texto libre ni enviados sin verificación desde el navegador.

**Autorización:**
- autenticación y autorización serán controles separados;
- la autorización ocurrirá antes de consultar RAG, ejecutar IA o modificar recursos;
- los roles iniciales serán `recepcion`, `veterinario` y `administrador`;
- los permisos serán concretos y no equivaldrán automáticamente al nombre del rol;
- toda operación sensible revalidará usuario activo, `clinic_id` y permiso requerido;
- un usuario de una clínica no tendrá acceso a recursos de otra;
- los usuarios con historial se desactivarán mediante estado y no se eliminarán físicamente.

**RAG interno protegido:**
- contendrá procedimientos de recepción, procedimientos administrativos, protocolos operativos, manejo interno de urgencias, aislamiento, limpieza, coordinación, stock e instrucciones internas autorizadas;
- los documentos internos deberán incluir como mínimo `document_id`, `clinic_id`, tipo de documento, nivel de acceso, estado, versión y fecha de actualización;
- la recuperación se filtrará por `clinic_id`, nivel autorizado y estado documental antes de entregar contexto al modelo;
- si no existe información suficiente, Luna interna no inventará y derivará a revisión humana;
- credenciales, contraseñas, tokens, API keys, secretos de infraestructura y variables privadas no formarán parte del RAG.

**Separación entre conocimiento y ficha clínica:**
- RAG público: información general y pública de la clínica;
- RAG interno: conocimiento privado operativo y documental de la clínica;
- vacunas, exámenes, consultas, tratamientos y documentos clínicos de cada mascota pertenecerán a una futura ficha clínica/paciente separada y no al RAG;
- una futura interfaz del tutor podrá entregar acceso protegido a datos y documentos de sus propias mascotas después de autenticar al tutor y verificar su vínculo con el paciente.

**Operación humana:**
- LAB-025 incorporará alertas, pendientes, derivaciones y tareas como recursos operativos separados;
- los estados iniciales de una alerta serán `pendiente`, `reconocida`, `en_atencion` y `cerrada`;
- las alertas pertenecen a la clínica y no quedan bloqueadas a una sola persona;
- el reconocimiento, atención y cierre registrarán actor y fecha;
- Telegram seguirá siendo únicamente adaptador piloto de notificación y no administrará estados;
- temporizadores y escalamiento automático por falta de reconocimiento quedan fuera de la implementación inicial, aunque la estructura deberá permitirlos posteriormente.

**Auditoría y errores:**
- las acciones internas relevantes deberán registrar actor, acción, recurso, momento y resultado;
- el historial de auditoría no se modificará desde la operación normal;
- denegaciones y fallos sensibles podrán auditarse mediante motivos técnicos controlados;
- no se expondrán nombres de nodos, stack traces, URLs internas, secretos, variables de entorno ni detalles de infraestructura;
- las operaciones importantes confirmarán persistencia real antes de informar éxito.

**Pruebas mínimas:**
- autenticación válida;
- rechazo de usuarios no registrados e inactivos;
- aislamiento entre clínicas;
- permisos por rol;
- RAG filtrado correctamente;
- ausencia de invención cuando falte información;
- reconocimiento y gestión de alertas con trazabilidad;
- persistencia de pendientes, derivaciones y tareas;
- auditoría;
- sanitización de errores;
- regresión de separación entre LAB-024/LAB-024.1 y el entorno interno.

**Contexto de etapa:**

VetAtiende AI se encuentra en la pre-implementación del primer piloto comercial. Aunque la rama conserva el nombre histórico `mvp-comercial`, las decisiones de LAB-025 se evalúan para operación real del piloto y no como un MVP experimental.

### Implementación y cierre de LAB-025 — 31 de agosto de 2026

**Estado:** implementado, validado y publicado.

La ampliación aprobada para DAC-018 fue llevada a implementación sin ampliar el alcance funcional del laboratorio.

Quedó validado:

- aplicación interna separada de Streamlit público y publicada bajo `/interno/`;
- autenticación OIDC y autorización interna independiente del proveedor de identidad;
- validación de usuario registrado, activo, clínica, rol y permiso antes de RAG, IA u operaciones sensibles;
- aislamiento lógico por `clinic_id` en usuarios, recursos y consultas;
- roles iniciales `recepcion`, `veterinario` y `administrador` con permisos concretos;
- RAG interno privado en Qdrant, separado del RAG público y filtrado por clínica, nivel autorizado y estado documental;
- entrega a Luna interna únicamente de fragmentos confiables con umbral inicial de `0.50` y derivación humana cuando no existe respaldo suficiente;
- operación de alertas, pendientes, derivaciones y tareas con validación de persistencia;
- auditoría de operaciones relevantes y denegaciones controladas;
- errores sanitizados sin exposición de secretos, URLs internas, nombres de nodos ni stack traces;
- integración LAB-024/LAB-024.1 → LAB-025 mediante alerta operativa deduplicada, conservando `alert_id`, `episode_id` y `clinic_id`;
- OIDC real probado en el entorno controlado del piloto;
- rotación de la clave interna después de una exposición controlada y eliminación de temporales;
- paquete reproducible de la aplicación interna sin secretos reales.

Durante el cierre se corrigieron dos dependencias operativas que afectaban la regresión integrada, sin reabrir el alcance histórico de LAB-024/LAB-024.1:

- LAB-024 utiliza `openai/gpt-oss-120b` tanto para Luna pública como para la clasificación IA de urgencias, sustituyendo el modelo retirado;
- los task runners externos quedaron configurados con concurrencia `5` y autoapagado `15`, eliminando el timeout JavaScript reproducible en la ruta de clasificación ambigua.

Se mantienen fuera de LAB-025 los temporizadores y escalamiento automático por falta de reconocimiento, cancelación y reprogramación de citas confirmadas, recordatorios y seguimientos automáticos, comunicaciones comerciales, ficha clínica completa y portal del tutor.

**Resultado:** DAC-018 queda implementada para LAB-025 y conserva la separación entre conocimiento público, conocimiento interno y futura ficha clínica del paciente.

---

## DAC-019 — Cancelación y reprogramación de citas confirmadas

**Fecha:** 29 de julio de 2026

**Decisión:**

Cancelar una solicitud conversacional abierta será una operación distinta de cancelar o modificar una cita ya confirmada en Calendar.

**Aplicación prevista para LAB-026:**

- localización segura del evento correcto;
- verificación adicional de quien solicita la operación;
- prohibición de utilizar solamente `session_id` como autorización;
- protección contra modificaciones de citas ajenas;
- cancelación efectiva del evento;
- liberación del horario;
- trazabilidad de la operación;
- búsqueda y revalidación del nuevo horario para reprogramar;
- conservación de la cita original hasta asegurar el nuevo horario;
- confirmación pública solamente después de completar la integración;
- derivación humana cuando la identidad o la cita no puedan verificarse.

La verificación podrá evolucionar hacia teléfono, código temporal, enlace único o revisión interna.

**Motivo:**

La modificación de eventos confirmados tiene mayor impacto y riesgo que abandonar una conversación de agenda todavía abierta.

---

## DAC-020 — Seguimientos, recordatorios y contactos pendientes

**Fecha:** 29 de julio de 2026

**Decisión:**

VetAtiende AI incorporará comunicaciones operativas previas y posteriores a las atenciones, manteniéndolas separadas de la publicidad y del criterio clínico profesional.

**Aplicación prevista para LAB-027:**

- recordatorios previos;
- confirmación de asistencia;
- registro de clientes que no responden;
- citas no presentadas;
- solicitudes de contacto;
- seguimientos posteriores autorizados;
- tareas pendientes para el personal;
- estados de seguimiento;
- cierre trazable;
- derivación humana cuando una respuesta indique riesgo o requiera evaluación veterinaria.

**Motivo:**

El acompañamiento antes y después de una cita mejora la coordinación, pero no debe transformarse en diagnóstico, tratamiento automático ni publicidad encubierta.

---

## DAC-021 — Comunicaciones y avisos comerciales configurables

**Fecha:** 29 de julio de 2026

**Decisión:**

Los mensajes comerciales serán contextuales, autorizados, configurables por clínica y subordinados a la seguridad veterinaria.

**Aplicación prevista para LAB-028:**

- promociones y recomendaciones definidas por la clínica;
- posibilidad de activar o desactivar comunicaciones;
- respeto de consentimiento y preferencias;
- uso solamente en canales permitidos;
- separación respecto de mensajes clínicos y operativos;
- exclusión durante urgencias, reclamos, derivaciones o situaciones sensibles;
- ausencia de presión indebida;
- trazabilidad de reglas y campañas activas;
- prohibición de inventar productos, precios o promociones.

**Motivo:**

La función comercial forma parte del diseño del producto, pero nunca debe desplazar una necesidad veterinaria ni afectar la confianza del usuario.

---

## DAC-022 — RAG persistente y gestión documental versionada

**Fecha:** 29 de julio de 2026

**Decisión:**

El trigger `Recargar RAG al iniciar n8n` y el Simple Vector Store en memoria serán considerados una solución transitoria de desarrollo.

Antes del piloto, el conocimiento público e interno deberá migrar a almacenamiento vectorial persistente.

**Aplicación prevista para LAB-029:**

- persistencia después de reinicios;
- separación efectiva por `clinic_id`;
- separación entre conocimiento público e interno;
- metadatos de documento, versión, visibilidad, hash, fecha y estado;
- carga controlada;
- actualización incremental cuando sea posible;
- creación de una versión nueva sin borrar primero la versión activa;
- prueba de recuperación antes de activar la nueva versión;
- conservación de la última versión válida si la actualización falla;
- respaldos y restauración;
- verificación de salud y disponibilidad;
- prohibición de mezclar fragmentos entre clínicas.

**Relación con DAC-014:**

DAC-014 conserva el registro histórico de la solución inicial validada en LAB-021. Esta decisión establece la evolución obligatoria antes del piloto.

**Motivo:**

La disponibilidad del conocimiento no debe depender de reconstruir completamente el índice después de cada reinicio ni de una carga que pueda dejar a Luna temporalmente sin información.

---

## DAC-023 — Configuración administrable por clínica

**Fecha:** 29 de julio de 2026

**Decisión:**

La configuración comercial deberá separarse por clínica y administrarse mediante un acceso protegido.

**Aplicación prevista para LAB-030:**

Cada clínica podrá configurar, según permisos:

- servicios;
- precios;
- duraciones;
- intervalos;
- jornadas;
- fechas bloqueadas;
- calendarios;
- cantidad de alternativas;
- documentos públicos;
- documentos internos;
- contactos de urgencia;
- canales de alerta;
- reglas de derivación;
- recordatorios;
- seguimientos;
- mensajes comerciales;
- textos visibles para sus clientes.

La configuración de una clínica no deberá afectar a otra.

**Motivo:**

Una solución comercial no puede depender de modificar manualmente el workflow cada vez que una clínica cambie un horario, servicio o regla operativa.

---

## DAC-024 — Modelo inicial de capacidad de las agendas

**Fecha:** 29 de julio de 2026

**Decisión:**

El primer piloto utilizará inicialmente el modelo:

`un calendario = una capacidad simultánea`

**Alcance:**

- una agenda médica representa un recurso disponible a la vez;
- una agenda de peluquería representa un recurso disponible a la vez;
- los eventos bloquean completamente el intervalo entre inicio y término;
- las agendas médica y de peluquería utilizan calendarios diferentes.

**Limitación conocida:**

Las clínicas con varios veterinarios, peluqueros, salas, puestos o equipos compartidos requerirán posteriormente un modelo de recursos y capacidad múltiple.

**Motivo:**

Mantener una arquitectura verificable para el primer piloto sin introducir prematuramente una planificación compleja de múltiples recursos.
