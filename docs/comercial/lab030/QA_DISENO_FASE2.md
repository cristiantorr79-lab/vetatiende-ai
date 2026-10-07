# LAB-030 — Diseño QA para Fase 2

Fecha: 2026-09-22. Estado: diseño aprobado en Chat, pendiente de implementación.

## 1. Objetivo y alcance

Este documento define el modelo de pruebas de LAB-030 para QA integral y preparación para piloto real. Toma como base [QA_AUDITORIA_INICIAL.md](QA_AUDITORIA_INICIAL.md) y no implementa ni ejecuta pruebas.

La Fase 2 debe construir una batería pequeña y mantenible mediante reutilización y orquestación de validadores existentes. No debe convertir LAB-030 en una colección redundante de scripts ni reabrir LAB anteriores sin una regresión demostrable.

## 2. Modelo de pruebas

### SMOKE

Objetivo: comprobar rápidamente si VetAtiende está suficientemente sano para continuar con pruebas más profundas.

Debe ser corto, automático en todo lo posible, fail-fast y orientado a funciones críticas. Si falla una dependencia crítica inicial, la ejecución se detiene y no continúa con pruebas que dependan de ella. Un smoke no sustituye la regresión completa.

### REGRESIÓN DIRIGIDA

Objetivo: ejecutar únicamente las pruebas relacionadas con el componente que cambió y sus dependencias técnicas demostrables.

Ejemplos:

- cambio RAG: probar RAG, autorización, aislamiento y persistencia relacionados;
- cambio de agenda: probar reservas, Calendar, persistencia y gestión de citas afectada;
- cambio de urgencias: probar clasificación, prioridad, alertas, deduplicación y fallback seguro.

No se ejecutará toda la regresión si el alcance del cambio y su grafo de dependencias permiten una selección menor con evidencia suficiente. La selección y sus exclusiones deben quedar registradas.

### REGRESIÓN COMPLETA

Objetivo: validar transversalmente QA-01 a QA-08.

Se ejecutará principalmente:

- antes del piloto real;
- antes de incorporar una nueva clínica;
- después de cambios transversales importantes;
- antes de una versión comercial relevante.

## 3. Diseño preliminar del smoke

El smoke propuesto sigue este orden para detectar temprano fallos bloqueantes y evitar mutaciones innecesarias:

1. **Salud básica**
   - n8n responde;
   - los servicios necesarios están disponibles;
   - no existe un error evidente de configuración.
2. **Contrato público**
   - una petición simple es aceptada;
   - la respuesta contiene los campos esperados;
   - no expone información interna.
3. **RAG**
   - una consulta conocida devuelve una respuesta válida.
4. **Reserva**
   - un camino sano de agenda avanza correctamente.
5. **Gestión de cita**
   - una operación básica de cancelación o gestión entra por la ruta correcta.
6. **Urgencias**
   - un mensaje claramente urgente activa prioridad;
   - no continúa por RAG ni agenda normal.
7. **Multiclínica**
   - dos `clinic_id` no se mezclan;
   - una clínica inválida falla cerrado.
8. **Cleanup**
   - se eliminan únicamente los datos creados por QA;
   - el post-check queda limpio.
9. **Rendimiento**
   - se registra la duración de cada bloque y el tiempo total.

Objetivo operativo preliminar: completar el smoke idealmente en menos de 2–3 minutos en condiciones normales. Este objetivo es una referencia inicial que deberá medirse; no transforma una ejecución lenta en FAIL por sí solo hasta que se aprueben umbrales por bloque. El smoke conservará el mínimo de recorridos necesarios y no absorberá la regresión completa.

## 4. Diseño preliminar de regresión

| Bloque | Cobertura prevista |
|---|---|
| QA-01 — Salud técnica y contratos | Workflows, contratos público e interno, estructura, ausencia de secretos e invariantes |
| QA-02 — RAG y conocimiento | Público, interno, permisos, documentos activos y persistencia |
| QA-03 — Reservas | Agenda médica, peluquería, alternativas, conflictos y confirmación |
| QA-04 — Gestión de citas | Cancelación, reprogramación, idempotencia, fallos parciales y recuperación |
| QA-05 — Urgencias y seguridad funcional | Reglas deterministas, casos ambiguos, prioridad, alertas y fallback seguro |
| QA-06 — Operación interna y seguimiento | Autorización, tareas, pendientes, derivaciones, seguimientos y recordatorios |
| QA-07 — Multiclínica, aislamiento y persistencia | Aislamiento A/B, `clinic_id` inválido, fail-closed, persistencia y reinicio cuando corresponda |
| QA-08 — Piloto, rendimiento y regresión global | Integración transversal, tiempos, dependencias externas, evidencia operativa y criterio de preparación para piloto |

La regresión dirigida seleccionará de esta matriz los bloques y dependencias afectados. La regresión completa deberá cubrir los ocho bloques sin exigir que cada caso se ejecute más de una vez: una misma prueba integrada puede aportar evidencia a varias capacidades si sus oráculos quedan identificados.

## 5. Cleanup transversal

El cleanup transversal eliminará únicamente datos creados por las pruebas QA. Queda prohibido borrar por patrones amplios, aproximación, coincidencias parciales o supuestos no registrados.

Cada ejecución deberá usar identificadores inequívocos dentro de un espacio controlado, por ejemplo `LAB030_QA_...`, y registrar el ID exacto de cada recurso creado.

Flujo conceptual:

```text
crear dato QA
→ registrar ID exacto
→ ejecutar prueba
→ eliminar usando IDs registrados
→ verificar post-check
→ confirmar cero residuos esperados
```

El cleanup será fail-closed. Debe detener la eliminación y reportar cuando:

- aparezcan recursos inesperados;
- falten IDs esperados;
- exista una diferencia entre el inventario previsto y el real.

La implementación futura reutilizará conceptualmente la filosofía segura validada en LAB-029: inventario previo, comparación exacta, eliminación acotada y post-check. El resultado funcional de una prueba no será cierre completo mientras su cleanup obligatorio permanezca fallido o pendiente.

## 6. Modelo de evidencia QA

Cada prueba deberá registrar como mínimo:

- ID de prueba;
- fecha y hora;
- entorno;
- resultado;
- duración;
- capacidad validada;
- datos ficticios creados;
- cleanup realizado;
- resultado del cleanup;
- evidencia o referencia generada.

Los registros deben distinguir evidencia local, simulada, E2, manual y dependiente de servicios externos. No se guardarán logs gigantes en Git. Evidencias runtime pesadas o potencialmente sensibles permanecerán fuera de Git. En Git quedarán únicamente resúmenes y manifiestos pequeños cuando corresponda, sin secretos, credenciales, payloads sensibles ni datos reales.

## 7. Criterios PASS, WARN y FAIL

### PASS

La prueba cumple completamente lo esperado y existe evidencia suficiente para comprobarlo.

### WARN

La funcionalidad principal funciona, pero existe una limitación conocida, dependencia externa, rendimiento degradado no bloqueante, comprobación manual pendiente o condición aceptada que debe vigilarse.

WARN no bloquea automáticamente el piloto. Debe documentar causa, impacto, responsable o condición de seguimiento y aceptación cuando corresponda.

### FAIL

Existe un incumplimiento relevante de funcionalidad crítica, contrato, seguridad, aislamiento, persistencia, integridad, cleanup o comportamiento obligatorio.

Un FAIL crítico bloquea el piloto. La severidad debe derivarse del criterio obligatorio incumplido; no del número total de pruebas aprobadas.

## 8. Criterio global para piloto

### APTO PARA PILOTO

- 0 FAIL críticos;
- pruebas obligatorias ejecutadas;
- cleanup correcto;
- evidencias mínimas disponibles.

### APTO CON OBSERVACIONES

- 0 FAIL críticos;
- uno o más WARN aceptados y documentados;
- se mantienen cumplidas las pruebas obligatorias, el cleanup y las evidencias mínimas.

### NO APTO PARA PILOTO

- al menos 1 FAIL crítico.

No se usarán promedios ni conteos de PASS para compensar un FAIL crítico. Una prueba obligatoria no ejecutada no se registrará como PASS; deberá quedar identificada como pendiente o bloqueada y evaluarse antes de emitir el criterio global.

## 9. Arquitectura futura de scripts

Esta arquitectura es únicamente de diseño. No existe implementación todavía.

### `scripts/lab030/qa_smoke.mjs`

Objetivo: orquestar el smoke rápido con orden fail-fast, selección de funciones críticas, salida resumida y referencias de evidencia.

### `scripts/lab030/qa_regresion.mjs`

Objetivo: orquestar la regresión dirigida o completa sobre QA-01 a QA-08, con selección explícita del alcance y registro de exclusiones.

Ambos scripts deberán reutilizar validadores y pruebas existentes en lugar de duplicar lógica. La implementación priorizará:

- reutilización;
- orquestación;
- fail-fast;
- salida resumida;
- evidencia reproducible.

No se crearán scripts auxiliares nuevos sin una necesidad concreta que no pueda resolverse mediante los recursos inventariados.

## 10. Estado y próximo paso

El modelo SMOKE, REGRESIÓN DIRIGIDA y REGRESIÓN COMPLETA queda definido conceptualmente. También quedan definidos el cleanup transversal, el modelo mínimo de evidencia, los criterios PASS/WARN/FAIL y el criterio global APTO PARA PILOTO / APTO CON OBSERVACIONES / NO APTO PARA PILOTO.

No existe implementación todavía. La selección técnica de Tarea 3 queda registrada a continuación. La Tarea 4 permanece pendiente y no se inicia automáticamente.

## Selección técnica para qa_smoke.mjs

La selección usa el mínimo de piezas existentes que aporta valor al smoke. La clasificación se cuenta por **componente único**, aunque un componente aparezca en más de un bloque: **A = 1**, **B = 6**, **C = 9 candidatos relevantes descartados**.

- **A — REUTILIZAR DIRECTAMENTE:** puede invocarse prácticamente como está.
- **B — REUTILIZAR PARCIALMENTE:** aporta funciones, contratos, casos u oráculos, pero no conviene ejecutar el archivo completo dentro del smoke.
- **C — NO USAR EN SMOKE:** se reserva para regresión, soporte histórico o herramientas fuera del camino rápido.

| Bloque smoke | Componente existente (LAB) | Ruta | Clase | Futuro | Datos | Uso e idoneidad | Adaptación / cleanup |
|---|---|---|:---:|:---:|:---:|---|---|
| 1. Salud básica | Verificador de PostgreSQL y Qdrant (029) | `scripts/lab029/verificar_runtime_lab029.mjs` | A | E2 | NO | Invocable como está; una llamada cubre disponibilidad P/Q y configuración de colecciones. No valida n8n ni publicación. | Envolver resultado en fail-fast y tiempo; sin cleanup. |
| 2. Contrato público | Validador estructural/contratos (029) | `scripts/lab029/validar_lab029.mjs` | B | LOCAL | NO | Reutilizar únicamente invariantes de contrato público, sanitización, clínica y conexiones. El script completo ejecuta 1395 checks y genera workflows en memoria: demasiado pesado y acoplado para smoke. | Extraer/importar checks mínimos sin ejecutar el CLI completo; sin cleanup. |
| 2. Contrato público | Runner runtime por casos (029) | `scripts/lab029/ejecutar_runtime_lab029.mjs` | B | E2 | SÍ | Reutilizar llamada HTTP, validación de cuerpo, clasificación de resultado y selección por caso. No ejecutar toda la fase Público. | Caso mínimo LAB-030, endpoint/configuración explícitos, manifest ligero; registrar auditorías creadas para cleanup. |
| 3. RAG | Runner runtime por casos (029) | `scripts/lab029/ejecutar_runtime_lab029.mjs` | B | E2 | SÍ | Reutilizar un solo caso público conocido y su oráculo. Evitar Management/Interno/Persistencia completos. | Parametrizar consulta/expectativa/IDs LAB030; registrar auditoría y recursos creados. |
| 4. Reserva | Runner conversacional real (028) | `scripts/lab028/probar_runtime_real_lab028.mjs` | B | E2 | SÍ | Reutilizar motor de turnos, interpretación de respuesta, timeout y un camino sano médico. El runner completo incluye varios casos y avisos: demasiado amplio para smoke. | Exponer un único escenario, clínica/fechas/endpoints LAB030 y capturar `event_id`/cita exactos; cleanup Calendar + tablas/estado. |
| 5. Gestión de cita | Sin componente suficiente | — | — | E2 | SÍ | Los oráculos históricos están documentados, pero no existe una pieza vigente, pequeña e invocable para una cancelación básica sobre la cita del smoke. | Código mínimo nuevo: continuar con la cita del bloque 4, entrar por la ruta de cancelación, verificar Calendar/estado y registrar IDs; cleanup obligatorio. |
| 6. Urgencia prioritaria | Lógica y contrato de urgencia (027) | `scripts/lab027/probar_logica_lab027.mjs` | B | LOCAL | NO | Reutilizar parcialmente el contrato, IDs deterministas y oráculos de derivación/fallback como referencia ejecutable local. La suite completa de 245 checks no entra al smoke y no demuestra prioridad E2. | Importar solo funciones/oráculos necesarios; hace falta una llamada E2 mínima nueva y registrar alerta/episodio/tarea para cleanup. |
| 7. Multiclínica / fail-closed | Validador estructural/contratos (029) | `scripts/lab029/validar_lab029.mjs` | B | LOCAL | NO | Reutilizar checks mínimos de ausencia de fallback, autoridad clínica y filtros A/B. No invocar el validador completo. | Separar invariantes sobre export vigente, sin generación ni conteos históricos. |
| 7. Multiclínica / fail-closed | Runner runtime por casos (029) | `scripts/lab029/ejecutar_runtime_lab029.mjs` | B | E2 | SÍ | Reutilizar selección de un caso A/B y uno de clínica inválida. La fase completa y el reinicio pertenecen a regresión. | Manifest LAB030 y dos entradas mínimas; registrar cualquier auditoría/recurso generado. |
| 8. Cleanup | Validador de inventario/post-check (029) | `scripts/lab029/validar_inventario_cleanup_lab029.mjs` | B | LOCAL | NO | Reutilizar la semántica fail-closed, comparación exacta y post-check. Su esquema está ligado a LAB029 y no cubre Calendar/estados acumulados. | Generalizar en el orquestador al manifest LAB030; no ejecutar el módulo como cleanup autónomo. |
| 8. Cleanup | Orquestador por adaptador (029) | `scripts/lab029/limpiar_runtime_lab029.mjs` | B | E2 | SÍ | Reutilizar el flujo precheck → eliminación exacta → post-check → evidencia. No es invocable directamente: exige adaptador y contrato LAB029. | Adaptador transversal mínimo para IDs registrados de P/Q/Data Tables/Calendar; detener ante diferencias y conservar evidencia. |
| 9. Tiempos | Sin componente necesario | — | — | LOCAL/E2 | NO | El smoke solo requiere medir cada bloque y el total; el analizador histórico por nodos sería desproporcionado. | Medición mínima en `qa_smoke.mjs`, salida resumida y objetivo informativo de 2–3 minutos; sin cleanup. |

La única invocación directa seleccionada es `verificar_runtime_lab029.mjs`. Los seis componentes B son fuentes de funciones u oráculos; `qa_smoke.mjs` no debe lanzar sus baterías completas. Cuando una misma llamada E2 aporte contrato, RAG y multiclínica, el orquestador deberá conservar un resultado por oráculo sin repetir la petición.

### Componentes descartados del smoke

Los siguientes nueve componentes C son candidatos importantes deliberadamente excluidos:

| Componente | Ruta | Motivo de exclusión |
|---|---|---|
| Validador completo LAB-026 | `scripts/lab026/validar_workflow_lab026.mjs` | 1570 aserciones, hash y generación por stdout; apropiado para regresión dirigida de agenda, no para smoke. |
| Validador completo LAB-027 | `scripts/lab027/validar_workflows_lab027.mjs` | 2791 comprobaciones más lógica y referencias históricas; demasiado pesado y redundante para el camino rápido. |
| Suite lógica LAB-028 | `scripts/lab028/probar_lab028.mjs` | 38 casos de avisos/selección; prueba profunda local, no disponibilidad crítica. |
| Suite mock del runtime LAB-029 | `scripts/lab029/probar_runtime_lab029.mjs` | 109 pruebas locales con mocks y temporales; valida herramientas, no salud E2. |
| Preparador runtime LAB-029 | `scripts/lab029/preparar_runtime_lab029.mjs` | Genera manifest, payloads, SQL y workflows temporales; excede el smoke y no debe regenerar/importar workflows. |
| Cleanup real LAB-029 | `scripts/lab029/ejecutar_cleanup_runtime_lab029.mjs` | Contrato específico P/Q/Data Tables LAB029 y payload local; no cubre Calendar ni estados transversales. Reutilizar la filosofía mediante B, no este ejecutor completo. |
| Fixtures contextuales LAB-028 | `scripts/lab028/fixtures_runtime_contextual_lab028.mjs` | Fija clínica/marcador y administra campañas que no son necesarias para el camino mínimo de reserva. |
| Prueba SQL PostgreSQL LAB-029 | `scripts/lab029/probar_postgres_lab029.sql` | Prueba profunda transaccional sobre base de prueba; corresponde a regresión de persistencia. |
| Analizador de rendimiento LAB-028 | `scripts/lab028/analizar_rendimiento_runtime_lab028.mjs` | Analiza ejecuciones y categorías por nodo o consulta API; el smoke solo necesita duraciones de bloques y total. |

También quedan fuera todos los generadores, migraciones, pruebas de herramienta, reconstrucción/reinicio y baterías históricas completas. Su exclusión evita generación accidental, duplicación y tiempos incompatibles con el objetivo de 2–3 minutos.

### Brechas del smoke

Tarea 4 deberá diseñar código nuevo mínimo únicamente para estas brechas:

1. **Preflight n8n/publicación/configuración:** `verificar_runtime_lab029.mjs` cubre P/Q, pero falta una comprobación ligera de n8n, endpoint vigente y publicación efectiva antes de cualquier mutación.
2. **Adaptación de invariantes locales:** seleccionar contrato público, sanitización y fail-closed desde `validar_lab029.mjs` sin ejecutar su generación ni la batería completa.
3. **Escenario único y manifest LAB030:** coordinar una petición RAG, reserva médica y casos A/B/inválido con IDs inequívocos, sin usar fixtures amplios.
4. **Gestión básica:** no hay ejecutor pequeño vigente para cancelar la cita recién creada y verificar Calendar + estado persistido.
5. **Urgencia E2 mínima:** la lógica 027 aporta contratos, pero falta la llamada integrada que demuestre prioridad y ausencia de continuación normal, con inventario de alerta/episodio/tarea.
6. **Cleanup transversal:** falta el adaptador que elimine por IDs exactos los recursos del smoke en PostgreSQL, Qdrant, Data Tables y Calendar, y ejecute post-check global fail-closed.
7. **Medición/evidencia resumida:** falta la capa del orquestador que mida cada bloque y el total, normalice PASS/WARN/FAIL y escriba solo un resumen/manifiesto pequeño.

Estas brechas pertenecen a la futura estructura de `qa_smoke.mjs`; no justifican nuevos runners por capacidad. La próxima tarea debe diseñar cómo cubrirlas antes de implementar código.

## Estructura propuesta de qa_smoke.mjs

La primera versión se diseñará como un único orquestador pequeño con seis fases A–F. Las fases C y D agrupan sus comprobaciones como bloques internos; no se crearán runners separados. El orden exacto será:

```text
A Preflight local
→ B Salud de entorno
→ C Invariantes y contratos
→ D Escenario funcional mínimo
→ E Cleanup
→ F Resultado
```

Si ocurre un fallo crítico antes de crear datos, se salta directamente a F. Si ocurre después de crear datos, se detienen las comprobaciones funcionales pendientes y se entra a E antes de F. El cleanup y el resultado final forman una ruta de cierre obligatoria; no son pruebas opcionales posteriores.

### Responsabilidad por fase

| Fase | Responsabilidad y alcance | Reutilización aprobada | Lógica reutilizada | Código nuevo mínimo | Nivel | Crea datos | Cleanup | Condición de fallo |
|---|---|---|---|---|:---:|:---:|---|
| A — Preflight local | Validar configuración mínima, rutas requeridas, formato de entorno/run y presencia de variables obligatorias sin mostrar valores | B: invariantes seleccionadas de `scripts/lab029/validar_lab029.mjs` | Contrato público, sanitización y fail-closed como oráculos; no ejecutar su CLI | Registro central de requisitos, lectura segura de variables, comprobación de archivos, generación de `run_id` y manifest inicial | LOCAL | NO | NO | `CRITICAL_FAIL` ante archivo/configuración/variable obligatoria ausente o inválida, o si no puede prepararse cleanup seguro antes de mutar |
| B — Salud de entorno | Comprobar n8n y endpoint efectivo; verificar PostgreSQL/Qdrant y dependencias indispensables | A: `scripts/lab029/verificar_runtime_lab029.mjs` | Health P/Q y compatibilidad de colecciones | Petición liviana no mutante a n8n/endpoint publicado; temporizador y redacción de errores | E2 | NO | NO | `CRITICAL_FAIL` si n8n, endpoint o una dependencia obligatoria no responde o tiene configuración incompatible |
| C — Invariantes y contratos | Verificar contrato público mínimo, estructura relevante, ausencia de exposición interna y fallo cerrado de clínica inválida antes de ejecutar mutaciones | B: checks seleccionados de `validar_lab029.mjs`; B: helpers de `ejecutar_runtime_lab029.mjs` | Forma de respuesta, sanitización, autoridad de clínica, filtros y clasificación de resultado | Adaptador de lectura del export vigente sin generación; una petición inválida no mutante cuando sea necesaria | LOCAL + E2 | NO, salvo auditoría automática del entorno | Si la llamada genera auditoría, SÍ | `CRITICAL_FAIL` ante contrato inválido, fuga interna, fallback de clínica o clínica inválida aceptada |
| D — Escenario funcional mínimo | Ejecutar, en orden, RAG conocido → reserva médica sana → cancelación verificable → urgencia prioritaria → aislamiento A/B/fail-closed | B: `ejecutar_runtime_lab029.mjs`; B: `probar_runtime_real_lab028.mjs`; B: contrato/oráculos de `probar_logica_lab027.mjs` | HTTP y clasificación RAG/multiclínica; motor conversacional y timeout de reserva; IDs/oráculos de urgencia | Coordinación de un solo escenario LAB030, cancelación de la cita creada, llamada urgente integrada y captura inmediata de cada ID exacto | E2 | SÍ | SÍ, obligatorio | `CRITICAL_FAIL` ante fallo de RAG obligatorio, reserva no durable, cancelación no verificable, urgencia sin prioridad, continuación normal indebida o mezcla A/B |
| E — Cleanup | Inventariar, comparar, eliminar solo IDs registrados y ejecutar post-check de todos los almacenes tocados | B: `validar_inventario_cleanup_lab029.mjs`; B: flujo de `limpiar_runtime_lab029.mjs` | Comparación exacta, fail-closed, orden precheck → delete → post-check → evidencia | Adaptador transversal mínimo para PostgreSQL, Qdrant, Data Tables y Calendar; actualización del manifest | E2 | SÍ, solo eliminaciones registradas | Es la fase de cleanup | `CRITICAL_FAIL` si faltan IDs, aparecen recursos inesperados, inventario difiere, una eliminación falla o el post-check conserva residuos; ante discrepancia no borrar |
| F — Resultado | Cerrar tiempos, normalizar estados, calcular resultado global, persistir manifest pequeño y mostrar resumen humano | Sin batería adicional | Criterios PASS/WARN/FAIL ya definidos | Cronómetro por bloque/total, agregación, escritura segura del manifest y salida corta | LOCAL | Solo manifest fuera de Git | NO | `CRITICAL_FAIL` si no puede conservarse evidencia mínima; un fallo previo no puede ser compensado por PASS posteriores |

#### Fase D: bloques mínimos y reutilización de datos

La fase D contiene cinco bloques, no cinco suites:

1. **RAG:** una consulta pública conocida y un oráculo mínimo de respuesta válida.
2. **Reserva:** una sola reserva médica ficticia; registrar inmediatamente cita, evento, estado y cualquier auditoría creada.
3. **Cancelación:** reutilizar la cita del bloque anterior, confirmar la ruta correcta y verificar tanto Calendar como persistencia. No crear una segunda cita.
4. **Urgencia:** usar una sesión separada con mensaje inequívoco; comprobar prioridad y que no siga por RAG/agenda normal. Registrar alerta, episodio o tarea realmente creados.
5. **Multiclínica/fail-closed:** reutilizar el menor número de llamadas posible para comprobar separación A/B y rechazo de clínica inválida. La prueba profunda de aislamiento queda en regresión.

Cada recurso se añade al manifest en el momento en que se obtiene su ID, antes de iniciar el siguiente paso. Un timeout no autoriza un reintento ciego: primero se reconcilia el estado para descubrir si el recurso fue creado.

### Política fail-fast

Los estados de control del orquestador serán:

- **CRITICAL_FAIL:** detiene el bloque actual y todas las comprobaciones funcionales pendientes. Si existen IDs creados, transfiere el control a cleanup; después siempre ejecuta el cierre de resultado. Produce resultado global FAIL.
- **WARN:** registra causa, impacto y duración, y continúa únicamente cuando hacerlo es seguro. Ejemplos iniciales: exceder el objetivo informativo de 2–3 minutos sin superar un umbral bloqueante futuro, o no disponer del HEAD opcional mientras sí exista el resto de evidencia.
- **FAIL_NO_STOP:** registra FAIL pero permite terminar otros bloques independientes y luego cleanup. No tendrá usos en la primera versión. Solo podrá incorporarse si una tarea posterior demuestra independencia técnica, ausencia de riesgo adicional y valor diagnóstico; nunca podrá compensarse ni convertirse en PASS.

Son `CRITICAL_FAIL`, como mínimo:

- configuración o variables obligatorias inválidas;
- imposibilidad de preparar manifest o estrategia segura de cleanup;
- n8n, endpoint o servicio indispensable no disponible;
- contrato público básico inválido o exposición de información interna;
- clínica inválida que no falla cerrado o mezcla entre clínicas;
- reserva confirmada sin persistencia verificable;
- cancelación o urgencia con resultado obligatorio incumplido;
- inventario de cleanup inesperado, ID faltante, eliminación incompleta o post-check con residuos;
- imposibilidad de conservar la evidencia mínima.

Los errores se sanitizarán antes de imprimir o persistir. Nunca se incluirán valores de variables sensibles, URLs con credenciales, headers de autorización o cuerpos completos.

### Manifest de ejecución

Cada ejecución tendrá un identificador inequívoco con forma `LAB030_QA_<run_id>`. El `run_id` deberá ser seguro para usar como correlación, único dentro del entorno y no derivado de PII. El manifest se guardará fuera de Git, bajo una ubicación runtime controlada como `private-storage/lab030/<run_id>/manifest.json`.

Esquema conceptual mínimo:

| Campo | Contenido |
|---|---|
| `schema_version` | Versión pequeña del contrato del manifest |
| `run_id` / `qa_prefix` | Identidad de ejecución y prefijo `LAB030_QA_<run_id>` |
| `started_at` / `finished_at` | Fecha/hora UTC de inicio y cierre |
| `environment` | Identificador no sensible del entorno |
| `git_head` | HEAD si está disponible; ausencia explícita si no |
| `tests` | IDs y nombres de pruebas realmente ejecutadas, en orden |
| `blocks` | Resultado, duración, capacidad y causa sanitizada por bloque |
| `duration_ms` | Duración total |
| `created_resources` | IDs exactos agrupados por tipo/almacén y clínica, sin payloads |
| `cleanup_expected` | IDs y operaciones exactas previstas |
| `cleanup_actual` | IDs tratados, post-check y discrepancias sanitizadas |
| `global_result` | PASS, WARN o FAIL |

El manifest se actualizará después de cada cambio de estado relevante y cada ID descubierto, de modo que un fallo intermedio no pierda el inventario necesario para cleanup. Las escrituras deberán evitar un archivo parcialmente válido. No incluirá secretos, tokens, credenciales, headers, payloads clínicos completos ni PII real. Los datos de prueba serán ficticios y mínimos.

### Salida humana resumida

La salida futura será una tabla de texto corta, con una línea por bloque y sin logs crudos:

```text
QA-SMOKE LAB-030
Preflight ........ PASS   X.X s
Salud ............ PASS   X.X s
Contratos ........ PASS   X.X s
RAG .............. PASS   X.X s
Reserva .......... PASS   X.X s
Cancelación ...... PASS   X.X s
Urgencia ......... PASS   X.X s
Multiclínica ..... PASS   X.X s
Cleanup .......... PASS   X.X s

Tiempo total: XX.X s
Resultado global: PASS
Manifest: <referencia local sanitizada>
```

Los bloques no alcanzados por fail-fast se mostrarán como `NOT_RUN`, nunca PASS. Un cleanup no requerido porque no se creó ningún dato se mostrará como `NOT_REQUIRED`; si existen IDs, solo PASS permite cerrar limpiamente. El detalle de una causa se limitará a una línea sanitizada y el manifest conservará la referencia ampliada.

### Archivos futuros previstos

Para la primera versión se prevé **un único archivo de código**:

- `scripts/lab030/qa_smoke.mjs`: orquestación, adaptadores mínimos, medición, manifest, cleanup y resumen.

No se propone un archivo auxiliar en esta etapa. Las funciones internas deberán permanecer pequeñas y agrupadas por fase. Un auxiliar solo se justificará después si la implementación demuestra que una pieza estable es compartida también por `qa_regresion.mjs`; esa decisión requerirá una tarea explícita y no forma parte del diseño actual.

El manifest runtime no es código auxiliar ni archivo versionado. Se genera por ejecución fuera de Git. `qa_smoke.mjs` aún no existe y esta sección no autoriza implementarlo.
