# LAB-031 — Diseño de validación QA-07 multiclínica

Estado: **DISEÑO COMPLETADO / E2 NOT_EXECUTED / NOT_VERIFIED**.

Este documento diseña una validación mínima, segura y reproducible. No autoriza implementación, creación de workflows ni ejecución contra servicios. QA-07 permanece `FAIL` y continúa bloqueando `GATE-PILOT` hasta obtener evidencia E2 suficiente.

## 1. Objetivo y límites

Demostrar que dos clínicas sintéticas no pueden leer ni mutar recursos ajenos, no heredan configuración entre sí y fallan de forma cerrada ante una autoridad clínica inválida. La presencia de `clinic_id` no constituye evidencia de aislamiento: cada caso exige verificar la respuesta y el estado persistido de ambos lados.

Quedan fuera de esta validación:

- una regresión funcional completa de RAG, reservas, citas, urgencias, seguimientos u operación interna;
- administración visual de clínicas o configuración;
- datos reales, PII, secretos o credenciales dentro de payloads o evidencia;
- restauración desde backup, carga, concurrencia y rendimiento global;
- repetición del escenario documental E2 de LAB-030;
- creación o modificación de infraestructura y workflows como parte de este diseño.

## 2. Identidades sintéticas y correlación

Se definen exactamente dos clínicas sintéticas:

| Alias | `clinic_id` | Uso |
|---|---|---|
| `CLINICA_A` | `lab031_qa_clinic_a` | Recursos, sesiones, identidad interna y configuración A |
| `CLINICA_B` | `lab031_qa_clinic_b` | Recursos, sesiones, identidad interna y configuración B |

La futura ejecución usará un único identificador `LAB031_QA_<run_id>`. `run_id` será único, no derivado de PII y seguro para IDs técnicos. Todos los recursos creados deberán registrar ese identificador o un ID exacto inmediatamente correlacionado en el manifest.

Convención conceptual:

- sesiones: `<qa_prefix>_SESSION_A` y `<qa_prefix>_SESSION_B`;
- citas: `<qa_prefix>_APPT_A` y `<qa_prefix>_APPT_B`;
- eventos Calendar: IDs reales devueltos por Calendar, nunca inferidos;
- tareas: `<qa_prefix>_TASK_A` y `<qa_prefix>_TASK_B`;
- documentos: `<qa_prefix>_DOC_A` y `<qa_prefix>_DOC_B` cuando el preflight determine que se requieren documentos nuevos;
- auditorías, operaciones, alertas y estados: IDs reales capturados después de cada escritura.

Los textos sintéticos usarán marcadores no sensibles como `MARCADOR_A_<run_id>` y `MARCADOR_B_<run_id>`. No se usarán nombres, teléfonos, correos, historias clínicas ni mensajes reales.

## 3. Preflight y primer fallo real

La ejecución futura deberá detenerse antes de mutar si falla cualquiera de estas condiciones:

1. existe una ruta publicada y vigente para cada capacidad elegida;
2. `CLINICA_A` y `CLINICA_B` existen, están activas y poseen configuración QA independiente;
3. cada clínica tiene una identidad interna sintética activa con los permisos mínimos del caso;
4. los calendarios QA de A y B son distintos y están inequívocamente vinculados a su clínica;
5. están disponibles los identificadores de Data Tables realmente vigentes;
6. puede prepararse el manifest y el cleanup exacto antes de crear datos;
7. se obtiene snapshot de las clínicas y de cualquier configuración estable que deba conservarse;
8. ningún recurso preexistente coincide con los IDs reservados para el run.

Una ruta inexistente, export inactivo, configuración compartida no atribuible, permiso ausente o imposibilidad de cleanup es `CRITICAL_FAIL`. No se sustituirá por un workflow histórico ni se continuará con una capacidad parecida.

## 4. Capacidades existentes seleccionadas

- **RAG:** la autoridad pública LAB-029 exige clínica explícita, válida, existente y activa; PostgreSQL y Qdrant filtran por `clinic_id`. Se reutilizará como lectura de conocimiento, sin repetir el E2 RAG de LAB-030.
- **Estado conversacional:** las agendas históricas separan estado por `clinic_id::session_id`. Se usará el mismo `session_id` sintético en A y B para demostrar que la clínica forma parte efectiva de la separación.
- **Operación interna:** LAB-025 autoriza por identidad, usuario activo, clínica y permiso. `lab025_tareas` y las acciones `ver_tareas_seguimiento` / `cerrar_tarea_seguimiento` aportan un recurso consultable y una mutación verificable.
- **Agenda y citas:** LAB-026 conserva cita durable, `clinic_id`, operación, auditoría y `event_id`, y valida Calendar después de cancelar o reprogramar.
- **Configuración:** LAB-028 usa `lab028_configuracion` y `lab028_campanas` por clínica; una configuración deshabilitada o error de lectura no debe adoptar la campaña de otra clínica. No se presupone una UI de administración.
- **Clínica inactiva:** LAB-029 documenta autoridad `active` en PostgreSQL y rechazo fail-closed para clínica ausente, inválida, inexistente o inactiva.

La implementación deberá confirmar que estas rutas siguen siendo las vigentes. La documentación histórica identifica candidatos, no disponibilidad actual.

## 5. Conjunto mínimo: siete casos E2

Las variantes A→B y B→A pertenecen al mismo caso cuando comparten preparación y oráculo. Un fallo detiene los casos funcionales pendientes y transfiere el control a cleanup si ya existen recursos.

### L-01 — Lectura RAG cruzada bidireccional

| Campo | Definición |
|---|---|
| Entrada | Consulta desde A por `MARCADOR_B_<run_id>` y desde B por `MARCADOR_A_<run_id>`; controles positivos de cada clínica sobre su propio marcador. |
| Precondición | Un documento activo sintético por clínica, o documentos QA preexistentes inequívocos y autorizados; misma visibilidad y colección; autoridad clínica activa. |
| Recurso esperado | Solo el documento/punto de la clínica solicitante puede aparecer en fuentes o respuesta. |
| Recurso que NO debe tocarse | Documento, versión, eventos y puntos de la otra clínica; no se realiza mutación. |
| Resultado esperado | El control propio recupera su marcador; la consulta cruzada no devuelve marcador ni fuente ajena y no hace fallback. |
| Evidencia requerida | Request sanitizado, `clinic_id`, resultado/fuentes, IDs de documentos/versiones/puntos esperados y evidencia de ausencia cruzada. |
| PASS | Los dos controles propios son atribuibles a su clínica y ambas consultas cruzadas excluyen por completo el recurso contrario. |
| FAIL | Marcador/fuente ajena, fallback de clínica, consulta sin filtro demostrable o control propio no verificable. |
| Cleanup | Solo documentos/versiones/eventos/puntos creados por el run; si se reutilizan fixtures estables, no eliminarlos y comprobar snapshot sin cambios. |

### L-02 — Estado conversacional y lectura interna cruzada

| Campo | Definición |
|---|---|
| Entrada | Misma cadena de `session_id` usada en A y B con estados sintéticos distintos; identidad interna A solicita listado mientras existe `TASK_B`, y viceversa. |
| Precondición | Estado conversacional separable en la ruta vigente; identidades A/B autorizadas; una tarea por clínica con ID exacto y `creado_por` compatible con la acción reutilizada. |
| Recurso esperado | Cada sesión recupera solo su propio estado; cada identidad lista solo su tarea. |
| Recurso que NO debe tocarse | Estado y tarea de la clínica contraria; ninguna fila se actualiza. |
| Resultado esperado | A no recibe estado ni tarea B; B no recibe estado ni tarea A, aunque el valor de sesión coincida. |
| Evidencia requerida | Snapshot antes/después de filas de estado y tareas; respuesta sanitizada y clínica resuelta desde autoridad/identidad. |
| PASS | Separación bidireccional demostrada en respuesta y persistencia, sin confiar únicamente en el body. |
| FAIL | Lectura ajena, mezcla de estado, aceptación de `clinic_id` aportado sobre la identidad o fila alterada. |
| Cleanup | Eliminar por ID exacto estados y tareas creados por el run, más auditorías automáticas inventariadas. |

### M-01 — Mutación cruzada de cita y Calendar

| Campo | Definición |
|---|---|
| Entrada | Contexto autorizado de A intenta cancelar la cita/evento B; contexto B intenta reprogramar la cita/evento A. Se usan las rutas vigentes, no acceso directo a Calendar. |
| Precondición | Una cita durable sintética por clínica, evento Calendar asociado, calendarios A/B distintos, versión y estado inicial capturados. |
| Recurso esperado | Ninguna cita ajena debe ser seleccionable ni mutada; la ruta debe rechazar o responder sin revelar datos internos. |
| Recurso que NO debe tocarse | Evento, cita, versión y estado de la clínica contraria; tampoco deben aparecer `hold`, operación o auditoría de éxito normal sobre el recurso ajeno. |
| Resultado esperado | Rechazo controlado en ambas direcciones; eventos siguen presentes e idénticos y citas conservan estado/versión. |
| Evidencia requerida | Snapshots Calendar y persistentes antes/después; respuestas sanitizadas; inventario de cualquier auditoría de rechazo. |
| PASS | Cero cambio en ambos recursos ajenos y ausencia de efectos laterales normales; rechazo trazable cuando corresponda. |
| FAIL | Cancelación, reprogramación, selección o revelación cruzada; mutación parcial; discrepancia no reconciliada. |
| Cleanup | Cancelar/eliminar únicamente los eventos propios del run y eliminar por IDs exactos citas, operaciones, `hold` y auditorías creadas. |

### M-02 — Mutación cruzada de operación interna

| Campo | Definición |
|---|---|
| Entrada | Identidad A ejecuta `cerrar_tarea_seguimiento` sobre `TASK_B`; identidad B ejecuta la misma acción sobre `TASK_A`. |
| Precondición | Identidades y permisos sintéticos vigentes; tareas A/B en estado inicial compatible; snapshots completos. |
| Recurso esperado | Rechazo por aislamiento o recurso no visible dentro de la clínica autenticada. |
| Recurso que NO debe tocarse | `estado`, `fecha_actualizacion`, `fecha_cierre`, asignación y demás campos de la tarea ajena. |
| Resultado esperado | Ninguna tarea se cierra o actualiza; no se crea auditoría de éxito. Una auditoría de denegación solo es válida si queda inventariada. |
| Evidencia requerida | Respuesta, clínica derivada de identidad, snapshot antes/después de ambas tareas y auditorías relacionadas. |
| PASS | Ambas mutaciones cruzadas son rechazadas y las tareas permanecen byte/valor equivalentes en campos relevantes. |
| FAIL | Cualquier actualización ajena, confianza en clínica del body, éxito ambiguo o auditoría de operación exitosa. |
| Cleanup | Eliminar por ID exacto tareas y auditorías del run; no tocar usuarios/permisos QA estables. |

### C-01 — Configuración diferenciada por clínica

| Campo | Definición |
|---|---|
| Entrada | Flujo propio autorizado de A y B que alcance la lectura LAB-028: A configurada con campaña activa `MARCADOR_A_<run_id>` y B deshabilitada o con `MARCADOR_B_<run_id>`. |
| Precondición | `lab028_configuracion` y `lab028_campanas` vigentes, filas exactas por clínica y un disparador post-reserva reutilizable; snapshots previos. |
| Recurso esperado | A aplica únicamente su valor; B aplica su valor o supresión configurada. |
| Recurso que NO debe tocarse | Configuración/campaña de la otra clínica y cualquier configuración estable ajena al run. |
| Resultado esperado | Ninguna respuesta de A contiene B ni viceversa; una configuración deshabilitada no hace fallback hacia la activa. |
| Evidencia requerida | IDs exactos de filas de configuración/campaña, valores diferenciadores no sensibles, respuesta resultante y snapshots antes/después. |
| PASS | Conducta observable coincide con la configuración propia en A y B, sin contaminación cruzada ni mutación de configuración. |
| FAIL | Marcador ajeno, fallback, consulta sin restricción de clínica o incapacidad de atribuir el resultado. |
| Cleanup | Eliminar solo filas creadas por el run o restaurar por ID y snapshot exactos si se modificó una fixture QA; limpiar reservas/eventos usados como disparador. |

### F-01 — `clinic_id` inválido e inexistente

| Campo | Definición |
|---|---|
| Entrada | Dos variantes no mutantes: un ID con formato inválido y un ID bien formado sin registro, ambos con sesión sintética del run. |
| Precondición | Endpoint público vigente y snapshots de recursos A/B. |
| Recurso esperado | Rechazo controlado y sanitizado en ambas variantes. |
| Recurso que NO debe tocarse | Cualquier estado, documento, cita, evento, tarea, alerta o configuración de A/B. |
| Resultado esperado | Sin fallback, IA, RAG, agenda ni mutación normal posterior al gate de autoridad. |
| Evidencia requerida | Respuesta/estado HTTP según contrato vigente, traza sanitizada del camino y post-check de cero recursos nuevos salvo auditoría explícita inventariada. |
| PASS | Ambas variantes fallan cerrado antes de capacidad normal y no producen recursos de negocio. |
| FAIL | Aceptación, sustitución por A/B, respuesta con datos ajenos o efecto lateral no inventariado. |
| Cleanup | Normalmente `NOT_REQUIRED`; si se crea auditoría de rechazo, eliminarla por ID exacto después de registrarla. |

### F-02 — Clínica inactiva sin fallback

| Campo | Definición |
|---|---|
| Entrada | Solicitud con `clinic_id=lab031_qa_clinic_b` durante una ventana controlada en que B está inactiva. |
| Precondición | Todos los casos que requieren B activa ya terminaron; snapshot de la fila B; mecanismo autorizado y verificable para cambiar/restaurar estado; ningún uso concurrente. |
| Recurso esperado | Rechazo controlado por autoridad clínica. |
| Recurso que NO debe tocarse | Recursos A/B de negocio; A nunca debe actuar como fallback. |
| Resultado esperado | Sin RAG, agenda, configuración, estado conversacional ni mutación normal. |
| Evidencia requerida | Snapshot `active` previo, evidencia `inactive`, respuesta, post-check de cero recursos y restauración exacta a `active`. |
| PASS | B inactiva es rechazada, no hay fallback ni efecto lateral y el snapshot final coincide con el inicial. |
| FAIL | Capacidad normal ejecutada, fallback, mutación, imposibilidad de restaurar o discrepancia de snapshot. |
| Cleanup | Restaurar B al valor previo por ID exacto; la clínica no se elimina. Auditar y limpiar únicamente registros del run. |

## 6. Manifest conceptual

El manifest se crea antes de mutar, se guarda fuera de Git y se actualiza atómicamente después de descubrir cada ID. No contiene tokens, credenciales, headers, URLs sensibles, PII ni cuerpos completos.

```json
{
  "schema_version": "1.0",
  "run_id": "<run_id>",
  "qa_prefix": "LAB031_QA_<run_id>",
  "status": "PREPARED|RUNNING|FAILED|CLEANUP|COMPLETE",
  "clinic_a": {
    "clinic_id": "lab031_qa_clinic_a",
    "baseline_snapshot_ref": "<hash-or-safe-ref>"
  },
  "clinic_b": {
    "clinic_id": "lab031_qa_clinic_b",
    "baseline_snapshot_ref": "<hash-or-safe-ref>"
  },
  "sessions": { "a": [], "b": [], "shared_values": [] },
  "resources_created": {
    "a": {
      "calendar_event_ids": [],
      "persistent_ids": [],
      "data_table_rows": {},
      "document_ids": [],
      "version_ids": [],
      "qdrant_point_ids": [],
      "audit_event_ids": [],
      "other_ids": []
    },
    "b": {
      "calendar_event_ids": [],
      "persistent_ids": [],
      "data_table_rows": {},
      "document_ids": [],
      "version_ids": [],
      "qdrant_point_ids": [],
      "audit_event_ids": [],
      "other_ids": []
    }
  },
  "data_tables_affected": [],
  "cases": {
    "L-01": { "result": "NOT_RUN", "evidence_refs": [] },
    "L-02": { "result": "NOT_RUN", "evidence_refs": [] },
    "M-01": { "result": "NOT_RUN", "evidence_refs": [] },
    "M-02": { "result": "NOT_RUN", "evidence_refs": [] },
    "C-01": { "result": "NOT_RUN", "evidence_refs": [] },
    "F-01": { "result": "NOT_RUN", "evidence_refs": [] },
    "F-02": { "result": "NOT_RUN", "evidence_refs": [] }
  },
  "cleanup_expected": [],
  "cleanup": {
    "inventory_result": "NOT_RUN",
    "comparison_result": "NOT_RUN",
    "delete_result": "NOT_RUN",
    "post_check_result": "NOT_RUN",
    "residues_remaining": null,
    "preserved_resources_verified": false
  },
  "global_result": "NOT_VERIFIED"
}
```

`persistent_ids` se desglosará en el contrato implementado por tabla/tipo —citas, operaciones, estados, tareas, alertas y auditorías— y no como una bolsa no atribuible. `data_table_rows` registrará nombre/ID estable de tabla e IDs exactos de fila. Si un servicio devuelve un ID después de un timeout, primero se reconcilia el estado; no se reintenta a ciegas.

## 7. Cleanup exacto y fail-closed

Orden obligatorio:

1. **INVENTORY:** consultar por cada ID exacto del manifest en Calendar, PostgreSQL, Qdrant y Data Tables; capturar también auditorías/eventos automáticos correlacionados.
2. **COMPARE:** exigir igualdad entre recursos esperados y encontrados, pertenencia a A/B y correlación con `qa_prefix`. Si falta un ID, aparece uno adicional o la pertenencia es ambigua, detenerse sin borrar.
3. **DELETE:** eliminar únicamente IDs aprobados en el snapshot de inventory, respetando dependencias. Se prohíben prefijos amplios, `LIKE` de borrado, eliminación por fecha o vaciado de tablas/colecciones.
4. **RESTORE:** restaurar por valor exacto cualquier fixture QA estable modificada temporalmente, incluida la activación de B y configuración diferenciadora cuando corresponda.
5. **POST-CHECK:** comprobar ausencia de todos los recursos efímeros del run, restauración de snapshots y preservación de recursos no pertenecientes al run.
6. **RESULT:** exigir `residues_remaining=0`; cleanup incompleto o no demostrable produce resultado global `FAIL`.

Las dos clínicas sintéticas y sus identidades/permisos QA estables **no se borrarán automáticamente**. Conservarlas reduce el riesgo de eliminar una autoridad compartida y permite ejecuciones reproducibles. Se verificará que sus snapshots finales coincidan con los iniciales. Si una futura tarea decide crearlas por run, deberá autorizar expresamente su ciclo de vida y demostrar que no son compartidas antes de incorporarlas al DELETE.

Un fallo funcional no omite cleanup. Un desacuerdo de inventory sí impide DELETE y exige intervención humana, conservando evidencia sanitizada.

## 8. Reutilización para implementación futura

| Pieza existente | Clasificación | Uso permitido / límite |
|---|---|---|
| Autoridad pública, filtros PostgreSQL/Qdrant y fail-closed de LAB-029 | **REUTILIZABLE CON ADAPTACIÓN** | Reutilizar contratos y llamadas dirigidas; parametrizar A/B y no ejecutar todo LAB-029. |
| `scripts/lab029/ejecutar_runtime_lab029.mjs` | **REUTILIZABLE CON ADAPTACIÓN** | Reutilizar cliente, clasificación y selección de caso; está acoplado al manifest/IDs LAB-029. |
| `scripts/lab029/validar_inventario_cleanup_lab029.mjs` y flujo precheck/delete/post-check | **REUTILIZABLE CON ADAPTACIÓN** | Reutilizar semántica de comparación exacta y fail-closed; ampliar a Calendar, citas, estados, tareas y configuración. |
| `scripts/lab029/verificar_runtime_lab029.mjs` | **REUTILIZABLE DIRECTO** | Health de PostgreSQL/Qdrant si la futura tarea confirma variables y alcance; no demuestra aislamiento. |
| Rutas LAB-026 de cancelación/reprogramación y verificaciones Calendar/persistencia | **REUTILIZABLE CON ADAPTACIÓN** | Seleccionar una cancelación y una reprogramación cruzadas; no ejecutar el validador completo. |
| `scripts/lab026/validar_workflow_lab026.mjs` | **HISTÓRICO / NO EJECUTAR** | 1570 aserciones y generación histórica; no aporta evidencia E2 proporcional para este diseño. |
| Acciones LAB-025/LAB-027 `ver_tareas_seguimiento` y `cerrar_tarea_seguimiento` | **REUTILIZABLE CON ADAPTACIÓN** | Usar identidades sintéticas A/B y dos tareas exactas; confirmar que la ruta está publicada. |
| `scripts/lab027/probar_logica_lab027.mjs` y `validar_workflows_lab027.mjs` | **HISTÓRICO / NO EJECUTAR** | Oráculos de autoridad/idempotencia como referencia; no repetir 245/2791 checks. |
| `scripts/lab028/fixtures_runtime_contextual_lab028.mjs` | **REUTILIZABLE CON ADAPTACIÓN** | Modelo de fixtures/cleanup de `lab028_configuracion` y `lab028_campanas`; eliminar acoplamiento `LAB028_TEST` y aceptar A/B. |
| `scripts/lab028/probar_runtime_real_lab028.mjs` | **REUTILIZABLE CON ADAPTACIÓN** | Reutilizar navegación mínima hasta aviso post-reserva solo para C-01; no ejecutar su batería completa. |
| Generadores y workflows temporales cerrados de LAB-029/LAB-030 | **HISTÓRICO / NO EJECUTAR** | No republicar ni repetir el escenario RAG público cerrado de LAB-030. |
| Orquestador QA-07, manifest transversal, inventory Calendar/Data Tables/PostgreSQL/Qdrant y cleanup unificado | **NO EXISTE / CÓDIGO NUEVO MÍNIMO** | Una futura tarea deberá implementar la coordinación mínima; no crear runners separados por dominio. |
| Fixture/control seguro de clínica inactiva con snapshot y restauración | **NO EXISTE / CÓDIGO NUEVO MÍNIMO** | Implementar solo si la autoridad vigente permite mutación controlada y reversible; de lo contrario F-02 queda bloqueado, nunca PASS. |

## 9. Criterio global de QA-07

La ejecución futura solo puede acreditar QA-07 cuando:

- los siete casos estén `PASS` con evidencia y oráculos verificables;
- ninguna variante A→B o B→A tenga lectura, mutación o fallback cruzado;
- el primer fallo real se conserve y los casos no alcanzados figuren `NOT_RUN`;
- cleanup termine `PASS`, con cero residuos y recursos estables preservados;
- no haya secretos, PII ni datos reales en manifest o evidencia.

Un caso `FAIL`, `NOT_RUN` o `NOT_VERIFIED`, o cleanup distinto de `PASS`, mantiene QA-07 en `FAIL` y `GATE-PILOT` bloqueado. Este diseño no modifica el estado actual.

## 10. Riesgos y dependencias abiertas

- Debe confirmarse qué exports están realmente publicados y qué cadena atiende a Streamlit; un export versionado no prueba disponibilidad.
- Las dos clínicas, calendarios e identidades QA aún deben provisionarse o verificarse mediante una tarea autorizada.
- LAB-028 aporta configuración real por clínica, pero alcanzar su comportamiento exige una confirmación de reserva; la implementación debe reutilizar recursos y evitar duplicar una regresión de reservas.
- El cierre interno de tareas exige filas de permisos vigentes y tareas con origen compatible; no se debe ampliar privilegios para hacer pasar la prueba.
- El cleanup transversal actual no cubre conjuntamente Calendar, PostgreSQL, Qdrant y todas las Data Tables; requiere código nuevo mínimo.
- Desactivar B es una mutación de autoridad de alto cuidado: se ejecuta al final, sin concurrencia, con snapshot y restauración obligatoria.
- La persistencia tras reinicio y la restauración desde backup no quedan demostradas por estos siete casos y permanecen fuera de esta validación mínima.
