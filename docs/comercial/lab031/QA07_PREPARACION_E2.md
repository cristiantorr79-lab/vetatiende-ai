# LAB-031 — Preparación E2 y contrato del adaptador QA-07

Estado: **PREPARACIÓN DOCUMENTAL / E2 NOT_EXECUTED / QA-07 NOT_VERIFIED**.

## 1. Objetivo

Definir qué debe existir en E2 y el contrato exacto entre `scripts/lab031/qa07_multiclinica.mjs` y un futuro adaptador externo. Esta tarea no provisiona recursos, no usa credenciales, no hace red y no autoriza los siete casos E2.

La autoridad funcional es [QA07_DISENO_AISLAMIENTO_MULTICLINICA.md](QA07_DISENO_AISLAMIENTO_MULTICLINICA.md). Los exports y cierres LAB-025 a LAB-030 demuestran capacidades históricas o locales; su publicación y configuración actual en E2 se conservan como `NOT_VERIFIED` hasta inspección autorizada.

## 2. Contrato mínimo del adaptador

El módulo indicado externamente por `LAB031_ADAPTER_MODULE` debe exportar `default` o `adapter`. El objeto debe implementar cuatro funciones asíncronas. No recibe secretos dentro del manifest: resuelve su configuración desde el entorno de ejecución y nunca imprime valores sensibles.

### `inventory(manifest)` — solo lectura

- Entrada: copia del manifest validado.
- Consulta cada ID exacto de `cleanup_expected`; no descubre por prefijos amplios.
- Salida exacta: `{ run_id, resources }`, donde cada recurso contiene `{ id, clinic_id, store, type }`.
- Debe incluir todos y solo los recursos esperados, con cardinalidad y pertenencia inequívocas.
- Errores: dependencia indisponible, ID faltante, cardinalidad distinta de uno cuando corresponda, recurso inesperado, clínica ajena o pertenencia ambigua. Debe lanzar un error sanitizado; no devuelve éxito parcial.
- No crea, modifica ni elimina datos.

### `runCase(caseId, manifest)` — lectura o mutación controlada según caso

- Entrada: uno de `L-01`, `L-02`, `M-01`, `M-02`, `C-01`, `F-01`, `F-02` y copia del manifest vigente.
- Salida obligatoria: `{ ok, evidence_refs, created_resources }`.
- `ok` es booleano; `evidence_refs` contiene referencias sanitizadas, no payloads; `created_resources` siempre es un arreglo, incluso vacío.
- Cada recurso creado o descubierto por efecto lateral debe incluir `{ side, group, id, clinic_id, store, type }`. `side` es `a` o `b`; `group` es `calendar_event_ids`, `persistent_ids`, `data_table_resources`, `rag_resources` o `audits_events`.
- El orquestador incorpora esos IDs al manifest y `cleanup_expected` antes del caso siguiente. Resultado incompleto o recurso cruzado falla cerrado.
- L-01 y las lecturas de L-02 son no mutantes salvo auditoría automática. M-01, M-02 y C-01 requieren fixtures/efectos con cleanup. F-01 normalmente es no mutante salvo auditoría. F-02 modifica temporalmente el estado de B y exige restauración exacta.
- Un timeout no autoriza reintento ciego: el adaptador reconcilia por identificadores exactos y devuelve cualquier recurso realmente creado.

### `deleteExact(expected, inventory, manifest)` — mutación destructiva acotada

- Entrada: lista exacta ya validada, snapshot coincidente de inventory y copia del manifest.
- Solo elimina/restaura los IDs recibidos; no acepta `LIKE`, prefijos, rangos de fecha, vaciado de tabla/colección ni eliminación de clínicas.
- Respeta dependencias: efectos hijos/auditorías según contrato, puntos/versiones/documentos cuando apliquen, filas, citas/eventos y restauraciones controladas.
- Si el estado cambió desde inventory o la pertenencia no coincide, lanza error antes de la primera eliminación restante.
- No puede interpretar un ID nuevo ni ampliar el conjunto recibido.

### `postcheck(manifest)` — solo lectura

- Entrada: copia del manifest posterior a DELETE/restore.
- Salida: `{ run_id, resources: [] }` cuando no quedan recursos efímeros.
- También debe verificar snapshots de clínicas/configuración estable y preservación de recursos ajenos cuando el adaptador cuente con evidencia inicial suficiente; esas comprobaciones se referencian en evidencia sanitizada.
- Cualquier residuo, recurso ajeno alterado o verificación inconclusa es error/FAIL, nunca WARN convertido en éxito.

### Reglas comunes fail-closed

- Métodos ausentes, salida inválida, secreto en evidencia, ID no manifestado, clínica ajena, cardinalidad ambigua o error de servicio bloquean la fase.
- `EXECUTE` exige confirmación `LAB031_QA_E2`; `CLEANUP` exige `LAB031_QA_CLEANUP`.
- El adaptador no decide el resultado global ni modifica directamente el archivo de manifest.
- Todo error se sanitiza; no incluye URL completa, token, header, credencial, PII ni cuerpo íntegro.

## 3. Recursos E2 mínimos por clínica

| Recurso | CLINICA_A | CLINICA_B | Necesidad |
|---|---|---|---|
| `clinic_id` | `lab031_qa_clinic_a` | `lab031_qa_clinic_b` | Registro canónico independiente en autoridad LAB-029. |
| Estado inicial | `active` | `active` | B se prueba temporalmente inactiva solo en F-02 y se restaura. |
| Calendario | Calendario QA exclusivo A | Calendario QA exclusivo B | IDs distintos y vínculo verificable por clínica; nunca calendarios reales. |
| Agenda/cita | Una cita/evento sintético A | Una cita/evento sintético B | M-01; `lab026_citas`, operación/auditoría y `event_id` exacto. |
| Identidad interna | Usuario sintético activo A | Usuario sintético activo B | Identidad derivada de autenticación, no del body. |
| Rol/permisos | Rol mínimo con `seguimientos_ver` y `seguimientos_operar` | Igual, limitado a B | L-02/M-02 mediante `lab025_permisos_roles`. |
| Tarea interna | `TASK_A`, compatible con cierre LAB-027 | `TASK_B`, compatible con cierre LAB-027 | Filas exactas en `lab025_tareas`; auditorías inventariadas. |
| Configuración | Fila LAB-028 habilitada + marcador A | Deshabilitada o marcador B | `lab028_configuracion` y `lab028_campanas`, diferenciación observable C-01. |
| Estado conversacional | Sesión A con marcador propio | Mismo valor de sesión con estado B distinto | Tabla vigente de agenda; su nombre/ID real debe resolverse antes de provisionar. |
| RAG público | Documento/punto activo con marcador A | Documento/punto activo con marcador B | L-01; PostgreSQL + Qdrant, misma visibilidad/colección y filtros por clínica. |
| Baseline | Snapshot de clínica, configuración y recursos preservados | Igual | Obligatorio antes de cualquier mutación. |

No se requiere clínica real, RAG interno adicional, scheduler LAB-027 completo, Telegram, urgencia, datos clínicos, UI de administración ni colección Qdrant nueva.

## 4. Rutas, tablas y clasificación de dependencias

La columna “existe” se refiere al repositorio o evidencia histórica, no al estado vivo de E2.

| Dependencia | Evidencia local | Clasificación actual | Acción previa a E2 |
|---|---|---|---|
| Orquestador y pruebas LAB-031 | `scripts/lab031/` | **EXISTE Y REUTILIZABLE** | Revisar contrato y mantener pruebas locales PASS. |
| Health PostgreSQL/Qdrant | `scripts/lab029/verificar_runtime_lab029.mjs` | **EXISTE Y REUTILIZABLE** | Invocación futura separada y autorizada; no demuestra QA-07. |
| Ruta pública `POST /webhook/vetatiende-comercial-chat-lab024` | Exports LAB-026/028/029 | **NOT_VERIFIED** | Determinar workflow propietario publicado en E2; no publicar duplicados con el mismo path. |
| Ruta interna `/webhook/vetatiende-interno-lab025` | Exports LAB-025/029 | **NOT_VERIFIED** | Confirmar workflow publicado, autenticación y contrato vigente. |
| Gestión documental LAB-029 | Export `lab029_gestion_rag_persistente.json`, subworkflow | **NOT_VERIFIED** | Confirmar vía autorizada para fixtures RAG; no reutilizar temporales LAB-030. |
| `lab026_citas` y registros de operación/auditoría | Cierre/export LAB-026 | **EXISTE PERO REQUIERE CONFIGURACIÓN** | Confirmar tablas E2, esquema e IDs de filas; crear solo fixtures A/B. |
| `lab025_tareas`, usuarios, permisos y auditoría | Cierre/export LAB-025/029 | **EXISTE PERO REQUIERE CONFIGURACIÓN** | Crear identidades, permisos y tareas sintéticas por clínica sin ampliar roles. |
| `lab028_configuracion` / `lab028_campanas` | Export/fixtures LAB-028 | **EXISTE PERO REQUIERE CONFIGURACIÓN** | Adaptar fixtures a A/B e IDs del run; no usar `clinica_piloto_001`. |
| Tablas de estado de agenda | Exports públicos acumulados | **NOT_VERIFIED** | Resolver nombre e ID de tabla realmente usados por el workflow publicado. |
| Autoridad de clínicas PostgreSQL | LAB-029 valida `status='active'` | **EXISTE PERO REQUIERE CONFIGURACIÓN** | Crear dos registros sintéticos o confirmar que ya fueron provisionados. |
| CLINICA_A / CLINICA_B | Solo IDs definidos en diseño | **REQUIERE CREACIÓN SINTÉTICA** | Cristian autoriza/provisiona mediante mecanismo controlado. |
| Calendarios QA A/B | No constan IDs para estas clínicas | **REQUIERE CREACIÓN SINTÉTICA** | Crear dos calendarios separados y mantener IDs fuera de Git. |
| Identidades A/B y permisos | No constan para estos IDs | **REQUIERE CREACIÓN SINTÉTICA** | Provisionar sujetos/usuarios sintéticos y permisos mínimos. |
| Documentos/puntos RAG A/B | No constan para estos IDs | **REQUIERE CREACIÓN SINTÉTICA** | Ingesta controlada con marcadores no sensibles e IDs exactos. |
| Configuración/campañas A/B | No constan para estos IDs | **REQUIERE CREACIÓN SINTÉTICA** | Filas exactas por run o fixtures QA con snapshot/restauración. |
| Adaptador externo E2 | Solo contrato/orquestación local | **REQUIERE CREACIÓN SINTÉTICA** | Implementar un módulo mínimo fuera de secretos; no conectar durante esta tarea. |
| Scheduler/canal simulado LAB-027 | Export histórico, inactivo local | **NO APLICA** | QA-07 usa tareas protegidas; no ejecutar scheduler ni batería 027. |
| Temporales LAB-030 | Cerrados y retirados | **NO APLICA** | No republicar ni repetir. |

Los flags `active` contenidos en exports locales no certifican publicación actual en E2.

## 5. Configuración externa requerida

### No sensible; puede documentarse en `.env.example` sin valores reales

- `LAB031_RUN_ID`
- `LAB031_ENVIRONMENT`
- `LAB031_RUNTIME_ROOT`
- `LAB031_ADAPTER_MODULE`
- `VETATIENDE_QA_CLINIC_A_ID`
- `VETATIENDE_QA_CLINIC_B_ID`
- `VETATIENDE_QA_PUBLIC_WEBHOOK_PATH`
- `VETATIENDE_QA_INTERNAL_WEBHOOK_PATH`
- `VETATIENDE_QA_CALENDAR_A_ID` y `VETATIENDE_QA_CALENDAR_B_ID` **solo como nombres vacíos**; sus valores operativos permanecen fuera de Git.
- IDs/nombres no sensibles de tablas requeridas, bajo prefijo `VETATIENDE_QA_TABLE_*`, si el adaptador no los descubre de forma inequívoca.

Los IDs de clínica siguen siendo exactamente los aprobados. Si se exponen como variables, PRECHECK debe exigir coincidencia y no permitir sustitución silenciosa.

### Sensible; valores exclusivamente en gestor/entorno privado

- `VETATIENDE_QA_N8N_BASE_URL`
- `VETATIENDE_QA_N8N_API_TOKEN`
- `VETATIENDE_QA_POSTGRES_URI`
- `VETATIENDE_QA_QDRANT_URL`
- `VETATIENDE_QA_QDRANT_API_KEY`
- credenciales/headers internos necesarios para la ruta protegida;
- material OIDC o sesión sintética de las identidades A/B;
- credenciales y IDs operativos de Google Calendar.

`.env.example` puede contener los nombres con valores vacíos y comentarios de formato. Nunca debe contener URLs reales, IPs, tokens, subjects, cookies, claves, headers, secretos OIDC, URIs con contraseña ni IDs de calendarios operativos. Manifest y logs tampoco los incluyen.

## 6. Checklist crítico previo a `EXECUTE`

- [ ] Rama, código y diseño revisados; pruebas locales PASS.
- [ ] Manifest preparado fuera de Git con run único y estrategia de cleanup.
- [ ] Adaptador implementa las cuatro funciones y pasa pruebas locales con mocks.
- [ ] PostgreSQL, Qdrant, n8n y Calendar responden al health autorizado sin imprimir secretos.
- [ ] A y B existen, están activas y sus snapshots fueron capturados.
- [ ] Calendarios A/B existen, son distintos, sintéticos y están vinculados a la clínica correcta.
- [ ] Identidades A/B están activas, aisladas y poseen solo `seguimientos_ver` / `seguimientos_operar` necesarios.
- [ ] Workflow público propietario del path está identificado y publicado; no hay duplicidad.
- [ ] Workflow interno propietario del path está identificado, publicado y protegido.
- [ ] Tablas vigentes y esquemas de citas, estados, tareas, permisos, configuración y auditoría están identificados.
- [ ] Configuración A/B tiene un valor diferenciador observable y no existe fallback.
- [ ] Documentos/puntos RAG A/B sintéticos están preparados o existe un plan exacto para crearlos y limpiarlos.
- [ ] Inventory puede consultar por cada ID exacto en todos los almacenes.
- [ ] `deleteExact` y `postcheck` cubren Calendar, PostgreSQL, Qdrant y Data Tables afectados.
- [ ] Restauración de B tras F-02 y preservación de recursos estables fueron ensayadas con mocks.
- [ ] Ventana sin concurrencia aprobada para F-02.
- [ ] Cristian conserva credenciales y confirma autorización de la primera mutación.

La ausencia o resultado ambiguo de cualquier ítem mantiene `EXECUTE` bloqueado.

## 7. Responsabilidades

### ChatGPT

- aprobar alcance, orden, criterios y evidencia requerida;
- decidir aceptación de riesgos o cambios documentales;
- no manejar ni solicitar valores secretos en el chat.

### Codex

- mantener orquestador/adaptador mínimo, portable y probado sin red;
- validar contratos, manifest, fail-closed, sanitización y cleanup con mocks;
- revisar evidencia local y reportar el primer fallo real;
- no provisionar ni ejecutar E2 sin tarea explícita.

### Cristian

- confirmar el entorno E2 correcto y custodiar credenciales;
- verificar o provisionar clínicas, calendarios, identidades, permisos, rutas y configuración sintética;
- confirmar ventana sin concurrencia y backups/rollback aplicables;
- autorizar y supervisar las acciones remotas, especialmente F-02 y cleanup;
- conservar valores reales fuera de Git y entregar solo resultados sanitizados.

## 8. Orden seguro de preparación

1. Aprobar este contrato y el cambio local que registra `created_resources`.
2. Implementar el adaptador con mocks; probar salidas inválidas, timeout reconciliado y bloqueo previo a DELETE.
3. Cristian identifica el workflow propietario de cada path y las tablas realmente vigentes.
4. Verificar health en una tarea separada autorizada, sin mutar.
5. Provisionar A/B, calendarios e identidades sintéticas; capturar snapshots.
6. Provisionar permisos mínimos, configuración diferenciada y recursos RAG/tareas/citas con IDs exactos.
7. Ejecutar `PRECHECK_LOCAL` y `PREPARE_MANIFEST`; validar que cleanup cubre cada almacén.
8. Ejecutar `INVENTORY` de precondiciones sin DELETE y revisar manualmente el resumen sanitizado.
9. Autorizar una primera ejecución E2 por tarea explícita; ejecutar fail-fast y cleanup obligatorio.

## 9. Criterio para autorizar la primera ejecución E2

Se autoriza solo cuando el checklist crítico está completo, el adaptador pasa pruebas locales, las rutas propietarias están inequívocamente publicadas, todos los recursos son sintéticos, cada posible escritura tiene captura inmediata de ID y cleanup exacto, y Cristian confirma credenciales privadas, ventana y entorno. La autorización no cambia QA-07 a PASS: solo permite obtener evidencia.

Primer bloqueo vigente: **no está verificado qué workflows son propietarios y están publicados actualmente en E2 para las rutas pública e interna**. Sin esa resolución no se pueden atribuir configuración, tablas ni cleanup a la cadena que realmente atendería QA-07.
