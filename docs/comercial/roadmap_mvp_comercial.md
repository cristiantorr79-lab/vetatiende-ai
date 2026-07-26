# Roadmap MVP Comercial — VetAtiende AI

Este documento pertenece exclusivamente a la etapa comercial desarrollada en la rama `mvp-comercial`.

No modifica ni reemplaza la versión del Challenge congelada en `main` y en el tag `v1.0.0-challenge`.

## LAB-018 — Privacidad, seguridad y cumplimiento

**Estado:** Cerrado documentalmente el 15 de julio de 2026.

### Resultado

- base documental de privacidad y seguridad completada;
- proveedores y transferencias revisados;
- responsabilidades y límites del tratamiento definidos;
- matriz de 47 controles creada;
- plan de implementación técnica organizado;
- uso de datos reales todavía no autorizado.

## Estado actual

### LAB-019 — Infraestructura comercial segura

**Cerrado y validado técnicamente el 21 de julio de 2026.**

Resultados principales:

- entorno comercial separado de la versión académica;
- despliegue mediante Docker y Docker Compose;
- n8n, task runners, Streamlit y Caddy operativos;
- acceso HTTPS mediante proxy reverso;
- exposición pública limitada a los puertos 80 y 443;
- servicios internos sin publicación directa hacia Internet;
- secretos reales excluidos del repositorio;
- firewall persistente y acceso SSH endurecido;
- respaldo completo y restauración de prueba validados;
- reinicio automático de los servicios comprobado;
- validación realizada solamente con datos ficticios;
- plantilla segura exportada en infra/comercial/;
- una evidencia técnica registrada en docs/comercial/lab019/evidencias/.

## LAB-020 - Integración funcional comercial inicial

**Estado: cerrado y validado.**

LAB-020 conectó correctamente:

- interfaz Streamlit comercial;
- webhook permanente de n8n;
- Luna mediante Groq;
- respuesta devuelta y mostrada en Streamlit;
- identificación inicial mediante `CLINIC_ID=clinica_piloto_001`;
- comunicación privada entre Streamlit y n8n dentro de Docker;
- pruebas funcionales exclusivamente con datos ficticios.

El flujo validado es:

`Streamlit -> n8n comercial -> Luna -> Streamlit`

Workflow exportado:

`n8n/workflows/comercial/lab020_consulta_comercial_basica.json`

Continúan pendientes la autenticación de usuarios, el aislamiento completo entre clínicas, el dominio comercial definitivo y la autorización para utilizar datos personales reales.

## LAB-021 — RAG público comercial inicial

**Estado: cerrado y validado técnicamente el 23 de julio de 2026.**

LAB-021 incorporó información pública controlada de una clínica ficticia mediante RAG comercial:

- documentos públicos separados por clínica;
- lectura de archivos PDF y CSV desde el volumen comercial;
- embeddings multilingües mediante Cohere;
- búsqueda de contexto público como herramienta de Luna;
- generación de respuestas mediante Groq;
- conservación de `clinic_id`, `session_id`, `message` y `channel`;
- respuesta compatible con la interfaz Streamlit comercial;
- workflow limpio, publicado y validado mediante webhook permanente;
- integración completa desde Streamlit público por HTTPS;
- uso exclusivo de datos ficticios.

Se validaron consultas de horarios, precios, medios de pago e información inexistente. Luna recuperó información desde los documentos y evitó inventar respuestas cuando el dato no estaba disponible.

El almacén vectorial actual reside en memoria y deberá reemplazarse posteriormente por una solución persistente antes de ampliar el uso comercial.

Continúan pendientes la autenticación completa, el aislamiento entre múltiples clínicas y la autorización para utilizar datos personales reales.

## LAB-022 — Agenda médica comercial parametrizable

**Estado: validado técnicamente el 29 de julio de 2026. Cierre documental y commit pendientes.**

LAB-022 incorporó una agenda médica comercial parametrizable dentro del workflow de Luna, conservando la rama de RAG público implementada en LAB-021.

La documentación detallada se encuentra en:

`docs/comercial/lab022/README.md`

### Arquitectura validada

La arquitectura quedó compuesta por:

- interfaz Streamlit comercial autohospedada;
- webhook permanente separado para LAB-022;
- workflow comercial de n8n con 77 nodos;
- RAG público comercial;
- estado conversacional persistido mediante n8n Data Tables;
- credencial comercial separada de Google Calendar;
- calendario ficticio exclusivo para la agenda médica comercial;
- recarga automática del RAG después de iniciar n8n;
- uso exclusivo de datos ficticios.

El workflow oficial es:

`LAB-022 - Agenda médica comercial parametrizable`

La exportación oficial se encuentra en:

`n8n/workflows/comercial/lab022_agenda_medica_comercial_parametrizable.json`

### Configuración parametrizable

La agenda permite configurar por clínica y servicio:

- identificador del servicio;
- duración de la atención;
- intervalo válido de inicio;
- cantidad de días a revisar;
- cantidad de alternativas;
- zona horaria;
- jornada de atención por día;
- fechas bloqueadas;
- calendario asociado.

La configuración base validada utiliza:

- servicio `consulta_general`;
- duración de 30 minutos;
- intervalos de inicio de 30 minutos;
- búsqueda de hasta 7 días;
- 3 alternativas;
- zona horaria `America/Santiago`;
- lunes a viernes entre 09:00 y 18:30;
- sábado entre 10:00 y 14:00;
- domingo sin atención regular;
- lista de fechas bloqueadas vacía.

También se probaron temporalmente distintas duraciones, intervalos, fechas bloqueadas, fechas sin disponibilidad y horarios fuera de jornada.

### Estado conversacional

La Data Table utilizada es:

`lab022_estado_agenda`

El estado se separa mediante la clave:

`clinic_id::session_id`

Los principales estados son:

- `nuevo`;
- `esperando_datos_minimos`;
- `esperando_fecha_horario`;
- `esperando_seleccion_horario`;
- `esperando_horario_futuro`;
- `sin_horarios_disponibles`;
- `confirmada`.

Se incorporaron los campos:

- `fecha_pendiente`;
- `hora_pendiente`.

Estos campos permiten conservar una fecha o una hora entregada por separado y combinarlas cuando el usuario completa la información en un mensaje posterior.

También se validó aislamiento entre sesiones, sin mezcla de fechas, horas, nombres, mascotas, teléfonos ni estados.

### Funciones validadas

LAB-022 permite:

- detectar solicitudes y continuaciones de agenda médica;
- distinguir consultas informativas destinadas al RAG;
- conservar una agenda abierta mientras se responde una pregunta informativa;
- recopilar nombre del tutor, mascota y teléfono;
- normalizar teléfonos móviles chilenos;
- interpretar fechas y horas expresadas en lenguaje natural;
- reconocer fechas relativas, días de la semana, AM/PM, `y cuarto` y `y media`;
- combinar fecha seguida de hora;
- combinar hora seguida de fecha;
- solicitar la fecha cuando el usuario entrega solamente una hora;
- rechazar fechas pasadas;
- validar apertura, cierre, duración e intervalo de inicio;
- consultar disponibilidad real en Google Calendar;
- ofrecer alternativas reales;
- recuperar la conversación después de no encontrar horarios;
- seleccionar alternativas por número o mediante expresiones naturales;
- revalidar la disponibilidad antes de confirmar;
- impedir la confirmación cuando aparece un conflicto;
- crear una cita médica ficticia;
- cancelar o reiniciar una solicitud de agenda abierta;
- continuar con consultas RAG después de confirmar una cita.

Una solicitud como `10:15`, cuando los inicios permitidos son cada 30 minutos, ofrece primero alternativas posteriores cercanas como `10:30`, `11:00` y `11:30`.

### Confirmación y Google Calendar

La confirmación final fue validada tanto con horarios libres como con conflictos incorporados antes de crear el evento.

En el escenario libre:

- el evento se creó en Google Calendar;
- la duración fue de 30 minutos;
- el estado quedó `confirmada`;
- la respuesta pública informó la confirmación.

En el escenario de conflicto:

- no se creó una segunda cita;
- Luna informó que el horario ya no estaba disponible;
- se ofrecieron nuevas alternativas.

El evento ficticio utilizado en la prueba final fue verificado visualmente y eliminado después de la validación.

### RAG y reinicio de n8n

El RAG continúa utilizando Simple Vector Store en memoria.

Para evitar que quede vacío después de reiniciar n8n, se incorporó el trigger:

`Recargar RAG al iniciar n8n`

Después de un reinicio controlado se validó:

- contenedor n8n en estado saludable;
- `/healthz` con HTTP 200;
- ejecución automática del trigger;
- lectura de 2 documentos;
- carga de 30 fragmentos;
- consulta posterior mediante webhook permanente;
- respuesta correcta sobre la vacuna antirrábica y su precio referencial;
- ausencia de estado interno y detalles técnicos en la respuesta pública.

El nodo de inserción utiliza `Clear Store` para evitar duplicación de fragmentos durante las recargas.

### Validaciones de integración

Se validó correctamente:

- consulta RAG antes y después de reiniciar n8n;
- agenda médica después del reinicio;
- webhook permanente mediante túnel SSH;
- integración con Google Calendar;
- persistencia mediante Data Tables;
- respuesta pública con únicamente `ok`, `clinic_id`, `session_id` y `reply`;
- creación y eliminación de un evento ficticio;
- continuidad RAG durante una agenda abierta;
- continuidad RAG después de una cita confirmada;
- aislamiento entre sesiones;
- respuesta sin credenciales, estado interno ni detalles técnicos.

La integración funcional mantiene el flujo:

`Streamlit → webhook permanente LAB-022 → n8n → Google Calendar y Data Table → respuesta visible`

### Exportación final

La exportación oficial fue validada mediante PowerShell:

- JSON válido;
- 77 nodos;
- workflow activo;
- hash coincidente entre Descargas y repositorio;
- trigger de inicio presente;
- rama de solo hora presente;
- campos `fecha_pendiente` y `hora_pendiente` presentes;
- `Clear Store` presente;
- fecha temporal de prueba ausente;
- sin secretos incorporados intencionalmente.

### Limitaciones pendientes

LAB-022 no incluye:

- cancelación de citas ya confirmadas;
- modificación de citas creadas;
- peluquería;
- urgencias;
- Telegram;
- Google Sheets;
- autenticación completa;
- datos personales reales;
- administración visual de configuraciones por clínica;
- aislamiento comercial definitivo para múltiples clínicas;
- almacenamiento vectorial persistente;
- bloqueo transaccional distribuido contra reservas simultáneas;
- expiración y eliminación automática de estados conversacionales.

La ruta pública directa `/webhook/...` actualmente es atendida por Uvicorn y devuelve HTTP 405. La integración interna de Streamlit y las pruebas directas mediante el túnel hacia n8n funcionan correctamente.

Después de las pruebas finales se eliminaron las 33 filas ficticias acumuladas en la Data Table. La tabla y sus columnas se conservaron, quedando con 0 filas.

## Próxima etapa

La siguiente etapa comercial se definirá después de una revisión transversal del estado del proyecto. Entre las prioridades pendientes se encuentran:

- experiencia conversacional más natural y cercana;
- persistencia robusta del RAG;
- autenticación y control de acceso;
- aislamiento completo entre clínicas;
- administración de configuraciones por clínica;
- privacidad y preparación para datos personales reales;
- cancelación y modificación de citas;
- monitoreo, respaldo y recuperación operativa.

La priorización y el alcance del próximo laboratorio se definirán antes de comenzar su implementación.
