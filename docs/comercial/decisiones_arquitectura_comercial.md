# Decisiones de arquitectura comercial — VetAtiende AI

**LAB:** LAB-018 a LAB-019
**Estado:** Actualizado con el cierre de LAB-019
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
