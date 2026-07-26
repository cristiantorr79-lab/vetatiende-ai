# LAB-022 — Agenda médica comercial parametrizable

## Estado

Validado técnicamente el 29 de julio de 2026 utilizando exclusivamente datos ficticios.

El workflow fue publicado y probado después de un reinicio controlado de n8n. El cierre documental y el único commit correspondiente a LAB-022 permanecen pendientes hasta completar las verificaciones finales del repositorio.

## Objetivo

Incorporar a Luna una agenda médica comercial parametrizable, con estado conversacional persistente, consulta real de disponibilidad en Google Calendar y continuidad con el RAG público comercial desarrollado en LAB-021.

## Alcance implementado

- Agenda médica integrada dentro del workflow comercial de Luna.
- Configuración de horarios, duración, intervalos y calendario por clínica.
- Estado conversacional persistido mediante n8n Data Tables.
- Interpretación de fechas y horas en conversaciones de varios mensajes.
- Conservación independiente de fecha y hora pendientes.
- Consulta real de disponibilidad en Google Calendar.
- Generación de alternativas válidas.
- Revalidación de disponibilidad antes de confirmar.
- Creación de citas ficticias en Google Calendar.
- Cancelación y reinicio de solicitudes de agenda en curso.
- Continuidad de preguntas informativas mediante RAG.
- Recarga automática del almacén vectorial después de iniciar n8n.
- Respuestas públicas sin exposición del estado interno.
- Uso exclusivo de datos ficticios.

## Fuera de alcance

LAB-022 no incorpora:

- cancelación de citas ya creadas en Google Calendar;
- modificación de citas confirmadas;
- peluquería o lavado;
- urgencias;
- Telegram;
- Google Sheets;
- autenticación completa de usuarios finales;
- administración visual de configuraciones por clínica;
- datos personales reales;
- aislamiento comercial definitivo para múltiples clínicas;
- almacén vectorial persistente.

## Clínica ficticia utilizada

~~~text
clinica_piloto_001
~~~

## Workflow comercial

Nombre en n8n:

~~~text
LAB-022 - Agenda médica comercial parametrizable
~~~

Exportación oficial:

~~~text
n8n/workflows/comercial/lab022_agenda_medica_comercial_parametrizable.json
~~~

El workflow final contiene 77 nodos y permanece activo en la instancia comercial de n8n.

## Webhook

Ruta utilizada por LAB-022:

~~~text
/webhook/vetatiende-comercial-chat-lab022
~~~

Las pruebas directas del webhook publicado se realizaron mediante el túnel SSH hacia n8n.

El dominio público actualmente enruta una solicitud directa a `/webhook/...` hacia el servicio Uvicorn y devuelve HTTP 405. La revisión de esa regla de proxy queda fuera del alcance funcional de LAB-022, ya que la integración operativa desde Streamlit utiliza la conexión interna configurada para el entorno comercial.

## Arquitectura validada

~~~text
Streamlit comercial
        ↓
Webhook permanente LAB-022
        ↓
n8n
        ├── RAG público comercial
        ├── Data Table de estado
        └── Google Calendar
        ↓
Respuesta pública a Streamlit
~~~

Componentes principales:

- Streamlit comercial autohospedado;
- n8n comercial versión 2.29.8;
- Google Calendar comercial ficticio;
- n8n Data Tables;
- Groq para generación de respuestas;
- Cohere para embeddings;
- Simple Vector Store en memoria;
- Caddy como proxy reverso;
- Docker Compose en Oracle Cloud.

## Configuración parametrizable

La configuración base permite definir:

- `service_id`;
- duración de la atención;
- intervalo válido de inicio;
- cantidad de días a revisar;
- cantidad de alternativas;
- zona horaria;
- jornada por día;
- fechas bloqueadas;
- calendario asociado.

Configuración base validada:

- servicio: `consulta_general`;
- duración: 30 minutos;
- intervalo de inicio: 30 minutos;
- búsqueda: hasta 7 días;
- alternativas: 3;
- zona horaria: `America/Santiago`;
- lunes a viernes: 09:00–18:30;
- sábado: 10:00–14:00;
- domingo: sin atención regular;
- fechas bloqueadas: lista vacía.

También se probaron temporalmente:

- duraciones de 15, 30 y 45 minutos;
- intervalos de 15 y 30 minutos;
- fechas bloqueadas;
- fechas sin disponibilidad;
- horarios fuera de jornada;
- horarios que no respetan el intervalo configurado.

## Estado conversacional

Data Table utilizada:

~~~text
lab022_estado_agenda
~~~

Clave compuesta:

~~~text
clinic_id::session_id
~~~

Estados principales:

- `nuevo`;
- `esperando_datos_minimos`;
- `esperando_fecha_horario`;
- `esperando_seleccion_horario`;
- `esperando_horario_futuro`;
- `sin_horarios_disponibles`;
- `confirmada`.

Datos conversacionales almacenados:

- nombre del tutor;
- nombre de la mascota;
- teléfono;
- fecha solicitada;
- hora solicitada;
- `start_time`;
- alternativas;
- estado de agenda;
- `fecha_pendiente`;
- `hora_pendiente`.

Los campos `fecha_pendiente` y `hora_pendiente` permiten conservar por separado información entregada en mensajes distintos.

Ejemplos validados:

~~~text
Usuario: Quiero una hora el viernes
Usuario: A las 10
~~~

~~~text
Usuario: Quiero una hora a las 10
Usuario: El viernes
~~~

En ambos casos, Luna combina la fecha y la hora sin perder el estado anterior.

## Detección de intención

La detección distingue entre:

- solicitud nueva de agenda;
- continuación de una agenda abierta;
- entrega de fecha;
- entrega de hora;
- selección de alternativa;
- entrega de datos mínimos;
- confirmación;
- cancelación de la solicitud;
- reinicio de la solicitud;
- pregunta informativa para el RAG.

Una consulta informativa realizada durante una agenda abierta se deriva al RAG sin eliminar la fecha, la hora ni el estado acumulado.

## Datos mínimos

Antes de confirmar una cita se solicitan:

- nombre del tutor;
- nombre de la mascota;
- teléfono móvil chileno válido.

El número se normaliza al formato utilizado por la clínica ficticia.

No se utilizaron datos personales reales durante las pruebas.

## Interpretación de fecha y hora

Se validaron expresiones como:

- `hoy`;
- `mañana`;
- `pasado mañana`;
- días de la semana;
- fechas explícitas;
- horas AM y PM;
- `y cuarto`;
- `y media`;
- selección mediante número;
- expresiones como `la segunda`.

También se validó:

- rechazo de fechas pasadas;
- rechazo de horarios fuera de la jornada;
- rechazo de horarios que terminan después del cierre;
- ajuste hacia el siguiente intervalo permitido;
- continuación de una conversación que contiene solo fecha;
- continuación de una conversación que contiene solo hora.

## Disponibilidad y alternativas

El workflow consulta Google Calendar antes de ofrecer horarios.

Se validaron:

- días sin eventos;
- días con eventos ocupados;
- días completamente bloqueados;
- ausencia total de horarios dentro del rango;
- recuperación después de solicitar una nueva fecha;
- alternativas posteriores cercanas al horario solicitado;
- tres alternativas reales según la configuración base.

Una solicitud como `10:15`, con intervalos de inicio de 30 minutos, ofrece primero opciones posteriores como `10:30`, `11:00` y `11:30`.

## Confirmación y revalidación

Antes de crear una cita se realiza una comprobación final de disponibilidad.

Se validaron dos escenarios:

1. Horario todavía disponible:
   - la cita se crea;
   - el evento aparece en Google Calendar;
   - el estado queda `confirmada`.

2. Horario ocupado antes de confirmar:
   - la cita no se crea;
   - Luna informa el conflicto;
   - se ofrecen nuevas alternativas.

La prueba final creó una cita ficticia para el 17 de febrero de 2027 entre las 09:00 y las 09:30. El evento fue verificado visualmente y eliminado después de la prueba.

## Cancelación y reinicio

Se validaron los comandos conversacionales para:

- cancelar una solicitud de agenda abierta;
- reiniciar la solicitud;
- limpiar fecha y hora pendientes;
- comenzar nuevamente sin conservar información anterior.

Estas funciones controlan la conversación de agenda. No eliminan ni modifican una cita ya confirmada en Google Calendar.

## RAG público comercial

LAB-022 conserva la rama RAG implementada en LAB-021.

Documentos operativos:

- `faq_clientes.pdf`;
- `servicios_precios.csv`.

El almacén vectorial continúa funcionando en memoria.

Para evitar que el RAG quede vacío después de reiniciar n8n, se incorporó el trigger:

~~~text
Recargar RAG al iniciar n8n
~~~

Flujo de inicio:

~~~text
Recargar RAG al iniciar n8n
        ↓
Leer documentos públicos comerciales
        ↓
Preparar documentos
        ↓
Cargar documentos públicos en RAG
~~~

Después del reinicio controlado se validó:

- contenedor n8n saludable;
- `/healthz` con HTTP 200;
- ejecución automática del trigger;
- lectura de 2 documentos;
- carga de 30 fragmentos;
- consulta posterior mediante webhook permanente;
- respuesta correcta sobre la vacuna antirrábica;
- precio referencial de 16.000 CLP;
- ausencia de información técnica interna en la respuesta.

El nodo de inserción utiliza `Clear Store` antes de cargar los documentos, evitando acumulación de fragmentos duplicados en cada reinicio.

## Contrato de entrada

Ejemplo:

~~~json
{
  "clinic_id": "clinica_piloto_001",
  "session_id": "sesion_ficticia_001",
  "message": "Quiero una hora el viernes a las 10",
  "channel": "web"
}
~~~

Campos obligatorios:

- `clinic_id`;
- `session_id`;
- `message`;
- `channel`.

Se validó rechazo controlado cuando:

- falta `session_id`;
- el `clinic_id` no está habilitado para el canal.

## Contrato de respuesta pública

Ejemplo:

~~~json
{
  "ok": true,
  "clinic_id": "clinica_piloto_001",
  "session_id": "sesion_ficticia_001",
  "reply": "Tengo estas alternativas reales disponibles..."
}
~~~

La respuesta pública contiene únicamente:

- `ok`;
- `clinic_id`;
- `session_id`;
- `reply`.

No expone:

- `agendaConfig`;
- `estadoAgenda`;
- identificadores internos del calendario;
- credenciales;
- claves;
- stack traces;
- nombres de proveedores técnicos;
- detalles internos de ejecución.

## Validaciones funcionales

Se validaron correctamente:

- RAG antes del reinicio;
- reinicio controlado de n8n;
- recarga automática del RAG;
- RAG después del reinicio;
- webhook permanente mediante túnel;
- agenda después del reinicio;
- fecha seguida de hora;
- hora seguida de fecha;
- solo hora;
- solo fecha;
- fechas pasadas;
- horarios fuera de jornada;
- intervalos inválidos;
- fechas bloqueadas;
- días sin horarios;
- recuperación desde `sin_horarios_disponibles`;
- selección de alternativas;
- revalidación antes de confirmar;
- conflicto durante la confirmación;
- creación real de evento ficticio;
- eliminación posterior del evento de prueba;
- cancelación de solicitud;
- reinicio de solicitud;
- consultas RAG durante una agenda abierta;
- consulta RAG después de una cita confirmada;
- aislamiento entre dos sesiones;
- conservación independiente de estados;
- respuesta pública sin campos internos.

## Validación técnica de la exportación

La exportación final fue revisada mediante PowerShell.

Resultados:

- JSON válido;
- 77 nodos;
- workflow activo;
- hash idéntico entre la descarga y el archivo del repositorio;
- trigger de inicio presente;
- rama de solo hora presente;
- guardado de hora pendiente presente;
- respuesta para solicitar fecha presente;
- `fecha_pendiente` presente;
- `hora_pendiente` presente;
- `Clear Store` presente;
- fecha temporal de prueba ausente;
- sin nodo temporal `Wait`;
- sin secretos incorporados intencionalmente.

## Seguridad y privacidad

Durante LAB-022:

- se utilizaron exclusivamente datos ficticios;
- no se incluyeron tokens ni claves en el JSON exportado;
- las credenciales permanecen administradas por n8n;
- no se expusieron direcciones IP ni secretos en la documentación;
- la respuesta pública se redujo a cuatro campos;
- las pruebas de tutor, mascota y teléfono utilizaron identidades ficticias;
- los eventos de prueba fueron eliminados de Google Calendar después de validarlos.

Después de las pruebas finales se eliminaron las 33 filas ficticias acumuladas en la Data Table. La tabla y su estructura se conservaron, quedando con 0 filas.

## Limitaciones técnicas actuales

### Simple Vector Store

El RAG utiliza almacenamiento en memoria. La recarga automática después de iniciar n8n reduce el impacto operativo, pero no reemplaza una base vectorial persistente.

### Proxy público

La ruta pública directa `/webhook/...` está siendo atendida por Uvicorn y devuelve HTTP 405. La ruta interna utilizada por Streamlit y las pruebas mediante túnel hacia n8n funcionan correctamente.

### Concurrencia

La revalidación final reduce el riesgo de doble reserva, pero no constituye un bloqueo transaccional distribuido. Una solución comercial con alta concurrencia requerirá un mecanismo más robusto.

### Retención

La política técnica de expiración y eliminación automática de estados conversacionales todavía no está implementada.

### Citas confirmadas

LAB-022 permite cancelar o reiniciar una solicitud abierta, pero no cancelar ni modificar eventos ya creados.

## Resultado

LAB-022 deja una agenda médica comercial funcional y parametrizable, integrada con Luna, Google Calendar, Data Tables, Streamlit y el RAG público comercial.

La solución fue validada antes y después de reiniciar n8n, incluyendo la recarga automática de 30 fragmentos del RAG y el funcionamiento de la agenda mediante el webhook permanente.

El workflow final quedó publicado, activo y exportado con 77 nodos.

El siguiente paso es revisar el diff final y realizar el único commit de cierre del laboratorio.
