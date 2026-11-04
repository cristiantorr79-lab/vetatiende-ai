# LAB-031 — Verificación read-only de cadena E2 y propiedad de rutas

Estado: **REVISIÓN LOCAL COMPLETADA / ESTADO E2 ACTUAL NOT_VERIFIED**.

No se realizaron llamadas de red, webhooks funcionales ni consultas administrativas a E2. No existe en el repositorio una vía administrativa read-only utilizable sin credenciales: los clientes de API requieren tokens y los webhooks de producto pueden crear estado. La verificación remota se detuvo en ese punto.

## 1. Cadena esperada desde el repositorio

La cadena final arquitectónica esperada es:

```text
Streamlit comercial
  → LAB-029 Público (webhook público único)
      → capacidades acumuladas LAB-024/026/028
      → PostgreSQL/Qdrant persistentes LAB-029

Streamlit interno / identidad protegida
  → LAB-029 Interno (webhook interno único)
      → operación LAB-025 + acciones LAB-027
      → RAG interno persistente LAB-029

LAB-027 Scheduler
  → seguimientos/recordatorios y tareas LAB-025
  → auxiliares internos LAB-024/LAB-026 según contrato

LAB-029 Management
  → subworkflow interno de ingestión/rollback
  → PostgreSQL + Qdrant
```

### Propietarios finales esperados

- Público: `LAB-029 - RAG público persistente por clínica`, ID histórico `BCUJ8lHHFZHj9yld`.
- Interno: `LAB-029 - Operación interna con RAG persistente por clínica`, ID histórico `RR555uwDbQ4kTyaZ`.
- Management: `LAB-029 - Gestión documental persistente y versionada`, ID histórico `s0NoyEyVtO9AgJUk`.
- Auxiliar de seguimiento: `LAB-027 - Seguimientos, recordatorios y pendientes`.

Los exports LAB-029 se construyeron sobre la cadena funcional acumulada: el Público conserva agenda, peluquería, urgencias, gestión de citas y avisos; el Interno conserva operación protegida y acciones de seguimiento. Por ello LAB-026, LAB-028 y LAB-025 son fuentes históricas/integradas, no deben reclamar simultáneamente los webhooks finales cuando LAB-029 Público/Interno estén publicados.

Management no expone webhook público en su export final. Los drivers temporales LAB-030 fueron retirados y no deben reutilizarse.

## 2. Endpoints y consumo esperado por Streamlit

| Uso | Ruta esperada | Observación |
|---|---|---|
| Canal público/Luna | `POST /webhook/vetatiende-comercial-chat-lab024` | Path heredado conservado por LAB-026/028/029. Debe tener un solo propietario activo. |
| Operación interna | `POST /webhook/vetatiende-interno-lab025` | Path heredado conservado por LAB-025/029. Debe tener un solo propietario activo y autenticación vigente. |
| Management | Sin webhook público final | Se invoca como subworkflow interno; cualquier driver HTTP debe ser temporal, protegido y explícitamente autorizado. |

La aplicación comercial versionada en `infra/comercial/streamlit/app.py` usa la variable `N8N_INTERNAL_WEBHOOK_URL` para enviar el payload público con `clinic_id`, `session_id`, `message` y `channel`. Por tanto, pese a su nombre histórico, su valor desplegado debería terminar en el **path público** anterior. El archivo `infra/comercial/.env.example` conserva rutas genéricas antiguas (`vetatiende-publico` / `vetatiende-interno`) y no acredita la configuración desplegada.

La aplicación `app/streamlit_app.py` es la interfaz mínima del Challenge, no la app comercial final; utiliza variables pública e interna separadas y no determina por sí sola la cadena E2 comercial.

## 3. Mapa de propiedad

| Ruta/capacidad | Propietario esperado | LAB origen | Evidencia | Estado esperado | Estado real E2 verificable | Conclusión |
|---|---|---:|---|---|---|---|
| Canal público / Luna | LAB-029 Público | 029 sobre 028 | Export con webhook `vetatiende-comercial-chat-lab024`; arquitectura RAG persistente | Único activo/publicado | Última observación documentada: inactivo; actual `NOT_VERIFIED` | Bloqueante para cadena final. |
| RAG público | Integrado en LAB-029 Público | 029 | Filtros PostgreSQL/Qdrant por clínica y versiones activas | Integrado y activo | Actual `NOT_VERIFIED` | LAB-028 no acredita RAG persistente final. |
| Agenda médica | Integrada en LAB-029 Público | 022/026 | Export acumulado conserva agenda y Calendar | Integrada, no propietario separado | Actual `NOT_VERIFIED` | LAB-026 no debe competir por el mismo path. |
| Peluquería | Integrada en LAB-029 Público | 023/028 | Export acumulado conserva ruta y configuración | Integrada | Actual `NOT_VERIFIED` | No requiere webhook adicional. |
| Urgencias | Integradas en LAB-029 Público; receptor interno auxiliar | 024/024.1 | Prioridad heredada y contratos internos | Integradas; auxiliar sin webhook público duplicado | Actual `NOT_VERIFIED` | Confirmar enlaces internos publicados. |
| Cancelación/reprogramación | Integrada en LAB-029 Público | 026 | LAB-026 era propietario histórico del path | Integrada | Actual `NOT_VERIFIED` | LAB-026 activo simultáneo produciría conflicto. |
| Operación interna | LAB-029 Interno | 029 sobre 025 | Export con webhook `vetatiende-interno-lab025` | Único activo/protegido | Última observación documentada: inactivo; actual `NOT_VERIFIED` | Bloqueante para QA-07 interno. |
| Seguimientos | LAB-027 Scheduler + acciones integradas en LAB-029 Interno | 027 | Scheduler, `lab027_*`, acciones en puerta LAB-025/029 | Auxiliar activo; sin webhook público competidor | Histórico LAB-028 lo reportó activo; actual `NOT_VERIFIED` | Confirmar scheduler y referencias de subworkflow. |
| Avisos post-reserva | Integrados en LAB-029 Público | 028 | `lab028_configuracion` / `lab028_campanas` en export acumulado | Integrados | Actual `NOT_VERIFIED` | LAB-028 separado debe quedar histórico si LAB-029 Público está activo. |
| Gestión documental / Management | LAB-029 Management | 029 | Export sin webhook público; evento operativo posterior LAB-029 | Activo como subworkflow | Última observación: activo/publicado; actual `NOT_VERIFIED` | No usar temporales LAB-030. |

## 4. Estados locales e históricos observados

### Exports versionados

- LAB-029 Público: `active: false`.
- LAB-029 Interno: `active: false`.
- LAB-029 Management: `active: false` en export, coherente con export portable y no con estado remoto.
- LAB-028: `active: true`, mismo path público.
- LAB-026: `active: true`, mismo path público.
- LAB-025: `active: false`, mismo path interno.
- LAB-027 Scheduler: `active: false` en export.

Estos flags no prueban estado E2. Sí prueban que importar/activar exports sin revisar propiedad podría generar colisiones.

### Último inventario remoto documentado

El evento operativo posterior de LAB-029 registró:

- Management LAB-029: activo/publicado;
- Público LAB-029: inactivo/no publicado;
- Interno LAB-029: inactivo/no publicado.

LAB-028 documentó anteriormente LAB-028 y Scheduler LAB-027 activos en E2. LAB-030 no volvió a verificar mediante inventario administrativo la publicación de la cadena final y declaró que Público/Interno LAB-029 permanecían no publicados según el último estado conocido.

No existe evidencia posterior suficiente para convertir esos estados históricos en estado real actual.

## 5. Primer fallo real y conflictos

**Primer fallo real:** la última evidencia operativa disponible muestra los propietarios finales esperados LAB-029 Público e Interno **inactivos/no publicados**. Por tanto, el repositorio no acredita que Streamlit consuma actualmente la cadena final LAB-029 requerida por QA-07.

Conflictos/riesgos adicionales:

1. LAB-026, LAB-028 y LAB-029 Público comparten `vetatiende-comercial-chat-lab024`; nunca deben estar activos simultáneamente.
2. LAB-025 y LAB-029 Interno comparten `vetatiende-interno-lab025`; deben tener un solo propietario activo.
3. `.env.example` usa paths genéricos que no coinciden con los exports comerciales finales.
4. La app comercial usa `N8N_INTERNAL_WEBHOOK_URL` para el canal público; el nombre es ambiguo y obliga a comprobar el valor efectivo sin publicarlo.
5. El estado actual de LAB-027 Scheduler y sus referencias a workflows auxiliares no está verificado.

No se amplió la inspección a E2 después de confirmar que requería credenciales o acción visual.

## 6. Verificación manual exacta para Cristian

En n8n E2, sin ejecutar workflows:

1. Abrir la lista de workflows y registrar de forma sanitizada `nombre`, `ID` y `active/publicado` para:
   - LAB-026 cancelación/reprogramación;
   - LAB-028 avisos post-reserva;
   - LAB-029 Público;
   - LAB-025 Interno;
   - LAB-029 Interno;
   - LAB-027 Scheduler;
   - LAB-029 Management.
2. Abrir solo la configuración de triggers y confirmar paths; no pulsar “Execute workflow”:
   - exactamente un activo para `vetatiende-comercial-chat-lab024`;
   - exactamente un activo para `vetatiende-interno-lab025`.
3. Confirmar que los propietarios activos son LAB-029 Público e Interno. Si no lo son, registrar el hallazgo y detenerse; no activar/desactivar en esta tarea.
4. Confirmar que Management LAB-029 existe y está disponible como subworkflow sin webhook público añadido.
5. Confirmar que LAB-027 Scheduler está publicado y que sus nodos `Execute Workflow` apuntan a los IDs vigentes, sin ejecutar el scheduler.
6. En la configuración del contenedor/app Streamlit, comparar sin copiar valores:
   - la variable usada por la app comercial apunta al host E2 correcto;
   - termina en `/webhook/vetatiende-comercial-chat-lab024`;
   - la aplicación interna apunta a `/webhook/vetatiende-interno-lab025`.
7. Entregar solo una tabla sanitizada con nombres, IDs, estados y paths. No enviar URLs completas, IPs, tokens, headers, credenciales ni capturas que los expongan.

Si aparece duplicidad activa, propietario distinto, path antiguo, referencia auxiliar ausente o workflow final inactivo, ese es el primer fallo y la revisión manual debe detenerse sin corregirlo.

## 7. Elementos `NOT_VERIFIED`

- estado remoto actual de los siete workflows anteriores;
- ausencia de duplicados activos por path;
- valores efectivos de las variables Streamlit;
- publicación/protección real del webhook interno;
- referencias vigentes de LAB-027;
- correspondencia entre los exports locales y versiones desplegadas;
- clínicas, calendarios, identidades, permisos y configuración A/B de QA-07.

## 8. Criterio para desbloquear provisionamiento QA-07

Cristian debe confirmar mediante la tabla sanitizada que LAB-029 Público e Interno son los únicos propietarios activos de sus paths, Management está disponible sin endpoint público impropio, LAB-027 y auxiliares apuntan a IDs vigentes y Streamlit consume las rutas correctas. Después debe compararse la versión desplegada con los exports aprobados o documentar toda discrepancia.

Hasta entonces no se provisionan clínicas, calendarios, identidades ni fixtures y `EXECUTE` permanece bloqueado.

## 9. Reconciliación con evidencia visual actual — Tarea 6B

Cristian confirmó LAB-029 Público y Management publicados; LAB-027 Seguimientos, LAB-024 Recepción interna y el adaptador LAB-027 publicados; LAB-026/028 no publicados; y LAB-025 Interno publicado mientras LAB-029 Interno permanece no publicado sobre `vetatiende-interno-lab025`. También encontró publicados dos temporales LAB-030 —driver Gestión documental y cleanup RAG público— y ya los eliminó. Se registra el hallazgo sin reabrir su inspección.

### LAB-025 frente a LAB-029 Interno

LAB-029 Interno se genera desde LAB-025, conserva su webhook POST, Header Auth y capacidades operativas, y reemplaza el RAG temporal: elimina siete nodos de recarga y añade lectura/consolidación de versiones internas activas en PostgreSQL/Qdrant. Conserva identidad, clínica, roles, permisos, alertas, pendientes, derivaciones, tareas, auditoría y acciones LAB-027. Añade RAG persistente/versionado filtrado por clínica, visibilidad, estado, versión y nivel de acceso.

Por tanto, **LAB-029 Interno reemplaza funcionalmente a LAB-025 Interno**. LAB-027 no depende del ID del workflow interno: sus referencias concretas apuntan al adaptador LAB-027 y a la recepción LAB-024; la gestión humana reutiliza contratos, tablas y acciones. No existe motivo documentado para mantener LAB-025 como propietario final. Ambos no pueden publicarse simultáneamente sobre el mismo path.

### Cadena objetivo

- LAB-029 Público: único propietario público publicado.
- LAB-029 Interno: futuro único propietario interno publicado.
- LAB-029 Management: publicado.
- LAB-027 Seguimientos, LAB-024 Recepción interna y adaptador LAB-027: auxiliares publicados.
- LAB-026, LAB-028 y, tras el reemplazo, LAB-025 Interno: históricos `Unpublished`.

### Clasificación

**GAP OPERACIONAL — criticidad alta, bloqueante de QA-07 y `GATE-PILOT`.** Ejecutar QA-07 contra LAB-025 produciría evidencia sobre una versión sustituida, sin acreditar el RAG persistente y aislamiento documental final.

### Remediación mínima propuesta — no ejecutada

Precondiciones: respaldar configuración/estado de LAB-025 para rollback; confirmar que LAB-029 coincide con el export aprobado y conserva webhook, Header Auth, credenciales, acciones, tablas, roles y permisos; confirmar PostgreSQL, Qdrant `vetatiende_interno`, ausencia de placeholders y cleanup exacto; acordar ventana controlada.

Secuencia: dejar LAB-029 configurado pero `Unpublished`; despublicar LAB-025 para liberar el path; publicar inmediatamente LAB-029; comprobar un único propietario; no modificar Público, Management ni auxiliares.

Smoke posterior: comprobación administrativa read-only; una consulta RAG interna con identidad, clínica y documento sintéticos; una lectura `ver_tareas_seguimiento`; inventario y cleanup exacto de cualquier auditoría/estado. No crear citas, ejecutar scheduler, usar datos reales ni ejecutar los siete casos QA-07.

Rollback: ante fallo de publicación, contrato, acciones, RAG o cleanup, despublicar LAB-029, volver a publicar LAB-025, confirmar propietario único y conservar el primer fallo. QA-07 continúa `NOT_VERIFIED`.
