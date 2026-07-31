# LAB-023 — Agenda comercial de peluquería y lavado

## Estado

**Cerrado, validado y publicado el 30 de julio de 2026.**

LAB-023 incorporó la agenda comercial de peluquería y lavado al workflow vigente de Luna, manteniendo separados el calendario, la Data Table, la configuración y el estado conversacional respecto de la agenda médica.

El workflow `LAB-023 - Agenda comercial de peluquería y lavado` quedó activo y es la versión comercial vigente.

El workflow `LAB-022 - Agenda médica comercial parametrizable` quedó inactivo y conservado como referencia histórica. Su workflow y su exportación no fueron eliminados.

La exportación oficial de LAB-023 se encuentra en:

`n8n/workflows/comercial/lab023_agenda_comercial_peluqueria_lavado.json`

## Objetivo

Incorporar una agenda comercial de peluquería y lavado integrada con Luna, manteniendo separación completa respecto de la agenda médica implementada en LAB-022.

La agenda deberá permitir configurar servicios con duraciones variables, calcular disponibilidad real y confirmar citas ficticias sin afectar la agenda médica ni el RAG público.

## Punto de partida

LAB-023 toma como referencia dos fuentes:

- la arquitectura comercial y conversacional validada en LAB-022;
- la lógica académica de peluquería y lavado validada durante el Challenge.

LAB-022 será la base técnica principal para:

- contrato de entrada y respuesta;
- identificación de clínica y sesión;
- manejo de estado conversacional;
- interpretación de fecha y hora;
- búsqueda de alternativas;
- revalidación antes de confirmar;
- manejo controlado de errores;
- integración con el RAG público;
- aislamiento entre sesiones.

La solución académica de peluquería será utilizada solamente como referencia para:

- calendario separado;
- servicios con duraciones distintas;
- cálculo completo entre inicio y término;
- prevención de cruces con eventos ocupados;
- presentación de rangos horarios;
- bloqueo de la duración completa del servicio.

## Resultado de la auditoría inicial

La agenda académica demostró correctamente que:

- peluquería y medicina deben utilizar calendarios separados;
- cada servicio debe bloquear su duración estimada completa;
- la siguiente cita puede comenzar al terminar la anterior;
- la cantidad diaria de citas depende de los servicios reservados;
- no se deben ofrecer horarios que terminen fuera de la jornada;
- la disponibilidad debe evaluar todo el intervalo del servicio;
- la confirmación debe revalidarse antes de crear el evento.

La implementación académica no debe copiarse directamente porque contiene:

- valores fijos;
- horarios incorporados dentro del código;
- duraciones generales;
- referencias a recursos académicos;
- lógica acoplada a una sola clínica;
- intervalos de inicio no administrables;
- recursos pertenecientes al entorno del Challenge.

## Decisiones de arquitectura relacionadas

LAB-023 deberá respetar especialmente:

- DAC-004 — Privacidad y seguridad desde el diseño;
- DAC-006 — Aislamiento de datos entre clínicas;
- DAC-011 — Límites de la inteligencia artificial y supervisión humana;
- DAC-013 — Integración funcional comercial desacoplada;
- DAC-015 — Agenda médica comercial parametrizable;
- DAC-016 — Agenda separada para peluquería y lavado;
- DAC-017 — Prioridad de urgencias y alerta interna activa;
- DAC-023 — Configuración administrable por clínica;
- DAC-024 — Modelo inicial de capacidad de las agendas.

## Alcance aprobado

LAB-023 deberá incorporar:

- detección de solicitudes de peluquería y lavado;
- aclaración cuando el usuario diga solamente que desea agendar;
- catálogo estructurado de servicios;
- servicios y combinaciones configurables;
- duración configurable por servicio;
- resolución de duración según tamaño u otra característica autorizada;
- intervalo de inicio configurable;
- jornada configurable por día;
- zona horaria configurable;
- fechas bloqueadas;
- cantidad de días de búsqueda;
- cantidad de alternativas;
- Google Calendar exclusivo;
- Data Table exclusiva;
- estado conversacional separado;
- recopilación de datos mínimos;
- interpretación de fecha y hora;
- conservación de fecha u hora entregadas por separado;
- consulta de disponibilidad real;
- alternativas compatibles con toda la duración;
- revalidación antes de confirmar;
- creación de eventos ficticios;
- cancelación y reinicio de solicitudes todavía abiertas;
- consultas informativas mediante el RAG público sin perder el estado;
- contrato público compatible con Streamlit;
- pruebas de regresión de LAB-022.

## Fuera de alcance

LAB-023 no incorporará todavía:

- urgencias médicas comerciales;
- alerta activa al equipo interno;
- RAG interno;
- operación interna protegida;
- cancelación de citas ya confirmadas;
- reprogramación de citas confirmadas;
- seguimiento previo o posterior;
- recordatorios;
- comunicaciones comerciales;
- RAG vectorial persistente;
- administración visual de configuraciones;
- múltiples peluqueros simultáneos;
- múltiples puestos de trabajo;
- pagos;
- datos personales reales.

Las urgencias se implementarán en LAB-024 y tendrán prioridad sobre peluquería, agenda médica, RAG y mensajes comerciales.

## Clínica ficticia utilizada

La configuración inicial continuará utilizando exclusivamente:

`clinic_id = clinica_piloto_001`

Todos los tutores, mascotas, teléfonos, eventos y conversaciones utilizados en las pruebas serán ficticios.

## Arquitectura propuesta

La implementación inicial se desarrollará en un workflow nuevo de n8n basado en la arquitectura validada de LAB-022.

Nombre previsto:

`LAB-023 - Agenda comercial de peluquería y lavado`

La construcción deberá realizarse mediante una copia controlada de LAB-022, manteniendo LAB-022 publicado y sin modificaciones durante el desarrollo inicial.

Flujo previsto:

`Streamlit → webhook LAB-023 → Luna → RAG público o agenda correspondiente → respuesta pública`

La agenda médica y la agenda de peluquería deberán permanecer como ramas lógicas separadas.

## Separación de recursos

La agenda de peluquería utilizará recursos propios:

| Recurso | Agenda médica | Peluquería y lavado |
|---|---|---|
| Google Calendar | Exclusivo médico | Exclusivo peluquería |
| Data Table | `lab022_estado_agenda` | Nueva tabla LAB-023 |
| Catálogo | Servicios médicos | Servicios de peluquería |
| Duraciones | Configuración médica | Configuración por servicio |
| Estado conversacional | Médico | Peluquería |
| Eventos | Consultas médicas | Servicios de peluquería |

Nombre previsto para la nueva Data Table:

`lab023_estado_peluqueria`

Clave prevista:

`clinic_id::session_id`

Aunque ambas agendas utilicen la misma estructura de clave, sus tablas, calendarios, estados y configuraciones deberán permanecer separados.

## Catálogo inicial de servicios

El catálogo inicial podrá incluir:

- baño;
- corte;
- baño y corte.

La palabra `lavado` podrá tratarse como sinónimo configurable de baño o como un servicio independiente cuando una clínica lo requiera.

Cada combinación comercial deberá contar con una configuración determinista.

No se asumirá que la duración de un servicio combinado sea automáticamente la suma de las duraciones de sus partes.

La configuración inicial podrá diferenciar servicios según especie y tamaño cuando esa información cambie la duración estimada.

## Configuración mínima por servicio

Cada servicio deberá poder definir:

- `service_id`;
- nombre público;
- estado activo;
- especies permitidas;
- tamaños permitidos;
- duración en minutos;
- intervalo de inicio en minutos;
- necesidad de tamaño;
- necesidad de información de pelaje;
- necesidad de revisión humana.

Las duraciones definitivas de la clínica piloto se establecerán durante la implementación y se validarán exclusivamente con datos ficticios.

### Configuración ficticia inicial aprobada para la implementación

Para el prototipo de LAB-023 se utilizará una configuración inicial completamente ficticia y posteriormente parametrizable por clínica.

Alcance automático inicial:

- especie permitida: perro;
- tamaños permitidos: pequeño, mediano y grande;
- `lavado` se normaliza inicialmente como sinónimo de `bano`;
- tamaño obligatorio para resolver la duración;
- tipo de pelaje opcional para todos los servicios;
- el tipo de pelaje puede conservarse si el usuario lo informa, pero no modifica la duración inicial;
- casos fuera del catálogo deberán pasar a revisión humana.

Duraciones ficticias iniciales:

| `service_id` | Nombre público | Pequeño | Mediano | Grande | Intervalo de inicio | Uso del pelaje |
|---|---|---:|---:|---:|---:|---|
| `bano` | Baño | 60 minutos | 90 minutos | 120 minutos | 30 minutos | Opcional |
| `corte` | Corte | 90 minutos | 120 minutos | 150 minutos | 30 minutos | Opcional |
| `bano_y_corte` | Baño y corte | 120 minutos | 150 minutos | 180 minutos | 30 minutos | Opcional |

Configuración ficticia de jornada:

- lunes a viernes: 09:00 a 18:30;
- sábado: 10:00 a 14:00;
- domingo: cerrado;
- días de búsqueda: 7;
- alternativas ofrecidas: 3;
- capacidad simultánea: 1;
- fechas bloqueadas iniciales: ninguna.

Estas duraciones no representan valores reales de una clínica y deberán mantenerse configurables.

## Configuración de agenda

La configuración general deberá contener como mínimo:

- `clinic_id`;
- `calendar_id`;
- zona horaria;
- cantidad de días de búsqueda;
- cantidad de alternativas;
- intervalo de inicio predeterminado;
- jornada por día;
- fechas bloqueadas;
- catálogo de servicios.

Cada servicio podrá sobrescribir:

- duración;
- intervalo de inicio;
- especies permitidas;
- tamaños permitidos;
- requisitos adicionales.

La configuración de peluquería deberá permanecer separada de la configuración de la agenda médica.

## Datos mínimos

La confirmación automática deberá recopilar:

- nombre del tutor;
- teléfono;
- nombre de la mascota;
- especie;
- servicio;
- tamaño;
- fecha;
- hora.

Podrán solicitarse de manera condicional:

- tipo de pelaje;
- longitud del pelaje;
- raza;
- observaciones;
- información de comportamiento.

Los datos adicionales solo deberán solicitarse cuando sean necesarios para resolver el servicio, su duración o una derivación segura.

## Duraciones y disponibilidad

La regla central será:

`fin = inicio + duración configurada`

Un horario solo podrá ofrecerse cuando:

- el servicio esté activo;
- la especie y el tamaño estén permitidos;
- el inicio respete el intervalo configurado;
- el inicio sea posterior o igual a la apertura;
- el término sea anterior o igual al cierre;
- la fecha no esté bloqueada;
- no exista cruce con otro evento;
- la duración completa esté disponible.

La duración y el intervalo de inicio serán parámetros diferentes.

Ejemplo conceptual:

- duración del servicio: 90 minutos;
- intervalo de inicio: 30 minutos.

En ese caso podrán evaluarse inicios cada 30 minutos, pero solo se ofrecerán cuando los 90 minutos completos estén disponibles.

## Estados conversacionales propuestos

Los estados iniciales previstos son:

- `nuevo`;
- `esperando_servicio`;
- `esperando_datos_minimos`;
- `esperando_fecha_horario`;
- `esperando_seleccion_horario`;
- `esperando_horario_futuro`;
- `sin_horarios_disponibles`;
- `requiere_revision_humana`;
- `confirmada`.

La estructura definitiva deberá validarse durante la implementación.

## Datos del estado

La Data Table deberá poder conservar:

- `session_key`;
- `clinic_id`;
- `session_id`;
- estado;
- `service_id`;
- nombre público del servicio;
- duración resuelta;
- nombre del tutor;
- teléfono;
- nombre de la mascota;
- especie;
- tamaño;
- tipo de pelaje;
- fecha pendiente;
- hora pendiente;
- hora de inicio;
- hora de término;
- alternativas ofrecidas;
- fecha de actualización.

La duración resuelta deberá conservarse junto con la solicitud para evitar cálculos diferentes durante la confirmación.

Una modificación del servicio, tamaño u otro dato que afecte la duración deberá invalidar las alternativas anteriores y generar una nueva búsqueda.

## Convivencia con la agenda médica

Luna deberá distinguir entre:

- consulta veterinaria;
- peluquería o lavado;
- consulta informativa.

Ejemplos de enrutamiento:

- `Necesito una consulta` → agenda médica;
- `Quiero baño y corte` → agenda de peluquería;
- `Necesito agendar` → solicitar aclaración;
- `¿Cuánto cuesta el baño?` → RAG público.

Una solicitud de peluquería no deberá borrar el estado de una solicitud médica.

Una solicitud médica no deberá borrar el estado de peluquería.

Cuando exista una operación abierta y el usuario intente iniciar otra incompatible, Luna deberá preguntar cuál desea continuar.

Cancelar o reiniciar una agenda no deberá modificar automáticamente el estado de la otra.

## Integración con el RAG público

El RAG público continuará respondiendo consultas autorizadas sobre:

- servicios;
- precios;
- duración estimada;
- requisitos;
- horarios;
- información pública aprobada por la clínica.

Una consulta informativa durante una reserva no deberá eliminar ni reiniciar el estado de peluquería.

Después de responder mediante el RAG, Luna deberá permitir que el usuario continúe la reserva pendiente.

La duración utilizada para bloquear Google Calendar deberá provenir de la configuración estructurada y no de una respuesta libre generada por el modelo.

El RAG en memoria y su trigger de recarga continuarán siendo una solución transitoria hasta la implementación del almacenamiento vectorial persistente en LAB-029.

## Derivación humana

La confirmación automática deberá detenerse cuando:

- no pueda determinarse el servicio solicitado;
- no pueda resolverse una duración concreta;
- la especie no esté autorizada para el servicio;
- el tamaño quede fuera del catálogo configurado;
- el servicio requiera una evaluación previa;
- el tutor informe agresividad o estrés intenso;
- se solicite sedación;
- exista una condición especial configurada;
- falten datos esenciales que no puedan recuperarse;
- Luna no pueda actuar con seguridad.

En LAB-023 la derivación deberá:

- informar que la solicitud necesita revisión de la clínica;
- no crear la cita automáticamente;
- conservar un estado conversacional seguro;
- evitar afirmar que el equipo interno fue avisado;
- permitir que el usuario cancele o reinicie la solicitud.

El aviso interno activo de la derivación se incorporará posteriormente dentro de la operación interna protegida.

Una posible urgencia médica no deberá tratarse como una derivación normal. Desde LAB-024 tendrá prioridad sobre todas las demás funciones.

## Confirmación y Google Calendar

Antes de crear el evento se deberá:

1. recuperar la alternativa seleccionada desde el estado;
2. comprobar que los datos mínimos continúan completos;
3. comprobar que el servicio y la duración resuelta siguen vigentes;
4. revalidar la disponibilidad completa en Google Calendar;
5. crear el evento solamente cuando el horario continúe libre;
6. ofrecer nuevas alternativas cuando aparezca un conflicto;
7. guardar el estado como confirmado solamente después de crear el evento.

La confirmación pública no deberá emitirse si falla la consulta, la revalidación, la creación del evento o la persistencia del estado.

El evento deberá registrar como mínimo:

- servicio;
- mascota;
- tutor;
- teléfono ficticio durante las pruebas;
- especie;
- tamaño;
- duración bloqueada;
- hora de inicio;
- hora estimada de término;
- observaciones autorizadas.

El evento no deberá incluir:

- credenciales;
- nombres de nodos;
- prompts;
- estados técnicos;
- proveedores de inteligencia artificial;
- información interna innecesaria.

La revalidación disminuye el riesgo de una reserva duplicada, pero no constituye un bloqueo transaccional distribuido.

## Contrato de entrada previsto

```json
{
  "clinic_id": "clinica_piloto_001",
  "session_id": "sesion_ficticia",
  "message": "Quiero agendar baño y corte para mi perro",
  "channel": "streamlit"
}
```

Los identificadores y datos utilizados durante las pruebas deberán ser ficticios.

## Contrato de respuesta pública

```json
{
  "ok": true,
  "clinic_id": "clinica_piloto_001",
  "session_id": "sesion_ficticia",
  "reply": "respuesta visible para el usuario"
}
```

La respuesta pública deberá limitarse a:

- `ok`;
- `clinic_id`;
- `session_id`;
- `reply`.

No deberá exponer estados conversacionales, alternativas internas, identificadores de Calendar, Data Tables, nombres de nodos ni errores técnicos.

## Pruebas obligatorias

### Enrutamiento y aislamiento

- la agenda médica continúa funcionando;
- las solicitudes de peluquería utilizan su rama propia;
- una solicitud ambigua pide aclaración;
- una consulta informativa utiliza el RAG público;
- medicina y peluquería no mezclan estados;
- cancelar medicina no cancela peluquería;
- cancelar peluquería no cancela medicina;
- sesiones distintas permanecen aisladas;
- una clínica inválida es rechazada de forma segura.

### Servicios y datos

- baño es reconocido;
- corte es reconocido;
- baño y corte es reconocido;
- lavado se normaliza según la configuración;
- un servicio ambiguo solicita aclaración;
- un servicio inexistente no se inventa;
- tamaño ausente se solicita cuando es obligatorio;
- especie ausente se solicita;
- datos entregados en mensajes separados se conservan;
- un servicio no autorizado deriva a revisión humana;
- una condición especial no se confirma automáticamente.

### Duraciones

- un servicio corto bloquea su duración configurada;
- un servicio largo bloquea su duración configurada;
- un cambio de tamaño modifica la duración cuando corresponde;
- un cambio de servicio invalida las alternativas anteriores;
- la siguiente cita puede comenzar cuando termina la anterior;
- no se ofrece un horario cuyo término supere el cierre;
- duración e intervalo de inicio se validan por separado;
- el evento creado conserva el inicio y término correctos.

### Disponibilidad

- día sin eventos;
- día parcialmente ocupado;
- cruce al inicio del servicio;
- cruce durante el servicio;
- cruce cerca del término;
- jornada cerrada;
- fecha bloqueada;
- horario fuera de jornada;
- inicio fuera del intervalo permitido;
- ausencia total de horarios;
- recuperación desde `sin_horarios_disponibles`;
- alternativas compatibles con toda la duración;
- búsqueda dentro de la cantidad de días configurada.

### Conversación

- fecha seguida de hora;
- hora seguida de fecha;
- solo fecha solicita o permite completar la hora;
- solo hora solicita la fecha y conserva la hora;
- datos mínimos entregados en mensajes separados;
- selección de alternativa por número;
- selección de alternativa por fecha y hora;
- rechazo de alternativas;
- solicitud de un horario más temprano;
- solicitud de un horario posterior;
- consulta RAG durante una reserva abierta;
- continuidad de la reserva después de responder mediante RAG;
- cancelación de una solicitud abierta;
- reinicio de una solicitud abierta;
- derivación humana sin crear cita;
- intento de iniciar agenda médica mientras peluquería está abierta;
- intento de iniciar peluquería mientras la agenda médica está abierta.

### Confirmación y errores

- revalidación con horario libre;
- conflicto incorporado antes de confirmar;
- nuevas alternativas después de un conflicto;
- error al consultar Google Calendar;
- error durante la revalidación;
- error al crear el evento;
- error al leer el estado conversacional;
- error al guardar el estado conversacional;
- error al recuperar la alternativa seleccionada;
- evento creado con inicio y término correctos;
- duración del evento igual a la duración resuelta;
- descripción del evento con datos ficticios autorizados;
- ausencia de credenciales y detalles técnicos en el evento;
- estado confirmado solamente después de crear el evento;
- respuesta pública sin confirmación falsa ante un fallo;
- respuesta pública limitada a `ok`, `clinic_id`, `session_id` y `reply`.

### Regresión

- agenda médica completa de LAB-022;
- búsqueda de disponibilidad médica;
- confirmación médica;
- cancelación y reinicio de solicitudes médicas abiertas;
- RAG público antes de abrir una agenda;
- RAG público durante una agenda abierta;
- RAG público después de una cita confirmada;
- recarga automática transitoria del RAG;
- reinicio controlado de n8n;
- Streamlit comercial;
- webhook de prueba;
- webhook permanente;
- aislamiento entre sesiones;
- separación entre calendarios;
- separación entre Data Tables;
- contrato público sin campos internos.

## Seguridad y privacidad

LAB-023 deberá:

- utilizar exclusivamente datos ficticios durante desarrollo y pruebas;
- recopilar solamente los datos necesarios para gestionar el servicio;
- proteger credenciales, calendarios y configuraciones;
- evitar información interna en las respuestas públicas;
- mantener separados los recursos médicos y de peluquería;
- validar `clinic_id` y `session_id` antes de procesar la solicitud;
- impedir el acceso cruzado entre clínicas;
- evitar confirmar acciones cuando falle una integración;
- registrar errores sin exponer detalles técnicos al usuario;
- conservar supervisión humana para casos especiales;
- mantener el contrato público de cuatro campos;
- eliminar los eventos y estados ficticios utilizados en las pruebas finales.

No se autorizará el uso de datos personales reales durante LAB-023.

La habilitación de datos reales dependerá de completar las etapas de autenticación, aislamiento, privacidad, persistencia, monitoreo y preparación para el piloto.

## Limitaciones iniciales

LAB-023 utilizará inicialmente el modelo:

`un calendario de peluquería = una capacidad simultánea`

Esta versión no resolverá todavía:

- múltiples peluqueros simultáneos;
- múltiples puestos de trabajo;
- salas o equipos compartidos;
- capacidad múltiple dentro de un mismo calendario;
- bloqueo transaccional distribuido;
- expiración automática de estados conversacionales;
- eliminación automática de estados antiguos;
- cancelación de citas ya confirmadas;
- reprogramación de citas confirmadas;
- aviso interno activo de derivaciones;
- administración visual de configuraciones;
- almacenamiento vectorial persistente;
- datos personales reales.

Las limitaciones deberán quedar registradas al cierre y no deberán ocultarse en la interfaz ni en la documentación técnica.

## Criterio de cierre

LAB-023 podrá cerrarse solamente cuando:

- el workflow haya sido construido y validado desde la interfaz visual de n8n;
- LAB-022 continúe funcionando sin regresiones;
- el calendario de peluquería esté separado del calendario médico;
- la Data Table de peluquería esté separada del estado médico;
- el catálogo y las duraciones variables funcionen según la configuración;
- la jornada, los intervalos y las fechas bloqueadas sean respetados;
- las alternativas correspondan a disponibilidad real;
- la revalidación antes de confirmar funcione;
- los errores no generen confirmaciones falsas;
- los eventos ficticios se creen con inicio y término correctos;
- las consultas RAG conserven el estado de la reserva;
- la derivación humana no cree citas automáticamente;
- el contrato público contenga solamente cuatro campos;
- las pruebas obligatorias y de regresión estén aprobadas;
- los eventos ficticios utilizados en las pruebas finales sean eliminados;
- la Data Table ficticia sea limpiada al cierre;
- el workflow sea exportado desde n8n después de validarlo;
- el archivo JSON exportado sea válido;
- no existan secretos ni datos reales en la exportación;
- el roadmap, las decisiones de arquitectura y este README estén actualizados;
- el repositorio sea revisado antes del cierre;
- se realice un único commit final para LAB-023.

No se realizarán commits intermedios durante el desarrollo.

## Implementación final validada

La implementación se realizó mediante el workflow:

`LAB-023 - Agenda comercial de peluquería y lavado`

El workflow final integra:

- la rama médica heredada y validada desde LAB-022;
- una rama independiente para peluquería y lavado;
- un Google Calendar exclusivo para peluquería;
- la Data Table exclusiva `lab023_estado_peluqueria`;
- estado conversacional independiente mediante la clave `clinic_id::session_id`;
- catálogo de baño, corte y baño y corte;
- duraciones determinadas por servicio y tamaño;
- tipo de pelaje opcional;
- intervalo de inicio independiente de 30 minutos;
- validación de jornada, duración completa, fechas pasadas y días sin atención;
- búsqueda de hasta 7 días y entrega de 3 alternativas;
- capacidad simultánea inicial igual a 1;
- posibilidad de comenzar una cita al finalizar exactamente la anterior;
- consulta y revalidación real de disponibilidad en Google Calendar;
- creación controlada de eventos;
- manejo de errores sin confirmaciones falsas;
- revisión humana para especies distintas de perro y servicios fuera del catálogo;
- continuidad del RAG público sin pérdida del estado de reserva;
- contrato público limitado a `ok`, `clinic_id`, `session_id` y `reply`.

La exportación final contiene 143 nodos y 158 conexiones definidas. La revisión estática no encontró nombres o identificadores duplicados, conexiones inválidas, referencias a nodos inexistentes ni secretos incorporados intencionalmente.

## Pruebas finales aprobadas

Se validaron, utilizando exclusivamente datos ficticios:

- detección y continuidad de solicitudes de peluquería;
- normalización de `lavado` como baño;
- duraciones de 60 a 180 minutos según servicio y tamaño;
- rechazo de horarios fuera de jornada, domingos, fechas pasadas e inicios fuera del intervalo;
- aceptación de servicios que terminan exactamente al cierre;
- búsqueda de disponibilidad y alternativas reales;
- citas adyacentes sin conflicto;
- conflicto detectado durante la confirmación y durante la revalidación final;
- errores de consulta, revalidación, creación de eventos y guardado de estado;
- derivación humana sin creación automática de citas;
- aislamiento entre la agenda médica y la agenda de peluquería;
- consultas al RAG durante una reserva abierta y continuación posterior de la reserva;
- regresión de la agenda médica desde Streamlit;
- respuestas HTTP con el contrato público de cuatro campos.

Durante la validación desde Streamlit se detectó que el intérprete podía guardar el nombre de una mascota como `Nube y mi` al recibir en un mismo mensaje el nombre del tutor, la mascota y el teléfono. Se corrigió el nodo `Interpretar datos reserva peluquería` para detener el nombre de la mascota antes de las frases que introducen el teléfono.

Después de la corrección se comprobó que:

- el tutor quedó guardado como `Andrea Prueba`;
- la mascota quedó guardada correctamente como `Nube`;
- el teléfono ficticio fue normalizado;
- el estado avanzó a espera de fecha y hora;
- se creó una cita ficticia de baño para tamaño mediano con una duración de 90 minutos;
- el evento y la Data Table conservaron los datos correctos.

## Limpieza de cierre

Después de completar las pruebas:

- se eliminaron del calendario exclusivo de peluquería los eventos ficticios creados durante LAB-023;
- se eliminaron todas las filas ficticias de `lab023_estado_peluqueria`;
- la tabla y sus 19 columnas se conservaron;
- la tabla quedó con 0 filas;
- no se eliminaron filas de `lab022_estado_agenda`;
- no se modificaron ni eliminaron eventos del calendario médico.

## Estado operativo final

- `LAB-023 - Agenda comercial de peluquería y lavado`: activo y vigente;
- `LAB-022 - Agenda médica comercial parametrizable`: inactivo y conservado como referencia histórica;
- Streamlit: conectado al webhook permanente de LAB-023;
- calendario médico y calendario de peluquería: separados;
- Data Tables médica y de peluquería: separadas;
- datos personales reales: prohibidos hasta completar la preparación para el piloto.

## Exportación oficial

La exportación validada se guardó en:

`n8n/workflows/comercial/lab023_agenda_comercial_peluqueria_lavado.json`

La copia almacenada en el repositorio coincide exactamente mediante SHA-256 con la exportación final descargada desde n8n.

## Resultado

LAB-023 cumple los criterios funcionales, técnicos, conversacionales, de aislamiento, seguridad y limpieza definidos para el laboratorio.

El cierre del repositorio se consolidará mediante un único commit final de LAB-023.
