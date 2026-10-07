# LAB-030 — Alineación con EQAB v1.0 y EWB v1.0

> **Actualización de pre-cierre (2026-10-06):** las matrices y conteos de este documento representan la fotografía de Tarea 8E y no fueron recalificados durante el cierre funcional. La cadena E2 ejecutada posteriormente —precondición, ingestión, post-check de persistencia, inventory, cleanup exacto y post-check sin residuos— terminó PASS. La evidencia final y los estados vigentes están consolidados en `HANDOFF_CODEX.md`.

Estado vigente del LAB: **CERRADO — PASS** para el alcance funcional ejecutado. Los conteos detallados siguientes se conservan como línea base histórica, no como una recalificación de cierre.

Fecha: 2026-09-29. Alcance: mapeo documental de evidencia existente, sin remediación ni ejecución de pruebas.

## 1. Objetivo

Determinar qué controles corporativos aplicables ya están cubiertos por VetAtiende, especialmente por LAB-030, y separar evidencia suficiente, limitaciones, brechas reales y aspectos todavía no verificados. Este análisis no reconstruye prácticas ya existentes ni convierte evidencia histórica en una certificación actual.

## 2. Baselines utilizados

- `EQAB_Emactiva_Quality_Assurance_Baseline_v1.0.md`, versión 1.0, aprobada el 2026-09-27.
- `EWB_Emactiva_Work_Baseline_v1.0.md`, versión 1.0, aprobada el 2026-09-27.

Se usaron desde sus ubicaciones corporativas vigentes bajo `C:/Users/DELL/Emactiva/00_CORPORATIVO/`. No se copiaron ni modificaron dentro de VetAtiende.

EPB v1.0 y EDPB v1.0 también son políticas corporativas aplicables a VetAtiende. No se auditan completas aquí. La dependencia evidente para el gate de piloto es acreditar privacidad/protección de datos y preparación de despliegue/operación; su GAP formal debe planificarse separadamente para no ampliar LAB-030 de forma artificial.

## 3. Criterio de auditoría

Se aplicaron los estados `PASS`, `WARN`, `FAIL`, `N/A` y `NOT_VERIFIED` conforme a los baselines. Un `PASS` exige evidencia localizable; `WARN` conserva una limitación no bloqueante; `FAIL` identifica una brecha aplicable; `N/A` requiere no aplicabilidad real; `NOT_VERIFIED` indica evidencia aún insuficiente y no se convierte automáticamente en fallo.

Fuentes VetAtiende revisadas: [HANDOFF_CODEX.md](HANDOFF_CODEX.md), [QA_AUDITORIA_INICIAL.md](QA_AUDITORIA_INICIAL.md), [QA_DISENO_FASE2.md](QA_DISENO_FASE2.md) y `scripts/lab030/qa_smoke.mjs`. La evidencia histórica se tomó únicamente de las referencias ya consolidadas por esos documentos; no se reabrieron ni repitieron LAB anteriores.

La matriz QA-01 a QA-08 se usa como evidencia específica del producto y no crea controles corporativos adicionales.

## 4. Matriz resumida EQAB

| Dominio y controles | Estado resumido | Evidencia y límite |
|---|---|---|
| EQAB-01 — 01-01 a 01-05 | 3 PASS / 2 WARN | Auditoría, inventario de 37 archivos, matriz QA-01 a QA-08, riesgos D1-D6 y diseño por fases. La estrategia consolidada aparece en LAB-030, no desde el inicio completo del producto, y algunos criterios funcionales siguen distribuidos. |
| EQAB-02 — 02-01 a 02-05 | 5 WARN | Existe cobertura funcional histórica para RAG, reservas, citas, urgencias, operación y seguridad, con oráculos documentados. Falta revalidación integrada y trazabilidad unificada sobre la cadena final. |
| EQAB-03 — 03-01 a 03-05 | 3 PASS / 2 WARN | `qa_smoke.mjs`, política fail-fast, salida sanitizada y diagnóstico del primer fallo real en Tareas 8/8C. El smoke actual cubre preflight, contratos y salud parcial; las rutas funcionales críticas aún no están incorporadas. |
| EQAB-04 — 04-01 a 04-05 | 2 PASS / 3 WARN | Integraciones n8n, PostgreSQL/Aiven, Qdrant, Calendar e IA están inventariadas; contratos locales están comprobados. Las pruebas integradas vigentes, indisponibilidad y consistencia posterior a fallos requieren evidencia actual adicional. |
| EQAB-05 — 05-01 a 05-05 | 2 PASS / 3 NOT_VERIFIED | Está definido el alcance proporcional de smoke, regresión dirigida y completa, y se evita repetir baterías históricas. Las regresiones dirigida, ampliada y completa de LAB-030 aún no se han ejecutado. |
| EQAB-06 — 06-01 a 06-05 | 1 PASS / 2 WARN / 1 FAIL / 1 NOT_VERIFIED | Los timings se registran y existen muestras/umbrales históricos. Falta un objetivo de rendimiento unificado para la cadena final; carga/volumen/concurrencia actuales no están verificados. |
| EQAB-07 — 07-01 a 07-05 | 2 PASS / 3 WARN | Existen pruebas históricas de identidad, roles, bypass y sanitización; el smoke valida fail-closed y evita secretos. Autenticación/autorización/bypass deben revalidarse sobre el despliegue final. |
| EQAB-08 — 08-01 a 08-05 | 1 PASS / 3 WARN / 1 FAIL | Persistencia, rollback, fingerprint y rechazo de clínica inválida tienen evidencia histórica. Falta demostrar aislamiento integral actual entre clínicas para calendario, configuración y operación; restauración completa tampoco está acreditada. |
| EQAB-09 — 09-01 a 09-05 | 3 PASS / 2 WARN | HANDOFF, manifest diseñado, resultados/timings y datos sintéticos están documentados. La relación control-prueba-evidencia y el cleanup transversal siguen incompletos. |
| EQAB-10 — 10-01 a 10-05 | 4 PASS / 1 NOT_VERIFIED | Gates y estados están definidos, los WARN se documentan y ningún PASS compensa un fallo crítico. El cierre de LAB-030 no puede verificarse mientras permanezca abierto. |

**Conteo EQAB (50 controles): 21 PASS, 22 WARN, 2 FAIL, 0 N/A y 5 NOT_VERIFIED.**

## 5. Matriz resumida EWB

| Dominio y controles | Estado resumido | Evidencia y límite |
|---|---|---|
| EWB-01 — 01-01 a 01-05 | 3 PASS / 2 WARN | Las tareas separan alcance, implementación, QA y validación humana; las responsabilidades se observan en la práctica. Falta una asignación nominal/formal completa de responsables. |
| EWB-02 — 02-01 a 02-05 | 3 PASS / 1 WARN / 1 N/A | Trabajo organizado en LAB-030 con objetivo, restricciones, tareas y HANDOFF. Las tareas concretas viven en instrucciones de Chat y no en Issues versionados; no hubo conversión de Issue a LAB aplicable. |
| EWB-03 — 03-01 a 03-05 | 5 PASS | Roadmap y backlog existen; el detalle se incorporó progresivamente mediante tareas cerradas, con objetivo, límites, validación y salida esperada. |
| EWB-04 — 04-01 a 04-05 | 5 PASS | Chat coordinó decisiones, Codex realizó cambios acotados y la persona conservó credenciales, infraestructura y validación manual E2. Las instrucciones se entregaron como bloques completos. |
| EWB-05 — 05-01 a 05-05 | 5 PASS | Evidencia diferenciada, primer fallo real, no repetición de auditorías, validación proporcional y separación explícita entre hecho, pendiente y decisión. |
| EWB-06 — 06-01 a 06-05 | 2 PASS / 3 N/A | Documentación y HANDOFF permiten continuidad. PR, revisión de PR y adaptación de plantillas externas no aplican todavía porque LAB-030 está abierto, sin commit ni PR. |
| EWB-07 — 07-01 a 07-05 | 5 PASS | El HANDOFF preserva estado entre chats, decisiones, resultados, riesgos y siguiente paso exacto sin reabrir trabajo cerrado. |
| EWB-08 — 08-01 a 08-05 | 2 PASS / 1 WARN / 1 N/A / 1 NOT_VERIFIED | Se trabaja en `mvp-comercial` y se ejecutan `git status --short`/`git diff --check`. El flujo completo de commits/PR no puede verificarse aún; no forzar commit durante un LAB abierto es coherente con la preferencia operacional. |
| EWB-09 — 09-01 a 09-05 | 5 PASS | Secretos no impresos ni duplicados, configuración separada, preflight fail-closed y rollback/mitigación histórica documentada. |
| EWB-10 — 10-01 a 10-05 | 4 PASS / 1 NOT_VERIFIED | Trabajo autónomo dentro del alcance, sin microconfirmaciones, herramientas proporcionales y artefactos mínimos. El cierre del LAB continúa pendiente. |

**Conteo EWB (50 controles): 39 PASS, 4 WARN, 0 FAIL, 5 N/A y 2 NOT_VERIFIED.**

## 6. Evidencia VetAtiende asociada

- [QA_AUDITORIA_INICIAL.md](QA_AUDITORIA_INICIAL.md): capacidades críticas, inventario reutilizable, historial consolidado, riesgos D1-D6 y prohibición de repetir baterías sin motivo.
- [QA_DISENO_FASE2.md](QA_DISENO_FASE2.md): smoke por fases, fail-fast, manifest, datos sintéticos, cleanup exacto, tiempos, estados y gates.
- [HANDOFF_CODEX.md](HANDOFF_CODEX.md): continuidad por tareas, decisiones, primer fallo real, salud manual E2, WARN controlado y siguientes pasos.
- `scripts/lab030/qa_smoke.mjs`: preflight, contratos locales, sanitización, tiempos, estados, health de solo lectura y detención ante condiciones críticas.
- Evidencia histórica referenciada por la auditoría: cierres funcionales LAB-021 a LAB-029, resultados locales/E2, persistencia, rollback, multiclínica RAG y cleanup LAB-029. Conserva su carácter histórico y no se presenta como nueva ejecución.

## 7. Controles ya cubiertos

Están suficientemente cubiertos para continuar el QA: planificación e inventario, estructura del smoke, fail-fast, primer fallo real, contratos locales, clasificación PASS/WARN/FAIL, medición de tiempos, protección de secretos, trabajo incremental por LAB, HANDOFF, continuidad, uso proporcional de herramientas, validación humana de infraestructura y controles Git locales.

La salud esencial manual de n8n y Qdrant cerró Fase B con `WARN` controlado. La ausencia de token administrativo n8n y URI PostgreSQL directa dejó checks opcionales en `NOT_RUN`, sin trasladar secretos de forma insegura.

## 8. WARN

Los WARN principales son evidencia funcional histórica todavía no revalidada sobre la cadena final, smoke funcional aún incompleto, integraciones y seguridad parcialmente verificadas, recuperación limitada, trazabilidad dispersa y cleanup transversal pendiente. En EWB, las responsabilidades no están completamente formalizadas por nombre, las tareas no usan Issues y el commit único permanece pendiente mientras LAB-030 sigue abierto.

## 9. FAIL reales

1. **EQAB-06-01 — rendimiento:** no existe todavía un objetivo medible unificado para la cadena final desplegada.
2. **EQAB-08-04 — aislamiento multiclínica:** no existe evidencia suficiente de aislamiento integral actual para calendario, configuración y operación entre dos clínicas.

Son brechas reales para preparación de piloto, pero no bloquean la preparación del primer escenario funcional mínimo RAG/contrato público. No se remediaron en esta tarea.

## 10. NOT_VERIFIED

En EQAB permanecen sin verificar las ejecuciones de regresión dirigida, ampliada y completa, carga/volumen/concurrencia actual y el cierre final de LAB-030. En EWB permanecen sin verificar el flujo completo de integración Git/PR y el cierre del LAB. Su estado responde a etapas aún no alcanzadas y no equivale a FAIL.

## 11. Brechas que afectan LAB-030

- Completar gradualmente el smoke funcional empezando por RAG/contrato público.
- Construir evidencia integrada de las rutas críticas seleccionadas.
- Definir y ejecutar cleanup transversal cuando una prueba cree datos.
- Revalidar seguridad, persistencia y aislamiento según avance la regresión.
- Definir objetivos de rendimiento antes del gate de piloto.

## 12. Brechas tratables en otro LAB

- Preparación operativa/UI completa, restauración desde backup, retención, eliminación, incidentes y responsables.
- Auditoría GAP formal de EPB v1.0 y EDPB v1.0.
- Controles de carga, volumen o concurrencia que excedan el riesgo y alcance inmediato del smoke.
- Formalización corporativa adicional de Issues/PR cuando el flujo de integración lo requiera.

Estas materias deben coordinarse antes del gate que les corresponda, sin forzar su implementación dentro de Tarea 9A.

## 13. Conclusión

Esta conclusión pertenecía a la fotografía de Tarea 8E y quedó superada por la ejecución funcional posterior. LAB-030 cerró su cadena E2 de RAG público, persistencia, consistencia PostgreSQL/Qdrant y cleanup exacto en PASS. Los conteos EQAB/EWB anteriores no se recalifican: sus WARN, FAIL y NOT_VERIFIED sobre regresión ampliada, carga, rendimiento unificado y otros dominios siguen siendo límites documentados y no se convierten en PASS por el cierre de este escenario.

## 12. Estado de cierre

**LAB-030 — CERRADO — PASS** para el alcance funcional ejecutado y evidenciado. La clínica QA quedó preservada, los datos documentales temporales fueron eliminados sin residuos y los workflows temporales fueron retirados. La aptitud integral de piloto sobre toda la matriz EQAB/EWB conserva los límites del mapeo histórico y requiere evidencia adicional únicamente si el proyecto decide certificar esos controles fuera del alcance ejecutado.
