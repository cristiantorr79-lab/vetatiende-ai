# LAB-031 — Matriz maestra QA de VetAtiende AI

Estado documental: **LAB-031 — DIAGNÓSTICO CERRADO / GATE-LAB PASS CON EXCEPCIÓN CONTROLADA**. `GATE-PILOT` permanece **BLOQUEADO**; esta matriz no declara al producto apto para piloto.

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
| **QA-02 — RAG y conocimiento** | Verificar conocimiento público e interno, permisos, versiones activas, persistencia y consistencia entre PostgreSQL y Qdrant. | LAB-029 documenta dominio, permisos, activación y rollback; LAB-030 cerró el escenario RAG público E2 con consistencia P/Q, inventario y cleanup exactos. La ejecución n8n `#4332` acreditó cero versiones públicas activas para el contexto probado y terminación sin `Respond to Webhook`. | `FAIL` | Fallo funcional confirmado ante corpus público vacío: HTTP 200 con cuerpo no JSON. La cobertura interna y transversal continúa parcial. No es evidencia de fallo del detector de urgencias. | Crítica | Impide una respuesta pública segura y estructurada; bloquea habilitar atención hasta corregir el resultado vacío. | LAB-032: corregir el fallback público sin documentos y ejecutar una prueba negativa focalizada. El contenido RAG específico de Animals se valida durante su configuración supervisada. | No repetir `#4332` ni el escenario RAG público E2 cerrado; no confundir corpus vacío con regresión del detector. |
| **QA-03 — Reservas** | Acreditar reservas médicas y de peluquería, alternativas, conflictos, confirmación durable y aislamiento por clínica. | Cierres funcionales LAB-022/LAB-023; matriz LAB-026; runtime y avisos LAB-028; inventario de reutilización LAB-030. | `NOT_VERIFIED` | No existe evidencia vigente de la ruta de reservas integrada sobre la cadena final ni de su aislamiento multiclínica actual. | Alta | Debe verificarse antes de permitir reservas en piloto. | Regresión dirigida mínima de una reserva por tipo relevante, conflicto y confirmación, con oráculos de Calendar y persistencia. | No reconstruir ni ejecutar completas las baterías históricas LAB-022, LAB-023, LAB-026 o LAB-028. |
| **QA-04 — Gestión de citas** | Acreditar cancelación y reprogramación seguras, idempotencia, conflictos, fallos parciales, compensación y derivación humana. | Cierre y matriz de LAB-026 con creación durable, cancelación, reprogramación, concurrencia y recuperación; diseño de selección LAB-030. | `NOT_VERIFIED` | La gestión de citas no fue revalidada sobre la integración final vigente y no existe cleanup transversal actual de sus recursos. | Alta | Bloquea habilitar estas operaciones en piloto sin validación dirigida y cleanup demostrable. | Regresión dirigida de cancelación y reprogramación sobre datos sintéticos, con post-check e inventario exacto por ejecución. | No repetir las 1570 aserciones ni toda la matriz LAB-026 si no existe cambio o riesgo que lo justifique. |
| **QA-05 — Urgencias y seguridad funcional** | Acreditar prioridad de urgencias, reglas deterministas, clasificación ambigua, negaciones, alertas y fallback seguro sin diagnóstico. | LAB-024/024.1 y LAB-025 documentan regresiones funcionales; LAB-026/028 preservan prioridad. Ticket `#15`: ejecución n8n `#4332`, cero filas en `Leer versiones públicas activas LAB-029`, rama sin `Respond to Webhook`, HTTP 200 no JSON. | `NOT_VERIFIED` | La detección de negación/prioridad no llegó a evaluarse: el primer fallo real fue el manejo de corpus público vacío. No existe evidencia de fallo del detector, pero tampoco evidencia vigente suficiente para aprobar urgencias integradas. | Crítica | Condición obligatoria antes de atender clientes: corregir primero la respuesta vacía y después validar urgencias de forma dirigida. | LAB-032: fallback público estructurado y luego casos mínimos determinista, ambiguo/negación y fallo de notificación. | No repetir `#4332` antes de la corrección ni atribuir su fallo al detector de urgencias. |
| **QA-06 — Operación interna y seguimiento** | Acreditar autenticación, autorización, tareas, pendientes, derivaciones, alertas, recordatorios, respuestas e idempotencia. | LAB-025 aporta operación interna y permisos; LAB-027 documenta 40/40 runtime y cleanup 3/3 históricos; auditoría LAB-030 identifica componentes reutilizables. | `NOT_VERIFIED` | Falta reproducción mantenible de LAB-027 sobre la versión actual y validación integrada de la operación interna final. | Alta | No permite afirmar continuidad operativa, seguimiento ni control humano listos para piloto. | Un escenario mantenible scheduler → respuesta → tarea → cierre con repetición idempotente, más autorización interna dirigida. | No reconstruir los 40 casos ni repetir los 245 checks de lógica o 2791 comprobaciones completas. |
| **QA-07 — Multiclínica, aislamiento y persistencia** | Demostrar separación efectiva de lectura y mutación entre clínicas para documentos, calendario, configuración y operación, con fail-closed y persistencia. | Ticket `#14`: PASS acotado para alertas A/B. La lectura cruzada no expuso `alerta_prueba_clinica_002`; `reconocer_alerta` cruzado respondió HTTP 404/`ok:false`; el post-check visual mantuvo la alerta `pendiente` y sin actor. LAB-029/030 aportan aislamiento RAG/documental histórico. | `FAIL` | No existe PASS integral. Riesgo estructural crítico, sin fuga ejecutada demostrada: `calendar_id` literal fijo en agenda médica y peluquería, sin resolución por `clinic_id`. Calendario/configuración y restore siguen sin acreditar. | Crítica | **Bloquea `GATE-PILOT`** para cualquier capacidad multiclínica o de reservas. El PASS de alertas no compensa el riesgo de calendarios. | LAB-032: resolución de calendario por clínica, fail-closed y validación A/B dirigida con inventario y cleanup. Restore permanece control operacional separado. | No repetir el PASS acotado de alertas ni afirmar fuga de calendario no demostrada; no repetir cleanup documental LAB-030. |
| **QA-08 — Piloto, rendimiento y regresión global** | Consolidar recorrido transversal, rendimiento, cleanup, regresión y preparación operativa con criterio de aptitud para piloto. | Diseño smoke/regresión LAB-030; timings históricos; alineación EQAB/EWB; cierre limpio del escenario RAG público. Decisión operativa del issue `#1` del 2026-11-05 separa controles técnicos previos de la configuración supervisada de Animals. | `FAIL` | Fallback público, urgencias integradas, calendario por clínica, controles operativos, GAP EPB/EDPB y cleanup global de LAB-031 permanecen sin cierre acreditado. El cleanup histórico LAB-030 no acredita datos temporales posteriores. | Crítica | **Bloquea `GATE-PILOT`**. No se habilita atención a clientes hasta resolver los controles críticos aplicables. | LAB-032 remedia fallos técnicos críticos; LAB-033 recibe mejoras no bloqueantes. Antes de apertura, Animals valida contenido corporativo y experiencia conversacional bajo supervisión. | No usar medias históricas como SLA, no repetir suites completas ni convertir validaciones supervisadas futuras en PASS actual. |

## 6. Priorización vigente

El primer fallo funcional demostrado es la **respuesta pública sin documentos** (`#4332`): debe corregirse en LAB-032 antes de repetir la validación dirigida de urgencias. En paralelo, QA-07 conserva un riesgo estructural crítico por `calendar_id` fijo; no se habilitan reservas multiclínica hasta resolverlo y validar A/B.

Antes de atender clientes son obligatorios: respuesta pública estructurada aun sin documentos; urgencias dirigidas y fallback seguro; autorización y aislamiento; y reservas/cancelación/reprogramación solo si se habilitarán, con cleanup. Durante la configuración supervisada de Veterinaria Animals se validan horarios, servicios, precios, políticas y experiencia conversacional usando información corporativa autorizada, no datos clínicos personales.

Los tickets `#14` y `#15` completaron su función diagnóstica, pero no sus criterios funcionales originales: ambos deben permanecer abiertos o ser cerrados únicamente mediante una decisión explícita que preserve sus pendientes en LAB-032. Esta matriz no modifica retrospectivamente dichos criterios.

### 6.1 Excepción controlada de conservación temporal

| Campo | Registro |
|---|---|
| ID único | `EXC-LAB031-EQAB-09-05-20261105-01` |
| Marco aplicable | EQAB-09-05 y sección 16 de EQAB; trazabilidad EWB y minimización/seguridad EPB-EDPB. |
| Controles afectados | Cleanup de temporales LAB-031; QA-08; criterio de cleanup del issue #1; condición previa de `GATE-PILOT`. |
| Decisión | Conservar temporalmente los datos sintéticos de QA hasta completar las validaciones pendientes. Cleanup permanece `NOT_VERIFIED`; no se declara PASS. |
| Justificación | Evitar eliminar y recrear fixtures sintéticos entre validaciones dirigidas pendientes, reduciendo repetición y mutación innecesaria del entorno QA. |
| Riesgo | Contaminación del entorno QA, confusión con evidencia de ejecuciones posteriores o lectura accidental de fixtures conservados. |
| Mitigación | Datos exclusivamente sintéticos, identificados y aislados; prohibido utilizarlos como evidencia de piloto, mezclarlos con datos de Animals o habilitar atención pública mientras exista la excepción. |
| Responsable/aprobador | Cristian. |
| Fecha de decisión | 2026-11-05. |
| Revisión obligatoria | Inmediatamente después de finalizar las pruebas pendientes y antes de incorporar datos reales de Animals o habilitar el piloto. |
| Cierre de excepción | Inventario completo, cleanup exacto y post-check con cero residuos, con evidencia trazable. |

Esta excepción permite cerrar el **alcance diagnóstico / GATE-LAB** porque el riesgo está identificado, aprobado, acotado y mitigado. No satisface el control de cleanup, no cambia QA-07/QA-08 y no habilita `GATE-PILOT`.

## 7. Brechas corporativas aplicables

- El GAP formal de EPB v1.0 y EDPB v1.0 permanece pendiente antes del gate aplicable.
- Los WARN, FAIL y NOT_VERIFIED de la fotografía EQAB/EWB de LAB-030 no se convierten en PASS por el cierre del escenario RAG público.
- En las fuentes aprobadas y en el repositorio no se identificó una política corporativa de repositorios Emactiva versionada y aplicable. Debe identificarse o formalizarse su baseline, alcance, responsable y evidencia exigible antes de evaluar cumplimiento; esta observación no autoriza inventar controles ni ampliar esta tarea.

## 8. Regla de actualización

Cada cambio de estado debe enlazar evidencia concreta, fecha o ejecución, alcance exacto y responsable de aceptación. Si una validación cubre varias filas, sus oráculos deben distinguirse. Un hallazgo nuevo registra primero el fallo real; no se oculta mediante reejecuciones indiscriminadas ni mediante resultados favorables de otro dominio.
