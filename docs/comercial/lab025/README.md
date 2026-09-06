# LAB-025 — Operación interna protegida y RAG interno comercial

## Estado

**Cerrado, validado y publicado el 31 de agosto de 2026.**

LAB-025 implementa la operación interna protegida del piloto comercial de VetAtiende AI manteniendo separación estricta respecto del canal público. LAB-024/LAB-024.1 continúa como núcleo público de urgencias y LAB-025 funciona como workflow interno independiente.

El nombre histórico de la rama `mvp-comercial` se conserva por trazabilidad. El cierre de LAB-025 se evalúa con criterios de operación real del piloto: seguridad, aislamiento, trazabilidad, persistencia, mantenibilidad y control humano.

## Objetivo cumplido

### Extensión local LAB-027, bloque 1G

Se añaden únicamente `ver_tareas_seguimiento` y `cerrar_tarea_seguimiento` a la
puerta interna protegida existente. El export local permanece inactivo durante
esta construcción; no se ha desplegado ni modificado el servicio en ejecución.

| Acción | Permiso requerido | Resultado |
|---|---|---|
| ver_tareas_seguimiento | seguimientos_ver | Lista tareas pendientes/en_proceso de LAB-027 de la clínica autenticada. |
| cerrar_tarea_seguimiento | seguimientos_operar | Cierra la tarea indicada por recurso_id, verifica y audita antes de responder éxito. |

La matriz aprobada concede ambos permisos a recepción (`recepcion`), veterinario
y administrador. Se mantiene la comprobación de identidad, usuario activo,
clínica y permiso activo cargado desde `lab025_permisos_roles`; el rol por sí solo
no concede acceso. Las pruebas simulan esas filas con datos ficticios. Este bloque
no inserta permisos ni usuarios reales ni ejecuta migraciones: su habilitación en
un entorno operativo requiere las filas de permisos correspondientes.

Se reutiliza `lab025_tareas` sin cambiar sus doce columnas string: `task_id`,
`clinic_id`, `titulo`, `descripcion`, `prioridad`, `estado`, `creado_por`,
`asignado_a`, `fecha_creacion`, `fecha_limite`, `fecha_actualizacion`, `fecha_cierre`.
**fecha_cierre existe** en el esquema del export y en su nodo de cierre.
El listado y el cierre exigen `creado_por=sistema_lab027` y una identidad
determinista LAB-027 válida que incluya la clínica autenticada. No mezclan tareas
genéricas ni recursos de otra clínica. La respuesta usa `{ok, action, message, data}`.

El cierre específico admite `pendiente` o `en_proceso` → `cerrada`, conservando
las transiciones previas de `actualizar_tarea`. Reutiliza búsqueda, escritura y
verificación; la actualización usa `allConditions` con tarea, clínica y estado
anterior. Comprueba tanto la fila devuelta por la escritura como la relectura y
las fechas esperadas. No permite alterar título, descripción, prioridad o asignación
mediante la acción de cierre. Una tarea ya cerrada no se vuelve a escribir ni genera
otra auditoría de mutación.

El cierre humano reutiliza `lab025_auditoria_operaciones`, con actor, clínica,
acción, recurso, estados, resultado y fecha/hora. La respuesta de éxito nueva
espera la inserción y comprobación de auditoría; no se audita cada lectura del
listado. Si falla la auditoría después del cierre, no se anuncia éxito y se requiere
revisión interna: las dos escrituras no constituyen una transacción. Un reintento
sobre la tarea ya cerrada no fabrica una nueva mutación. No se modifica la cita ni
el seguimiento al cerrar manualmente la tarea.

El personal autorizado puede:

- autenticarse mediante OIDC;
- ser autorizado por VetAtiende según usuario, clínica, rol, estado y permisos;
- acceder únicamente a recursos de su propia clínica;
- consultar conocimiento interno autorizado;
- gestionar alertas operativas;
- crear y actualizar pendientes;
- crear, visualizar, aceptar y resolver derivaciones;
- crear y actualizar tareas;
- dejar trazabilidad de operaciones relevantes y denegaciones controladas.

## Arquitectura implementada

La solución mantiene separados:

- Streamlit público;
- aplicación Streamlit interna;
- workflow público LAB-024/LAB-024.1;
- workflow interno LAB-025;
- RAG público;
- RAG interno protegido;
- futura ficha clínica del paciente.

No existe un modo interno activable desde el canal público y Luna pública no dispone de una ruta hacia el RAG interno.

## Autenticación y autorización

El acceso interno utiliza OIDC mediante proveedor configurable. El proveedor autentica la identidad y VetAtiende autoriza las acciones.

La identidad interna se resuelve mediante:

- `user_id`;
- `clinic_id`;
- rol;
- estado;
- permisos.

Roles iniciales:

- `recepcion`;
- `veterinario`;
- `administrador`.

La autorización ocurre antes de RAG, IA y modificaciones de recursos. Los permisos son concretos y no equivalen automáticamente al nombre del rol.

Se validaron:

- identidad faltante;
- usuario no registrado;
- usuario inactivo;
- acción sin permiso;
- acción autorizada;
- aislamiento por `clinic_id`;
- autenticación OIDC real del piloto controlado.

## Contrato interno

La aplicación interna envía acciones estructuradas al webhook protegido de LAB-025. La identidad no se toma de texto libre enviado por el usuario.

La respuesta controlada conserva el formato conceptual:

- `ok`;
- `action`;
- `message`;
- `data`.

Los errores visibles no exponen URLs internas, nombres de nodos, stack traces, claves, secretos ni detalles de infraestructura.

## Recursos operativos

Se implementaron siete dominios:

1. usuarios internos;
2. permisos por rol;
3. alertas operativas;
4. pendientes;
5. derivaciones;
6. tareas;
7. auditoría.

Data Tables utilizadas:

- `lab025_usuarios_internos`;
- `lab025_permisos_roles`;
- `lab025_alertas_operacion`;
- `lab025_pendientes`;
- `lab025_derivaciones`;
- `lab025_tareas`;
- `lab025_auditoria_operaciones`.

## Alertas operativas

LAB-024/LAB-024.1 continúa detectando la urgencia pública. LAB-025 administra la operación humana mediante:

- `pendiente`;
- `reconocida`;
- `en_atencion`;
- `cerrada`.

Las transiciones registran actor y fecha. Las escrituras se filtran por clínica y estado previo cuando corresponde, y se verifica persistencia antes de confirmar éxito.

Quedaron validados:

- visualización de alertas activas;
- reconocimiento;
- transición `reconocida → en_atencion`;
- transición `en_atencion → cerrada`;
- rechazo de transición inválida;
- recurso faltante;
- recurso inexistente;
- denegación por permiso;
- aislamiento por clínica.

Telegram sigue siendo únicamente el adaptador piloto de notificación y no administra el estado operacional.

## Pendientes

Se implementaron creación y actualización de pendientes con control de:

- tipo;
- descripción;
- prioridad;
- usuario asignado;
- estado;
- resolución;
- clínica;
- persistencia posterior a la escritura.

Las pruebas cubrieron transiciones válidas, cambios parciales, reasignaciones, datos inválidos, recursos inexistentes, aislamiento y permisos.

## Derivaciones

Se implementaron:

- creación;
- visualización;
- aceptación;
- resolución;
- validación del recurso de origen;
- rol y usuario destino;
- aislamiento por clínica;
- persistencia y auditoría.

## Tareas

Se implementaron:

- creación;
- actualización;
- prioridad;
- asignación;
- fecha límite;
- transición de estado;
- persistencia y auditoría.

## RAG interno protegido

El RAG interno utiliza Qdrant y una colección privada para la clínica piloto:

`vetatiende_interno_clinica_piloto_001`

Los documentos se asocian a metadata de control:

- `document_id`;
- `clinic_id`;
- tipo de documento;
- nivel de acceso;
- estado;
- versión.

La recuperación filtra por:

- `clinic_id`;
- documento activo;
- nivel autorizado según rol.

El contexto entregado a Luna interna se construye únicamente con fragmentos que alcanzan el umbral de similitud configurado de `0.50`. Las fuentes se deduplican antes de devolver la respuesta.

Si el conocimiento autorizado no es suficiente, Luna no inventa y exige revisión humana.

## Separación de RAG y ficha clínica

Se mantiene la decisión arquitectónica:

- **RAG público:** información pública general de la clínica;
- **RAG interno:** procedimientos, protocolos y conocimiento operativo privado;
- **ficha clínica:** vacunas, exámenes, consultas, tratamientos y documentos de cada paciente.

Los datos clínicos del paciente no forman parte del RAG interno.

## Auditoría

Las operaciones relevantes registran, según corresponda:

- identificador de auditoría;
- clínica;
- actor;
- acción;
- tipo de recurso;
- recurso;
- estado anterior;
- estado nuevo;
- resultado;
- fecha y hora.

Se comprobó persistencia real de auditoría para operaciones autorizadas y denegaciones relevantes.

## Integración LAB-024 → LAB-025

La integración productiva quedó validada de extremo a extremo.

Una urgencia detectada por LAB-024:

1. conserva `clinic_id`, `episode_id` y `alert_id`;
2. responde al usuario sin depender del éxito de las operaciones internas;
3. registra la alerta operativa para LAB-025;
4. evita duplicar la misma alerta;
5. mantiene Telegram como notificación piloto;
6. deja la alerta disponible para gestión humana autenticada.

La regresión final confirmó una alerta nueva persistida en estado `pendiente` y visible desde la aplicación interna.

## Compatibilidad de modelos durante el cierre

Durante la regresión final se detectó que `llama-3.3-70b-versatile` ya no estaba disponible en Groq para el flujo utilizado.

Se actualizó LAB-024 para utilizar `openai/gpt-oss-120b` en:

- `Modelo de Luna comercial con Groq` — máximo 1000 tokens;
- `Modelo clasificación urgencia con Groq` — máximo 350 tokens.

LAB-025 mantiene `openai/gpt-oss-120b` para Luna interna.

La consulta pública normal, la clasificación IA ambigua y el flujo de urgencia fueron regresionados después del cambio.

Este ajuste de compatibilidad se registra dentro del cierre de LAB-025 y no reabre los commits históricos de LAB-024/LAB-024.1.

## Task runners

Durante la regresión final se detectaron esperas y timeouts en nodos Code JavaScript. Los logs mostraron solicitudes JavaScript sin oferta disponible y un runner que no reconocía la tarea a tiempo.

La configuración final validada quedó en:

- `N8N_RUNNERS_MAX_CONCURRENCY=5`;
- `N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT=15`.

Después de recrear únicamente `task-runners`, la prueba ambigua `Mi perro está temblando y no quiere comer.` ejecutó correctamente la ruta de clasificación IA y la ejecución completa finalizó `Succeeded`, sin el timeout anterior.

## Aplicación interna y OIDC

Se implementó una segunda aplicación Streamlit protegida bajo `/interno/`.

Características principales:

- OIDC;
- identidad derivada de la sesión autenticada;
- clave interna solo del lado servidor;
- separación física respecto de Streamlit público;
- respuestas sanitizadas;
- acciones de Luna interna, alertas, pendientes, derivaciones y tareas.

La clave interna fue rotada durante LAB-025 después de quedar visible durante una prueba controlada. Los archivos temporales asociados fueron eliminados y no se versionan secretos reales.

## Pruebas finales aprobadas

Quedaron aprobadas, entre otras:

- solicitud interna inválida;
- identidad faltante;
- usuario no registrado;
- usuario inactivo;
- OIDC real;
- permisos por rol;
- aislamiento por clínica;
- RAG interno con fuentes;
- RAG sin información suficiente sin invención;
- alertas y sus transiciones;
- pendientes;
- derivaciones;
- tareas;
- auditoría;
- sanitización de errores;
- confirmación de persistencia;
- consulta pública normal con RAG;
- urgencia pública determinista;
- urgencia ambigua con clasificación IA;
- Telegram;
- integración LAB-024 → LAB-025;
- persistencia de `alert_id`, `episode_id` y `clinic_id`;
- recuperación del task runner JavaScript sin timeout.

## Limpieza final

Se eliminaron del servidor:

- backups temporales de LAB-025;
- staging OIDC;
- ZIP temporal de despliegue;
- copias temporales de `.env`;
- backups temporales de Caddy, compose y aplicación interna.

El backup temporal creado exclusivamente para el ajuste final del runner debe eliminarse después de verificar el cierre Git.

## Fuera del alcance mantenido

LAB-025 no incorpora:

- temporizadores automáticos de reconocimiento;
- escalamiento automático por falta de reconocimiento;
- cancelación y reprogramación de citas confirmadas;
- recordatorios y seguimientos automáticos;
- comunicaciones comerciales;
- ficha clínica completa;
- portal protegido del tutor;
- almacenamiento clínico dentro del RAG.

## Workflows finales

- `LAB-024 - Urgencias médicas comerciales y alerta interna - CHECKPOINT INTEGRACIÓN LAB-025`;
- `LAB-025 - Operación interna protegida y RAG interno comercial - CHECKPOINT AUDITORÍA CORREGIDA`.

Los workflows quedaron publicados y sometidos a regresión funcional antes del cierre.

## Base Git

- rama: `mvp-comercial`;
- base anterior: `584e071 fix: fortalece cobertura de urgencias LAB-024.1`;
- LAB-025 se cierra mediante un único commit;
- LAB-024 y LAB-024.1 no reciben un commit independiente nuevo.

## Resultado

**LAB-025 cumple el alcance funcional y técnico aprobado y queda cerrado como operación interna protegida del piloto comercial de VetAtiende AI.**
