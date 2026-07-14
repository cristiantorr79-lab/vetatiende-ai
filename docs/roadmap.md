# Roadmap oficial MVP Operativo - VetAtiende AI

## 1. Enfoque

VetAtiende AI se desarrolla como un MVP operativo para clínicas veterinarias pequeñas y medianas.

La entrega del Challenge de Agentes de IA de Alura/ONE corresponde a la primera versión funcional del producto, no a una demostración separada.

El objetivo es construir un asistente capaz de operar en un contexto real inicial de clínica veterinaria, con separación entre clientes externos y personal autorizado.

---

## 2. Arquitectura general del MVP

### 2.1 Flujo público

```text
Cliente externo
→ Luna recepción
→ detección de urgencia e intención
→ RAG público o agenda
→ herramientas públicas autorizadas
→ respuesta o registro operativo
```

El flujo público puede responder sobre:

- horarios;
- servicios;
- precios referenciales;
- peluquería y lavado;
- farmacia presencial;
- Pet Shop presencial;
- preparación general;
- cuidados generales no diagnósticos;
- derivación ante urgencias;
- solicitudes de agenda;
- disponibilidad médica;
- disponibilidad de peluquería y lavado.

El flujo público no puede acceder a procedimientos internos.

### 2.2 Flujo interno

```text
Personal autorizado
→ acceso protegido
→ Luna Interna
→ RAG interno
→ herramientas internas autorizadas
```

El flujo interno puede responder sobre:

- procedimientos de recepción;
- triaje inicial no diagnóstico;
- aislamiento;
- manejo administrativo de urgencias;
- registro operativo de faltas de stock;
- derivación al veterinario responsable;
- revisión de solicitudes internas cuando exista una fuente conectada.

El flujo interno no debe exponerse como canal público.

---

## 3. Regla de seguridad de acceso

La separación entre cliente externo y personal interno no depende de frases escritas por el usuario.

No se considera autorización válida que alguien escriba:

- “Soy supervisor”.
- “Soy veterinario”.
- “Trabajo en recepción”.
- “Modo interno”.
- “Soy personal de la clínica”.

El acceso interno depende de un canal protegido y de una clave enviada mediante Header Auth.

---

## 4. Plan original del Challenge

Esta sección conserva el diseño inicial del proyecto como referencia histórica.

Durante la ejecución, el MVP superó el plan original y se agregaron nuevas etapas para disponibilidad proactiva, alertas activas, Streamlit y agenda separada de peluquería.

### LAB-006 - Seguridad de acceso y separación de canales

**Estado:** Cerrado

Objetivo original:

- separar el flujo público del flujo interno;
- proteger el acceso a documentación interna;
- impedir que un cliente obtenga procedimientos internos declarando ser trabajador.

Resultado:

- workflow público sin acceso a RAG interno;
- workflow interno separado;
- Webhook interno protegido;
- validación de rechazo sin autorización;
- acceso correcto con Header Auth.

### LAB-007 - Agenda operativa

**Estado:** Cerrado

Objetivo original:

- integrar Google Calendar como fuente real de disponibilidad;
- confirmar horas solo cuando exista disponibilidad validada;
- solicitar datos mínimos antes de agendar.

Resultado:

- agenda médica integrada;
- citas de 30 minutos;
- extracción de tutor, mascota, teléfono, fecha y hora;
- creación de eventos en Google Calendar.

### LAB-008 - Registro operativo básico

**Estado:** Cerrado

Objetivo original:

- registrar información operativa sin mezclar conocimiento público e interno.

Resultado:

- registros en Google Sheets;
- citas confirmadas;
- alertas de urgencia;
- contactos pendientes;
- faltas de stock;
- observaciones autorizadas.

### LAB-009 - Seguridad veterinaria integrada

**Estado:** Cerrado

Objetivo original:

- asegurar que las urgencias veterinarias corten el flujo normal.

Resultado:

- reglas explícitas de urgencia;
- derivación inmediata;
- bloqueo de agenda ante casos críticos;
- respuestas sin diagnóstico ni tratamientos de riesgo.

### LAB-010 - Pruebas integrales del MVP

**Estado:** Cerrado

Objetivo original:

- validar VetAtiende AI como producto operativo inicial.

Resultado:

- RAG público validado;
- RAG interno protegido validado;
- agenda médica validada;
- registros operativos validados;
- seguridad veterinaria validada;
- separación de canales validada.

### LAB-011 - Deploy en OCI

**Estado:** Cerrado

Objetivo original:

- desplegar VetAtiende AI en Oracle Cloud Infrastructure usando Docker.

Resultado:

- n8n desplegado en OCI;
- workflows principales importados;
- credenciales configuradas fuera del repositorio;
- documentos RAG disponibles en el servidor;
- webhooks público e interno operativos;
- integraciones con Groq, Cohere, Google Calendar y Google Sheets validadas.

### LAB-012 - README final y entrega

**Estado del plan original:** Reemplazado por el roadmap ampliado

En el plan inicial, LAB-012 correspondía al README final y entrega.

Durante el desarrollo se decidió extender el MVP antes del cierre. Por eso LAB-012 fue reutilizado para disponibilidad proactiva y la entrega final pasó a LAB-015.

---

## 5. Roadmap ampliado y estado real

### LAB-012 - Disponibilidad proactiva de agenda

**Estado:** Cerrado

Resultado:

- Luna ofrece horarios reales cuando el cliente solicita agendar sin fecha u hora exacta;
- propone tres alternativas cuando el horario solicitado está ocupado;
- filtra alternativas según mañana, tarde o día solicitado;
- interpreta expresiones habituales en Chile;
- registra correctamente tutor, mascota y teléfono;
- evita confirmar citas sin disponibilidad validada.

### LAB-013 - Aviso activo de urgencias por Telegram interno

**Estado:** Cerrado

Resultado:

- urgencias detectadas en el flujo público;
- registro correcto en Google Sheets;
- aviso activo enviado a un grupo privado interno de Telegram;
- respuesta segura de Luna al cliente;
- workflow exportado y sanitizado;
- sin token ni chat ID real en el repositorio.

### LAB-014 - Interfaz Streamlit y agenda separada de peluquería

**Estado:** Cerrado

Resultado de interfaz:

- modo cliente externo funcional;
- modo interno protegido simple;
- variables sensibles cargadas desde `.env`;
- memoria conversacional básica;
- limpieza manual de conversación;
- respuestas visibles desde el navegador;
- manejo de errores de conexión.

Resultado de agenda médica:

- regresión médica validada;
- citas de 30 minutos;
- extracción de datos mínimos;
- interpretación de fecha y hora;
- creación en Google Calendar;
- registro en Google Sheets.

Resultado de peluquería y lavado:

- Google Calendar separado;
- Google Sheets separado;
- pestaña `agenda_peluqueria`;
- baño de 90 minutos;
- baño y corte de 120 minutos;
- corte de pelo de 120 minutos;
- consulta de disponibilidad real;
- tres alternativas compatibles con la duración;
- validación nuevamente antes de crear el evento;
- bloqueo completo de la duración;
- sin citas que terminen fuera de la jornada;
- agenda ambigua resuelta preguntando el tipo de servicio.

Resultado de urgencias:

- regresión validada;
- corte de agenda médica y de peluquería;
- registro en Sheets;
- alerta por Telegram;
- respuesta correcta en Streamlit.

Evidencia:

- `docs/evidencias/lab014_interfaz_streamlit_challenge.md`

Commit de cierre:

```text
76d827d feat: implementa interfaz Streamlit y agenda de peluquería LAB-014
```

---

## 6. Laboratorio actual

### LAB-015 - README final, evidencias y entrega del Challenge

**Estado:** Cerrado

Objetivo:

Dejar el repositorio listo para evaluación final del Challenge de Agentes de IA de Alura/ONE.

Trabajo realizado:

- README final completo;
- arquitectura real documentada;
- RAG público e interno explicados;
- agenda médica documentada;
- agenda separada de peluquería y lavado documentada;
- Streamlit documentado;
- despliegue en OCI documentado;
- urgencias con Telegram documentadas;
- instrucciones de ejecución;
- variables de entorno;
- ejemplos de uso;
- medidas de seguridad;
- limitaciones actuales;
- evidencias enlazadas;
- evolución comercial prevista.

Validaciones realizadas:

- UTF-8 válido;
- enlaces locales válidos;
- diagrama Mermaid presente;
- bloques Markdown cerrados;
- ausencia de patrones básicos de secretos;
- evidencia LAB-015 creada;
- `git diff --check` sin errores.

Cierre validado:

- README final actualizado;
- roadmap actualizado con el estado real del proyecto;
- evidencia LAB-015 creada;
- documentación final revisada;
- archivos esenciales verificados;
- sintaxis Python y workflows JSON validados;
- auditoría básica de secretos completada;
- cambios preparados para commit y publicación.

Criterio de salida:

El repositorio puede ser enviado al Challenge y mostrado como MVP operativo inicial.

Evidencia:

- `docs/evidencias/lab015_readme_final_entrega_challenge.md`

---

## 7. Laboratorio actual

### LAB-016 - Demo pública segura e interactiva

**Estado:** Cerrado

**Objetivo:**

Publicar una demo interactiva de VetAtiende AI para que compañeros del bootcamp y evaluadores puedan conversar con Luna desde una URL pública, sin exponer el modo interno ni generar efectos sobre los recursos operativos reales.

**Alcance implementado:**

- crear una interfaz pública exclusiva en `app/streamlit_public_app.py`;
- explicar claramente qué es VetAtiende AI y qué puede hacer Luna;
- mantener la conversación durante la sesión;
- incluir preguntas sugeridas para facilitar las pruebas;
- mostrar una advertencia visible sobre los límites académicos y veterinarios;
- publicar la interfaz mediante Streamlit Community Cloud;
- utilizar Secrets para configurar el webhook de demostración;
- documentar y validar la demo antes de publicarla.

**Separación obligatoria entre demo y producción:**

La demo utiliza un webhook exclusivo de demostración y permanece aislada del entorno operativo real.

Los usuarios públicos no podrán:

- crear citas en los calendarios operativos reales;
- registrar información en las planillas operativas reales;
- enviar alertas al Telegram interno real;
- acceder al webhook interno protegido;
- consultar el RAG interno;
- visualizar claves, tokens, credenciales, identificadores privados o direcciones IP operativas.

**Arquitectura implementada:**

    Usuario público
    → Streamlit Community Cloud
    → app/streamlit_public_app.py
    → webhook exclusivo de demostración
    → reglas públicas y RAG público
    → agenda simulada o recursos exclusivos de demostración
    → orientación segura de urgencias sin Telegram real
    → respuesta de Luna

**Decisión técnica aprobada:**

DA-030 establece que LAB-016 utilizará:

- una aplicación Streamlit pública independiente;
- un workflow n8n de demostración completamente separado;
- agenda médica simulada;
- agenda de peluquería y lavado simulada;
- orientación segura de urgencias sin Telegram ni registros reales;
- acceso exclusivo al RAG público;
- ninguna conexión con Calendar, Sheets o el canal interno operativo.

El entorno demo deberá poder activarse o desactivarse sin afectar producción.

**Contenido mínimo de la interfaz:**

- título `VetAtiende AI`;
- subtítulo `Asistente virtual para clínicas veterinarias`;
- explicación breve del propósito de Luna;
- lista de capacidades;
- preguntas sugeridas;
- conversación visible durante la sesión;
- opción para limpiar la conversación;
- advertencia de demo académica.

**Capacidades que se mostrarán:**

- consultar servicios, precios y horarios;
- solicitar una hora veterinaria;
- consultar peluquería y lavado;
- recibir orientación segura ante una posible urgencia.

**Criterios de validación:**

- existe una URL pública funcional;
- la interfaz explica claramente el propósito de VetAtiende AI;
- Luna responde consultas públicas;
- la conversación se conserva durante la sesión;
- las preguntas sugeridas funcionan;
- no existe acceso visible ni técnico al modo interno;
- no se crean citas reales;
- no se modifican planillas operativas reales;
- no se envían alertas reales por Telegram;
- no se exponen secretos ni identificadores privados;
- el repositorio no contiene archivos `.env`;
- la demo puede desactivarse sin afectar producción;
- las pruebas y evidencias quedan documentadas antes del commit final.

**Fuera de alcance:**

- publicar el modo interno;
- convertir Streamlit en la aplicación comercial definitiva;
- atender urgencias reales desde la demo;
- conectar WhatsApp Business;
- implementar usuarios, roles o administración multiempresa;
- modificar producción antes de validar el aislamiento.

**Criterio de salida:**

VetAtiende AI cuenta con una demo pública, clara, segura y aislada, apta para recibir retroalimentación de compañeros y evaluadores.

---

**Resultado validado:**

- demo pública desplegada en Streamlit Community Cloud;
- URL pública: [Abrir VetAtiende AI](https://vetatiende-ai-nwg6exgqvha5zst2fyvpxw.streamlit.app/);
- interfaz pública separada del modo operativo e interno;
- workflow n8n independiente para demostración segura;
- consultas públicas mediante RAG validadas;
- agenda médica simulada validada;
- peluquería y lavado simulados validados;
- orientación segura ante urgencias validada;
- sin creación de citas reales, registros en Google Sheets ni alertas por Telegram;
- corrección validada para evitar interpretar palabras temporales como mañana como nombres de mascotas;
- evidencia técnica y capturas almacenadas en docs/evidencias/.

**Commits principales:**

- 16e655a feat: implementa demo pública segura LAB-016;
- 207f4c3 fix: corrige extracción de mascota en demo LAB-016.


## 8. Estado general del proyecto

| Laboratorio | Estado |
|---|---|
| LAB-006 | Cerrado |
| LAB-007 | Cerrado |
| LAB-008 | Cerrado |
| LAB-009 | Cerrado |
| LAB-010 | Cerrado |
| LAB-011 | Cerrado |
| LAB-012 | Cerrado |
| LAB-013 | Cerrado |
| LAB-014 | Cerrado |
| LAB-015 | Cerrado |
| LAB-016 | En desarrollo |

---

## 9. Principios de evolución

VetAtiende AI continuará creciendo con estas reglas:

- validar antes de agregar complejidad;
- resolver problemas operativos reales;
- mantener separados los canales público e interno;
- no exponer información sensible;
- no inventar disponibilidad, precios ni stock;
- no sustituir la evaluación veterinaria;
- adaptar cada implementación a la realidad de la clínica;
- priorizar módulos que puedan generar valor comercial temprano.
