# LAB-031 — Matriz maestra QA de VetAtiende AI

Estado documental: **LAB-031 — ABIERTO / IN_PROGRESS**. Esta matriz no declara al producto apto para piloto.

## 1. Objetivo y alcance

LAB-031 consolida la evidencia QA vigente de VetAtiende AI, identifica las brechas reales que aún impiden acreditar el `GATE-PILOT` y define la siguiente validación mínima para cada dominio. La evaluación cubre salud técnica y contratos, RAG, reservas, gestión de citas, urgencias, operación interna, aislamiento multiclínica, persistencia, rendimiento y regresión global.

La matriz reutiliza evidencia aprobada de LAB-021 a LAB-030, con énfasis en:

- [QA_AUDITORIA_INICIAL de LAB-030](../lab030/QA_AUDITORIA_INICIAL.md);
- [QA_DISENO_FASE2 de LAB-030](../lab030/QA_DISENO_FASE2.md);
- [ALINEACION_EQAB_EWB de LAB-030](../lab030/ALINEACION_EQAB_EWB.md);
- [HANDOFF_CODEX de LAB-030](../lab030/HANDOFF_CODEX.md);
- [roadmap comercial](../roadmap_mvp_comercial.md).

Son baselines corporativos aplicables EPB v1.0, EDPB v1.0, EQAB v1.0 y EWB v1.0. Esta tarea consolida el estado documental; no ejecuta pruebas, no remedia brechas y no recalifica automáticamente los controles corporativos.

## 2. Fuera de alcance

- Reabrir LAB-030 o repetir su escenario E2 cerrado.
- Ejecutar E2, suites completas, regresiones, Node, Docker, n8n, PostgreSQL o Qdrant.
- Crear scripts, fixtures, datos o pruebas nuevas.
- Modificar workflows, infraestructura, secretos o configuración operativa.
- Usar datos personales o clínicos reales.
- Corregir en esta tarea las brechas encontradas o declarar `GATE-PILOT` aprobado.
- Auditar formalmente EPB v1.0 o EDPB v1.0; su GAP continúa pendiente.

## 3. Regla de evidencia y no repetición

No hay `PASS` sin evidencia suficiente, vigente y trazable para el alcance exacto evaluado. Una prueba histórica demuestra únicamente lo que su cierre documentó: no se transforma en `PASS` actual de una cadena más amplia. Las pruebas cerradas no se repiten salvo cambio material, regresión demostrable o riesgo real que afecte su resultado.

LAB-030 demostró y no debe repetirse:

- escenario RAG público E2;
- consistencia PostgreSQL/Qdrant de ese escenario;
- inventario exacto;
- `DELETE` exacto;
- post-check;
- cero residuos;
- preservación de la clínica QA;
- retiro de workflows temporales.

Su evidencia puede reutilizarse como antecedente acotado. No acredita por sí sola reservas, citas, urgencias, operación interna, aislamiento multiclínica integral, regresión global ni aptitud para piloto.

## 4. Estados oficiales

| Estado | Criterio |
|---|---|
| `PASS` | El alcance exacto tiene evidencia vigente, suficiente y trazable, sin fallo crítico abierto. |
| `WARN` | Existe evidencia útil, pero es parcial, histórica, limitada o conserva una observación que no invalida por sí sola el alcance acreditado. |
| `FAIL` | Existe una brecha o incumplimiento demostrado que bloquea el alcance o el gate aplicable. |
| `N/A` | El control no aplica y la razón está documentada. |
| `NOT_VERIFIED` | No existe evidencia suficiente para emitir `PASS`, `WARN` o `FAIL`; no equivale a éxito ni a fallo demostrado. |

Para `GATE-PILOT`, un `FAIL` crítico bloquea el avance. Los `WARN` y `NOT_VERIFIED` requieren resolución o aceptación explícita según el baseline aplicable; no se compensan con resultados favorables de otros QA.

## 5. Matriz maestra QA-01 a QA-08

| QA | Objetivo | Evidencia existente reutilizable | Estado vigente | Brecha real pendiente | Criticidad | Impacto en `GATE-PILOT` | Siguiente validación necesaria | Qué no debe repetirse |
|---|---|---|---|---|---|---|---|---|
| **QA-01 — Salud técnica y contratos** | Acreditar disponibilidad, publicación y contratos de la cadena final pública e interna, con fallos sanitizados y dependencias identificadas. | Inventario y contratos locales de LAB-026 a LAB-030; preflight y health checks diseñados en LAB-030; cierre acotado del escenario RAG público. | `WARN` | La integración final y operacional completa de rutas críticas no está acreditada; las comprobaciones administrativas opcionales de n8n y PostgreSQL quedaron sin verificar. | Alta | Impide afirmar que la cadena desplegada completa está preparada; requiere evidencia actual antes del gate. | Verificación dirigida de publicación, endpoints y contratos vigentes de la cadena final, limitada a rutas críticas y sin suite completa. | No repetir el E2 RAG público ni las comprobaciones locales históricas que no hayan cambiado. |
| **QA-02 — RAG y conocimiento** | Verificar conocimiento público e interno, permisos, versiones activas, persistencia y consistencia entre PostgreSQL y Qdrant. | LAB-029 documenta dominio, permisos, activación y rollback; LAB-030 cerró el escenario RAG público E2 con consistencia P/Q, inventario y cleanup exactos. | `WARN` | La evidencia actual es completa solo para el escenario público acotado; el RAG interno, sus permisos y la cadena integrada final no fueron acreditados en LAB-030. | Alta | El escenario público cerrado no bloquea por sí solo, pero la cobertura interna y transversal debe acreditarse antes del gate aplicable. | Validación dirigida del RAG interno y permisos sobre la versión final, reutilizando contratos existentes y datos sintéticos. | No repetir el escenario RAG público E2, su inventario, `DELETE`, post-check, cleanup ni retiro de temporales. |
| **QA-03 — Reservas** | Acreditar reservas médicas y de peluquería, alternativas, conflictos, confirmación durable y aislamiento por clínica. | Cierres funcionales LAB-022/LAB-023; matriz LAB-026; runtime y avisos LAB-028; inventario de reutilización LAB-030. | `NOT_VERIFIED` | No existe evidencia vigente de la ruta de reservas integrada sobre la cadena final ni de su aislamiento multiclínica actual. | Alta | Debe verificarse antes de permitir reservas en piloto. | Regresión dirigida mínima de una reserva por tipo relevante, conflicto y confirmación, con oráculos de Calendar y persistencia. | No reconstruir ni ejecutar completas las baterías históricas LAB-022, LAB-023, LAB-026 o LAB-028. |
| **QA-04 — Gestión de citas** | Acreditar cancelación y reprogramación seguras, idempotencia, conflictos, fallos parciales, compensación y derivación humana. | Cierre y matriz de LAB-026 con creación durable, cancelación, reprogramación, concurrencia y recuperación; diseño de selección LAB-030. | `NOT_VERIFIED` | La gestión de citas no fue revalidada sobre la integración final vigente y no existe cleanup transversal actual de sus recursos. | Alta | Bloquea habilitar estas operaciones en piloto sin validación dirigida y cleanup demostrable. | Regresión dirigida de cancelación y reprogramación sobre datos sintéticos, con post-check e inventario exacto por ejecución. | No repetir las 1570 aserciones ni toda la matriz LAB-026 si no existe cambio o riesgo que lo justifique. |
| **QA-05 — Urgencias y seguridad funcional** | Acreditar prioridad de urgencias, reglas deterministas, clasificación ambigua, negaciones, alertas y fallback seguro sin diagnóstico. | LAB-024/024.1 y LAB-025 documentan regresiones funcionales; LAB-026/028 preservan prioridad; LAB-030 inventaría casos y oráculos. | `NOT_VERIFIED` | No hay evidencia vigente de urgencias integradas en la cadena final ni de su comportamiento ante dependencias parciales o configuración por clínica. | Crítica | Una falla puede comprometer seguridad funcional; debe quedar acreditada antes del piloto. | Regresión dirigida de casos determinista, ambiguo, negado y fallo de notificación, verificando orientación pública segura y trazabilidad. | No repetir todo el catálogo histórico de urgencias; seleccionar casos por cambio, riesgo y dependencias afectadas. |
| **QA-06 — Operación interna y seguimiento** | Acreditar autenticación, autorización, tareas, pendientes, derivaciones, alertas, recordatorios, respuestas e idempotencia. | LAB-025 aporta operación interna y permisos; LAB-027 documenta 40/40 runtime y cleanup 3/3 históricos; auditoría LAB-030 identifica componentes reutilizables. | `NOT_VERIFIED` | Falta reproducción mantenible de LAB-027 sobre la versión actual y validación integrada de la operación interna final. | Alta | No permite afirmar continuidad operativa, seguimiento ni control humano listos para piloto. | Un escenario mantenible scheduler → respuesta → tarea → cierre con repetición idempotente, más autorización interna dirigida. | No reconstruir los 40 casos ni repetir los 245 checks de lógica o 2791 comprobaciones completas. |
| **QA-07 — Multiclínica, aislamiento y persistencia** | Demostrar separación efectiva de lectura y mutación entre clínicas para documentos, calendario, configuración y operación, con fail-closed y persistencia. | Aislamiento RAG y autoridad clínica LAB-029; rechazo de clínica inválida; fingerprint histórico; escenario documental LAB-030 preservó la clínica QA. | `FAIL` | No existe evidencia suficiente de aislamiento multiclínica integral actual para calendario, configuración y operación entre dos clínicas; la restauración completa desde backup tampoco está acreditada. | Crítica | **Bloquea `GATE-PILOT`**: un cruce de datos o recursos entre clínicas es inaceptable. | Prueba cruzada A/B de lectura y mutación, misma sesión/teléfono cuando aplique, clínica inválida y persistencia; luego acreditar restore mediante tarea operacional separada. | No repetir persistencia y cleanup del escenario documental LAB-030 ni inferir aislamiento integral desde RAG o ausencia de hardcodes. |
| **QA-08 — Piloto, rendimiento y regresión global** | Consolidar recorrido transversal, rendimiento, cleanup, regresión y preparación operativa con criterio de aptitud para piloto. | Diseño smoke/regresión LAB-030; timings históricos; alineación EQAB/EWB; cierre limpio y reproducible del escenario RAG público. | `FAIL` | No existe objetivo de rendimiento unificado; regresión dirigida, ampliada y completa integral no está acreditada; cleanup transversal, UI/operación, restore, retención, incidentes y responsables siguen pendientes. | Crítica | **Bloquea `GATE-PILOT`** hasta cerrar o aceptar formalmente cada control aplicable y completar el GAP EPB/EDPB. | Definir criterios medibles y responsables; ejecutar solo la regresión proporcional aprobada después de remediar brechas críticas y contar con cleanup transversal. | No usar medias históricas como SLA, no ejecutar suites completas sin selección justificada y no repetir el escenario cerrado de LAB-030. |

## 6. Priorización vigente

El primer GAP real priorizado es **QA-07: aislamiento multiclínica integral actual de calendario, configuración y operación**. Es crítico, tiene impacto directo sobre confidencialidad e integridad entre clínicas y bloquea `GATE-PILOT`. Su validación debe preceder a una regresión global amplia; primero se define y ejecuta una prueba cruzada A/B mínima, trazable y con datos sintéticos.

Después corresponden: seguridad funcional integrada de QA-05; preparación operativa y criterio de rendimiento de QA-08; integración final de QA-01; y las validaciones dirigidas pendientes de QA-02, QA-03, QA-04 y QA-06.

## 7. Brechas corporativas aplicables

- El GAP formal de EPB v1.0 y EDPB v1.0 permanece pendiente antes del gate aplicable.
- Los WARN, FAIL y NOT_VERIFIED de la fotografía EQAB/EWB de LAB-030 no se convierten en PASS por el cierre del escenario RAG público.
- En las fuentes aprobadas y en el repositorio no se identificó una política corporativa de repositorios Emactiva versionada y aplicable. Debe identificarse o formalizarse su baseline, alcance, responsable y evidencia exigible antes de evaluar cumplimiento; esta observación no autoriza inventar controles ni ampliar esta tarea.

## 8. Regla de actualización

Cada cambio de estado debe enlazar evidencia concreta, fecha o ejecución, alcance exacto y responsable de aceptación. Si una validación cubre varias filas, sus oráculos deben distinguirse. Un hallazgo nuevo registra primero el fallo real; no se oculta mediante reejecuciones indiscriminadas ni mediante resultados favorables de otro dominio.
