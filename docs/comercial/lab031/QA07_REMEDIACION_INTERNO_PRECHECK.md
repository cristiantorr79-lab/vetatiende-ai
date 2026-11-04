# LAB-031 — Preflight de remediación del workflow interno

Estado: **PREFLIGHT LOCAL PASS / CUTOVER BLOCKED**. QA-07 continúa `NOT_VERIFIED` y `GATE-PILOT` bloqueado.

LAB-029 Interno es estructuralmente compatible con el reemplazo de LAB-025. El cambio no se autoriza hasta completar la checklist visual de dependencias en n8n E2. No se realizaron conexiones, publicación, ejecución ni cambios remotos.

## 1. Comparación de exports

| Control | LAB-025 | LAB-029 | Conclusión |
|---|---|---|---|
| Webhook/autenticación | POST `vetatiende-interno-lab025`, Header Auth | Igual | Compatible; propietario único obligatorio. |
| Identidad/autorización | Usuario, clínica, rol y permisos | Conservados | Sin divergencia detectada. |
| Operación | Alertas, pendientes, derivaciones, tareas y auditoría | Conservadas | Mismos nodos/tablas relevantes. |
| Acciones LAB-027 | Ver/cerrar tareas, resultado de cita y seguimiento clínico | Conservadas | Compatible con LAB-027. |
| RAG interno | Recarga/carga temporal | Elimina siete nodos de recarga | Sustitución deliberada. |
| RAG persistente | Sin versiones canónicas | PostgreSQL obtiene versiones activas; Qdrant filtra | Capacidad nueva LAB-029. |
| Subworkflows | Ninguno | Ninguno | Sin dependencia por ID. |

LAB-029 se genera desde LAB-025 y conserva su superficie funcional. No se detectaron secretos literales, URLs/IPs hardcodeadas, placeholders ejecutables, nodos duplicados ni referencias a workflows inactivos.

## 2. Dependencias

Referencias de credencial que Cristian debe comprobar sin ver ni copiar valores:

- Header Auth: `VetAtiende Internal LAB-025`;
- PostgreSQL: `Postgres account`;
- Qdrant: `VetAtiende Qdrant Comercial`;
- Cohere: `Cohere comercial LAB-021`;
- Groq: `Groq Comercial LAB-020`.

PostgreSQL es una dependencia nueva respecto de LAB-025 y el primer punto visual bloqueante. LAB-029 conserva Cohere para embeddings de consulta, aunque elimina la credencial usada por la recarga retirada.

Servicios/datos: PostgreSQL/Aiven; colección Qdrant `vetatiende_interno`; Cohere; Groq; y Data Tables `lab025_usuarios_internos`, `lab025_permisos_roles`, `lab025_alertas_operacion`, `lab025_pendientes`, `lab025_derivaciones`, `lab025_tareas`, `lab025_auditoria_operaciones`, `lab026_citas` y `lab027_seguimientos`.

## 3. Resultado y bloqueo

Confirmado localmente: path, método y autenticación compatibles; capacidades LAB-025/LAB-027 conservadas; RAG temporal sustituido focalmente; colección interna y consulta PostgreSQL presentes; tablas conservadas; sin subworkflows, secretos literales o placeholders ejecutables.

**CUTOVER BLOCKED:** no está verificado visualmente que LAB-029 desplegado tenga asignadas y válidas todas las credenciales —especialmente PostgreSQL— ni que Qdrant y las Data Tables resuelvan sin error.

## 4. Checklist visual mínima

| Nodo/elemento | Qué observar | Clasificación |
|---|---|---|
| `Entrada operación interna LAB-025` | POST, path correcto, Header Auth asignado, sin alerta | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| `Leer versiones internas activas LAB-029` | PostgreSQL asignado; nodo/query sin alerta ni placeholder | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| `Buscar conocimiento RAG interno` | Qdrant asignado y colección `vetatiende_interno` | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| `Embeddings Cohere consulta RAG interno` | Cohere asignado | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| `Groq Luna interna LAB-025` | Groq asignado y modelo presente | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| Usuarios/permisos | tablas `lab025_usuarios_internos` y `lab025_permisos_roles` resuelven | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| Operación | alertas, pendientes, derivaciones, tareas y auditoría resuelven | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| Acciones LAB-027 | acciones presentes; `lab026_citas` y `lab027_seguimientos` resuelven | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |
| Referencias `Execute Workflow` | no existen en el export | **NO REQUIERE ACCIÓN** |
| Nodos antiguos de recarga | no deben existir en LAB-029 | **NO REQUIERE ACCIÓN** |
| Publicación durante preflight | LAB-029 `Unpublished`; LAB-025 `Published` | **PASS VISUAL REQUERIDO** |
| Rollback | LAB-025 conserva configuración y posibilidad de republicación | **PASS VISUAL REQUERIDO / BLOQUEANTE SI FALTA** |

Ante el primer elemento bloqueante, no despublicar LAB-025.

## 5. Cutover mínimo — no ejecutado

1. Completar checklist y registrar nombre/ID/estado sin secretos.
2. Confirmar rollback de LAB-025.
3. Dejar LAB-029 preparado y `Unpublished`.
4. En ventana breve, despublicar LAB-025.
5. Publicar inmediatamente LAB-029.
6. Confirmar un único propietario de `vetatiende-interno-lab025`.
7. No cambiar Público, Management, LAB-027 ni LAB-024.
8. No ejecutar QA-07 completo; pasar solo al smoke autorizado.

## 6. Rollback — no ejecutado

Si LAB-029 no publica, el path falla o el smoke no pasa: despublicar LAB-029; volver a publicar LAB-025; confirmar propietario único/path recuperado; detener la remediación; registrar primer fallo y evidencia sanitizada; no reintentar sin corrección.

## 7. Smoke mínimo posterior — diseño

1. Confirmación administrativa read-only de propietario único, path y autenticación.
2. Solicitud sintética autorizada y denegación controlada sin fallback de clínica.
3. Consulta RAG sobre documento interno sintético activo, exigiendo fuente, clínica y versión correctas.
4. `ver_tareas_seguimiento` con identidad sintética, sin modificar tareas.
5. Inventory por IDs exactos de auditorías/estados automáticos.
6. Cleanup exacto; ante discrepancia, no borrar.
7. Post-check con cero residuos y recursos preexistentes intactos.

No crear citas, ejecutar scheduler, modificar tareas, usar datos reales ni ejecutar los siete casos QA-07.

## 8. Criterio de autorización

Cristian entrega checklist sanitizada con todos los controles críticos PASS y confirma ventana/rollback. Solo una tarea posterior explícita puede ejecutar cutover y smoke. Hasta entonces: **CUTOVER BLOCKED**.

## 9. Resultado post-cutover — Tarea 8

Cristian reportó el cutover manual completado: LAB-025 Interno `Unpublished` y LAB-029 Interno `Published`, con precheck visual de Header Auth, PostgreSQL, Qdrant, Cohere y Groq en PASS.

El smoke desde Codex quedó **BLOCKED antes de la primera llamada** porque este proceso no dispone de configuración externa. Se comprobaron únicamente nombres y presencia, sin imprimir valores. Faltan:

- `LAB029_N8N_WEBHOOK_BASE_URL` o endpoint interno equivalente;
- `LAB029_INTERNAL_HEADER_NAME`;
- `LAB029_INTERNAL_HEADER_VALUE`;
- `LAB029_IDENTITY_PROVIDER` cuando no aplique el valor controlado por defecto;
- `LAB029_IDENTITY_SUBJECT_A` o identidad QA autorizada equivalente.

Resultado: S-01 `FAIL` en preflight por configuración ausente; S-02, S-03 y S-04 `NOT_RUN`. No hubo llamada de red, ejecución E2, dato creado ni cleanup requerido (`N/A`). No se recomienda rollback: no existe evidencia de fallo del workflow, solo ausencia de configuración en el proceso ejecutor.

## 10. Adaptador E2 seguro — Tarea 8B

Se creó `scripts/lab031/qa07_adapter_e2.mjs`, separado del core y sin configuración específica del entorno. Expone `inventory`, `runCase`, `deleteExact` y `postcheck`, además de `preflight` y `runInternalSmoke`.

Variables obligatorias por nombre:

- `LAB031_INTERNAL_BASE_URL`;
- `LAB031_INTERNAL_WEBHOOK_PATH`;
- `LAB031_INTERNAL_HEADER_NAME`;
- `LAB031_INTERNAL_HEADER_VALUE`;
- `LAB031_IDENTITY_PROVIDER`;
- `LAB031_IDENTITY_SUBJECT`;
- `LAB031_QA_CLINIC_A`;
- `LAB031_QA_CLINIC_B`.

Opcionales para S-04: `LAB031_EXPECTED_INTERNAL_WORKFLOW_ID` y `LAB031_EXPECTED_INTERNAL_WORKFLOW_NAME`. Si n8n no devuelve evidencia de propietario en headers, S-04 queda `NOT_VERIFIED`; no se inventa atribución.

El smoke usa dos peticiones de solo lectura: `ver_tareas_seguimiento` para S-01/S-02 y `consulta_rag_interno` para S-03. Acepta fallback seguro documentado. No crea recursos por diseño y registra cleanup `N/A`.

Las operaciones multiclínica remotas que puedan crear o borrar datos aún fallan explícitamente con `QA07_E2_OPERATION_NOT_IMPLEMENTED`. `inventory`/`postcheck` solo aceptan por ahora un manifest sin recursos y `deleteExact` solo un conjunto vacío; ningún ID ajeno puede borrarse.

Validación local: sintaxis PASS; adaptador **7/7 PASS**, core **8/8 PASS**, `network_calls=0_real`. Las dos llamadas contabilizadas por la prueba fueron mocks locales.

Comando exacto de preflight, sin valores secretos:

```text
node scripts/lab031/qa07_adapter_e2.mjs --mode=preflight
```

## 11. Registro de continuidad y cierre de sesión — 2026-10-15

### Estado operativo confirmado

- Cutover manual completado: LAB-025 Interno está `Unpublished` y LAB-029 Interno está `Published`.
- Ambos conservan el contrato `POST /webhook/vetatiende-interno-lab025`.
- El rollback continúa disponible mediante LAB-025; no existe evidencia actual que justifique ejecutarlo.
- La revisión visual nodo por nodo se evitó cuando el export JSON permitía verificar la configuración estructural.

Dependencias visuales confirmadas en LAB-029 Interno:

| Nodo | Referencia de credencial/configuración | Estado |
|---|---|---|
| Header Auth | `VetAtiende Internal LAB-025` | PASS visual |
| `Leer versiones internas activas LAB-029` | `Postgres account` | PASS visual |
| `Buscar conocimiento RAG interno` | `VetAtiende Qdrant Comercial` | PASS visual |
| `Embeddings Cohere consulta RAG interno` | `Cohere comercial LAB-021` | PASS visual |
| `Groq Luna interna LAB-025` | `Groq Comercial LAB-020`; modelo `openai/gpt-oss-120b` | PASS visual |

### Identidad sintética reutilizable

La siguiente identidad es sintética, no secreta y ya existe; no requiere crear identidad ni modificar Data Tables:

- `user_id`: `usr_prueba_veterinario_001`;
- `clinic_id`: `clinica_piloto_001`;
- `identity_provider`: `prueba_oidc`;
- `identity_subject`: `usuario_veterinario_001`;
- `role`: `veterinario`;
- `estado`: `activo`;
- permisos confirmados en `lab025_permisos_roles`: `rag_interno_consultar` y `seguimientos_ver`.

### Conectividad y operación n8n

- Desde el host, `127.0.0.1:5678` rechazó la conexión.
- `docker compose ps` mostró n8n `healthy` y el binding vigente `10.0.0.97:5678 -> 5678/tcp`.
- `http://10.0.0.97:5678/` respondió HTTP 200.
- No se modificó Docker. `127.0.0.1` continúa siendo válido dentro del contenedor n8n para self-calls.
- `docker compose exec --user 0 n8n n8n export:credentials` respondió `no credentials found`; con el usuario normal del contenedor, `docker compose exec n8n n8n export:credentials` exportó siete credenciales. Para operaciones CLI de credenciales debe usarse el usuario normal salvo motivo documentado.

### Drift confirmado de Header Auth

- Nombre de header: `X-VetAtiende-Internal-Key`.
- `VETATIENDE_INTERNAL_KEY` existe en el contenedor n8n y no estaba disponible en el host Ubuntu.
- El primer `curl` desde el host usó una variable vacía y obtuvo HTTP 403; esto no fue un fallo del workflow.
- La comparación segura, sin exponer valores, entre el entorno y la credencial n8n activa produjo `HEADER_NAME=MATCH` y `HEADER_VALUE=MISMATCH`.
- Clasificación: drift de configuración entre `VETATIENDE_INTERNAL_KEY` y la credencial activa `VetAtiende Internal LAB-025`. Es un GAP pendiente antes del piloto.
- No cambiar ninguna de las dos fuentes hasta determinar su autoridad y dependencias. No registrar valores reales en Git, documentación, scripts, historial o manifests.

### Smoke ejecutado

S-01 y S-02 se ejecutaron contra LAB-029 Interno publicado, usando la credencial n8n activa y la identidad sintética `prueba_oidc` / `usuario_veterinario_001`, con acción `ver_tareas_seguimiento`:

- respuesta HTTP 200;
- S-01: **PASS funcional**;
- S-02: **PASS funcional inicial**;
- datos creados: ninguno;
- cleanup: `N/A`.

No repetir S-01/S-02 salvo regresión o cambio de configuración. Tampoco repetir la comprobación visual de credenciales, Data Tables, conectividad, el diagnóstico del 403 ni la comparación de Header Auth.

### Estado al cierre y siguiente paso

- LAB-031: `IN_PROGRESS`.
- Cutover: operativo según smoke mínimo.
- S-03: pendiente / no ejecutado.
- S-04: pendiente / no verificado.
- QA-07: `NOT_VERIFIED`.
- `GATE-PILOT`: bloqueado.
- GAP confirmado: drift de Header Auth.

El primer paso de la próxima sesión es ejecutar únicamente S-03, `consulta_rag_interno`, con la misma identidad sintética y la credencial n8n activa, sin exponer secretos. Debe validar PostgreSQL, Qdrant, Cohere y Groq/Luna, y obtener una respuesta válida o fallback documentado. Después se evaluará S-04; solo con el smoke cerrado podrá avanzarse hacia QA-07.

Las variables temporales de PowerShell pueden haberse perdido al cerrar la sesión; esto es esperado. Solo debe reconstruirse configuración no sensible y los secretos deben obtenerse de la autoridad de entorno correspondiente.
