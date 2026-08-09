# LAB-024 — Urgencias médicas comerciales y alerta interna

## Estado

LAB-024 se encuentra cerrado, validado y operativo como workflow comercial vigente.

El cierre histórico original de LAB-024 se conserva. Posteriormente se realizó una auditoría complementaria que detectó huecos reproducibles de cobertura en determinados mensajes de urgencia.

El 8 de agosto de 2026 se ejecutó LAB-024.1 como fortalecimiento correctivo del núcleo de detección.

LAB-024.1:

- no modifica la arquitectura general del laboratorio;
- no modifica el contrato público;
- no modifica las Data Tables aprobadas;
- no modifica la arquitectura de canales;
- conserva 208 nodos en el workflow final;
- mantiene LAB-024 como workflow comercial vigente;
- mantiene LAB-023 inactivo como referencia histórica.

## Fecha de inicio

31 de julio de 2026.

## Objetivo

Incorporar una ruta prioritaria para detectar posibles urgencias médicas veterinarias antes de ejecutar:

- el RAG público;
- la agenda médica;
- la agenda de peluquería y lavado;
- consultas generales;
- respuestas comerciales;
- continuaciones de reservas abiertas.

La solución deberá:

- detectar señales prioritarias en el mensaje actual;
- considerar contexto reciente de la misma sesión;
- evitar diagnósticos y tratamientos improvisados;
- entregar una respuesta pública breve, clara y segura;
- recomendar contacto veterinario inmediato cuando corresponda;
- registrar la alerta de forma trazable;
- intentar una notificación interna;
- manejar fallos sin exponer detalles técnicos;
- conservar las reservas abiertas sin continuarlas automáticamente;
- mantener el contrato público vigente;
- utilizar exclusivamente datos ficticios durante desarrollo y pruebas.

## Punto de partida

LAB-024 se construirá sobre el workflow comercial validado en LAB-023.

LAB-023 contiene actualmente:

- RAG público comercial;
- agenda médica comercial parametrizable;
- agenda comercial separada de peluquería y lavado;
- estados conversacionales médicos;
- estados conversacionales de peluquería;
- calendarios separados;
- contrato público estable;
- aislamiento por `clinic_id::session_id`.

El workflow vigente no contiene todavía una ruta comercial de urgencias.

## Auditoría inicial

Antes de diseñar LAB-024 se realizó una auditoría de solo lectura sobre:

- el roadmap comercial;
- la decisión de arquitectura DAC-017;
- el workflow académico de urgencias de LAB-013;
- el workflow comercial vigente de LAB-023;
- la ruta inicial desde el Webhook público;
- los hashes de las exportaciones revisadas;
- el estado del repositorio.

La auditoría no modificó archivos ni workflows.

## Resultado de la auditoría académica

El flujo académico contiene una ruta formada por:

~~~text
Detectar Urgencia
→ Es Urgencia
→ Preparar Registro Urgencia
→ Registrar Alerta Urgencia
→ Responder Urgencia
→ Enviar Alerta Telegram Interno
~~~

Elementos reutilizables conceptualmente:

- prioridad sobre el flujo público normal;
- separación entre respuesta pública y aviso interno;
- recomendación de atención veterinaria;
- ausencia de diagnóstico;
- registro trazable;
- intento de aviso activo;
- Telegram como referencia inicial;
- prohibición de sustituir una urgencia por una cita normal.

Elementos que no deben copiarse directamente:

- detección basada solo en una lista fija y `includes()`;
- ausencia de análisis de negaciones;
- ausencia de contexto multimensaje;
- campos y mensajes rígidos;
- falta de configuración por clínica;
- contrato público con campos internos;
- ausencia de deduplicación;
- ausencia de categorías normalizadas;
- falta de actualización del resultado de notificación;
- falta de rutas explícitas ante errores de registro;
- dependencia directa de Telegram.

## Resultado de la auditoría de LAB-023

LAB-023 posee una sola entrada pública principal:

`Entrada webhook RAG público comercial LAB-021`

La ruta inicial vigente es:

~~~text
Entrada pública
→ Normalizar entrada comercial
→ Validar session_id
→ Validar clinic_id
→ Cargar configuraciones de agendas
→ Leer estados conversacionales
→ Detectar intención comercial
→ RAG, agenda médica o peluquería
~~~

El punto aprobado para incorporar urgencias es:

~~~text
Después de validar session_id y clinic_id
y antes de cargar o procesar las agendas.
~~~

## Decisiones de arquitectura relacionadas

- DAC-017 — Prioridad de urgencias y alerta interna activa.
- Separación entre lógica central y canales de comunicación.
- Configuración y aislamiento por clínica.
- Contrato público mínimo.
- Uso exclusivo de datos ficticios durante desarrollo y pruebas.
- Un único commit al cierre completo del laboratorio.

## Principio central

Una posible urgencia médica tendrá prioridad absoluta sobre:

- RAG público;
- agenda médica;
- peluquería y lavado;
- mensajes comerciales;
- precios;
- promociones;
- consultas generales;
- reservas abiertas;
- confirmaciones de citas normales.

La automatización no reemplaza la evaluación de un profesional veterinario.

## Arquitectura comercial de canales

VetAtiende AI deberá ofrecer distintas opciones de implementación según las necesidades de cada clínica.

Posibles canales públicos:

- Streamlit;
- WhatsApp;
- sitio web;
- aplicación propia;
- otro canal integrado.

Posibles canales internos:

- Telegram;
- WhatsApp;
- correo electrónico;
- aplicación interna;
- webhook;
- otro canal configurado.

La lógica de urgencias debe ser independiente del canal seleccionado.

La arquitectura deberá seguir el principio:

~~~text
Núcleo de urgencias
≠
Canal público
≠
Canal interno
~~~

## Implementación prevista para el piloto

Para el piloto y las demostraciones comerciales se utilizará:

- Streamlit como canal público;
- n8n como motor de automatización;
- Telegram como canal interno de alerta.

Esta decisión aprovecha la base ya validada durante el Challenge académico.

Telegram no se considerará una dependencia comercial definitiva.

## Arquitectura funcional propuesta

~~~text
Cliente
↓
Streamlit
↓
Webhook comercial
↓
Normalizar entrada
↓
Validar session_id
↓
Validar clinic_id
↓
Cargar configuración de urgencias
↓
Leer contexto breve de urgencias
↓
Evaluar reglas deterministas
↓
Clasificación controlada con IA cuando corresponda
↓
Determinar prioridad
~~~

Si existe una señal prioritaria:

~~~text
Preparar respuesta pública segura
├── Registrar estado y alerta
├── Seleccionar canal interno
├── Intentar notificación
└── Responder públicamente
~~~

Si no existe una señal prioritaria:

~~~text
Continuar hacia LAB-023
→ agenda médica
→ peluquería
→ RAG público
→ consultas generales
~~~

## Alcance aprobado de señales

Las categorías internas iniciales serán:

- respiratoria;
- neurológica;
- alteración de conciencia;
- trauma;
- hemorragia;
- posible intoxicación;
- urinaria;
- térmica;
- gastrointestinal grave;
- reproductiva;
- ocular grave;
- dolor o deterioro súbito;
- otra señal prioritaria.

Ejemplos de señales cubiertas:

- dificultad para respirar;
- asfixia;
- encías o lengua azuladas;
- convulsiones;
- inconsciencia;
- colapso;
- atropello;
- caída importante;
- sangrado abundante;
- ingestión de veneno o medicamentos;
- imposibilidad de orinar;
- golpe de calor;
- abdomen hinchado con intentos improductivos de vomitar;
- parto complicado;
- traumatismo ocular;
- empeoramiento rápido.

## Contextos que deben diferenciarse

La detección deberá distinguir:

~~~text
caso_actual
caso_negado
caso_historico
pregunta_informativa
situacion_hipotetica
contexto_insuficiente
~~~

No se abrirá automáticamente una alerta únicamente porque el mensaje contenga una palabra relacionada con urgencias.

## Prioridades operativas

No se utilizarán niveles que puedan confundirse con un diagnóstico clínico.

Los estados aprobados son:

~~~text
prioridad_inmediata
prioridad_preventiva
sin_prioridad
~~~

### Prioridad inmediata

Se utilizará ante una señal clara que obliga a detener todo el flujo comercial.

Comportamiento:

~~~text
Detener RAG y agendas
→ registrar alerta
→ intentar aviso interno
→ recomendar atención veterinaria inmediata
~~~

### Prioridad preventiva

Se utilizará ante señales preocupantes, ambiguas o incompletas.

Comportamiento:

~~~text
Detener temporalmente RAG y agendas
→ entregar recomendación conservadora
→ realizar como máximo una pregunta breve
→ registrar el episodio cuando corresponda
~~~

### Sin prioridad

El mensaje continuará hacia el flujo normal cuando:

- no existan señales preocupantes;
- la mención sea histórica;
- la situación esté negada;
- sea una consulta informativa;
- sea una hipótesis claramente no actual.

## Estrategia híbrida de clasificación

LAB-024 utilizará:

~~~text
Reglas deterministas prioritarias
+
Contexto breve de sesión
+
IA controlada solo para casos ambiguos
~~~

### Reglas deterministas

Evaluarán:

- expresiones completas;
- sinónimos;
- variantes ortográficas;
- negaciones;
- tiempo verbal;
- referencias históricas;
- preguntas informativas;
- combinación de señales;
- agravamiento;
- mensajes recientes de la misma sesión.

Una señal determinista inmediata no podrá ser rebajada por IA.

### Participación de IA

La IA intervendrá únicamente cuando las reglas no sean concluyentes.

La salida deberá usar una estructura cerrada y controlada.

La IA no podrá:

- diagnosticar;
- inventar síntomas;
- prescribir tratamientos;
- improvisar la respuesta pública;
- rebajar una alerta determinista;
- decidir crear una cita normal.

Si la IA falla o devuelve una salida inválida, se aplicará un fallback conservador.

## Contexto conversacional

La configuración inicial propuesta es:

~~~text
Mensajes recientes del usuario: máximo 3
Ventana de contexto: 30 minutos
Clave: clinic_id::session_id
~~~

No se utilizarán las respuestas de Luna como evidencia clínica.

Los límites son parámetros operativos configurables, no criterios veterinarios.

## Respuesta pública

Toda respuesta prioritaria deberá:

- indicar que la situación podría requerir atención veterinaria urgente;
- recomendar contacto inmediato con la clínica o atención veterinaria;
- indicar que no se debe esperar una confirmación de agenda;
- indicar que no se debe esperar una respuesta por el chat;
- ser breve;
- excluir publicidad y promociones;
- usar plantillas controladas por clínica.

Nunca deberá:

- diagnosticar;
- asegurar gravedad;
- descartar gravedad;
- prometer que un veterinario responderá;
- prometer tiempos de atención;
- afirmar que el equipo fue notificado;
- entregar medicamentos o dosis;
- recomendar provocar vómito;
- sustituir la atención urgente por una cita normal.

## Datos mínimos

La respuesta urgente no dependerá de recopilar datos adicionales.

La alerta podrá crearse con:

- `clinic_id`;
- `session_id`;
- canal de origen;
- identificador disponible del contacto o conversación;
- mensaje actual;
- contexto reciente;
- fecha y hora;
- clasificación interna.

Cuando ya estén disponibles podrán utilizarse:

- nombre del tutor;
- nombre de la mascota;
- especie;
- ubicación general;
- teléfono.

El teléfono no será prioritario ni obligatorio.

Cuando resulte necesario se podrá solicitar como máximo:

- una pregunta breve de seguridad; o
- una ubicación general como comuna o sector.

Nunca se retrasará la recomendación urgente esperando esos datos.

## Preguntas breves permitidas

- ¿Está consciente?
- ¿Está respirando con normalidad?
- ¿El sangrado continúa?
- ¿Está convulsionando ahora?
- ¿Logra orinar?
- ¿Sabes qué sustancia pudo ingerir?
- ¿Está empeorando rápidamente?
- ¿En qué comuna o sector te encuentras?

Estas preguntas no se utilizarán para descartar clínicamente una urgencia.

## Estructura de Data Tables

Se aprobaron tres tablas separadas.

### `lab024_estado_urgencia`

Mantendrá una fila mutable por:

~~~text
clinic_id::session_id
~~~

Su función será conservar:

- mensajes recientes;
- episodio activo;
- prioridad actual;
- categoría actual;
- timestamps;
- ventana de contexto;
- referencias a la última alerta.

Estados propuestos:

~~~text
sin_episodio
activo_preventivo
activo_inmediato
atencion_reportada
expirado
~~~

No se utilizarán estados clínicos como:

~~~text
resuelto
estable
fuera_de_peligro
~~~

### `lab024_alertas_internas`

Mantendrá el historial trazable de:

~~~text
apertura
actualizacion
escalacion
cierre_operativo
~~~

Cada evento tendrá:

- `alert_id`;
- `episode_id`;
- `parent_alert_id`;
- clínica;
- sesión;
- mensaje actual;
- contexto utilizado;
- prioridad;
- categoría;
- fuente de clasificación;
- reglas activadas;
- plantilla pública utilizada;
- timestamps.

### `lab024_historial_urgencias`

Registrará cada intento realizado por un adaptador de canal.

Permitirá canales como:

~~~text
telegram
whatsapp
correo
app
webhook
~~~

Estados previstos:

~~~text
pendiente
enviado
fallido
no_configurado
omitido_por_deduplicacion
~~~

## Objeto estándar de alerta interna

La lógica central producirá un objeto general antes de seleccionar el canal.

Ejemplo ficticio:

~~~json
{
  "alert_id": "alerta_ficticia",
  "episode_id": "episodio_ficticio",
  "clinic_id": "clinica_ficticia",
  "session_id": "sesion_ficticia",
  "priority": "prioridad_inmediata",
  "category": "respiratoria",
  "internal_message": "Mensaje interno sanitizado",
  "requires_notification": true
}
~~~

El objeto no contendrá credenciales ni destinos privados.

### Configuración privada del adaptador Telegram

La implementación comercial del piloto mantiene el identificador real del destino Telegram fuera del workflow y fuera de Git.

- el `.env` operativo almacena `VETATIENDE_TELEGRAM_ALERT_CHAT_ID` con el valor privado;
- `infra/comercial/.env.example` contiene únicamente un placeholder;
- `infra/comercial/compose.yaml` entrega `${VETATIENDE_TELEGRAM_ALERT_CHAT_ID}` al servicio `n8n`;
- los nodos `Enviar alerta Telegram urgencia intento 1` y `Enviar alerta Telegram urgencia intento 2` resuelven el destino mediante `{{ $env.VETATIENDE_TELEGRAM_ALERT_CHAT_ID }}`;
- `N8N_BLOCK_ENV_ACCESS_IN_NODE` se configura en `"false"` para permitir esta referencia durante la ejecución;
- el Chat ID real no debe aparecer en exportaciones de workflows, documentación ni commits.

La habilitación de acceso a `$env` amplía la capacidad de los workflows para consultar variables del contenedor. Por este motivo, la edición de workflows debe permanecer restringida a usuarios de confianza y esta capacidad no deberá utilizarse para exponer otras variables sensibles.

## Deduplicación

La deduplicación se realizará por episodio.

Configuración inicial propuesta:

~~~text
Ventana de contexto: 30 minutos
Supresión de aviso idéntico: 10 minutos
Mensajes recientes: máximo 3
~~~

### Primera señal

~~~text
Crear episode_id
→ registrar apertura
→ intentar aviso interno
→ responder públicamente
~~~

### Repetición sin empeoramiento

~~~text
Mantener episode_id
→ registrar actualización
→ omitir aviso interno idéntico
→ mantener respuesta pública
~~~

### Escalamiento

~~~text
Prioridad preventiva
→ prioridad inmediata
→ registrar escalación
→ generar nuevo aviso interno
~~~

La deduplicación nunca impedirá entregar la recomendación pública.

## Relación con reservas abiertas

Una posible urgencia no eliminará las reservas abiertas.

### Agenda médica

Durante un episodio prioritario:

- no consultar Calendar;
- no ofrecer alternativas;
- no solicitar datos faltantes;
- no confirmar cita;
- no modificar el estado médico;
- conservar la reserva suspendida.

### Peluquería

Durante un episodio prioritario:

- no consultar Calendar;
- no continuar recopilando servicio o tamaño;
- no ofrecer alternativas;
- no confirmar cita;
- no modificar el estado de peluquería;
- conservar la reserva suspendida.

### Continuación posterior

El usuario podrá retomar una reserva cuando:

- indique que la situación está siendo atendida; o
- el episodio haya expirado operacionalmente;
- el nuevo mensaje no contenga señales prioritarias.

Luna no deberá afirmar que la mascota está estable o fuera de peligro.

## Manejo de errores

La regla principal es:

~~~text
Un fallo interno nunca debe impedir
la recomendación pública de buscar atención.
~~~

Se probarán fallos en:

- estado conversacional;
- registro histórico;
- tabla de intentos;
- Telegram;
- credenciales;
- canal no configurado;
- clasificación mediante IA.

Estados internos generales propuestos:

~~~text
completa
registrada_sin_aviso
avisada_sin_registro_confirmado
fallo_interno_degradado
~~~

No serán expuestos al usuario.

## Reintentos del canal piloto

Telegram tendrá inicialmente:

~~~text
1 intento inicial
+
1 reintento técnico
~~~

Solo se reintentará ante errores transitorios.

No existirán ciclos indefinidos.

## Contrato público

Todas las respuestas mantendrán únicamente:

~~~json
{
  "ok": true,
  "clinic_id": "clinica_ficticia",
  "session_id": "sesion_ficticia",
  "reply": "Mensaje público seguro"
}
~~~

No se expondrán:

- `alert_id`;
- `episode_id`;
- prioridad;
- categoría;
- reglas activadas;
- confianza de IA;
- estado del registro;
- resultado de Telegram;
- canal interno;
- errores técnicos;
- nombres de nodos;
- nombres de tablas.

Una urgencia procesada correctamente utilizará:

~~~text
ok = true
~~~

Aunque falle una operación interna.

## Pruebas obligatorias

LAB-024 deberá validar:

### Detección

- dificultad respiratoria;
- convulsiones;
- alteración de conciencia;
- trauma;
- hemorragia;
- intoxicación;
- obstrucción urinaria;
- golpe de calor;
- signos gastrointestinales graves;
- parto complicado;
- prioridad preventiva.

### Falsos positivos

- negación;
- pregunta informativa;
- caso histórico;
- situación hipotética;
- urgencia de otro animal;
- cancelación por atención previa.

### Contexto

- señales divididas en varios mensajes;
- escalamiento;
- contexto vencido;
- límite de tres mensajes;
- aislamiento por clínica y sesión.

### Deduplicación

- repetición idéntica;
- actualización sin nuevo aviso;
- escalamiento con nuevo aviso;
- nueva sesión;
- otra clínica.

### Integración

- reserva médica abierta;
- reserva de peluquería abierta;
- intento de continuar durante episodio activo;
- retoma posterior controlada;
- bloqueo del RAG comercial durante episodio activo.

### Registro y notificación

- registro de apertura;
- registro de actualización;
- registro de escalamiento;
- Telegram exitoso;
- Telegram fallido;
- canal deshabilitado;
- reintento técnico;
- errores sanitizados.

### Resiliencia

- fallo de cada Data Table;
- fallo de IA;
- salida inválida del modelo;
- regla determinista prevalece sobre IA;
- respuesta pública en modo degradado.

### Regresión

- RAG normal;
- agenda médica;
- confirmación médica;
- conflicto médico;
- baño;
- corte;
- duraciones de peluquería;
- conflictos de peluquería;
- revisión humana;
- aislamiento de agendas;
- contrato público.

## Seguridad y privacidad

- usar exclusivamente datos ficticios;
- no almacenar credenciales en Data Tables;
- no incorporar secretos al JSON exportado;
- no exponer identificadores privados;
- sanitizar errores técnicos;
- mantener aislamiento por clínica;
- conservar únicamente el contexto necesario;
- no reutilizar información entre sesiones;
- no diagnosticar;
- no entregar tratamientos improvisados;
- no incluir publicidad en urgencias.

Las plantillas de instrucciones deberán ser revisadas por un profesional veterinario antes de un piloto con usuarios reales.

## Fuera de alcance

LAB-024 no incluirá todavía:

- operación interna autenticada completa;
- RAG interno;
- dashboard operativo definitivo;
- integración comercial definitiva con WhatsApp;
- aplicación interna definitiva;
- gestión clínica del caso;
- diagnóstico;
- triaje veterinario profesional;
- seguimiento posterior de urgencias;
- cancelación de citas confirmadas;
- reprogramación de citas confirmadas;
- múltiples niveles de escalamiento humano;
- analítica comercial definitiva.

## Criterios de cierre

LAB-024 se considerará cerrado únicamente cuando:

- la detección se ejecute antes de RAG y agendas;
- las reglas deterministas tengan prioridad;
- la IA esté controlada;
- las tres Data Tables estén creadas;
- la deduplicación esté validada;
- el escalamiento esté validado;
- Telegram funcione como adaptador piloto;
- los fallos internos estén probados;
- las reservas abiertas se conserven;
- el contrato público mantenga cuatro campos;
- las regresiones médica y de peluquería sean aprobadas;
- Streamlit funcione de punta a punta;
- la exportación final sea válida;
- no existan secretos;
- el hash del repositorio coincida con la exportación;
- la documentación final esté actualizada;
- la limpieza de datos ficticios esté terminada;
- se realice un único commit;
- la rama local y remota queden sincronizadas.

## Limpieza final

Al cierre se eliminaron todas las filas ficticias de:

~~~text
lab024_estado_urgencia
lab024_alertas_internas
lab024_historial_urgencias
~~~

Las tablas conservaron:

- sus nombres;
- estructura;
- columnas;
- tipos;
- cero filas ficticias.

No se eliminarán:

- estados médicos ajenos a LAB-024;
- estados de peluquería ajenos a LAB-024;
- eventos médicos;
- eventos de peluquería;
- recursos históricos de LAB anteriores.

Los mensajes de Telegram para pruebas deberán marcarse claramente:

~~~text
PRUEBA LAB-024 — DATOS FICTICIOS
~~~

## Estado operativo histórico durante el desarrollo

Estado operativo actual antes del cierre:

- LAB-024 está construido y validado funcionalmente;
- LAB-023 permanece inactivo como referencia histórica;
- Streamlit utiliza el webhook permanente validado de LAB-024;
- LAB-024 permanece activo como workflow comercial vigente;
- no se realizan commits hasta completar el cierre del laboratorio;
- todos los datos de prueba utilizados son ficticios.

Al cierre:

- LAB-024 se activa como workflow vigente;
- LAB-023 se desactiva;
- LAB-023 se conserva como referencia histórica;
- Streamlit se conecta al webhook permanente validado de LAB-024;
- se exporta el workflow desde n8n;
- se realiza el único commit del laboratorio.

## LAB-024.1 — Fortalecimiento de cobertura de urgencias

### Motivo

Después del cierre histórico de LAB-024 se realizó una auditoría complementaria del núcleo de urgencias.

Las pruebas detectaron casos reproducibles en los que determinadas situaciones potencialmente urgentes no llegaban a la clasificación controlada por IA porque el gate previo era demasiado estrecho.

Durante el fortalecimiento también se detectaron y corrigieron efectos secundarios relacionados con sobrecobertura, negaciones y contexto temporal.

### Correcciones aplicadas

Se fortaleció el nodo `Evaluar reglas deterministas urgencia` mediante:

- ampliación controlada del gate hacia IA para eventos críticos no cubiertos anteriormente;
- cobertura de asfixia, electrocución, atoramiento, traumatismos graves, mordeduras potencialmente peligrosas, accidentes acuáticos y cuerpos extraños de riesgo;
- exclusión de síntomas generales demasiado amplios para evitar alertas innecesarias;
- neutralización individual de señales explícitamente negadas;
- conservación de otras señales positivas presentes en el mismo mensaje;
- refinamiento de la lógica temporal para diferenciar antecedentes históricos de urgencias actuales.

### Validación complementaria

Entre las regresiones finales aprobadas se encuentran:

- `Mi perro está con asfixia.` → clasificación controlada por IA → `prioridad_inmediata` → categoría `respiratoria` → alerta interna;
- `Mi perro no se electrocutó, solo estuvo cerca de un cable.` → `caso_negado` → sin clasificación IA y sin Telegram;
- `Mi perro no está convulsionando, pero no puede respirar.` → `prioridad_inmediata` por señal respiratoria activa;
- `Hace un mes mi perro se electrocutó, pero ahora está completamente bien.` → `caso_historico` → sin alerta;
- `Hace un mes mi perro se electrocutó, pero ahora no puede respirar.` → `caso_actual` → `prioridad_inmediata` → alerta interna;
- `Mi perro tiene tos desde ayer.` → sin activación innecesaria de la ruta prioritaria;
- referencias exclusivamente a otro animal ajeno no abren una urgencia para la sesión propia.

### Alcance

LAB-024.1 es una corrección complementaria y no sustituye el cierre histórico de LAB-024.

Se mantienen sin cambios:

- contrato público `ok`, `clinic_id`, `session_id`, `reply`;
- arquitectura pública e interna;
- modelo de episodios y deduplicación;
- tres Data Tables de LAB-024;
- prioridad de reglas deterministas sobre IA;
- cantidad total de 208 nodos.

El reconocimiento humano de alertas, temporizadores, escalamiento y otras funciones internas protegidas permanecen fuera del alcance de esta corrección y corresponden a etapas posteriores del proyecto.

## Estado operativo final

- LAB-024 activo y publicado como workflow comercial vigente;
- LAB-023 inactivo y conservado como referencia histórica;
- Streamlit conectado al webhook permanente de LAB-024;
- Telegram validado como adaptador interno del piloto;
- workflow final exportado con 208 nodos;
- `lab024_estado_urgencia` con 0 filas ficticias;
- `lab024_alertas_internas` con 0 filas ficticias;
- `lab024_historial_urgencias` con 0 filas ficticias;
- exportación descargada y copia del repositorio verificadas mediante SHA256;
- todos los datos de las pruebas fueron ficticios.

## Resultado validado

LAB-024 demostró que VetAtiende AI puede:

- priorizar una posible urgencia médica;
- detener temporalmente funciones comerciales;
- mantener una respuesta pública segura;
- registrar el episodio;
- intentar avisar al equipo interno;
- tolerar fallos técnicos;
- evitar avisos duplicados;
- conservar reservas abiertas;
- funcionar con Streamlit y Telegram durante el piloto;
- mantener una arquitectura adaptable a los canales elegidos por cada clínica.
