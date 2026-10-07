# LAB-030 — HANDOFF CODEX

Fecha: 2026-09-22.

## Estado y objetivo

**LAB-030 ABIERTO.** Objetivo: QA integral y preparación para piloto real.

**Fase 1 completada:** auditoría QA e inventario reutilizable. La Fase 2 está pendiente de definición e implementación por tareas pequeñas aprobadas desde Chat. Este HANDOFF registra continuidad documental; no constituye un cierre final de LAB-030 ni autoriza iniciar la siguiente fase.

## Base de trabajo

- Repositorio: `C:/Users/DELL/VetAtiendeAI`.
- Rama: `mvp-comercial`.
- HEAD base: `8f830766abdfb5a8c5ecab639ec71f03dba62559`.
- Working tree inicial de la auditoría: limpio.
- Documento de auditoría y fuente principal: [QA_AUDITORIA_INICIAL.md](QA_AUDITORIA_INICIAL.md), ruta `docs/comercial/lab030/QA_AUDITORIA_INICIAL.md`.

Los resultados siguientes proceden de esa auditoría. No se repitió la auditoría ni se revisaron nuevamente los LAB anteriores para preparar este HANDOFF. LAB-029 permanece cerrado.

## Resultados de la auditoría

| Clasificación | Archivos |
|---|---:|
| Reutilizables directamente | 11 |
| Requieren adaptación | 19 |
| Históricos o de soporte | 7 |
| **Total relevante** | **37** |

El total incluye scripts, utilidades, generadores y soporte SQL; no equivale a 37 pruebas independientes. El inventario detallado y los límites de reutilización están en la auditoría.

## Brechas reales detectadas

1. Validación integrada del despliegue final.
2. Cleanup transversal.
3. Reproducción runtime mantenible de LAB-027.
4. Aislamiento multiclínica completo.
5. Criterios unificados de rendimiento.
6. Evidencia de preparación operativa/UI.

## Matriz QA vigente

| Bloque | Alcance |
|---|---|
| QA-01 | Salud técnica y contratos |
| QA-02 | RAG y conocimiento |
| QA-03 | Reservas |
| QA-04 | Gestión de citas |
| QA-05 | Urgencias y seguridad funcional |
| QA-06 | Operación interna y seguimiento |
| QA-07 | Multiclínica, aislamiento y persistencia |
| QA-08 | Piloto, rendimiento y regresión global |

## Smoke preliminar propuesto

Contratos locales → publicación y salud → RAG/autorización → reserva y cancelación → urgencia/deduplicación → cleanup verificado.

Es una propuesta pendiente de implementación y ejecución aprobadas. No se ejecutó el smoke durante la auditoría ni durante esta tarea documental.

## Riesgos principales

- Los workflows Público e Interno LAB-029 están no publicados según el último estado operativo recogido en la auditoría; no se verificó nuevamente el entorno remoto.
- Existen WARN históricos aceptados en el cierre heredado; conservan su clasificación y no se convierten en PASS ni acreditan rendimiento actual.
- El cleanup actual no cubre transversalmente todas las capacidades.

## Continuidad y restricciones

Fase 2 pendiente de definición e implementación por tareas pequeñas aprobadas desde Chat. No iniciar runner maestro, validadores, fixtures, pruebas o automatización runtime sin la instrucción correspondiente. Esta tarea solo crea el HANDOFF; la auditoría se conserva sin modificaciones.

No se ejecutaron pruebas ni E2. No se modificaron workflows ni scripts. No se realizó commit ni push. Los cambios documentales de LAB-030 permanecen dentro de `docs/comercial/lab030/`.

Comprobaciones finales previstas para esta tarea: únicamente `git status --short` y `git diff --check`. El resultado se informa al entregar; un diff de archivos trackeados no incluye archivos nuevos sin seguimiento.

**NO COMMIT REALIZADO**
**NO PUSH REALIZADO**
**NO WORKFLOWS MODIFICADOS**
**NO E2 EJECUTADO**

## Tarea 2 — Diseño QA aprobado

Tarea 2 completada el 2026-09-22. Se creó [QA_DISENO_FASE2.md](QA_DISENO_FASE2.md), ruta `docs/comercial/lab030/QA_DISENO_FASE2.md`.

Quedaron definidos conceptualmente:

- el smoke rápido y fail-fast;
- la regresión dirigida y la regresión completa;
- el cleanup transversal por IDs exactos y con comportamiento fail-closed;
- el modelo mínimo de evidencia QA;
- los resultados PASS, WARN y FAIL;
- los criterios globales APTO PARA PILOTO, APTO CON OBSERVACIONES y NO APTO PARA PILOTO;
- los futuros `scripts/lab030/qa_smoke.mjs` y `scripts/lab030/qa_regresion.mjs`, únicamente a nivel de diseño.

No existe implementación todavía. No se ejecutaron pruebas ni E2 y no se modificaron workflows o scripts.

Próximo paso: **Tarea 3 pendiente**, seleccionar exactamente qué scripts existentes serán reutilizados por el smoke antes de programar `qa_smoke.mjs`. No iniciar Tarea 3 automáticamente.

## Tarea 3 — Selección técnica del smoke

Tarea 3 completada el 2026-09-22. La sección «Selección técnica para qa_smoke.mjs» de [QA_DISENO_FASE2.md](QA_DISENO_FASE2.md) registra la selección por bloque y el descarte deliberado de baterías históricas completas.

Conteo por componente único:

- **A — reutilizar directamente:** 1;
- **B — reutilizar parcialmente:** 6;
- **C — no usar en smoke, candidatos relevantes:** 9.

La pieza A es el health check PostgreSQL/Qdrant de LAB-029. Las piezas B aportan contratos, casos runtime, lógica de urgencia y semántica de cleanup, pero no deben ejecutarse como baterías completas. Las piezas C se reservan para regresión, soporte histórico o análisis fuera del camino rápido.

Brechas que requieren código nuevo mínimo: preflight n8n/publicación, adaptación de invariantes locales sin generación, manifest y escenario LAB030, cancelación básica verificable, urgencia integrada E2, adaptador de cleanup transversal y medición/evidencia resumida.

No se implementó `qa_smoke.mjs`. No se crearon ni modificaron scripts o workflows. No se ejecutaron pruebas ni E2.

Próximo paso: **TAREA 4 — Diseñar la estructura mínima de `qa_smoke.mjs` a partir de la selección aprobada, antes de implementarlo.** No iniciar Tarea 4 automáticamente.

## Tarea 4 — Estructura mínima de qa_smoke.mjs

Tarea 4 completada el 2026-09-22. La sección «Estructura propuesta de qa_smoke.mjs» de [QA_DISENO_FASE2.md](QA_DISENO_FASE2.md) define el futuro orquestador sin implementar código.

Fases aprobadas:

- A — Preflight local;
- B — Salud de entorno;
- C — Invariantes y contratos;
- D — Escenario funcional mínimo;
- E — Cleanup;
- F — Resultado.

La política fail-fast distingue `CRITICAL_FAIL`, `WARN` y `FAIL_NO_STOP`. La primera versión no asigna casos a `FAIL_NO_STOP`. Un fallo crítico detiene las pruebas funcionales; si ya existen datos, conduce obligatoriamente al cleanup y luego al cierre de evidencia.

Quedaron definidos el manifest pequeño por ejecución, su almacenamiento fuera de Git, la captura inmediata de IDs exactos, la salida humana resumida y los estados `NOT_RUN`/`NOT_REQUIRED`. La primera versión prevé un único archivo futuro, `scripts/lab030/qa_smoke.mjs`; no se justifica todavía un auxiliar.

Aún no existe implementación. No se crearon ni modificaron scripts o workflows y no se ejecutaron pruebas, Node ni E2.

Próximo paso: **TAREA 5 — implementar la primera versión mínima de `qa_smoke.mjs` sin ejecutar E2.** No iniciar Tarea 5 automáticamente.

## Tarea 5 — Primera versión local de qa_smoke.mjs

Tarea 5 completada el 2026-09-22. Se creó `scripts/lab030/qa_smoke.mjs` como un único orquestador de alcance estrictamente local en esta versión.

Implementación disponible:

- Fase A — Preflight local: archivos y rutas requeridos, documentación, tres workflows LAB-029, componentes reutilizables, formato del `run_id` y detección por nombre/presencia de variables remotas sin leer ni imprimir valores.
- Fase C — Invariantes y contratos locales: JSON parseable, forma mínima, conexiones, nombres e IDs únicos, trigger esperado por workflow, webhook/respuesta para Público e Interno, nodos críticos públicos, ausencia de la referencia pública prohibida, placeholders críticos y patrones de secretos incrustados.
- Fase F — Resultado: manifest exclusivamente en memoria, tiempos, lista de pruebas, IDs creados vacíos, cleanup esperado/real vacíos, resumen corto y aptitud para piloto `NOT_DETERMINED`.

Fases sin ejecución remota:

- Fase B — Salud de entorno: `NOT_RUN`.
- Fase D — Escenario funcional E2: `NOT_RUN`.
- Fase E — Cleanup: `NOT_REQUIRED`, porque no se creó ningún dato.

Validación local:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**. El primer intento dentro del sandbox no llegó a analizar el archivo por `EPERM` al resolver `C:/Users/DELL`; la repetición local autorizada fuera del sandbox pasó.
- `node scripts/lab030/qa_smoke.mjs`: **PASS local** después de corregir una invariante demasiado amplia que exigía webhook al workflow de Gestión. El control final exige trigger válido a los tres workflows y webhook/respuesta únicamente a Público e Interno.
- Resultado: Preflight `PASS`, Salud `NOT_RUN`, Contratos `PASS`, Funcional E2 `NOT_RUN`, Cleanup `NOT_REQUIRED`, resultado local `PASS`.
- Tiempo observado final: 0.063 s.
- Aptitud para piloto: no determinada por esta versión local.

No hubo llamadas E2 o remotas, datos remotos creados ni cleanup real. No se modificaron scripts históricos ni workflows. El script no usa red, no escribe archivos y conserva el manifest solo en memoria.

Próximo paso: **TAREA 6 — validar y completar el preflight/contratos locales de `qa_smoke.mjs` antes de incorporar ejecución E2.** No iniciar Tarea 6 automáticamente.

## Tarea 6 — Preflight y contratos locales reforzados

Tarea 6 completada el 2026-09-22. Se revisaron y reforzaron exclusivamente las fases A y C de `scripts/lab030/qa_smoke.mjs`.

Ajustes realizados:

- clasificación explícita de configuración como `LOCAL_REQUIRED`, `E2_FUTURE` u `OPTIONAL`;
- detección de presencia de variables E2 únicamente por nombre, sin leer ni imprimir valores y sin fallar en modo LOCAL cuando están ausentes;
- normalización y validación segura de rutas relativas;
- comprobación de referencias de conexiones: origen, forma de salidas y destino existente;
- invariantes mínimas específicas de Gestión, Público e Interno, sin exigir webhook a Gestión;
- contrato público representativo con `ok`, `clinic_id`, `session_id` y `reply`, y rechazo de campos internos evidentes;
- componentes críticos públicos de RAG, agenda, urgencias y fail-closed;
- componentes internos de identidad, usuario, permisos, autorización, control de clínica y RAG protegido;
- componentes de Gestión para contrato documental, staging, activación y rollback;
- rechazo ligero de `LAB029_TEST`, referencia pública prohibida, placeholders críticos, credenciales en URL, claves/tokens evidentes y bearer literal, sin rechazar nombres de variables o credenciales de n8n.

No se incorporó el validador completo LAB-029 ni se recorrió la lógica de cada nodo. El smoke conserva solo invariantes capaces de detectar rotura estructural, contractual, de aislamiento o configuración evidente.

Validación local final:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- ejecución local: **PASS**;
- Preflight: `PASS`, 0.004 s;
- Salud de entorno: `NOT_RUN`;
- Contratos: `PASS`, 0.032 s;
- Funcional E2: `NOT_RUN`;
- Cleanup: `NOT_REQUIRED`;
- duración total local: 0.073 s;
- aptitud para piloto: no determinada.

La ejecución continúa siendo rápida, estrictamente local, sin red, E2, escrituras, fixtures, datos remotos o cleanup real. No se modificaron workflows ni scripts históricos.

Próximo paso: **TAREA 7 — diseñar el preflight E2 y la comprobación de salud remota que alimentarán la Fase B, sin ejecutar todavía escenarios funcionales.** No iniciar Tarea 7 automáticamente.

## Tarea 7 — Modo --e2-health preparado

Tarea 7 completada el 2026-09-22. `scripts/lab030/qa_smoke.mjs` incorpora el modo explícito `--e2-health`, separado del modo LOCAL predeterminado.

Preflight E2 health:

- obligatorias únicamente para este modo: `LAB028_N8N_BASE_URL`, `LAB028_N8N_API_TOKEN`, `LAB029_POSTGRES_URI`, `LAB029_QDRANT_URL` y `LAB029_QDRANT_API_KEY`;
- futuras de Fase D: `LAB029_N8N_WEBHOOK_BASE_URL`, `LAB029_INTERNAL_HEADER_NAME` y `LAB029_INTERNAL_HEADER_VALUE`;
- opcional: Git HEAD;
- se registra solo presencia/ausencia; ningún valor sensible entra al manifest o a la salida.

Checks de solo lectura preparados:

- n8n: `GET /healthz` y tiempo de respuesta;
- workflows: lectura individual mediante API para Gestión `s0NoyEyVtO9AgJUk`, Público `BCUJ8lHHFZHj9yld` e Interno `RR555uwDbQ4kTyaZ`;
- estado histórico esperado: Gestión activo, Público inactivo e Interno inactivo; una diferencia de publicación se informa como WARN, mientras ausencia o respuesta inválida es crítica;
- PostgreSQL: `SELECT 1` reutilizando el verificador LAB-029;
- Qdrant: colecciones requeridas y configuración vectorial reutilizando el verificador LAB-029.

El modo aplica fail-fast ante configuración obligatoria ausente, n8n/API no disponible, workflow requerido ausente, PostgreSQL no disponible o Qdrant incompatible/no disponible. Solo realiza GET en n8n/Qdrant y la lectura PostgreSQL mínima; no ejecuta workflows, no publica, no activa, no crea datos y no hace cleanup.

Validación de esta tarea:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- modo LOCAL predeterminado: **PASS**;
- Preflight: 0.009 s;
- Contratos: 0.176 s;
- total local: 0.312 s;
- Salud de entorno: `NOT_RUN`;
- Funcional E2 / Fase D: `NOT_RUN`;
- Cleanup: `NOT_REQUIRED`;
- `--e2-health`: no ejecutado; queda pendiente para Tarea 8 con configuración y acceso E2 controlados.

No hubo llamadas E2, escenarios funcionales, datos creados, cleanup real ni modificaciones de workflows o scripts históricos.

Próximo paso: **TAREA 8 — ejecutar y validar únicamente `--e2-health` contra E2.** No iniciar Tarea 8 automáticamente.

## Tarea 8 — Validación `--e2-health` contra E2

Tarea 8 detenida el 2026-09-22 por el primer fallo real durante el precheck de configuración.

Precheck local:

- rama: `mvp-comercial`;
- cambios limitados a `scripts/lab030/` y `docs/comercial/lab030/`;
- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- modo local: **PASS**;
- Preflight: `PASS`, 0.010 s;
- Salud de entorno: `NOT_RUN`, 0.000 s;
- Contratos: `PASS`, 0.085 s;
- Funcional E2: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total local: 0.281 s.

Resultado global de Fase B: `CRITICAL_FAIL` por configuración E2 incompleta. Las cinco variables requeridas estaban ausentes en el entorno operativo:

- `LAB028_N8N_BASE_URL`;
- `LAB028_N8N_API_TOKEN`;
- `LAB029_POSTGRES_URI`;
- `LAB029_QDRANT_URL`;
- `LAB029_QDRANT_API_KEY`.

La ejecución `node scripts/lab030/qa_smoke.mjs --e2-health` no se inició. No se realizaron llamadas remotas. Estado observado:

- n8n health: `NOT_RUN`;
- workflow Gestión: `NOT_RUN`;
- workflow Público: `NOT_RUN`;
- workflow Interno: `NOT_RUN`;
- PostgreSQL: `NOT_RUN`;
- Qdrant: `NOT_RUN`;
- tiempos por check E2: no disponibles;
- tiempo total E2: no disponible.

Fase D permaneció `NOT_RUN`. No se crearon datos, no se modificaron workflows ni sus estados y cleanup permaneció `NOT_REQUIRED`. No se modificó `scripts/lab030/qa_smoke.mjs`. No se realizó commit ni push.

Próximo paso: disponer de forma segura las cinco variables requeridas en el entorno operativo y repetir únicamente la Tarea 8 con `--e2-health`. No iniciar la Tarea 9 hasta completar esta validación.

## Tarea 8B — Adaptación de `--e2-health` a la configuración E2

Tarea 8B completada el 2026-09-24. El `CRITICAL_FAIL` anterior fue causado por un preflight que exigía cinco variables con nombres LAB aunque la infraestructura E2 utiliza configuración existente con otros nombres y no expone directamente todos los secretos al proceso.

Se adaptó exclusivamente `scripts/lab030/qa_smoke.mjs`:

- la URL base de n8n se resuelve, en orden, desde `LAB028_N8N_BASE_URL`, `N8N_EDITOR_BASE_URL` o la combinación validada de `N8N_PROTOCOL` y `N8N_HOST`;
- no se inventa protocolo y se rechazan URLs inválidas o con credenciales incrustadas;
- `LAB028_N8N_API_TOKEN` pasa a ser opcional para `GET /healthz`;
- sin token, la consulta administrativa de workflows queda `WARN` y no se ejecuta;
- sin `LAB029_POSTGRES_URI`, el health directo de PostgreSQL queda `WARN` y no se ejecuta; la validación real de persistencia se reserva para un mecanismo posterior que use de forma segura la credencial existente en n8n;
- Qdrant acepta `LAB029_QDRANT_API_KEY` y, como segundo alias, `QDRANT_API_KEY`; `LAB029_QDRANT_URL` se mantiene;
- la Fase B queda `WARN` cuando los únicos checks omitidos son workflows por falta de token o PostgreSQL por falta de URI;
- permanecen críticos la imposibilidad de resolver una URL válida para n8n, el fallo de `/healthz`, una configuración Qdrant insuficiente y un fallo real de Qdrant.

Validación local:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- `node scripts/lab030/qa_smoke.mjs`: **PASS local**;
- Preflight: `PASS`, 0.012 s;
- Salud de entorno: `NOT_RUN`, 0.000 s;
- Contratos: `PASS`, 0.205 s;
- Funcional E2: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total local: 0.292 s.

No se ejecutó `--e2-health`, no hubo red ni E2, no se crearon o duplicaron secretos, no se modificaron `.env`, compose, workflows o scripts históricos y no se crearon datos.

Próximo paso: **TAREA 8C — ejecutar nuevamente `--e2-health` usando la configuración real disponible en E2.** No iniciar Tarea 8C automáticamente.

## Tarea 8C — Ejecución de `--e2-health` con configuración E2

Tarea 8C detenida el 2026-09-27 por el primer `CRITICAL_FAIL` del preflight.

Precheck local:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- modo LOCAL: **PASS**;
- Preflight: `PASS`, 0.002 s;
- Salud de entorno: `NOT_RUN`, 0.000 s;
- Contratos: `PASS`, 0.100 s;
- Funcional E2: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total local: 0.141 s;
- el modo local no realizó red ni escrituras.

Resultado de `node scripts/lab030/qa_smoke.mjs --e2-health`:

- Preflight: `CRITICAL_FAIL`, 0.002 s;
- causa sanitizada: `qdrant_url_ausente`;
- Fase B / Salud de entorno: `NOT_RUN`, 0.000 s;
- n8n `/healthz`: `NOT_RUN`;
- API de workflows: `NOT_RUN`;
- Gestión: `NOT_RUN`;
- Público: `NOT_RUN`;
- Interno: `NOT_RUN`;
- PostgreSQL: `NOT_RUN`;
- Qdrant: `NOT_RUN`;
- Contratos: `NOT_RUN`, 0.000 s;
- Fase D: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total: 0.042 s;
- resultado global: `FAIL` debido al `CRITICAL_FAIL` del preflight.

Diagnóstico limitado al primer fallo: `LAB029_QDRANT_URL`, verificada previamente como presente en el `.env` de E2, no estaba exportada al proceso desde el que se ejecutó el smoke. La ejecución se detuvo antes de cualquier acceso remoto. No se cambió código porque el fallo corresponde al contexto de ejecución y no a la resolución de aliases implementada en Tarea 8B.

No se crearon datos, no hubo llamadas remotas, no se ejecutó cleanup real y no se modificaron workflows, `.env`, compose o scripts históricos.

Próximo paso: repetir únicamente Tarea 8C desde un proceso que cargue de forma segura la configuración existente de E2, comenzando por resolver `LAB029_QDRANT_URL`. No iniciar Tarea 9 mientras este `CRITICAL_FAIL` permanezca.

## Tarea 8D — Validación manual de salud E2 y cierre de Fase B

Tarea 8D completada el 2026-09-27. Después de Tarea 8C se realizó una validación manual directamente en E2, sin ejecutar pruebas desde esta tarea.

Estado de Fase B: **WARN controlado**.

La salud esencial quedó comprobada satisfactoriamente, pero dos comprobaciones opcionales/directas permanecen `NOT_RUN` porque sus credenciales no están expuestas al proceso de QA:

- n8n `GET /healthz`: **PASS**, HTTP 200;
- Qdrant `GET /collections` con la autenticación existente: **PASS**, HTTP 200;
- API administrativa de workflows: `NOT_RUN`, porque no existe un N8N API token expuesto al proceso de QA;
- PostgreSQL directo: `NOT_RUN`, porque no existe una URI PostgreSQL expuesta al proceso de QA;
- Cleanup: `NOT_REQUIRED`.

`qa_smoke.mjs --e2-health` no fue ejecutado de punta a punta. La validación se realizó manualmente directamente en E2 y los checks esenciales equivalentes de n8n y Qdrant dieron `PASS`. Queda pendiente validar el runner automatizado cuando LAB-030 esté disponible en el entorno E2, sin introducir mecanismos inseguros para mover secretos. Esta brecha no bloquea por sí sola continuar con el escenario funcional mínimo.

No se crearon datos, no se modificaron workflows o infraestructura y no se mostraron secretos.

Próximo paso: **TAREA 9 — incorporar y ejecutar el primer escenario funcional E2 mínimo de RAG/contrato público, sin reservas todavía.** No iniciar Tarea 9 automáticamente.

## Tarea 8E — Alineación con EQAB v1.0 y EWB v1.0

Tarea 8E completada el 2026-09-29. Se creó [ALINEACION_EQAB_EWB.md](ALINEACION_EQAB_EWB.md) mediante mapeo documental de evidencia existente, sin reabrir LAB anteriores, ejecutar pruebas o remediar brechas.

Baselines utilizados:

- EQAB v1.0 — Emactiva Quality Assurance Baseline;
- EWB v1.0 — Emactiva Work Baseline.

Resumen de 50 controles por baseline:

| Baseline | PASS | WARN | FAIL | N/A | NOT_VERIFIED |
|---|---:|---:|---:|---:|---:|
| EQAB v1.0 | 21 | 22 | 2 | 0 | 5 |
| EWB v1.0 | 39 | 4 | 0 | 5 | 2 |

Evidencias principales reutilizadas: auditoría e inventario LAB-030, matriz QA-01 a QA-08, diseño del smoke y regresión, política fail-fast, manifest/cleanup propuestos, `qa_smoke.mjs`, continuidad del HANDOFF, salud manual E2 y cierres históricos ya referenciados por la auditoría.

Brechas reales: falta un objetivo de rendimiento unificado para la cadena final y falta evidencia de aislamiento multiclínica integral actual para calendario, configuración y operación. Ninguna bloquea preparar el primer escenario mínimo de RAG/contrato público, pero ambas deben tratarse antes del gate de piloto correspondiente.

EPB v1.0 y EDPB v1.0 quedan reconocidos como políticas aplicables, pero no fueron auditados en esta tarea. Su GAP formal se planificará separadamente; antes del gate de piloto deben considerarse las dependencias evidentes de privacidad/protección de datos y preparación de despliegue/operación.

No existe un FAIL bloqueante para continuar el QA hacia Tarea 9A.

Próximo paso: **TAREA 9A — preparar el primer escenario funcional E2 mínimo de RAG/contrato público, sin ejecutar todavía E2.** No iniciar Tarea 9A automáticamente.

## Tarea 9A — Preparación del escenario E2 mínimo de RAG público

Tarea 9A completada el 2026-09-29. `scripts/lab030/qa_smoke.mjs` incorpora el modo explícito `--e2-public-rag`; no se ejecutó este modo contra E2.

Caso seleccionado:

- ID: `LAB030-RAG-PUBLIC-01`;
- fuente histórica: LAB-029 P-01, consulta pública de horario;
- clínica de QA documentada: `clinica_piloto_001`;
- pregunta sintética: día y hora de atención de la clínica;
- comportamiento esperado: contrato público válido y respuesta que contenga semánticamente un día de la semana y una hora, sin comparar el texto completo ni depender del fixture LAB-029 ya eliminado.

El modo conserva la selección explícita: sin argumentos ejecuta LOCAL, `--e2-health` conserva su ruta y `--e2-public-rag` selecciona exclusivamente el caso público. Las variables de entorno no activan E2 por sí solas.

Configuración y datos:

- reutiliza `N8N_PUBLIC_WEBHOOK_URL` como endpoint público completo;
- no contiene IP, dominio, URL E2 o secretos hardcodeados;
- usa `clinic_id`, `session_id`, `channel` y `message` como request mínimo histórico;
- el `session_id` es el `run_id` sintético `LAB030_QA_<timestamp>_<aleatorio>`;
- no usa nombres, teléfonos, correos ni datos clínicos reales.

Validaciones preparadas:

- HTTP exitoso;
- JSON parseable y body objeto;
- `ok === true`;
- `clinic_id` y `session_id` coincidentes;
- `reply` presente y no vacío;
- ausencia de campos internos evidentes;
- compatibilidad semántica con el caso histórico mediante presencia de día y hora, sin igualdad textual completa.

Huella persistente potencial de una petición: sesión o memoria conversacional, auditoría PostgreSQL, evento PostgreSQL u otro registro persistente creado por el workflow. El contrato público no expone sus IDs internos y todavía no existe un mecanismo LAB-030 que los inventarie y elimine por IDs exactos. `created_ids` permanece reservado exclusivamente para IDs exactos; no se autoriza borrado por prefijo.

**Cleanup preparado: NO.** El preflight de `--e2-public-rag` falla cerrado con una causa sanitizada antes de la petición mientras esta brecha siga abierta. No se modificó `QA_DISENO_FASE2.md` porque esta decisión aplica su política existente: no mutar si no puede prepararse cleanup seguro.

Validación local:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- `node scripts/lab030/qa_smoke.mjs`: **PASS local**;
- Preflight: `PASS`, 0.004 s;
- Salud de entorno: `NOT_RUN`, 0.000 s;
- Contratos: `PASS`, 0.128 s;
- Fase D: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total local: 0.195 s.

No se ejecutó E2, no se creó ningún dato y no se activaron o publicaron workflows.

Próximo paso: **TAREA 9B — resolver únicamente la brecha de inventario y cleanup exacto de la petición RAG pública antes de ejecutar E2.** No iniciar Tarea 9B automáticamente.

## Tarea 9B — Inventario y cleanup seguro del RAG público

Tarea 9B completada el 2026-09-29 como análisis y preparación local. No se ejecutó E2.

La ruta efectiva del caso RAG público realiza estas operaciones persistentes:

| Almacén | Operación | Identificador de correlación | Localización segura |
|---|---|---|---|
| n8n Data Table `lab024_estado_urgencia` (`WYCc8CjBsmZij4Wn`) | `upsert` de una fila de contexto no prioritario | `state_key = clinic_id::session_id` | consulta exacta por `state_key`, usando `clinica_piloto_001` y el `session_id` sintético del run |

PostgreSQL y Qdrant son únicamente de lectura en esta rama: PostgreSQL valida la clínica y obtiene versiones públicas activas; Qdrant recupera conocimiento público. No se identificaron escrituras RAG, auditorías, eventos, puntos Qdrant, citas, Calendar u otras Data Tables en el camino que termina en `Responder consulta pública comercial`.

Secuencia futura preparada en el manifest de `--e2-public-rag`:

1. generar run/session sintético;
2. ejecutar una petición pública;
3. inventariar la fila mediante el `state_key` exacto;
4. capturar el ID propio real devuelto por inventario en `created_ids`;
5. borrar exclusivamente ese ID;
6. repetir la consulta exacta por `state_key` y exigir cero filas;
7. cerrar evidencia sanitizada.

La reutilización LAB-029 confirma que los nodos Data Table permiten inventario filtrado y `deleteRows` con condiciones exactas. Sin embargo, el cleanup LAB-029 existente no incluye `lab024_estado_urgencia` y el proceso de QA no dispone de acceso seguro expuesto a Data Tables. Resolverlo actualmente exigiría modificar o publicar un workflow de soporte, o exponer una credencial adicional; ambas acciones están fuera del alcance y no deben improvisarse.

**Cleanup preparado: NO.** Primer bloqueo real: falta una vía segura ya disponible para consultar y eliminar la fila de `lab024_estado_urgencia` desde el proceso QA. El preflight conserva comportamiento fail-closed mediante `cleanup_public_rag_datatable_sin_acceso_seguro`, antes de enviar la petición. No se copió, creó o imprimió ninguna credencial y no se autoriza borrar por prefijos.

`scripts/lab030/qa_smoke.mjs` registra ahora la escritura real, los almacenes de solo lectura, la clave exacta de localización, la estrategia de inventario/borrado/post-check, la dependencia segura y las etapas A–G. `created_ids` solo podrá recibir el ID propio real obtenido por inventario.

Validación local:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- modo LOCAL: **PASS**;
- Preflight: `PASS`, 0.005 s;
- Salud de entorno: `NOT_RUN`, 0.000 s;
- Contratos: `PASS`, 0.058 s;
- Fase D: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total local: 0.134 s.

E2 permanece `NOT_RUN`; no se crearon datos.

Próximo paso: resolver únicamente el acceso seguro de inventario y cleanup exacto a la Data Table `lab024_estado_urgencia`, sin ejecutar todavía el caso RAG público. No iniciar una ejecución E2 automáticamente.

## Tarea 9C — Vía segura de acceso a Data Tables

Tarea 9C completada el 2026-09-30 como decisión técnica local, sin ejecución E2 ni modificación de workflows.

**Opción seleccionada: B — VÍA EXISTENTE REQUIERE ADAPTACIÓN MÍNIMA.**

No existe una vía A directamente reutilizable: el workflow Gestión vigente no ofrece una operación limitada a `lab024_estado_urgencia`, y los endpoints de cleanup LAB-029 no incluyen esta tabla ni el contrato LAB-030.

La vía elegida reutiliza el patrón ya probado de:

- `scripts/lab029/crear_workflow_precheck_cleanup_lab029.mjs` para webhook protegido, guarda exacta e inventario Data Table;
- `scripts/lab029/crear_workflow_cleanup_execute_lab029.mjs` para snapshot sellado y `deleteRows` restringido;
- `scripts/lab029/ejecutar_cleanup_runtime_lab029.mjs` para precheck, comparación del snapshot, ejecución y post-check.

Cambio mínimo requerido en una tarea posterior: crear una adaptación LAB-030 temporal y protegida, sin modificar los scripts históricos, que:

1. use el Header Auth existente mediante `LAB029_INTERNAL_HEADER_NAME` y `LAB029_INTERNAL_HEADER_VALUE`, y la base ya existente `LAB029_N8N_WEBHOOK_BASE_URL`;
2. acepte únicamente `clinic_id = clinica_piloto_001`, un `session_id` con formato exacto LAB-030 y `state_key = clinic_id::session_id`;
3. fije la tabla `lab024_estado_urgencia` (`WYCc8CjBsmZij4Wn`) y prohíba tabla dinámica;
4. consulte con igualdad exacta de `state_key`, sin prefijos o wildcards;
5. exija exactamente una fila y devuelva solo su ID propio y `state_key`;
6. selle el inventario antes de borrar y rechace cualquier diferencia;
7. borre exclusivamente el ID previamente inventariado;
8. repita la consulta exacta y exija cero filas.

La implementación debe verificar primero que el nodo Data Table expone un ID propio utilizable para el borrado. Si no lo expone, debe detenerse; no se sustituirá silenciosamente por un borrado más amplio. No se accederá directamente a tablas internas de n8n y no se expondrá una credencial Data Table al runner.

Riesgos controlados: endpoint temporal publicado más tiempo del necesario, parámetros alterados, cardinalidad distinta de uno, ID ausente, estado cambiado entre precheck y borrado, o respuesta con datos excesivos. Header Auth, validación estricta, snapshot sellado, tabla fija, respuesta mínima y fail-closed son requisitos obligatorios.

`scripts/lab030/qa_smoke.mjs` registra la opción B, el mecanismo, las tres variables existentes requeridas, las fuentes reutilizables y las guardas. Conserva `cleanup_ready = false` y falla cerrado con `cleanup_public_rag_endpoint_protegido_pendiente`.

**Cleanup preparado: NO**, porque la adaptación protegida todavía no está implementada ni se ha demostrado la disponibilidad del ID propio de fila.

Validación local:

- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- modo LOCAL: **PASS**;
- Preflight: `PASS`, 0.005 s;
- Salud de entorno: `NOT_RUN`, 0.000 s;
- Contratos: `PASS`, 0.037 s;
- Fase D: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total local: 0.098 s.

E2 permanece `NOT_RUN` y no se crearon datos.

Próximo paso: implementar localmente la adaptación mínima LAB-030 del workflow temporal protegido y su runner, sin publicar ni ejecutar E2, verificando en el contrato generado la obtención y el borrado por ID exacto. No iniciar ejecución E2 automáticamente.

## Tarea 9D — Workflow temporal local de inventario/cleanup

Tarea 9D completada el 2026-09-30. Se implementó localmente `scripts/lab030/workflow_temporal_cleanup_rag_publico.json`; permanece `active: false` y no fue importado, publicado ni ejecutado.

Artefactos:

- creado `scripts/lab030/workflow_temporal_cleanup_rag_publico.json`;
- actualizado `scripts/lab030/qa_smoke.mjs` para registrar el contrato y validarlo en modo LOCAL;
- actualizado este HANDOFF.

Mecanismo reutilizado: patrón LAB-029 de webhook con Header Auth, precheck Data Table, guarda fail-closed, comparación de snapshot, `deleteRows` exacto y post-check.

**Clasificación del ID: B — el ID interno no está confirmado por el contrato local versionado, pero existe una clave exacta soportada para borrar una única fila.** Los exports y scripts existentes demuestran `get` y `deleteRows` mediante filtros de igualdad sobre columnas del esquema; no demuestran que el ID interno sea una columna filtrable. El inventario devolverá `row_id` si n8n lo expone, pero la garantía de cleanup se basa en la clave compuesta única `state_key`.

Estrategia preparada:

1. inventario protegido por Header Auth con igualdad exacta sobre `state_key` en la tabla fija `WYCc8CjBsmZij4Wn`;
2. validación de `clinic_id = clinica_piloto_001`, formato exacto de `session_id` LAB-030 y `state_key = clinic_id::session_id`;
3. exigencia de exactamente una fila;
4. respuesta mínima con `state_key`, snapshot de `created_at`/`updated_at` y `row_id` solo si está expuesto;
5. relectura previa al borrado y comparación exacta con el snapshot;
6. `deleteRows` con una única condición de igualdad sobre `state_key`;
7. post-check protegido con la misma clave y exigencia de cero filas.

El workflow no admite tabla dinámica, prefijos, wildcards, selección masiva o parámetros incompletos. Usa un placeholder de configuración para asociar el Header Auth ya existente durante el despliegue; no contiene secretos. `qa_smoke.mjs` comprueba localmente que existen tres webhooks autenticados, cuatro nodos Data Table sobre la tabla fija, un único borrado, filtros exclusivamente por `state_key`, guarda de cardinalidad, comparación de snapshot y post-check cero.

**Cleanup preparado localmente: SÍ. Cleanup operativo: NO**, hasta importar/configurar de forma controlada el workflow temporal con la credencial Header Auth existente. El modo `--e2-public-rag` conserva fail-closed y no fue ejecutado.

Validaciones locales:

- JSON parseable: **PASS**, `active: false`, 16 nodos;
- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- modo LOCAL: **PASS**;
- Preflight: `PASS`, 0.006 s;
- Salud de entorno: `NOT_RUN`, 0.000 s;
- Contratos: `PASS`, 0.040 s;
- Fase D: `NOT_RUN`, 0.000 s;
- Cleanup: `NOT_REQUIRED`, 0.000 s;
- tiempo total local: 0.106 s.

No se ejecutó E2, Docker o workflow; no se modificó infraestructura y no se crearon datos.

Próximo paso: **TAREA 9E — desplegar y configurar de forma controlada el workflow temporal en E2, sin ejecutar todavía el caso RAG.** No iniciar Tarea 9E automáticamente.

## Preparación del documento público sintético para el smoke RAG

Tarea completada el 2026-09-30 sin ejecución E2, Docker, PostgreSQL/Qdrant remotos o workflows.

Causa real consolidada: el primer smoke RAG no dispone de conocimiento público activo para `clinica_piloto_001`; la consulta final exige un documento `public` activo y una versión `active`. No se autoriza insertar manualmente en PostgreSQL.

Mecanismo LAB-029 reutilizado: workflow `LAB-029 - Gestión documental persistente y versionada`, expuesto en ejecución controlada mediante el patrón de driver protegido con Header Auth de `scripts/lab029/preparar_runtime_lab029.mjs`. Gestión valida el contrato, crea o actualiza `documents`, genera una versión staging, inserta el contenido en `vetatiende_publico`, valida el punto y activa la versión coordinadamente en PostgreSQL/Qdrant.

Artefactos creados:

- `scripts/lab030/fixtures/rag_publico_clinica_piloto_001.txt`;
- `scripts/lab030/preparar_documento_rag_publico.mjs`;
- `scripts/lab030/cleanup_documento_rag_publico.mjs`.

Se actualizó `scripts/lab030/qa_smoke.mjs` para exigir estos artefactos durante el preflight LOCAL.

Payload exacto preparado:

- `action`: `ingest`;
- `clinic_id`: `clinica_piloto_001`;
- `document_id`: `LAB030_QA_DOC_PUBLIC_HORARIOS_001`;
- `document_type`: `faq`;
- `visibility`: `public`;
- `access_level`: `null`;
- `source_file`: `scripts/lab030/fixtures/rag_publico_clinica_piloto_001.txt`;
- `content_hash`: `0c1e8ac9d2cc2fbe9c3c12f9692c3532b3681da3a4d55533cd1d930cef1d3e5a`;
- `document_content`: texto sintético de horario, sin datos personales;
- `target_version_id`: cadena vacía para la acción `ingest`.

El preparador no usa red por defecto. Un futuro `--e2` exige explícitamente un endpoint de driver Gestión y reutiliza `LAB029_INTERNAL_HEADER_NAME`/`LAB029_INTERNAL_HEADER_VALUE`; falla cerrado si falta configuración, la URL es inválida o contiene credenciales.

Cleanup preparado localmente:

1. inventariar por igualdad exacta de `clinic_id` y `document_id` en PostgreSQL;
2. obtener IDs reales de versiones y eventos asociados;
3. inventariar puntos Qdrant mediante metadata exacta de clínica y documento;
4. validar que ningún registro pertenece a otro documento o clínica;
5. borrar por IDs exactos en orden: puntos Qdrant, eventos, versiones y documento;
6. no borrar nunca `clinica_piloto_001`;
7. repetir el inventario y exigir cero documentos, versiones, eventos y puntos para el documento exacto.

El script de cleanup opera por defecto en `PLAN_ONLY`; con un inventario local válido produce `EXACT_IDS_READY`. No implementa todavía una llamada E2: requiere el endpoint temporal protegido de inventario/borrado/post-check antes de una ejecución real.

Validaciones locales:

- `node --check` del preparador: **PASS**;
- `node --check` del cleanup: **PASS**;
- `node --check scripts/lab030/qa_smoke.mjs`: **PASS**;
- preparador no-red: **PASS**, payload y SHA-256 reproducibles;
- cleanup `PLAN_ONLY`: **PASS**;
- cleanup con inventario sintético exacto: **PASS**, produjo únicamente un punto, evento, versión y documento sintéticos;
- smoke LOCAL final: **PASS**;
- Preflight: `PASS`, 0.003 s;
- Contratos: `PASS`, 0.032 s;
- Fase D: `NOT_RUN`;
- Cleanup runtime: `NOT_REQUIRED`;
- tiempo total LOCAL: 0.072 s.

WARN / NOT_VERIFIED:

- el driver Gestión protegido aún no está desplegado/configurado para este documento;
- los IDs reales de versión, eventos y puntos solo pueden capturarse después de la futura ingesta;
- el endpoint protegido de cleanup documental todavía no está desplegado;
- activación, cleanup y post-check reales permanecen `NOT_VERIFIED` hasta la ejecución controlada.

Próximo paso exacto para ChatGPT: definir una tarea controlada que genere y despliegue en E2 el driver Gestión y el endpoint temporal de inventario/cleanup documental usando credenciales existentes, sin ingerir todavía el documento. Después, en otra tarea aprobada, ejecutar ingesta → verificación active → smoke RAG → cleanup exacto → post-check.

## Tarea 9E — preparación del despliegue de temporales en E2

Tarea completada localmente el 2026-09-30. **E2 y despliegue permanecen NOT_RUN.**

Se materializó el driver reproducible `scripts/lab030/workflow_temporal_gestion_documental.json` mediante `scripts/lab030/generar_workflow_temporal_gestion_documental.mjs`, tomando como fuente inmutable el workflow Gestión LAB-029. El export se llama `LAB-030 TEMP driver Gestión documental`, contiene 40 nodos, permanece `active: false` y expone `POST /webhook/lab030-qa-gestion-documental` con Header Auth existente.

El segundo artefacto es `scripts/lab030/workflow_temporal_cleanup_rag_publico.json`: `LAB-030 TEMP cleanup RAG público`, 16 nodos, `active: false`, con endpoints POST protegidos de inventario, delete y post-check. Opera solo sobre la Data Table fija `lab024_estado_urgencia` (`WYCc8CjBsmZij4Wn`) y una `state_key` exacta. El cleanup documental permanece `PLAN_ONLY`; como 9E no ejecutó la ingestión, no existe huella documental nueva.

Ambos exports usan el placeholder `CONFIGURE_EXISTING_HEADER_AUTH` y requieren que Cristian asigne visualmente `VetAtiende Internal Header Auth` después de importarlos. No contienen secretos. Gestión reutiliza `Postgres account`, `VetAtiende Qdrant Comercial`, `Cohere comercial LAB-021` y `LAB029_QDRANT_URL`; cleanup de sesión no requiere PostgreSQL/Qdrant.

El procedimiento reproducible, el orden de importación/configuración, las comprobaciones no destructivas futuras, la evidencia y el rollback están en `docs/comercial/lab030/DESPLIEGUE_TEMPORALES_E2.md`. No se necesita SSH ni Docker Compose para la importación visual. En 9E ambos workflows deben quedar importados pero inactivos; esta preparación local no realizó la importación.

Resultado: procedimiento E2 **PREPARADO**, despliegue **NOT_RUN**, ingestión **NOT_RUN**, cleanup **NOT_RUN**. No se modificó LAB-029 ni el workflow público.

Próximo paso exacto: Cristian importa y configura ambos JSON en n8n E2 siguiendo el procedimiento, captura los IDs y evidencia, y los deja inactivos. La activación temporal y la secuencia `ingestión → smoke RAG → cleanup → post-check` requieren una tarea posterior explícita.

## Corrección focalizada del driver temporal de Gestión documental

Corrección local completada el 2026-09-30. **E2 permanece NOT_VERIFIED.**

Fallo observado en la ingestión E2 anterior: HTTP 500 en `Marcar staging failed PostgreSQL LAB-029` con `Node 'Restaurar contexto tras staging PostgreSQL LAB-029' hasn't been executed`.

Causa raíz: varias salidas de error convergían en handlers cuyas expresiones obtenían `version_id`, `document_id`, `active_version_id` y `target_version_id` directamente desde nodos de ramas de éxito. En fallos anteriores a esos nodos, n8n evaluaba una referencia a un nodo no ejecutado. El mismo patrón existía en compensaciones de ingestión y rollback.

Corrección aplicada en `generar_workflow_temporal_gestion_documental.mjs` y regenerada en `workflow_temporal_gestion_documental.json`:

- separación de errores previos a la creación de staging, error de creación y errores posteriores a un staging confirmado;
- transporte explícito del contexto vigente antes de ejecutar marcaciones o compensaciones;
- restauración explícita del contexto después de respuestas PostgreSQL/Qdrant que sustituyen el item de entrada;
- handlers de `failed` y compensación consumen exclusivamente `$json` de su rama actual;
- separación del fallo de lectura inicial de rollback, donde todavía no existe contexto de rollback;
- conservación de la marcación PostgreSQL `failed` ante un error de creación staging usando el contexto garantizado de `Decidir staging documental LAB-029`;
- eliminación de referencias directas a nodos potencialmente no ejecutados dentro de las operaciones de marcación y compensación.

Validaciones locales: `node --check` del generador **PASS**; generación local/no-red **PASS**; JSON parseable, inactivo y con estructura válida **PASS**; auditoría estática de todas las salidas `continueErrorOutput` y referencias cruzadas de handlers **PASS**; revisión de secretos **PASS**; `git diff --check` **PASS**.

No se modificó ningún workflow productivo remoto, Docker Compose o LAB anterior. No se ejecutaron E2, ingestión o cleanup.

Siguiente paso exacto: volver a generar el artefacto, importar/actualizar únicamente `LAB-030 TEMP driver Gestión documental` en n8n E2, reasignar las credenciales existentes sin exponerlas y repetir la ingestión sintética en una tarea E2 autorizada.

## Corrección de precondición QA E2 — clínica sintética

Preparación local completada el 2026-09-30. **E2 permanece NOT_VERIFIED.**

La segunda ingestión E2 anterior alcanzó `Asegurar documento nuevo PostgreSQL LAB-029` y falló por la FK `documents_clinic_id_fkey`: `clinica_piloto_001` no existe en `vetatiende_documental.clinics`. La consulta operativa previa aportada para esta tarea confirmó su ausencia y mostró únicamente clínicas sintéticas `lab029_test_*`. No se repitió la consulta contra E2.

El esquema versionado en `scripts/lab029/migraciones/001_dominio_documental.sql` define para `clinics` tres campos mínimos explícitos: `clinic_id` con formato `^[a-z0-9][a-z0-9_-]{2,63}$`, `name` no vacío y `status` en `active|inactive`. `created_at` y `updated_at` son `NOT NULL` con `DEFAULT now()`. El patrón LAB-029 histórico inserta `clinic_id`, `name`, `status` y usa `active` para fixtures QA.

Artefactos preparados:

- `scripts/lab030/fixtures/asegurar_clinica_piloto_001.sql`: inserta exclusivamente `clinica_piloto_001`, nombre sintético `LAB030_QA Clínica Piloto 001` y estado `active`; usa `ON CONFLICT (clinic_id) DO NOTHING`, no modifica una fila existente y devuelve `CREATED` o `ALREADY_EXISTS_UNCHANGED`. Después exige que el estado final exista y sea `active`.
- `scripts/lab030/fixtures/cleanup_clinica_piloto_001.sql`: acepta borrar únicamente el ID exacto con el nombre exacto del fixture, falla cerrado si el nombre difiere o existen documentos/eventos dependientes, y verifica `post_check_zero`.
- `scripts/lab030/validar_fixture_clinica_qa.mjs`: valida localmente el contrato del esquema, la idempotencia sin update, las guardas del cleanup, la ausencia de filtros amplios y la ausencia de secretos. No usa red.

No se modificó el driver temporal ni ningún workflow. No se creó la clínica en E2 y no se ejecutaron ingestión o cleanup.

Siguiente paso exacto: ejecutar únicamente `asegurar_clinica_piloto_001.sql` de forma controlada sobre PostgreSQL E2, capturar `fixture_result`, verificar la fila exacta activa y detenerse. Solo después debe autorizarse una nueva repetición de la ingestión sintética.

## Runner temporal E2 para precondición `clinica_piloto_001`

Preparación local completada el 2026-10-01. **E2 permanece NOT_VERIFIED.**

Se creó un workflow independiente para conservar el propósito del driver Gestión y de los workflows de cleanup:

- `scripts/lab030/generar_workflow_precondicion_clinica_e2.mjs`;
- `scripts/lab030/workflow_temporal_precondicion_clinica_e2.json`;
- nombre n8n `LAB-030 TEMP precondición clínica QA E2`;
- tres nodos, `active: false`;
- `POST /webhook/lab030-qa-ensure-clinic` con Header Auth existente;
- credencial PostgreSQL existente `Postgres account`.

El generador lee directamente `fixtures/asegurar_clinica_piloto_001.sql`. El SQL se normalizó como una única sentencia compatible con el nodo PostgreSQL: inserción fija con `ON CONFLICT DO NOTHING`, lectura posterior exacta y booleano `post_check_valid`. No recibe parámetros del request, no actualiza filas existentes y no contiene cleanup.

El procedimiento de importación, configuración, llamada futura autorizada y retirada está documentado en `docs/comercial/lab030/PRECONDICION_CLINICA_E2.md`. No contiene secretos.

Validaciones locales: sintaxis del generador **PASS**; generación local/no-red **PASS**; JSON y estructura **PASS**; fixture **PASS**; revisión de secretos **PASS**; `git diff --check` **PASS**.

No se modificó el driver temporal, Docker Compose o workflows productivos. No se ejecutaron E2, creación de clínica, ingestión o cleanup.

Siguiente paso exacto: importar/configurar este único workflow en n8n E2, activarlo durante una llamada controlada, aceptar exclusivamente evidencia `CREATED` o `ALREADY_EXISTS_UNCHANGED` con `post_check_valid=true`, desactivarlo y detenerse antes de repetir la ingestión.

## Post-check único post-ingestión

La ingestión E2 del documento sintético fue ejecutada externamente y reportada como exitosa: workflow `LAB-030 TEMP driver Gestión documental`, ejecución n8n **#2638**, estado `Succeeded`, petición 17.595 s y tiempo interno 16.325 s. Identidad: `clinica_piloto_001` / `LAB030_QA_DOC_PUBLIC_HORARIOS_001`, hash `0c1e8ac9d2cc2fbe9c3c12f9692c3532b3681da3a4d55533cd1d930cef1d3e5a`.

Se preparó `scripts/lab030/workflow_temporal_postcheck_documento_e2.json`, generado por `generar_workflow_postcheck_documento_e2.mjs`. Es independiente, protegido, de solo lectura, cinco nodos y `active: false`. PostgreSQL verifica documento, clínica, versión activa real, hash, estado y evento `activated/accepted`. Qdrant ejecuta únicamente `points/scroll` sobre `vetatiende_publico` con filtros exactos de clínica, documento, `version_id`, estado y hash. La consolidación devuelve `POSTCHECK_OK`, `DOCUMENT_FOUND`, `VERSION_FOUND`, `VERSION_ID`, `VERSION_STATUS`, `EVENT_FOUND`, `QDRANT_FOUND` y `CONSISTENCY_OK`.

El proceso local no dispone de las credenciales/URLs necesarias para ejecutar el post-check contra E2; solo se comprobó su ausencia sin mostrar valores. Estado actual: **POSTCHECK_NOT_VERIFIED**.

Validaciones locales: sintaxis y generación no-red **PASS**; JSON y estructura de solo lectura **PASS**; revisión de secretos **PASS**; `git diff --check` **PASS**.

No se volvió a ingerir, no se ejecutó cleanup y no se modificaron datos o workflows productivos.

Siguiente paso exacto: importar/configurar únicamente `LAB-030 TEMP post-check documento RAG E2`, activarlo para una sola llamada protegida, capturar el JSON, exigir `POSTCHECK_OK=true` y `CONSISTENCY_OK=true`, desactivarlo y detenerse antes del cleanup.

## Cleanup documental exacto de la ingestión #2638

Implementación local completada el 2026-10-01. El post-check E2 reportado para la ingestión #2638 fue **PASS**: documento y versión activos, eventos `staged`, `validated`, `activated`, un punto Qdrant, `POSTCHECK_OK=true` y `CONSISTENCY_OK=true`.

Entidades exactas de la huella confirmada por el esquema y la evidencia: un documento `LAB030_QA_DOC_PUBLIC_HORARIOS_001`, una versión `ver_LAB030_QA_DOC_PUBLIC_HORARIOS_001_2638_1790884866372`, tres eventos vinculados a esa versión y un punto de `vetatiende_publico`. La clínica `clinica_piloto_001` queda excluida del borrado.

Se reforzó `cleanup_documento_rag_publico.mjs` con los selectores exactos, hash, versión, tipos de evento y cardinalidad Qdrant. Se creó `generar_workflow_cleanup_documento_e2.mjs`, que produce `workflow_temporal_cleanup_documento_e2.json`, workflow protegido e inactivo con tres endpoints separados:

- `POST /webhook/lab030-document-cleanup-inventory`: solo lectura; devuelve `created_ids` exactos y snapshot de la clínica;
- `POST /webhook/lab030-document-cleanup-delete`: exige confirmación explícita y el manifest exacto, borra un punto Qdrant por ID y luego tres eventos, una versión y un documento por IDs/selectores exactos;
- `POST /webhook/lab030-document-cleanup-postcheck`: solo lectura; exige cero residuos y confirma que la clínica conserva nombre, estado y timestamps del snapshot.

El DELETE falla cerrado por cardinalidad, pertenencia, hash o snapshot divergentes. No contiene ningún `DELETE` sobre `clinics`. Mantiene orden Qdrant → eventos → versión → documento, conforme al mecanismo LAB-029 validado.

Validaciones locales: sintaxis y ejecución no-red **PASS**; JSON y grafo **PASS**; SQL revisado estructuralmente **PASS**; payload Qdrant exacto **PASS**; referencias entre ramas **PASS**; secretos **PASS**; `git diff --check` **PASS**.

Estado cleanup E2: **NOT_VERIFIED**. No se ejecutó DELETE ni cleanup remoto.

Siguiente paso exacto: importar/configurar `LAB-030 TEMP cleanup documental E2`, ejecutar únicamente `INVENTORY`, guardar íntegramente `created_ids` y `clinic_snapshot`, comparar la cardinalidad esperada 3/1/1/1 y detenerse. Nunca iniciar DELETE directamente.

## Corrección del post-check PostgreSQL después del DELETE

Corrección local completada el 2026-10-06. El DELETE LAB-030 ya fue ejecutado correctamente y **no debe repetirse**: 3 eventos, 1 versión y 1 documento eliminados; 0 clínicas eliminadas.

El POST_CHECK E2 posterior quedó **NOT_VERIFIED** porque `Consultar persistencia PostgreSQL LAB-030` no encontró filas documentales y tenía `Always Output Data` activado. n8n generó `[{}]`; `Validar persistencia PostgreSQL LAB-030` esperaba una fila documental física y lanzó `LAB030_POSTCHECK_POSTGRES_INVALID`.

Se corrigieron únicamente el generador y export del workflow temporal de post-check. La consulta PostgreSQL ahora siempre devuelve exactamente una fila con `document_found`, `version_found`, `events_found`, `clinic_found` y `clinic_snapshot_valid`. El validador exige el estado post-delete `false/false/false/true/true`. `Always Output Data` fue retirado.

La clínica se compara con el snapshot exacto: `clinica_piloto_001`, `LAB030_QA Clínica Piloto 001`, `active`, `created_at=2026-10-01T19:53:44.611596+00:00` y `updated_at=2026-10-01T19:53:44.611596+00:00`. Documento, versión y eventos se consultan mediante los identificadores exactos de la ejecución #2638. Qdrant mantiene el filtro exacto y la consolidación exige cero puntos. El resultado puede producir `POSTCHECK_OK=true` y `CONSISTENCY_OK=true` únicamente con eliminación completa y clínica intacta.

Validaciones locales: `node --check` **PASS**; generación no-red **PASS**; JSON **PASS**; solo lectura **PASS**; contrato post-check **PASS**; referencias estáticas **PASS**; secretos **PASS**; `git diff --check` **PASS**.

No se ejecutó E2 después de la corrección. No se ejecutaron DELETE, cleanup, ingestión, commit o push.

Siguiente paso exacto: actualizar/importar únicamente `LAB-030 TEMP post-check documento RAG E2`, conservar sus credenciales, ejecutar una sola llamada de lectura y exigir `POSTCHECK_OK=true` y `CONSISTENCY_OK=true`. No volver a ejecutar DELETE.

## Consolidación final y pre-cierre

Consolidación documental completada el 2026-10-06. El alcance funcional ejecutado de LAB-030 queda **PASS y listo para cierre formal**.

### Evidencia E2 confirmada

1. **Precondición clínica QA — PASS**
   - `clinica_piloto_001`, nombre `LAB030_QA Clínica Piloto 001`, estado `active`;
   - `post_check_valid=true`;
   - `fixture_result=ALREADY_EXISTS_UNCHANGED`.

2. **Ingestión documental sintética — PASS**
   - ejecución n8n **#2638**, estado `Succeeded`;
   - petición: **17.595 s**; tiempo interno n8n: **16.325 s**;
   - documento `LAB030_QA_DOC_PUBLIC_HORARIOS_001`;
   - versión `ver_LAB030_QA_DOC_PUBLIC_HORARIOS_001_2638_1790884866372`;
   - hash `0c1e8ac9d2cc2fbe9c3c12f9692c3532b3681da3a4d55533cd1d930cef1d3e5a`.

3. **Post-check de persistencia e índice — PASS**
   - tiempo: **4566 ms**;
   - documento, versión y evento encontrados; un punto Qdrant encontrado;
   - `POSTCHECK_OK=true`; `CONSISTENCY_OK=true`.

4. **Inventory anterior al cleanup — PASS**
   - eventos: `lab029_evt_65`, `lab029_evt_66`, `lab029_evt_67`;
   - versión: `ver_LAB030_QA_DOC_PUBLIC_HORARIOS_001_2638_1790884866372`;
   - documento: `LAB030_QA_DOC_PUBLIC_HORARIOS_001`;
   - punto Qdrant: `3eab19cc-3c99-45a4-bfeb-b0d81459faa7`;
   - snapshot de clínica: `clinica_piloto_001`, `LAB030_QA Clínica Piloto 001`, `active`, `created_at=2026-10-01T19:53:44.611596+00:00`, `updated_at=2026-10-01T19:53:44.611596+00:00`.

5. **DELETE documental exacto — PASS**
   - tiempo: **6276 ms**;
   - 3 eventos, 1 versión y 1 documento eliminados;
   - 0 clínicas eliminadas;
   - `post_check_required=true`.

6. **Primer post-check posterior al DELETE — defecto del runner QA corregido**
   - fallo inicial: `LAB030_POSTCHECK_POSTGRES_INVALID`;
   - causa: consulta sin filas más `Always Output Data` produjo `[{}]`;
   - clasificación: defecto del runner temporal, no fallo del cleanup ni del sistema persistente;
   - corrección: indicadores PostgreSQL explícitos y retirada de `Always Output Data`;
   - el DELETE no se repitió.

7. **Post-check corregido — PASS**
   - tiempo: **2963 ms**;
   - documento, versión y eventos ausentes;
   - clínica presente y snapshot válido;
   - Qdrant ausente, 0 puntos;
   - `POSTCHECK_OK=true`; `CONSISTENCY_OK=true`.

8. **Post-check específico del cleanup — PASS**
   - tiempo: **6540 ms**;
   - documento, versión, eventos y punto Qdrant ausentes;
   - clínica preservada;
   - `residues_remaining=0`.

### Estado final

- datos sintéticos documentales eliminados completamente;
- clínica QA preservada sin modificación;
- cero residuos asociados a la prueba;
- workflows temporales `LAB-030 TEMP driver Gestión documental`, `LAB-030 TEMP precondición clínica QA E2`, `LAB-030 TEMP cleanup documental E2` y `LAB-030 TEMP post-check documento RAG E2` desactivados y eliminados de n8n;
- artefactos locales conservados para reproducibilidad;
- workflows productivos LAB-029 sin modificación.

### Límites conservados

Las comprobaciones administrativas opcionales de Fase B —API de workflows n8n y conexión PostgreSQL directa desde el proceso QA— permanecen históricamente `NOT_RUN` porque no se expusieron credenciales adicionales. La salud manual esencial de n8n/Qdrant quedó en `WARN` controlado. Las matrices EQAB/EWB de Tarea 8E son una fotografía histórica y no se recalificaron en este pre-cierre. Estos límites no invalidan el PASS de la cadena funcional ejecutada, pero deben conservarse si el cierre formal exige certificar toda la matriz de piloto.

**Estado LAB-030: LISTO PARA CIERRE FORMAL**, con cadena funcional E2 y cleanup exacto en PASS, temporales retirados y datos finales limpios.

## Corrección de temporales para IDs dinámicos y reutilizables

Corrección local completada el 2026-10-06, sin ejecución E2. Una segunda ejecución, #2887, produjo nuevos IDs y reveló que los generadores de cleanup y post-check conservaban el `version_id` de la primera ejecución. La causa raíz fue el acoplamiento de los artefactos temporales a evidencia histórica en vez de al manifest vigente.

Corrección aplicada:

- `INVENTORY` recibe únicamente `clinic_id` y `document_id` QA exactos;
- PostgreSQL selecciona de forma determinista una única versión `active` con el hash esperado y falla ante cero o múltiples candidatas;
- exige exactamente los eventos `staged`, `validated`, `activated` y un único punto Qdrant consistente;
- devuelve `created_ids`, `clinic_snapshot` y `selectors`, incluido el `version_id` real descubierto;
- DELETE consume exclusivamente ese manifest, valida cardinalidades, pertenencia, hash y snapshot, y conserva `LAB030_DOCUMENT_CLEANUP_EXECUTE`;
- POST_CHECK consume el manifest actual y soporta `PRESENT` y `ABSENT`, sin IDs de ejecución hardcodeados;
- la clínica queda fuera de toda sentencia DELETE.

Workflows afectados exclusivamente: `LAB-030 TEMP cleanup documental E2` y `LAB-030 TEMP post-check documento RAG E2`. No se modificaron Gestión documental LAB-029 ni workflows productivos.

Validaciones locales: sintaxis **PASS**; generación no-red **PASS**; JSON sincronizados **PASS**; dos IDs dinámicos simulados **PASS**; cardinalidades y fail-closed **PASS**; cero referencias a la ejecución histórica en los temporales activos **PASS**; secretos **PASS**; `git diff --check` **PASS**.

Estado E2 de esta corrección: **NOT_VERIFIED**. Siguiente paso exacto: volver a publicar/configurar únicamente los dos temporales corregidos y ejecutar solo `INVENTORY` con `clinica_piloto_001` y `LAB030_QA_DOC_PUBLIC_HORARIOS_001`. Revisar el manifest generado y detenerse antes de DELETE.

## Corrección puntual de comparación del snapshot en POST_CHECK

Corrección local completada el 2026-10-06. El DELETE E2 ya ejecutado permanece confirmado en 3 eventos, 1 versión, 1 documento y 0 clínicas; no se repitió.

El POST_CHECK demostró cero documentos, versiones, eventos y puntos Qdrant, además de la clínica preservada, pero el nodo final falló porque comparaba objetos mediante `JSON.stringify`, haciendo depender el resultado del orden de sus propiedades. Se sustituyó únicamente esa condición por comparación explícita de `name`, `status`, `clinic_id`, `created_at` y `updated_at` por valor. Todas las demás guardas y el contrato de salida permanecen intactos.

Validaciones locales: sintaxis **PASS**; generación no-red **PASS**; JSON **PASS**; snapshot con orden de propiedades distinto **PASS**; fail-closed ante un campo divergente **PASS**; cero referencias históricas en temporales activos **PASS**; secretos **PASS**; `git diff --check` **PASS**.

Estado E2 de esta corrección: **NOT_VERIFIED**. Siguiente paso exacto: Cristian actualiza únicamente `LAB-030 TEMP cleanup documental E2` y ejecuta solo su endpoint POST_CHECK con el manifest vigente. No repetir DELETE.

## Cierre formal LAB-030

**Estado vigente: LAB-030 — CERRADO — PASS.** Esta sección reemplaza los estados operativos pendientes de las etapas históricas anteriores.

### Evidencia final de la ejecución dinámica

- INVENTORY: **PASS**.
  - clínica: `clinica_piloto_001`;
  - documento: `LAB030_QA_DOC_PUBLIC_HORARIOS_001`;
  - versión real: `ver_LAB030_QA_DOC_PUBLIC_HORARIOS_001_2887_1791320682925`;
  - hash: `0c1e8ac9d2cc2fbe9c3c12f9692c3532b3681da3a4d55533cd1d930cef1d3e5a`;
  - colección: `vetatiende_publico`;
  - eventos exactos: `lab029_evt_68`, `lab029_evt_69`, `lab029_evt_70`;
  - punto Qdrant exacto: `18d14f4c-3e53-4c14-9bad-3178e8c8ad45`;
  - snapshot de clínica conservado.
- DELETE: **PASS**.
  - 3 eventos, 1 versión y 1 documento eliminados;
  - 0 clínicas eliminadas;
  - post-check requerido y ejecutado.
- POST-CHECK final: **PASS**.
  - documento, versión, eventos y punto Qdrant ausentes;
  - clínica preservada;
  - `residues_remaining=0`.

### Correcciones consolidadas

- eliminación de IDs históricos hardcodeados en los temporales activos;
- INVENTORY dinámico mediante selectores exactos;
- DELETE protegido por el manifest real y confirmación explícita;
- validación fail-closed de cardinalidad, pertenencia, hash y snapshot;
- corrección del runner PostgreSQL para resultados sin filas documentales;
- comparación estructural del `clinic_snapshot` por cinco campos, independiente del orden de propiedades;
- retiro final de todos los workflows temporales.

### Estado operativo final

- datos documentales temporales eliminados completamente;
- clínica QA preservada;
- cero residuos;
- `LAB-030 TEMP driver Gestión documental`, `LAB-030 TEMP precondición clínica QA E2`, `LAB-030 TEMP cleanup documental E2` y `LAB-030 TEMP post-check documento RAG E2` retirados de n8n;
- generadores, JSON y pruebas locales conservados solo para reproducibilidad histórica;
- workflows productivos y lógica LAB-029 sin modificaciones.

### Límites residuales

No se recalificó la matriz EQAB/EWB completa. Permanecen los WARN/FAIL/NOT_VERIFIED históricos relacionados con regresión ampliada, carga, concurrencia, rendimiento unificado y otros dominios que no fueron demostrados por este escenario RAG. Las comprobaciones administrativas opcionales de API n8n y PostgreSQL directo desde el proceso QA tampoco se convierten en PASS. Estos límites no afectan el cierre del alcance funcional ejecutado de LAB-030.

Objetivo cumplido: evidencia funcional completa del escenario, consistencia entre PostgreSQL y Qdrant, cleanup exacto demostrado, datos temporales eliminados, clínica preservada y temporales retirados.

**Siguiente paso exacto del proyecto:** abrir el siguiente LAB o hito aprobado para ampliar la validación de piloto sobre los controles residuales priorizados; no reabrir ni volver a ejecutar los temporales de LAB-030 salvo una nueva tarea explícita.
