# LAB-029 — HANDOFF CODEX

## Estado actual

LAB-029 continúa abierto, sin commit ni push. Management del run D está aprobado funcionalmente; la fase Interno está en validación y aún faltan persistencia, limpieza y resolver el TLS de Aiven. Los workflows temporales ya están publicados en E2; Codex no ejecutó runtime remoto en esta sesión. Los históricos LAB-021 a LAB-028 permanecen intactos.

El estado vigente y el siguiente paso están al final de este HANDOFF. Las secciones anteriores conservan el historial de diagnóstico y comandos de etapas previas.

## Archivos

- `scripts/lab029/migraciones/001_dominio_documental.sql`
- `scripts/lab029/migraciones/002_activacion_rollback.sql`
- `scripts/lab029/fixtures/cargar_fixtures_lab029.sql`
- `scripts/lab029/fixtures/limpiar_fixtures_lab029.sql`
- `scripts/lab029/logica_documental_lab029.mjs`
- `scripts/lab029/generar_workflows_lab029.mjs`
- `scripts/lab029/validar_lab029.mjs`
- `scripts/lab029/probar_logica_lab029.mjs`
- `scripts/lab029/verificar_runtime_lab029.mjs`
- `scripts/lab029/probar_runtime_lab029.mjs`
- `n8n/workflows/comercial/lab029_publico_rag_persistente.json`
- `n8n/workflows/comercial/lab029_interno_rag_persistente.json`
- `n8n/workflows/comercial/lab029_gestion_rag_persistente.json`
- `infra/comercial/compose.e2.lab029-aiven-ca.override.yaml`
- `docs/comercial/lab029/README.md`
- `docs/comercial/lab029/HANDOFF_CODEX.md`
- `.gitignore`

## Decisiones

PostgreSQL estándar es canónico para clínicas, documentos, versiones y eventos. Qdrant usa dos colecciones compartidas, una pública y otra interna. Cada recuperación filtra por IDs activos, clínica, visibilidad, estado active y, para interno, acceso. Los originales viven en almacenamiento privado excluido de Git; gestión recibe `document_content`. Cohere conserva `embed-multilingual-v3.0`.

El esquema usa FK, CHECK, uniques y un índice parcial que impide más de una versión activa. La activación y rollback bloquean el documento y actualizan estados dentro de una transacción. La lógica local modela fallos de embeddings, Qdrant y validación preservando la versión activa anterior.

## Validación local

- `node scripts/lab029/probar_logica_lab029.mjs`: 26 pruebas, PASS.
- `node scripts/lab029/validar_lab029.mjs`: PASS; contrato de gestión 12/12 y todas las conexiones apuntan a nodos existentes.
- `node scripts/lab029/probar_runtime_lab029.mjs`: 82 pruebas con mocks, PASS en la corrección I-03.
- `scripts/lab029/probar_postgres_lab029.sql`: PASS en PGlite 0.5.8 (PostgreSQL embebido local), incluidas FK cruzada, versión NULL, timestamps, seis eventos y reversión ante fallo de auditoría. Migraciones aplicadas dos veces, PASS.
- Los health checks locales se ejecutan con mocks y no imprimen URI, API key ni credenciales. El verificador directo devolvió `configuracion_faltante` porque esta sesión no tenía las variables reales.

## Runtime E2 pendiente — CA Aiven

La fuente de verdad del runtime E2 es `/opt/vetatiende-ab/compose.yaml`. El
`infra/comercial/compose.yaml` versionado representa el stack combinado histórico
y no debe reemplazar el archivo de E2. Aplicar junto al Compose vigente el
artefacto reproducible `infra/comercial/compose.e2.lab029-aiven-ca.override.yaml`,
instalado en E2 como `/opt/vetatiende-ab/compose.lab029-aiven-ca.override.yaml`.
El override añade solo a `n8n`:

- `NODE_EXTRA_CA_CERTS=/etc/ssl/certs/aiven-ca.pem`;
- `./certs/aiven-ca.pem:/etc/ssl/certs/aiven-ca.pem:ro`.

El CA real ya está en `/opt/vetatiende-ab/certs/aiven-ca.pem`, fuera de Git, con
propietario `root:root` y modo `0644`. Comandos mínimos pendientes en E2:

```bash
cd /opt/vetatiende-ab
test -r certs/aiven-ca.pem
docker compose -f compose.yaml -f compose.lab029-aiven-ca.override.yaml config --quiet
docker compose -f compose.yaml -f compose.lab029-aiven-ca.override.yaml up -d --no-deps --force-recreate n8n
docker compose -f compose.yaml -f compose.lab029-aiven-ca.override.yaml ps n8n task-runners
docker compose -f compose.yaml -f compose.lab029-aiven-ca.override.yaml exec -T n8n sh -lc 'test "$NODE_EXTRA_CA_CERTS" = /etc/ssl/certs/aiven-ca.pem && test -r "$NODE_EXTRA_CA_CERTS" && echo "PASS CA visible y legible"'
docker compose -f compose.yaml -f compose.lab029-aiven-ca.override.yaml exec -T n8n node -e 'const fs=require("fs");const p=process.env.NODE_EXTRA_CA_CERTS;if(!p||!fs.readFileSync(p,"utf8").includes("BEGIN CERTIFICATE"))process.exit(1);console.log("PASS CA PEM cargable por Node")'
```

Esperar `n8n` healthy y `task-runners` running. El runner debería reconectar sin
ser recreado; solo si no lo hace, ejecutar:

```bash
docker compose -f compose.yaml -f compose.lab029-aiven-ca.override.yaml up -d --no-deps --force-recreate task-runners
```

Después, en la credencial PostgreSQL Aiven de n8n, mantener SSL habilitado,
`Ignore SSL Issues (Insecure)` desactivado y ejecutar **Test connection**. Debe
conectar sin `self-signed certificate in certificate chain`. El override tendrá
que incluirse en futuras recreaciones del runtime E2.

## Próximo bloque exacto

Consultar la sección **Estado vigente tras corrección I-03** al final de este archivo. Antes del cierre siguen pendientes la validación TLS con CA Aiven, persistencia y limpieza final; no usar como instrucciones actuales los comandos históricos de las secciones intermedias.

## Correcciones de continuidad

Se conservó `mvp-comercial`, con HEAD `d1b3b8b99e5ca588c8a0b9d1fb6b76281effe399`, sin commit ni push.
La migración 001 añade FK compuesta documento/versión y triggers reutilizables de
updated_at. La 002 registra staged/validated/failed por trigger y activated/rollback
en sus funciones, de forma transaccional. El rollback JavaScript ahora renueva
activated_at y la simulación emite validated. README documenta el único responsable
de cada evento; no_changes queda a cargo del nodo de gestión.

Archivos ajustados: migraciones 001/002, lógica documental, pruebas de lógica,
validador, README, este HANDOFF y generador de workflows. Nuevo archivo de prueba:
`scripts/lab029/probar_postgres_lab029.sql`. El único cambio semántico al export
de gestión es retirar la inserción duplicada de activated y sus parámetros sin uso;
los exports público/interno conservan el contenido anterior. `.gitignore` conserva
el cambio preexistente. Los históricos LAB-021 a LAB-028 se verificaron contra la
base cerrada.

Riesgos pendientes: la coordinación es una saga entre dos almacenes y requiere
pruebas de fallos reales en n8n. La autenticación Qdrant por credencial predefinida,
el acceso a `LAB029_QDRANT_URL`, el loader y los cuerpos HTTP deben comprobarse
contra la versión n8n instalada. No se importó, activó ni tocó infraestructura real.

## Continuidad runtime — 2026-09-14 11:39:24 -03:00

Se preparó la continuación con el run limpio `LAB029_TEST_20260914A`, reutilizando
los seis workflows temporales publicados del run `LAB029_TEST_20260910A`. El
manifest limpio conserva sus identificadores, payloads y hashes nuevos, pero apunta
a los webhook paths e IDs reales ya publicados. No se creó ni importó ningún
workflow adicional.

Antes del runtime se completó la corrección pendiente del JSON body Qdrant. Los
diez HTTP Request de Gestión generan ahora JSON literal válido; las expresiones
n8n aparecen únicamente en los valores dinámicos. El objeto Set Payload conserva
`payload`, `key: metadata` y el filtro estricto por clínica, documento y versión.
Se ajustaron `scripts/lab029/generar_workflows_lab029.mjs`,
`scripts/lab029/validar_lab029.mjs` y
`scripts/lab029/probar_runtime_lab029.mjs`, y se regeneraron los exports LAB-029
afectados. Validación local: validador PASS 1374, contrato Gestión 12/12, runtime
mocks PASS 39 y `git diff --check` PASS.

No se ejecutó G-01→G-09 desde esta sesión. El primer bloqueo operativo ocurrió
antes de G-01: la conexión SSH directa a `ubuntu@10.0.0.97:22` agotó el tiempo de
espera. Esta estación no tiene túnel local al puerto 5678 ni una sesión web n8n
disponible. Por tanto, no existen tiempos ni resultados nuevos de G-01→G-09; su
estado permanece pendiente. Público, Interno, Persistencia y cleanup tampoco se
ejecutaron. No se generaron datos runtime desde esta sesión.

Próximo paso único: desde una terminal E2 con `/home/ubuntu/VetAtiendeAI`
sincronizado, ejecutar `--phase=management` usando el manifest
`private-storage/lab029/runtime/LAB029_TEST_20260914A/manifest.json`, base URL
`http://10.0.0.97:5678`, el header interno existente y
`LAB029_RUNTIME_CONFIRM=LAB029_RUNTIME_REAL`. El runner se detendrá en el primer
fallo y escribirá resultados y tiempos en ese mismo manifest.

### Corrección de fixture previa a Management — 2026-09-14

La ejecución externa confirmó G-01 PASS y detuvo G-02 en `Asegurar documento
nuevo PostgreSQL LAB-029`: la FK `documents_clinic_id_fkey` rechazó
`LAB029_TEST_20260914A_CLINIC_A` porque el run limpio no había creado sus clínicas.
No es un fallo de Gestión ni de la FK.

El Verificador temporal existente incorpora ahora el checkpoint `setup`. Antes de
G-01, el runner lo invoca una vez y su nodo PostgreSQL crea o reactiva exactamente
`clinic_a` y `clinic_b` del manifest mediante `INSERT ... ON CONFLICT DO UPDATE`.
El esquema exige `clinic_id ~ '^[a-z0-9][a-z0-9_-]{2,63}$'`. Las clínicas del
run son ahora `lab029_test_20260914a_clinic_a` y
`lab029_test_20260914a_clinic_b`: conservan la identificación temporal, la
unicidad del run y el aislamiento A/B en un formato válido. El SQL solo acepta
IDs con prefijo literal minúsculo `lab029_test_`; después relee ambas filas y
exige la assertion `clinicas_fixture_preparadas`. No crea documentos,
versiones, eventos ni puntos. El cleanup existente elimina estas clínicas por los
IDs exactos del manifest después de sus dependencias; el fixture SQL genérico se
ajustó para reconocer el prefijo sin distinguir mayúsculas.

Archivos modificados: `scripts/lab029/crear_workflow_verificador_runtime_lab029.mjs`,
`scripts/lab029/ejecutar_runtime_lab029.mjs`,
`scripts/lab029/probar_runtime_lab029.mjs`,
`scripts/lab029/fixtures/limpiar_fixtures_lab029.sql` y el export temporal
`private-storage/lab029/runtime/LAB029_TEST_20260914A/workflow_verificador_runtime.json`.
Validación local: validador PASS 1374, contrato Gestión 12/12, runtime mocks PASS
41, lógica PASS 26 y `git diff --check` PASS. No se ejecutó runtime desde Codex.

Próximo paso único: actualizar en n8n el Verificador temporal publicado con el
export anterior y ejecutar una sola vez `--phase=management`; la preparación de
clínicas ocurre automáticamente antes de G-01.

### Bloqueo G-02 en Qdrant — 2026-09-14

G-01 pasó y G-02 llegó correctamente hasta `Cargar staging en Qdrant LAB-029`.
Ese nodo es `@n8n/n8n-nodes-langchain.vectorStoreQdrant` y obtiene la URL base
exclusivamente de la credencial `VetAtiende Qdrant Comercial`
(`qdrantApi`, id `jHiRqgWleLSSH6GM`); no consume `LAB029_QDRANT_URL`. En cambio,
los nodos HTTP Request de compensación usan explícitamente
`LAB029_QDRANT_URL`, cuyo valor operativo en E2 es
`http://10.0.0.225:6333`. Esta diferencia explica que la carga falle con
`fetch failed` aunque la ruta de compensación pueda alcanzar Qdrant.

El host guardado en una credencial n8n no se exporta con el workflow. La única
comprobación pendiente es abrir `VetAtiende Qdrant Comercial` en n8n y confirmar
que su URL sea exactamente `http://10.0.0.225:6333` (sin `localhost`, nombre de
contenedor ni IP anterior), conservando la API key existente. Si difiere, se debe
corregir únicamente ese campo y guardar/probar la credencial. No hace falta
reimportar ningún workflow para aplicar esa corrección.

### Run limpio B — 2026-09-14

Se generó `LAB029_TEST_20260914B` como nueva evidencia limpia. Usa
`lab029_test_20260914b_clinic_a` y `lab029_test_20260914b_clinic_b`, además de
documentos, sesiones, archivos fuente, contenido y hashes exclusivos del run B.
El run `LAB029_TEST_20260914A` quedó intacto y no debe usarse como evidencia
final ni limpiarse todavía.

El manifest B referencia los seis workflows ya publicados de
`LAB029_TEST_20260910A`, incluidos sus IDs y webhook paths. El Verificador
publicado es compatible con el nuevo prefijo y crea idempotentemente las clínicas
A/B antes de G-01. No se debe importar ni publicar otro workflow. Antes de
Management solo deben copiarse a E2
`private-storage/lab029/runtime/LAB029_TEST_20260914B/manifest.json` y
`private-storage/lab029/runtime/LAB029_TEST_20260914B/payloads.json`, conservando
la misma ruta relativa bajo el repositorio.

### Corrección G-02: documento único para Qdrant — 2026-09-14

La ejecución del run B confirmó que la conectividad y autenticación Qdrant ya
funcionan. G-02 falló porque `Cargar contenido documental real LAB-029` usaba
`dataType: json` sin seleccionar el modo de datos específico. n8n 2.29.8 cargó
todo el item y produjo un documento por cada valor escalar.

El generador configura ahora `jsonMode: expressionData` y
`jsonData: ={{ $json.document_content }}`. Así, `pageContent` contiene únicamente
el documento real y la metadata conserva `clinic_id`, `document_id`, `version_id`,
`version_number`, `document_type`, `visibility`, `content_hash`, `updated_at`,
`source_file`, `access_level` y `status`. El splitter, Cohere, PostgreSQL,
credenciales y criterios de validación no cambiaron.

Antes de repetir G-02 se debe actualizar en n8n el workflow temporal publicado
`LAB029_TEST_20260910A Gestión driver` (id `Kq8kDubm6BM1Xtjm`) usando
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_gestion_driver.json`.

### Continuación Management desde G-06

El selector existente admite `--from=G-06`. Con el estado acumulado del run C,
ejecuta `setup`, G-06, G-07, G-08 y G-09. Omite G-01 a G-05 y no invoca
`prepare_g02`. El primer FAIL bloquea los casos posteriores y los tiempos y
resultados se registran normalmente en el manifest. Se conservan sin cambios
`--from=G-03`, `--case=G-02` y la fase Management completa.

Desde `/home/ubuntu/VetAtiendeAI` en E2:

```bash
LAB029_N8N_WEBHOOK_BASE_URL=http://10.0.0.97:5678 LAB029_INTERNAL_HEADER_NAME=X-VetAtiende-Internal-Key LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY" LAB029_RUNTIME_CONFIRM=LAB029_RUNTIME_REAL docker run --rm --user "$(id -u):$(id -g)" --network host -v "$PWD:/workspace" -w /workspace -e LAB029_N8N_WEBHOOK_BASE_URL -e LAB029_INTERNAL_HEADER_NAME -e LAB029_INTERNAL_HEADER_VALUE -e LAB029_RUNTIME_CONFIRM node:20-alpine node scripts/lab029/ejecutar_runtime_lab029.mjs --manifest=private-storage/lab029/runtime/LAB029_TEST_20260914C/manifest.json --phase=management --from=G-06 --summary
```

### Corrección puntual del bloque G-07

El objetivo fue hacer que toda la ruta posterior al staging use la versión
efectivamente persistida o reutilizada por PostgreSQL. La causa raíz era que el
workflow generaba `version_id` y `version_number` tentativos al inicio y varios
nodos posteriores seguían consultando ese contexto, aunque PostgreSQL pudiera
devolver otra identidad efectiva.

`Consultar versión activa PostgreSQL LAB-029` obtiene ahora la versión active y
`MAX(version_number)` de todo el historial del documento. `Decidir staging
documental LAB-029` calcula el siguiente número desde ese máximo. `Crear versión
staging PostgreSQL LAB-029` usa `ON CONFLICT (document_id, content_hash)`, permite
reactivar únicamente una fila `failed` y devuelve con `RETURNING` el
`version_id`, `version_number`, `status`, hash y archivo efectivos. No elimina
historial.

`Restaurar contexto tras staging PostgreSQL LAB-029` superpone el resultado de
PostgreSQL al contexto calculado. Desde allí, la restauración tras Qdrant, la
recuperación y validación staging, el cambio Qdrant a active, la activación
PostgreSQL y el manejo de fallo usan la identidad persistida. La transacción de
activación valida y activa esa misma fila. Dentro del tramo dirigido no quedan
referencias al `version_id` o `version_number` tentativos para operar sobre el
staging persistido.

Archivos modificados: `scripts/lab029/generar_workflows_lab029.mjs`,
`scripts/lab029/validar_lab029.mjs`,
`n8n/workflows/comercial/lab029_gestion_rag_persistente.json`,
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_gestion_driver.json`
y este handoff. Validación local: validador PASS 1384, contrato Gestión 12/12,
runtime mocks PASS 48, lógica PASS 26 y `git diff --check` PASS. G-07 queda
pendiente de repetición real.

Para continuar, actualizar únicamente en n8n `LAB029_TEST_20260910A Gestión
driver` (id `Kq8kDubm6BM1Xtjm`) con el export temporal anterior. Después, desde
`/home/ubuntu/VetAtiendeAI` en E2, ejecutar:

```bash
LAB029_N8N_WEBHOOK_BASE_URL=http://10.0.0.97:5678 LAB029_INTERNAL_HEADER_NAME=X-VetAtiende-Internal-Key LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY" LAB029_RUNTIME_CONFIRM=LAB029_RUNTIME_REAL docker run --rm --user "$(id -u):$(id -g)" --network host -v "$PWD:/workspace" -w /workspace -e LAB029_N8N_WEBHOOK_BASE_URL -e LAB029_INTERNAL_HEADER_NAME -e LAB029_INTERNAL_HEADER_VALUE -e LAB029_RUNTIME_CONFIRM node:20-alpine node scripts/lab029/ejecutar_runtime_lab029.mjs --manifest=private-storage/lab029/runtime/LAB029_TEST_20260914C/manifest.json --phase=management --case=G-07 --summary
```
El export definitivo `n8n/workflows/comercial/lab029_gestion_rag_persistente.json`
también quedó regenerado como fuente canónica, pero no es necesario publicarlo
para esta repetición mediante el driver autocontenido.

### Run limpio C — 2026-09-14

Se generó `LAB029_TEST_20260914C` con datos exclusivos después de publicar en el
driver de Gestión la corrección del Data Loader. Sus clínicas son
`lab029_test_20260914c_clinic_a` y `lab029_test_20260914c_clinic_b`; documentos,
sesiones, archivos fuente, contenido y hashes también pertenecen únicamente al
run C. Los runs A y B permanecen intactos como evidencia histórica de los fallos
anteriores.

El manifest C reutiliza los IDs, nombres y webhook paths de los seis workflows
publicados de `LAB029_TEST_20260910A`. No requiere importar ni publicar otro
workflow. Antes de ejecutar Management se deben copiar a E2 solamente
`private-storage/lab029/runtime/LAB029_TEST_20260914C/manifest.json` y
`private-storage/lab029/runtime/LAB029_TEST_20260914C/payloads.json`, preservando
esa ruta relativa en el repositorio.

### Corrección G-02: evaluación del filtro Qdrant — 2026-09-14

En el run C la inserción Qdrant terminó correctamente, pero el scroll devolvió
`points: []`. El formato escrito por el Vector Store usa las claves predeterminadas
`content` y `metadata`; por tanto, `metadata.clinic_id`, `metadata.document_id`,
`metadata.version_id` y `metadata.status` son las rutas correctas. El
`version_id` y la colección provienen del mismo contexto restaurado que alimenta
el loader y el Vector Store.

La causa estaba en los HTTP Request: `jsonBody` comenzaba con `{`, por lo que n8n
lo trataba como texto JSON estático y enviaba literalmente los valores
`{{ ... }}`. Ahora comienza con `={` y conserva un objeto JSON literal con
expresiones solo en sus valores. Así n8n 2.29.8 interpola los IDs antes de enviar
el filtro, sin recurrir a `JSON.stringify` ni a un objeto JavaScript completo.

Para repetir únicamente G-02 se debe actualizar en n8n
`LAB029_TEST_20260910A Gestión driver` (id `Kq8kDubm6BM1Xtjm`) desde
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_gestion_driver.json`.
El run C, sus payloads y su manifest no cambiaron.

### Ejecución aislada de G-02 — 2026-09-14

El runner acepta ahora `--case=G-02` junto con `--phase=management`. En este modo
ejecuta los checkpoints `setup` y `prepare_g02`, la llamada HTTP de G-02 y el checkpoint `g02`; no
ejecuta G-01 ni G-03 a G-09 y no realiza cleanup. Sin `--case`, la fase conserva
su comportamiento completo anterior. El resultado aislado, incluido su tiempo,
se escribe en `tests.management` del manifest con `case: "G-02"`.

Desde `/home/ubuntu/VetAtiendeAI` en E2:

```bash
LAB029_N8N_WEBHOOK_BASE_URL=http://10.0.0.97:5678 LAB029_INTERNAL_HEADER_NAME=X-VetAtiende-Internal-Key LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY" LAB029_RUNTIME_CONFIRM=LAB029_RUNTIME_REAL docker run --rm --user "$(id -u):$(id -g)" --network host -v "$PWD:/workspace" -w /workspace -e LAB029_N8N_WEBHOOK_BASE_URL -e LAB029_INTERNAL_HEADER_NAME -e LAB029_INTERNAL_HEADER_VALUE -e LAB029_RUNTIME_CONFIRM node:20-alpine node scripts/lab029/ejecutar_runtime_lab029.mjs --manifest=private-storage/lab029/runtime/LAB029_TEST_20260914C/manifest.json --phase=management --case=G-02 --summary
```

### Reejecución G-02 con residuos — `prepare_g02`

El Verificador temporal existente incorpora `prepare_g02`. La operación se
autoriza únicamente cuando el checkpoint coincide, el prefijo comienza con
`LAB029_TEST_`, `clinic_a` equivale a `lower(prefix) || '_clinic_a'` y
`document_public_a` equivale a `prefix || '_DOC_PUBLIC_A'`.

Dentro de ese límite elimina los eventos cuyo `clinic_id` y `document_id`
coinciden exactamente, elimina solamente versiones `staging` o `failed` del
documento y elimina el registro `documents` solo cuando ya no quedan versiones.
No contiene ningún `DELETE` sobre `clinics` y no referencia clinic B ni los otros
documentos del run. Los puntos Qdrant compensados permanecen con `status=failed`;
no interfieren con el filtro `status=staging` ni con el nuevo `version_id`, por lo
que no se añadió acceso Qdrant al Verificador.

Antes de repetir la prueba se debe actualizar únicamente
`LAB029_TEST_20260910A Verificador runtime` (id `Sm1GvgWz1X7BOqh2`) desde
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_verificador_runtime.json`.

### Corrección G-02: conservación de `version_number`

La ejecución real confirmó que `Decidir staging documental LAB-029` calculaba la
primera versión como 1 y PostgreSQL la insertaba correctamente. El valor volvía a
0 porque `Restaurar contexto tras staging PostgreSQL LAB-029` y `Restaurar
contexto tras Qdrant LAB-029` recuperaban el estado inicial de `Preparar contexto
e IDs LAB-029`, donde el contador se inicializa en 0.

Ambas restauraciones recuperan ahora el resultado de `Decidir staging documental
LAB-029`, conservando el número calculado. La validación usa el mismo contexto,
lee el contenido escrito por el Vector Store desde `payload.content` y exige que
`metadata.version_number` coincida numéricamente con el valor calculado. No acepta
0 para la primera versión ni cambia PostgreSQL, Qdrant o sus filtros.

Antes de repetir G-02 se debe actualizar únicamente
`LAB029_TEST_20260910A Gestión driver` (id `Kq8kDubm6BM1Xtjm`) desde
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_gestion_driver.json`.

### Continuación Management desde G-03

G-02 pasó en E2 para `LAB029_TEST_20260914C` en 4.198 s. El runner acepta ahora
`--from=G-03` para continuar con `setup` y ejecutar, en orden, G-03 a G-09. No
ejecuta G-01, G-02 ni `prepare_g02`. Conserva el bloqueo de dependencias: el
primer FAIL se registra y los casos posteriores quedan `BLOCKED`. Sin `--from`,
la fase Management mantiene su comportamiento completo; `--case=G-02` también
permanece intacto. `--from` y `--case` no pueden combinarse.

Desde `/home/ubuntu/VetAtiendeAI` en E2:

```bash
LAB029_N8N_WEBHOOK_BASE_URL=http://10.0.0.97:5678 LAB029_INTERNAL_HEADER_NAME=X-VetAtiende-Internal-Key LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY" LAB029_RUNTIME_CONFIRM=LAB029_RUNTIME_REAL docker run --rm --user "$(id -u):$(id -g)" --network host -v "$PWD:/workspace" -w /workspace -e LAB029_N8N_WEBHOOK_BASE_URL -e LAB029_INTERNAL_HEADER_NAME -e LAB029_INTERNAL_HEADER_VALUE -e LAB029_RUNTIME_CONFIRM node:20-alpine node scripts/lab029/ejecutar_runtime_lab029.mjs --manifest=private-storage/lab029/runtime/LAB029_TEST_20260914C/manifest.json --phase=management --from=G-03 --summary
```

### Corrección G-06: validación posterior al rollback

La recuperación Qdrant devolvió correctamente la versión objetivo con estado
`active`, pero `Validar recuperación después del rollback Qdrant LAB-029` buscaba
el contenido únicamente en `payload.text/pageContent`. El Vector Store lo guarda
en `payload.content`; el nodo tampoco verificaba antes la identidad del punto.

La validación usa ahora `Restaurar contexto rollback LAB-029` como autoridad y
exige un punto con contenido no vacío, `metadata.version_id` igual a
`target_version_id`, estado `active`, clínica y documento exactos, y
`content_hash` coincidente. No se modificaron el rollback, sus compensaciones,
los filtros ni PostgreSQL. Antes de repetir G-06 se debe actualizar únicamente
`LAB029_TEST_20260910A Gestión driver` (id `Kq8kDubm6BM1Xtjm`) desde
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_gestion_driver.json`.

### Run limpio final de Management — `LAB029_TEST_20260914D`

El run C confirmó en E2: G-02 PASS en 4.198 s, G-03 PASS en 3.616 s,
G-06 PASS en 2.486 s, G-07 PASS en 3.783 s, G-08 PASS en 9.181 s y G-09
PASS en 1.614 s. G-04 y G-05 quedaron con WARN en ejecuciones anteriores y se
reevaluarán en la corrida final limpia. Management ya no tiene bloqueos lógicos
conocidos.

Se preparó `LAB029_TEST_20260914D` con identificadores, sesiones, contenidos,
archivos fuente y hashes exclusivos. Reutiliza sin crear ni publicar otros
workflows los IDs, nombres y webhooks de `LAB029_TEST_20260910A` actualmente
publicados. Sus archivos de ejecución son:

- `private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json`
- `private-storage/lab029/runtime/LAB029_TEST_20260914D/payloads.json`

Antes de ejecutar, copiar esos dos archivos a
`/tmp/LAB029_TEST_20260914D/` dentro del contenedor n8n y copiar la versión
actual de `scripts/lab029/ejecutar_runtime_lab029.mjs` como
`/tmp/lab029/ejecutar_runtime_lab029.mjs`. Luego ejecutar Management completo,
sin `--from` ni `--case`:

```bash
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=management --summary'
```

### Corrección runtime Público: `clinic_id` de fixtures LAB-029

P-01 a P-04 del run `LAB029_TEST_20260914D` alcanzaban el webhook, pero
`Clinic_id permitido` comparaba exclusivamente con `clinica_piloto_001` y
respondía HTTP 400 para las clínicas temporales A/B. La copia Pública temporal
acepta ahora `clinica_piloto_001` o un identificador que cumpla estrictamente
`^lab029_test_[a-z0-9](?:[a-z0-9_-]{4,41}[a-z0-9])?_clinic_[ab]$`. Rechaza el
valor vacío, IDs arbitrarios, sufijos diferentes de A/B y variantes fuera del
formato minúsculo controlado.

La adaptación se aplica únicamente al generar/regenerar `workflow_publico.json`
en runtime. Los workflows históricos y el export final
`n8n/workflows/comercial/lab029_publico_rag_persistente.json` permanecen
intactos. Esta regla LAB029_TEST permite cerrar las pruebas; antes del cierre de
producción, el workflow final LAB-029 todavía debe incorporar validación
multi-clínica real sin depender de IDs de prueba ni de una única clínica fija.

Archivos modificados: `scripts/lab029/preparar_runtime_lab029.mjs`,
`scripts/lab029/probar_runtime_lab029.mjs` y
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_publico.json`.
La validación local cubre vacío y arbitrario rechazados, y piloto, fixture A y
fixture B permitidos. Para retomar, actualizar en n8n únicamente
`LAB029_TEST_20260910A Público` (id `8gX3oc5uNLFwLCKu`) desde ese export y
publicarlo nuevamente si la actualización lo deja inactivo. Después ejecutar:

```bash
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=public --summary'
```

### Fixtures automáticos de identidad interna A/B

La fase `internal` estaba bloqueada porque `lab025_usuarios_internos` no tenía
identidades asociadas a las clínicas del run D. El Verificador temporal crea o
reactiva ahora, durante `setup`, únicamente estas dos filas idempotentes:

- `lab029_test_20260914d_user_a`, subject
  `lab029_test_20260914d_subject_a`, clínica
  `lab029_test_20260914d_clinic_a`.
- `lab029_test_20260914d_user_b`, subject
  `lab029_test_20260914d_subject_b`, clínica
  `lab029_test_20260914d_clinic_b`.

Ambas usan provider `lab029_runtime`, rol `veterinario` y estado `activo`. Los
IDs se derivan del prefijo validado del manifest; cada upsert y cada borrado usa
un `user_id` exacto. La verificación posterior exige identidad, clínica, rol y
estado exactos. No hay operaciones por prefijo amplio ni referencias a usuarios
históricos.

El checkpoint `cleanup_identities` elimina exactamente esos dos usuarios y
verifica su ausencia. `limpiar_runtime_lab029.mjs` lo invoca antes del cleanup
documental. No elimina las clínicas durante `setup` ni modifica usuarios reales.

Se modificaron `crear_workflow_verificador_runtime_lab029.mjs`,
`ejecutar_runtime_lab029.mjs`, `limpiar_runtime_lab029.mjs`, los mocks runtime y
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_verificador_runtime.json`.
Actualizar en n8n únicamente `LAB029_TEST_20260910A Verificador runtime` (id
`Sm1GvgWz1X7BOqh2`) y publicarlo nuevamente si queda inactivo. Copiar también el
runner actualizado a `/tmp/lab029/ejecutar_runtime_lab029.mjs`.

Para ejecutar Interno sobre el run D:

```bash
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_IDENTITY_PROVIDER="lab029_runtime"; export LAB029_IDENTITY_SUBJECT_A="lab029_test_20260914d_subject_a"; export LAB029_IDENTITY_SUBJECT_B="lab029_test_20260914d_subject_b"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=internal --summary'
```

### Corrección del filtro `access_level` en RAG interno

El nodo `Buscar conocimiento RAG interno` producía `fetch failed` en n8n 2.29.8
al representar los niveles autorizados mediante un `match.any` dinámico sobre
`metadata.access_level`. El mismo nodo recuperaba el documento al retirar solo
esa condición, confirmando el aislamiento del defecto.

La semántica de autorización se conserva expresando los niveles permitidos como
un OR `should`, con una condición `match.value` por cada elemento de
`niveles_acceso_permitidos`. Clínica, `visibility=internal`, `status=active` y
las versiones activas permanecen como condiciones obligatorias `must`. No se
retiró ni relajó el control de acceso.

Se modificaron el generador LAB-029, el export Interno final, el export temporal,
el validador y los mocks runtime. Las validaciones locales confirman que
`recepcion` y `veterinario` quedan autorizados y `administrador` no se incorpora
cuando no está en la lista.

Actualizar en n8n únicamente `LAB029_TEST_20260910A Interno` (id
`IXVnpodoR6wu7iSC`) desde
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_interno.json` y
publicarlo nuevamente si queda inactivo. Repetir la fase con:

```bash
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_IDENTITY_PROVIDER="lab029_runtime"; export LAB029_IDENTITY_SUBJECT_A="lab029_test_20260914d_subject_a"; export LAB029_IDENTITY_SUBJECT_B="lab029_test_20260914d_subject_b"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=internal --summary'
```

### Fixtures automáticos de permisos internos A/B

El HTTP 403 de la fase `internal` se producía después de resolver correctamente
la identidad: `lab025_permisos_roles` no contenía permisos para las clínicas A/B
del run, por lo que `Consolidar permisos usuario interno` devolvía
`rol_sin_permisos_activos`.

El `setup` del Verificador crea o reactiva idempotentemente exactamente un
permiso por clínica, usando la clave compuesta exacta `clinic_id + veterinario +
rag_interno_consultar`. Ambos quedan en estado `activo` y actualizan
`fecha_actualizacion`. La comprobación posterior exige las dos clínicas exactas,
rol `veterinario`, permiso `rag_interno_consultar` y estado `activo`.

El checkpoint existente `cleanup_identities` elimina primero esos dos permisos
mediante sus tres condiciones exactas, verifica su ausencia y conserva el cleanup
de usuarios A/B. No usa borrados amplios ni contiene IDs de clínicas o permisos
históricos.

Se modificaron el generador del Verificador, los mocks runtime y
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_verificador_runtime.json`.
No se modificaron el workflow Interno, Data Tables ni permisos históricos.
Actualizar en n8n únicamente `LAB029_TEST_20260910A Verificador runtime` (id
`Sm1GvgWz1X7BOqh2`) y publicarlo nuevamente si queda inactivo.

Para repetir Interno sobre el run D:

```bash
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_IDENTITY_PROVIDER="lab029_runtime"; export LAB029_IDENTITY_SUBJECT_A="lab029_test_20260914d_subject_a"; export LAB029_IDENTITY_SUBJECT_B="lab029_test_20260914d_subject_b"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=internal --summary'
```

### Corrección assertion `setup` de identidades runtime

La creación idempotente A/B y la lectura posterior desde
`lab025_usuarios_internos` funcionaron correctamente en E2. El falso negativo
ocurría en `Evaluar assertions runtime LAB-029`: buscaba
`input.identity_users` e `input.identity_subjects`, campos que no forman parte
del contrato de `Validar solicitud verificador LAB-029`.

La assertion deriva ahora una única vez desde `input.prefix.toLowerCase()` los
`user_id` y subjects esperados, usando la misma regla de la creación. Exige
exactamente las dos filas del run con clínica, provider `lab029_runtime`, subject,
rol `veterinario` y estado `activo` correctos. Filas históricas adicionales no
afectan la validación porque solo se cuentan los dos `user_id` esperados.

No se modificaron los nodos que crean usuarios, la Data Table ni el workflow
Interno. Se modificaron el generador del Verificador, sus mocks y
`private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_verificador_runtime.json`.
Actualizar en n8n únicamente `LAB029_TEST_20260910A Verificador runtime` (id
`Sm1GvgWz1X7BOqh2`) y publicarlo nuevamente si queda inactivo.

Para repetir Interno sobre el run D:

```bash
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_IDENTITY_PROVIDER="lab029_runtime"; export LAB029_IDENTITY_SUBJECT_A="lab029_test_20260914d_subject_a"; export LAB029_IDENTITY_SUBJECT_B="lab029_test_20260914d_subject_b"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=internal --summary'
```

### Corrección de la assertion P-02 Público

P-02 producía un falso negativo porque exigía simultáneamente ausencia del dato
de Clínica A y recuperación positiva del marcador `B-<run_id>`. La respuesta
real de Clínica B fue segura y no incluyó `martes`, `15:29` ni contenido material
del documento A, pero falló al no recuperar el contenido propio B.

P-02 mide ahora exclusivamente aislamiento: descuenta de la respuesta el texto
literal de la pregunta y falla si encuentra `martes`, `15:29`, el contenido
material completo del fixture A o sus frases distintivas `Clínica A atiende` y
`atiende consultas de prueba`. Una respuesta sin información, la repetición del
identificador general del run y el contenido propio B no se consideran fuga.

Queda como pendiente funcional separado la recuperación positiva del contenido
propio de Clínica B. No se resolvió ni se ocultó en esta corrección y no se
modificó el workflow Público. Se validaron respuestas seguras, repetición de la
pregunta, cada marcador A, contenido A completo/parcial y contenido B.

Para repetir la fase Pública sobre el run D, copiar la versión actual de
`scripts/lab029/ejecutar_runtime_lab029.mjs` a
`/tmp/lab029/ejecutar_runtime_lab029.mjs` dentro de n8n y ejecutar:

```bash
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=public --summary'
```

## Corrección definitiva `access_level` del RAG interno (2026-09-15)

- Causa raíz: en n8n 2.29.8, el Search Filter del nodo Vector Store Qdrant falla con `fetch failed` al representar varios valores permitidos de `metadata.access_level`, tanto mediante `match.any` dinámico como mediante `should` con varios `match.value`. La búsqueda funciona con los demás filtros y con un valor literal único.
- Solución: `Buscar conocimiento RAG interno` conserva en Qdrant los filtros de `clinic_id`, `visibility=internal`, `status=active` y `version_id` activo. Inmediatamente después de recuperar y antes de construir contexto o llegar a Luna/IA, `Consolidar contexto RAG interno` filtra determinísticamente cada candidato y solo conserva aquellos cuyo `document.metadata.access_level` pertenece a `niveles_acceso_permitidos`.
- La jerarquía se conserva: recepción admite `recepcion`; veterinario admite `recepcion` y `veterinario`. Un nivel ajeno se descarta. Si todos los candidatos se descartan, `rag_contexto_disponible=false` conduce a la ruta existente sin información autorizada.
- Archivos funcionales modificados: `scripts/lab029/generar_workflows_lab029.mjs`, `scripts/lab029/validar_lab029.mjs`, `scripts/lab029/probar_runtime_lab029.mjs`, `n8n/workflows/comercial/lab029_interno_rag_persistente.json` y `private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_interno.json`.
- Validación local: runtime mocks PASS 81; validador PASS 1385 y Management 12/12; lógica PASS 26; `git diff --check` PASS; LAB-021 a LAB-028 intactos según el validador.
- Aplicación: actualizar en n8n únicamente `LAB029_TEST_20260910A Interno` (ID `IXVnpodoR6wu7iSC`) usando `private-storage/lab029/runtime/LAB029_TEST_20260910A/workflow_interno.json` y volver a publicarlo/activarlo si la actualización lo deja inactivo.
- Repetición runtime (I-01 se ejecuta primero):

```sh
cd /opt/vetatiende-ab && sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_IDENTITY_PROVIDER="lab029_runtime"; export LAB029_IDENTITY_SUBJECT_A="lab029_test_20260914d_subject_a"; export LAB029_IDENTITY_SUBJECT_B="lab029_test_20260914d_subject_b"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=internal --summary'
```

## Estado vigente tras corrección I-03 — 2026-09-16

### Versiones y conectividad

- n8n y task-runners se actualizaron de 2.29.8 a 2.39.5. Qdrant permanece en 1.19.0; el cliente Qdrant incluido en n8n 2.39.5 es 1.19.0. La incompatibilidad anterior entre n8n 2.29.8, su cliente Qdrant 1.16.2 y el servidor 1.19.0 quedó eliminada.
- Tras el upgrade, la credencial Aiven `Postgres account` devolvió `self-signed certificate in certificate chain`. SSL sigue en `Require`. `Ignore SSL Issues (Insecure)` se activó **temporalmente** y la conexión volvió a probarse correctamente. Esto no es la solución definitiva de producción: antes de cerrar LAB-029 hay que configurar la CA de Aiven, desactivar `Ignore SSL Issues (Insecure)` y comprobar nuevamente la conexión con validación TLS.

### Resultado Interno y diagnóstico de I-03

- Con PostgreSQL recuperado: I-01 **WARN**, pero responde funcionalmente y ya no presenta `fetch failed`; I-02 **PASS**; I-03 **FAIL** inicial; I-04 **PASS**; I-05 **FAIL** derivado de I-03.
- I-03 preguntaba `Pregunta inexistente ${manifest.prefix}_NO_MATCH`. El `manifest.prefix` también aparecía literalmente en el fixture interno; Qdrant recuperaba ese documento con score aproximado **0.6975**. La consulta manual ajena a los fixtures —«¿Cuál es el número de serie del extintor instalado en la bodega norte?»— recuperó un candidato con score aproximado **0.4223**, pero produjo la respuesta final segura: «No encontré información interna suficiente para responder con seguridad. El caso requiere revisión humana.» El defecto estaba en el diseño del test I-03; el workflow Interno respondió correctamente. No se añadió umbral de similitud ni se modificaron Qdrant, filtros o workflows.
- La corrección afecta únicamente `scripts/lab029/ejecutar_runtime_lab029.mjs` y `scripts/lab029/probar_runtime_lab029.mjs`: I-03 usa ahora esa pregunta estable, sin `manifest.prefix`, `run_id`, clínica, documento ni identificadores `LAB029_TEST`; conserva la assertion `/no encontr|revisión humana|revision humana/`.
- Validación local: **82** pruebas runtime PASS, validador LAB-029 **1385** PASS, contrato Management **12/12** PASS y `git diff --check` PASS. No hubo commit ni push.

### Reanudación exacta

1. Copiar el `scripts/lab029/ejecutar_runtime_lab029.mjs` actualizado al proyecto de E2 en `/home/ubuntu/VetAtiendeAI/scripts/lab029/ejecutar_runtime_lab029.mjs`; desde E2, copiarlo al contenedor n8n en `/tmp/lab029/ejecutar_runtime_lab029.mjs` (el runtime actual ejecuta Node dentro de ese contenedor).
2. Respaldar primero el manifest de E2: el runner reemplaza `tests.internal` incluso al ejecutar un caso aislado. Con el runner corregido, `--phase=internal --case=I-03` ejecuta únicamente I-03. No repetir I-01/I-02 salvo regresión.
3. `--from=I-03` sigue sin estar implementado (`--from` solo admite Management). La ejecución real previa ya registró I-03, I-04 e I-05 en PASS dentro de una misma invocación; el resultado de I-05 es válido para esa corrida, aunque `--case=I-03` no aisló los casos como se pretendía. No usar `--case=I-05` como sustituto de la comprobación conjunta, porque su assertion mira los resultados de la misma invocación.

Comando E2 para la prueba aislada I-03, una vez copiado el runner actualizado al proyecto de E2:

```bash
cd /opt/vetatiende-ab && sudo docker cp /home/ubuntu/VetAtiendeAI/scripts/lab029/ejecutar_runtime_lab029.mjs "$(sudo docker compose ps -q n8n):/tmp/lab029/ejecutar_runtime_lab029.mjs" && sudo docker compose exec -T --user 0 n8n sh -lc 'cp -p /tmp/LAB029_TEST_20260914D/manifest.json /tmp/LAB029_TEST_20260914D/manifest.before-i03.json && export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_IDENTITY_PROVIDER="lab029_runtime"; export LAB029_IDENTITY_SUBJECT_A="lab029_test_20260914d_subject_a"; export LAB029_IDENTITY_SUBJECT_B="lab029_test_20260914d_subject_b"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=internal --case=I-03 --summary'
```

### Aislamiento real de `--case` — 2026-09-16

En E2, la invocación `--phase=internal --case=I-03` ejecutó I-01 a I-05 porque la rama Interno llamaba a `run()` sin aplicar `selected(id)`. El resultado real fue I-01 WARN, I-02 WARN, I-03 PASS, I-04 PASS e I-05 PASS: **cero FAIL**. La pregunta corregida de I-03 quedó validada funcionalmente; I-04 e I-05 también pasaron. Los WARN de I-01/I-02 permanecen registrados como tales.

Se corrigió únicamente `scripts/lab029/ejecutar_runtime_lab029.mjs`: `run()` omite ahora los IDs no seleccionados. `scripts/lab029/probar_runtime_lab029.mjs` comprueba que `--case` ejecute exactamente un caso y una solicitud HTTP en Interno, Público y Persistencia. Management conserva sus guards existentes, `--from` y la incompatibilidad entre `--case` y `--from`. No cambiaron la lógica funcional de I-01 a I-05, los criterios PASS/WARN/FAIL ni los workflows.

Validación local posterior: **85** pruebas runtime PASS; validador LAB-029 **1385** PASS y contrato Management **12/12**; `git diff --check` PASS. Sin commit ni push. Antes de repetir un caso aislado en E2, copiar el runner actualizado a `/tmp/lab029/ejecutar_runtime_lab029.mjs`; el manifest del run conserva la evidencia real previa hasta que una nueva ejecución de la fase reemplace `tests.internal`, por lo que debe respaldarse primero.

### Falso negativo PS-01/I-01 tras recrear n8n — 2026-09-16

La consulta manual equivalente después del reinicio devolvió HTTP 200, contenido del protocolo interno 20260914D y `data.fuentes=["LAB029_TEST_20260914D_DOC_INTERNAL_A"]`, sin requerir revisión humana. La assertion PS-01/I-01 falló porque comparaba `protocolo interno 20260914D` con un espacio ASCII literal, mientras la respuesta usaba whitespace Unicode entre `interno` y `20260914D`. Es evidencia de recuperación persistente; el FAIL fue del runner, no del workflow ni de Qdrant.

En `scripts/lab029/ejecutar_runtime_lab029.mjs`, solo PS-01/I-01 normaliza el texto de `message` con el helper existente `normalizeText` y mantiene la exigencia de `protocolo interno <run_id>`. Además exige que `data.fuentes` sea un array que contenga exactamente `manifest.ids.document_internal_a`. Una respuesta sin dato o sin la fuente correcta sigue siendo FAIL. I-01, workflows, PostgreSQL, Qdrant e infraestructura no cambiaron.

`scripts/lab029/probar_runtime_lab029.mjs` cubre espacio ASCII, narrow no-break space, no-break space, fuente incorrecta/ausente y dato ausente. Validación local: **91** pruebas runtime PASS; validador LAB-029 **1385** PASS, contrato Management **12/12**; `git diff --check` PASS. Copiar el runner actualizado a E2 antes de repetir PS-01/I-01. **PS-01/STATE no se investigó en esta corrección.** Sin commit ni push.

### Baseline histórico de PS-01/STATE y persistencia del manifest — 2026-09-16

La ejecución histórica real del Verificador en G-09 para `LAB029_TEST_20260914D`, **antes** de recrear n8n, registró cinco filas PostgreSQL, un evento de cada tipo (`staged`, `validated`, `activated`, `no_changes`, `failed`, `rollback`) y el fingerprint completo. PS-01/STATE, **después** de recrear n8n, devolvió el mismo fingerprint exacto y las mismas cinco tuplas document/version/status/content_hash. Esto demuestra persistencia PostgreSQL; el FAIL `fingerprint_postgres_persistente` se debió exclusivamente a que el manifest restaurado contenía `persistence_baseline: null`.

`verificar_estado_runtime_lab029.mjs` sí guarda el baseline en el manifest cuando pasa G-09, pero aquella copia residía en `/tmp` del contenedor. No se copió al almacenamiento del host antes de recrear n8n. La copia local `private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json` aún tiene baseline `null`; **no contiene el fingerprint histórico exacto**, por lo que no se lo rellenó ni se ejecutó G-09 de nuevo.

Para próximas recreaciones, respaldar **todo el manifest actualizado** desde n8n al host justo después de G-09 y antes de recrear el contenedor. Este comando se ejecuta en E2; si el baseline falta, detener el reinicio:

```bash
cd /opt/vetatiende-ab
sudo docker cp "$(sudo docker compose ps -q n8n):/tmp/LAB029_TEST_20260914D/manifest.json" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json
sudo chown "$(id -u):$(id -g)" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json
sudo docker run --rm -v /home/ubuntu/VetAtiendeAI:/workspace:ro -w /workspace node:20-alpine node -e 'const m=require("./private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json");if(!m.persistence_baseline?.fingerprint)process.exit(1);console.log("PASS baseline G-09 persistido en host")'
```

Para rescatar **solo** el run D ya reiniciado, obtener de las ejecuciones históricas de n8n la respuesta contractual completa de G-09 y la de PS-01/STATE, con sus `execution_id` y tiempos observados. Guardar un archivo privado (fuera de Git) en `private-storage/lab029/runtime/LAB029_TEST_20260914D/g09-persistence-evidence.json` con esta estructura, copiando literalmente el fingerprint y las assertions de cada ejecución:

```json
{
  "prefix": "LAB029_TEST_20260914D",
  "restarted_at": "<instante real de recreación, ISO 8601>",
  "g09": {
    "execution_id": "<ID real G-09>",
    "observed_at": "<instante real anterior al reinicio, ISO 8601>",
    "checkpoint": "g09",
    "ok": true,
    "assertions": [{"name": "<assertion real aprobada>", "ok": true}],
    "summary": {"postgres_rows": 5, "event_counts": {"staged": 1, "validated": 1, "activated": 1, "no_changes": 1, "failed": 1, "rollback": 1}, "fingerprint": "<cadena JSON exacta de G-09>"}
  },
  "after_restart": {
    "execution_id": "<ID real PS-01/STATE>",
    "observed_at": "<instante real posterior al reinicio, ISO 8601>",
    "checkpoint": "persistence",
    "ok": false,
    "assertions": [{"name": "fingerprint_postgres_persistente", "ok": false}],
    "summary": {"postgres_rows": 5, "fingerprint": "<cadena JSON exacta posterior>"}
  }
}
```

Las cadenas de ejemplo entre `<...>` **no son evidencia**: reemplazarlas con los valores observados antes de ejecutar el siguiente paso. Copiar el `verificar_estado_runtime_lab029.mjs` actualizado al proyecto de E2. Respaldar el manifest del host, y ejecutar la rehidratación **sin contactar servicios**:

```bash
cd /home/ubuntu/VetAtiendeAI
cp -p private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.before-g09-rehydration.json
sudo docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/workspace" -w /workspace node:20-alpine node scripts/lab029/verificar_estado_runtime_lab029.mjs --manifest=private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json --rehydrate-g09-evidence=private-storage/lab029/runtime/LAB029_TEST_20260914D/g09-persistence-evidence.json
```

La rehidratación rechaza otro run, ejecución G-09 fallida, eventos incompletos, orden temporal imposible, IDs/hashes ajenos al run, cinco filas incorrectas y fingerprints distintos. Es idempotente si el baseline ya coincide; nunca toma un snapshot posterior como baseline. Tras PASS, copiar el manifest persistente al contenedor y ejecutar **solo** PS-01/STATE; al terminar, devolver también el manifest actualizado al host:

```bash
cd /opt/vetatiende-ab
sudo docker cp /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json "$(sudo docker compose ps -q n8n):/tmp/LAB029_TEST_20260914D/manifest.json"
sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_IDENTITY_PROVIDER="lab029_runtime"; export LAB029_IDENTITY_SUBJECT_A="lab029_test_20260914d_subject_a"; export LAB029_IDENTITY_SUBJECT_B="lab029_test_20260914d_subject_b"; export LAB029_PS01_NO_REBUILD_EVIDENCE="CONFIRMED_NO_REBUILD"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --phase=persistence --case=PS-01/STATE --summary'
sudo docker cp "$(sudo docker compose ps -q n8n):/tmp/LAB029_TEST_20260914D/manifest.json" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json
sudo chown "$(id -u):$(id -g)" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json
```

No avanzar a cleanup hasta validar la evidencia y PS-01/STATE. El fingerprint exacto y los IDs de ejecución históricos todavía deben copiarse desde n8n; Codex no los inventó ni ejecutó runtime remoto.

### Cleanup final del run D — preparación y bloqueo de acceso

El cleanup de `LAB029_TEST_20260914D` **no se ejecutó**. La comprobación SSH de solo lectura a `ubuntu@10.0.0.97` agotó el tiempo de conexión; no hay evidencia actual de PRE-CHECK, CLEANUP ni POST-CHECK en E2. El manifest local `private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json` sigue en estado `prepared` y es anterior al runtime; no debe usarse como prueba del estado actual ni sustituir la copia persistente de E2. Los residuos reales de PostgreSQL, Qdrant, Data Tables y archivos temporales siguen sin cuantificar. No se repitieron Management, Público, Interno ni Persistencia.

La causa concreta del bloqueo operativo es que el script original requería `LAB029_POSTGRES_URI` y `LAB029_QDRANT_API_KEY`, ausentes en E2, aunque n8n sí tiene las credenciales. Además, llamaba `cleanup_identities` **antes** de comprobarlas y borraba puntos por clínica sin inventario exacto ni POST-CHECK. Se sustituyó esa ruta por un orquestador fail-closed: requiere un adaptador con `inspect` y `removeVerified`, valida todas las categorías del inventario contra el manifest, guarda evidencia sanitizada antes del primer borrado y exige un segundo inventario vacío antes de marcar `cleaned`. El validador rechaza clínicas, documentos, versiones, eventos, puntos, usuarios, permisos, auditorías y archivos runtime ajenos. **Todavía falta el adaptador de E2 que use las credenciales existentes de n8n para producir ese inventario y borrar únicamente los IDs verificados; el script se niega a ejecutarse sin él. No ejecutarlo en E2 aún.** Tampoco debe copiarse una credencial desde n8n o desactivar validaciones TLS para sortear el bloqueo.

Archivos modificados o creados en este bloque: `scripts/lab029/limpiar_runtime_lab029.mjs`, `scripts/lab029/validar_inventario_cleanup_lab029.mjs`, `scripts/lab029/crear_workflow_precheck_cleanup_lab029.mjs`, `scripts/lab029/ejecutar_precheck_cleanup_lab029.mjs`, `scripts/lab029/probar_runtime_lab029.mjs`, el export temporal `workflow_cleanup_precheck.json` y este HANDOFF. Validación local: pruebas runtime **104 PASS**, validador LAB-029 **1385 PASS** (contrato Management **12/12 PASS**) y `git diff --check` PASS. Los mocks demuestran STOP ante datos ajenos y que `cleaned` exige POST-CHECK con cero residuos. Los resultados de PRE-CHECK, CLEANUP y POST-CHECK **reales** permanecen pendientes, no PASS; no se conoce un inventario de residuos restantes.

Para retomar este mismo bloque, se necesita acceso operativo a E2 o la ejecución supervisada allí de un mecanismo de cleanup que use las credenciales existentes de n8n. Antes de cualquier borrado, ese mecanismo debe enumerar y cotejar las clínicas, documentos, versiones, eventos, puntos Qdrant, usuarios, permisos y filas temporales de Data Tables contra los IDs exactos del manifest actualizado del run D; debe detenerse si aparece un dato ajeno. Después debe borrar únicamente los elementos verificados y demostrar cero residuos en un POST-CHECK. Conservar el manifest actualizado y un resumen sanitizado de las tres etapas en almacenamiento persistente del host. Solo si ese cleanup queda PASS, el siguiente bloque de LAB-029 será: validadores finales; auditoría de mantenibilidad del workflow Público y validación multi-clínica final; README y HANDOFF finales; `git diff --check`; un único commit limpio y push de `mvp-comercial`. Este bloque no hizo commit ni push.

Se preparó la primera etapa real, **PRE-CHECK de solo lectura**, para ejecutarla antes de diseñar el borrado exacto. `crear_workflow_precheck_cleanup_lab029.mjs` genera `private-storage/lab029/runtime/LAB029_TEST_20260914D/workflow_cleanup_precheck.json`. Usa las credenciales n8n existentes de PostgreSQL, Qdrant y Header Auth; consulta PostgreSQL, las dos colecciones compartidas y las Data Tables de usuarios, permisos y auditoría. Qdrant se pagina hasta 256 puntos por clínica/colección y se detiene si hay continuación; auditoría se detiene si llega al límite conservador de 1000 filas. El export no contiene nodos de borrado. `ejecutar_precheck_cleanup_lab029.mjs` añade el inventario de archivos del directorio runtime, valida todos los IDs y guarda `cleanup_precheck_snapshot.json` en privado. Hasta ejecutar este workflow en E2, **PRE-CHECK real sigue pendiente**.

Para esa ejecución, importar y publicar **solo** `workflow_cleanup_precheck.json` en n8n. Copiar a E2 `ejecutar_precheck_cleanup_lab029.mjs` y `validar_inventario_cleanup_lab029.mjs`; dentro del contenedor se necesitan ambos en `/tmp/lab029/`. El generador queda en el repositorio local para reproducir el export. Ejecutar el runner con `LAB029_N8N_WEBHOOK_BASE_URL=http://127.0.0.1:5678`, Header Auth existente y el manifest actualizado de `/tmp/LAB029_TEST_20260914D/manifest.json`. Copiar después el snapshot de `/tmp` al directorio privado persistente del host. No ejecutar CLEANUP hasta revisar que el snapshot es completo y seguro. Validación local de esta preparación: **104 mocks PASS**, validador LAB-029 **1385 PASS**, contrato Management **12/12 PASS**; sin commit ni push.

Bloque E2 **solo PRE-CHECK**, después de sincronizar los dos scripts al proyecto de E2 e importar/publicar el export temporal en n8n:

```bash
set -euo pipefail
cd /opt/vetatiende-ab
n8n_id="$(sudo docker compose ps -q n8n)"
sudo docker cp /home/ubuntu/VetAtiendeAI/scripts/lab029/ejecutar_precheck_cleanup_lab029.mjs "$n8n_id:/tmp/lab029/ejecutar_precheck_cleanup_lab029.mjs"
sudo docker cp /home/ubuntu/VetAtiendeAI/scripts/lab029/validar_inventario_cleanup_lab029.mjs "$n8n_id:/tmp/lab029/validar_inventario_cleanup_lab029.mjs"
sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_REAL"; node /tmp/lab029/ejecutar_precheck_cleanup_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json'
host_run=/home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D
test ! -e "$host_run/cleanup_precheck_snapshot.json"
sudo docker cp "$n8n_id:/tmp/LAB029_TEST_20260914D/cleanup_precheck_snapshot.json" "$host_run/cleanup_precheck_snapshot.json"
sudo chown "$(id -u):$(id -g)" "$host_run/cleanup_precheck_snapshot.json"
```

El bloque falla sin borrar nada si falta el workflow, alguna credencial, un inventario completo o los IDs exactos. No ejecutar aún `limpiar_runtime_lab029.mjs`: el adaptador de borrado se preparará únicamente después de revisar el snapshot real.

### cleanup_execute y cleanup_postcheck del run D

El PRE-CHECK real de E2 quedó aprobado para `LAB029_TEST_20260914D`: PostgreSQL 2 clínicas, 3 documentos, 5 versiones y 16 eventos; Qdrant 15 puntos públicos y 1 interno; Data Tables 2 usuarios, 2 permisos y 46 auditorías; runtime 1 archivo temporal (`payloads.json`). El snapshot persistente es `private-storage/lab029/runtime/LAB029_TEST_20260914D/cleanup_precheck_snapshot.json`. Esta copia todavía debe estar presente en E2 al generar y ejecutar el cleanup; no se reconstruye ni se reemplaza.

`crear_workflow_cleanup_execute_lab029.mjs` lee ese snapshot, vuelve a validarlo contra el manifest y exige exactamente los contadores aprobados. Genera `workflow_cleanup_execute.json`, con el SHA-256 del snapshot embebido y borrados estáticos por los IDs exactos: 46 condiciones `audit_id`; dos permisos por clave compuesta; dos `user_id`; listas cerradas de 15 y 1 point IDs; y una operación PostgreSQL que verifica cantidades y borra, en orden FK, 16 eventos, 5 versiones, 3 documentos y 2 clínicas. Usa exclusivamente las credenciales existentes de n8n. No contiene URI, API key ni otro secreto.

`ejecutar_cleanup_runtime_lab029.mjs --mode=execute` repite el inventario mediante el workflow PRE-CHECK ya publicado y compara estructuralmente todo su contenido con el snapshot antes de llamar al webhook destructivo. Una diferencia, un ID adicional, un snapshot modificado, un contador distinto o una confirmación incorrecta detienen la operación. La respuesta se coteja con el sello y los contadores esperados; luego se guarda `cleanup_evidence.json` con PRE-CHECK PASS, `deleted_counts` sanitizados y POST-CHECK PENDING.

`--mode=postcheck` exige esa evidencia de ejecución, vuelve a consultar PostgreSQL, ambas colecciones Qdrant y las tres Data Tables mediante n8n, y solo acepta cero en todas las categorías. Después de ese PASS elimina exclusivamente `payloads.json`, conserva manifest, snapshot y evidencia, actualiza el manifest a `cleanup.status=PASS` y registra `remaining_counts`. No elimina archivos si queda cualquier residuo.

Validación local: **108 pruebas runtime PASS**, incluidas alteración del snapshot, ID adicional, lista cerrada de IDs, residuo individual y cero total. Validador LAB-029 **1385 PASS**, contrato Management **12/12 PASS** y `git diff --check` PASS. No se ejecutó cleanup remoto, commit ni push.

Para generar el export sellado en E2, ejecutar desde `/home/ubuntu/VetAtiendeAI`:

```bash
sudo docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/workspace" -w /workspace node:20-alpine node scripts/lab029/crear_workflow_cleanup_execute_lab029.mjs --manifest=private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json --snapshot=private-storage/lab029/runtime/LAB029_TEST_20260914D/cleanup_precheck_snapshot.json
```

Importar y publicar en n8n **solo** `private-storage/lab029/runtime/LAB029_TEST_20260914D/workflow_cleanup_execute.json`. El workflow PRE-CHECK ya publicado permanece necesario para la comparación previa y el POST-CHECK.

Comando E2 para ejecutar únicamente `cleanup_execute`, después de importar/publicar ese export:

```bash
set -euo pipefail
cd /opt/vetatiende-ab
n8n_id="$(sudo docker compose ps -q n8n)"
sudo docker cp /home/ubuntu/VetAtiendeAI/scripts/lab029/ejecutar_cleanup_runtime_lab029.mjs "$n8n_id:/tmp/lab029/ejecutar_cleanup_runtime_lab029.mjs"
sudo docker cp /home/ubuntu/VetAtiendeAI/scripts/lab029/validar_inventario_cleanup_lab029.mjs "$n8n_id:/tmp/lab029/validar_inventario_cleanup_lab029.mjs"
sudo docker cp /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/cleanup_precheck_snapshot.json "$n8n_id:/tmp/LAB029_TEST_20260914D/cleanup_precheck_snapshot.json"
sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_CLEANUP"; node /tmp/lab029/ejecutar_cleanup_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --snapshot=/tmp/LAB029_TEST_20260914D/cleanup_precheck_snapshot.json --mode=execute'
sudo docker cp "$n8n_id:/tmp/LAB029_TEST_20260914D/cleanup_evidence.json" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/cleanup_evidence.json
sudo chown "$(id -u):$(id -g)" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/cleanup_evidence.json
```

Comando E2 separado para `cleanup_postcheck`; ejecutarlo solo después de que el anterior devuelva `execute_complete`:

```bash
set -euo pipefail
cd /opt/vetatiende-ab
n8n_id="$(sudo docker compose ps -q n8n)"
sudo docker compose exec -T --user 0 n8n sh -lc 'export LAB029_N8N_WEBHOOK_BASE_URL="http://127.0.0.1:5678"; export LAB029_INTERNAL_HEADER_NAME="X-VetAtiende-Internal-Key"; export LAB029_INTERNAL_HEADER_VALUE="$VETATIENDE_INTERNAL_KEY"; export LAB029_RUNTIME_CONFIRM="LAB029_RUNTIME_CLEANUP"; node /tmp/lab029/ejecutar_cleanup_runtime_lab029.mjs --manifest=/tmp/LAB029_TEST_20260914D/manifest.json --snapshot=/tmp/LAB029_TEST_20260914D/cleanup_precheck_snapshot.json --mode=postcheck'
sudo docker cp "$n8n_id:/tmp/LAB029_TEST_20260914D/cleanup_evidence.json" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/cleanup_evidence.json
sudo docker cp "$n8n_id:/tmp/LAB029_TEST_20260914D/manifest.json" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json
sudo chown "$(id -u):$(id -g)" /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/cleanup_evidence.json /home/ubuntu/VetAtiendeAI/private-storage/lab029/runtime/LAB029_TEST_20260914D/manifest.json
```

## Estado vigente tras validación final del repositorio — 2026-09-21

Esta sección registra el estado final vigente y sustituye el estado operativo pendiente descrito en las secciones cronológicas anteriores, que se conservan como historial de la ejecución.

### Cleanup real del run D

El cleanup del run `LAB029_TEST_20260914D` quedó cerrado y verificado en E2:

- `cleanup_execute`: `PASS`.
- `cleanup_postcheck`: `PASS`.
- residuos finales: `0`.
- PostgreSQL: `clinics = 0`, `documents = 0`, `versions = 0`, `events = 0`.
- Qdrant: `vetatiende_publico = 0`, `vetatiende_interno = 0`.
- Data Tables: `users = 0`, `permissions = 0`, `audits = 0`.
- archivos temporales: `0`.
- `payloads_deleted = true`.

Las evidencias finales persistidas en E2 son:

- `cleanup_precheck_snapshot.json`;
- `cleanup_evidence.json`;
- `manifest.json`, con `cleanup.status = PASS`.

### Validación final LAB-029

- Runtime: `PASS`, con 108 pruebas runtime locales LAB-029.
- Validador LAB-029: `PASS`, con 1385 checks.
- Contrato Management: `12/12 PASS`.
- Integridad histórica LAB-028: confirmada.
- Generación reproducible: `PASS`, con 3 workflows generados.
- Lógica documental: `PASS`, con 26 pruebas.
- Prueba PostgreSQL: no se repitió porque ya constaba aprobada y no existe un ejecutor local adicional definido.
- `git diff --check`: `PASS`; solo apareció la advertencia informativa LF→CRLF de `.gitignore`.
- Primer fallo real: ninguno.
- Estado general: `PASS`.

LAB-021 a LAB-028 permanecen intactos. El validador confirmó sus hashes históricos y `git status` no mostró modificaciones en esos LAB.

No se detectaron archivos temporales o no deseados que deban entrar al futuro commit. `private-storage/` está correctamente ignorado. La copia privada local conserva un `payloads.json` antiguo y todavía no contiene el snapshot ni la evidencia final provenientes de E2; estos archivos no entran al commit y no se realizó ninguna eliminación destructiva durante esta validación.

La validación final no modificó contenido. El generador obligatorio fue ejecutado y los exports permanecieron reproducibles. No se realizó commit ni push.

### Continuidad de cierre

El siguiente paso es la auditoría final de mantenibilidad del workflow Público. Después corresponde:

1. validación multi-clínica final;
2. actualización final de la documentación LAB-029;
3. revisión de `git diff`;
4. `git diff --check` final;
5. un único commit limpio;
6. push de `mvp-comercial`.

## Auditoría final de mantenibilidad del workflow Público — 2026-09-21

Se auditó estáticamente `n8n/workflows/comercial/lab029_publico_rag_persistente.json`, sin repetir pruebas funcionales, runtime, validador ni cleanup. El workflow contiene 309 nodos: 105 Code, 52 IF, 62 Data Table, 33 Respond to Webhook, 22 Google Calendar y 1 Wait. No hay nombres de nodo duplicados. Desde el webhook son alcanzables 300 nodos; cuatro subnodos AI son auxiliares y los cinco nodos restantes corresponden al bloque manual e intencional de inicialización de tablas LAB-026.

La auditoría de mantenibilidad termina **PASS**, sin hallazgos bloqueantes. Las responsabilidades principales pueden seguirse por nombres y tramos: recepción y normalización, validaciones, agenda/peluquería/urgencias heredadas, consulta documental PostgreSQL, recuperación Qdrant, construcción de respuesta y rutas de error. El tramo RAG LAB-029 está acotado y separado: prepara la consulta, lee por `clinic_id` las versiones públicas activas, consolida los IDs, filtra Qdrant por clínica, `visibility=public`, `status=active` y `version_id`, y entrega la herramienta al agente público. PostgreSQL, Qdrant, Cohere, Groq, Calendar y Telegram usan credenciales referenciadas; no se encontraron secretos ni URLs de servicio incrustados. La única variable de entorno detectada es `VETATIENDE_TELEGRAM_ALERT_CHAT_ID`.

Se registra un hallazgo **IMPORTANTE** que debe resolverse en el siguiente bloque de validación multi-clínica antes del cierre: el export final conserva cinco referencias a `clinica_piloto_001`. Las de impacto directo están en `Normalizar entrada comercial`, que usa esa clínica como valor predeterminado; `Clinic_id permitido`, que acepta únicamente ese ID; y `Cargar configuración peluquería`, cuya configuración declara esa clínica. También existen fallbacks defensivos en `Responder gestión cita LAB-026` y `Preparar revisión humana LAB-026`. El RAG documental ya mantiene el aislamiento correcto, pero estos hardcodes impiden considerar terminada la preparación multi-clínica del workflow completo y pueden atribuir una solicitud sin clínica o un contexto perdido a la clínica piloto. No se corrigieron durante esta auditoría.

Como deuda técnica aceptable queda el tamaño del workflow y de algunos Code nodes heredados. Los mayores son `Evaluar reglas deterministas urgencia` (26.310 caracteres, 1.155 líneas), `Generar alternativas agenda médica` (15.112 caracteres, 781 líneas), `Interpretar fecha y hora peluquería` (13.413 caracteres, 777 líneas), `Consolidar intención gestión cita LAB-026` (12.152 caracteres, 677 líneas) e `Interpretar fecha y hora agenda` (12.130 caracteres, 731 líneas). Esto aumenta el costo de diagnóstico y cambio, pero no constituye un bloqueo para el piloto porque las rutas están nombradas, los errores esperables tienen salidas explícitas y la funcionalidad heredada ya está validada. No se recomienda refactorizar esos bloques dentro de LAB-029.

No se detectó absorción nueva e indebida de responsabilidades históricas: el export conserva las capacidades acumuladas de LAB-021 a LAB-028 y LAB-029 modifica el tramo documental público. Los históricos permanecen intactos. No se modificó ningún archivo de código, workflow o documentación adicional; únicamente se actualizó este HANDOFF. No se realizó commit ni push.

El siguiente paso real es la validación multi-clínica final, incluyendo la eliminación o externalización controlada de las cinco dependencias de `clinica_piloto_001` en el workflow final, sin modificar los workflows históricos.

## Validación multi-clínica final del workflow Público — 2026-09-21

La validación multi-clínica final terminó **PASS**. La causa del hallazgo era que el workflow acumulado heredaba cinco referencias funcionales a `clinica_piloto_001`: valor predeterminado en `Normalizar entrada comercial`, autorización exclusiva en `Clinic_id permitido`, `clinic_id` fijo en `Cargar configuración peluquería` y fallbacks defensivos en `Responder gestión cita LAB-026` y `Preparar revisión humana LAB-026`.

La corrección se aplicó en la fuente canónica `scripts/lab029/generar_workflows_lab029.mjs` y se regeneró el export Público final. `Normalizar entrada comercial` conserva ahora únicamente el `clinic_id` explícito, normalizado con `trim`, y produce cadena vacía cuando falta. El nuevo nodo `Validar clínica pública PostgreSQL LAB-029` exige que el ID cumpla el mismo formato del esquema (`^[a-z0-9][a-z0-9_-]{2,63}$`) y que exista con estado `active` en `vetatiende_documental.clinics`. El nodo preserva salida ante cero filas o error, pero `Restaurar contexto clínica pública LAB-029` convierte cualquier resultado distinto de `true` en denegación; `Clinic_id permitido` solo continúa con el booleano estricto `true`. Por tanto, ausencia, formato inválido, clínica inexistente y fallo de PostgreSQL terminan de forma cerrada en la respuesta de clínica no permitida.

`clinica_piloto_001` sigue siendo válida únicamente cuando llega explícitamente y existe activa en PostgreSQL. No existe lista hardcodeada de clínicas ni dependencia de IDs `LAB029_TEST`. Las clínicas A y B conservan su propio ID desde la entrada hasta la consulta de versiones activas y el filtro Qdrant. La consulta PostgreSQL usa `d.clinic_id=$1`; Qdrant mantiene filtros por `metadata.clinic_id`, `visibility=public`, `status=active` y los `version_id` activos de esa misma clínica.

`Cargar configuración peluquería` conserva la configuración heredada y ahora asigna dinámicamente su `clinic_id` desde el contexto ya autorizado. Los dos fallbacks LAB-026 dejaron de atribuir contexto ausente a la clínica piloto y usan cadena vacía, evitando contaminación silenciosa entre clínicas. No se modificó el workflow histórico LAB-026 ni ningún export LAB-021 a LAB-028. El export Público final contiene **cero** referencias a `clinica_piloto_001`; no queda ninguna referencia residual que requiera justificación.

Validación local:

- generación reproducible: **PASS**, 3 workflows LAB-029 generados;
- runtime local: **109 PASS**, incluidas clínica A, clínica B, aislamiento A/B, clínica ausente, autorización denegada, clínica piloto explícita y configuración de peluquería ligada al contexto;
- validador LAB-029: **1395 PASS**;
- contrato Management: **12/12 PASS**;
- integridad histórica LAB-028: confirmada por hash;
- búsqueda de `clinica_piloto_001` en el export Público final: cero resultados;
- `git diff --check`: **PASS**, con la advertencia informativa LF→CRLF ya conocida de `.gitignore`.

Archivos modificados en este bloque: `scripts/lab029/generar_workflows_lab029.mjs`, `scripts/lab029/probar_runtime_lab029.mjs`, `scripts/lab029/validar_lab029.mjs`, `n8n/workflows/comercial/lab029_publico_rag_persistente.json` y este HANDOFF. No se realizó commit ni push.

El siguiente paso es la actualización final de `README.md` y de la documentación de cierre LAB-029. Después corresponde revisar el diff completo, ejecutar `git diff --check` final y preparar un único commit limpio antes del push de `mvp-comercial`.

## Estado vigente de cierre documental — 2026-09-21

Esta sección es la fuente de verdad vigente para continuar el cierre de LAB-029. `README.md` fue actualizado para reflejar la arquitectura y la evidencia final, reemplazando el estado inicial de implementación y las listas de runtime pendiente.

Estado técnico final:

- PostgreSQL/Aiven es la fuente canónica de clínicas, documentos, versiones y eventos;
- Qdrant `1.19.0` conserva las colecciones persistentes compartidas `vetatiende_publico` y `vetatiende_interno` con aislamiento por `clinic_id`;
- n8n y task-runners están en `2.39.5`, con cliente Qdrant `1.19.0`;
- staging, validación, activación, `no_changes`, fallo, compensación y rollback están implementados y trazados;
- el control interno aplica identidad, clínica, rol, permiso y `access_level` antes de entregar contexto a la IA;
- TLS Aiven quedó resuelto mediante el CA dedicado y `infra/comercial/compose.e2.lab029-aiven-ca.override.yaml`, sin depender de `Ignore SSL Issues (Insecure)`;
- Persistencia terminó `PASS`; PS-01/STATE pasó en 9.222 s con el fingerprint histórico real de G-09 rehidratado y coincidente después de recrear n8n;
- Multi-clínica terminó `PASS`: el export Público final contiene cero referencias a `clinica_piloto_001`, exige una clínica activa en PostgreSQL y falla cerrado ante ausencia, formato inválido, clínica inexistente o error de autoridad;
- la auditoría de mantenibilidad del Público terminó `PASS`, sin hallazgos bloqueantes; el tamaño del workflow acumulado y sus Code nodes extensos heredados quedan como deuda técnica aceptada fuera del alcance de LAB-029.

Estado funcional final:

- Management: cerrado funcionalmente;
- Público: P-01 a P-04 `WARN`, P-05 `PASS`, sin `FAIL` funcionales bloqueantes;
- Interno: I-01 e I-02 `WARN`; I-03, I-04 e I-05 `PASS`; 0 `FAIL`;
- Persistencia: `PASS`;
- Cleanup del run `LAB029_TEST_20260914D`: `cleanup_execute PASS`, `cleanup_postcheck PASS` y cero residuos.

El cleanup eliminó exactamente 46 auditorías, 2 permisos, 2 usuarios, 16 eventos, 5 versiones, 3 documentos, 2 clínicas, 15 puntos públicos y 1 punto interno. El POST-CHECK confirmó cero clínicas, documentos, versiones, eventos, puntos públicos, puntos internos, usuarios, permisos, auditorías y archivos temporales; `payloads_deleted=true`. Las evidencias persistidas en E2 son `cleanup_precheck_snapshot.json`, `cleanup_evidence.json` y `manifest.json`, con `cleanup.status=PASS`.

Validación final vigente:

- runtime local: **109 PASS**;
- validador LAB-029: **1395 PASS**;
- contrato Management: **12/12 PASS**;
- lógica documental: **26 PASS**;
- generación reproducible: **3 workflows PASS**;
- búsqueda de `clinica_piloto_001` en el export Público: cero resultados;
- `git diff --check`: **PASS**, con la advertencia informativa LF→CRLF conocida de `.gitignore`;
- LAB-021 a LAB-028: intactos.

En esta actualización se modificaron únicamente `docs/comercial/lab029/README.md` y este HANDOFF. No se realizó commit ni push.

El único bloque pendiente es la revisión completa de Git: revisar el diff y los archivos que entrarán al commit, confirmar ausencia de secretos y temporales, ejecutar únicamente los validadores finales que el diff justifique, ejecutar `git diff --check` final y, después, crear un único commit limpio de LAB-029 y hacer push de `mvp-comercial`.

## Cierre Git preparado — commit único pendiente — 2026-09-21

La revisión final de Git terminó **PASS** antes del commit. El inventario contiene exclusivamente cambios de LAB-029 y su configuración reproducible. `private-storage/`, `.env`, documentos reales, manifests, payloads, snapshots, evidencias runtime, certificados y backups permanecen fuera del staging. El escaneo sanitizado no encontró claves privadas, certificados, tokens, API keys ni URIs con credenciales. El override de Aiven contiene únicamente el bind mount y `NODE_EXTRA_CA_CERTS`; el CA real no está versionado.

Archivos aprobados para el único commit:

- `.gitignore`;
- `docs/comercial/lab029/HANDOFF_CODEX.md`;
- `docs/comercial/lab029/README.md`;
- `infra/comercial/compose.e2.lab029-aiven-ca.override.yaml`;
- `n8n/workflows/comercial/lab029_gestion_rag_persistente.json`;
- `n8n/workflows/comercial/lab029_interno_rag_persistente.json`;
- `n8n/workflows/comercial/lab029_publico_rag_persistente.json`;
- `scripts/lab029/crear_workflow_cleanup_execute_lab029.mjs`;
- `scripts/lab029/crear_workflow_precheck_cleanup_lab029.mjs`;
- `scripts/lab029/crear_workflow_verificador_runtime_lab029.mjs`;
- `scripts/lab029/ejecutar_cleanup_runtime_lab029.mjs`;
- `scripts/lab029/ejecutar_precheck_cleanup_lab029.mjs`;
- `scripts/lab029/ejecutar_runtime_lab029.mjs`;
- `scripts/lab029/fixtures/cargar_fixtures_lab029.sql`;
- `scripts/lab029/fixtures/limpiar_fixtures_lab029.sql`;
- `scripts/lab029/generar_workflows_lab029.mjs`;
- `scripts/lab029/limpiar_runtime_lab029.mjs`;
- `scripts/lab029/logica_documental_lab029.mjs`;
- `scripts/lab029/migraciones/001_dominio_documental.sql`;
- `scripts/lab029/migraciones/002_activacion_rollback.sql`;
- `scripts/lab029/preparar_runtime_lab029.mjs`;
- `scripts/lab029/probar_logica_lab029.mjs`;
- `scripts/lab029/probar_postgres_lab029.sql`;
- `scripts/lab029/probar_runtime_lab029.mjs`;
- `scripts/lab029/validar_inventario_cleanup_lab029.mjs`;
- `scripts/lab029/validar_lab029.mjs`;
- `scripts/lab029/verificar_estado_runtime_lab029.mjs`;
- `scripts/lab029/verificar_runtime_lab029.mjs`.

Validación ejecutada sobre el contenido final:

- generación reproducible: **PASS**, 3 workflows;
- runtime local: **PASS**, 109 pruebas;
- validador LAB-029: **PASS**, 1395 checks;
- contrato Management: **PASS**, 12/12;
- lógica documental: **PASS**, 26 pruebas;
- `git diff --check`: **PASS**, con la única advertencia informativa LF→CRLF de `.gitignore`;
- referencias `clinica_piloto_001` en el export Público final: 0;
- LAB-021 a LAB-028: intactos por hash y por Git.

LAB-029 está listo para el commit único con el mensaje `feat(lab029): cerrar gestion documental persistente y multiclínica`. En este instante el commit y el push todavía están pendientes. El HANDOFF debe incluirse en el mismo staging y no modificarse después del commit para registrar su hash.
