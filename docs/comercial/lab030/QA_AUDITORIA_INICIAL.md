# LAB-030 — Auditoría QA inicial e inventario reutilizable

Fecha: 2026-09-22. Fase 1 exclusivamente documental. Estado: propuesta para revisión de Chat; no autoriza ejecución ni inicio de Fase 2.

## 1. Objetivo, alcance y verificación inicial

Preparar QA integral y piloto real con una batería pequeña, mantenible y basada en las capacidades existentes. No rediseñar ni refactorizar los workflows acumulados. Esta auditoría no certifica disponibilidad actual ni autoriza datos reales.

- Repositorio: `C:/Users/DELL/VetAtiendeAI`.
- Rama comprobada: `mvp-comercial`.
- Working tree inicial: limpio (`git status --short --branch`).
- HEAD: `8f830766abdfb5a8c5ecab639ec71f03dba62559`.
- Relación con la referencia local `origin/mvp-comercial`: 0 ahead / 0 behind. Sin fetch ni comprobación del servidor remoto.
- Cierre funcional LAB-029: `b4c40a26e1e5378355bfbbb5058ad4432261df6e`; HEAD es el registro operativo posterior.
- Solo lectura de Git, documentación y código. Ningún script QA ejecutado, ninguna generación, conexión externa, instalación, E2 o cambio funcional.

Se revisaron README raíz, roadmap, decisiones de arquitectura, README/HANDOFF LAB-029, cierres LAB-021 a LAB-028, matriz LAB-026 y código dirigido de scripts. Se inventariaron archivos versionados y nombres de pruebas en todo el repositorio; `tests/` contiene únicamente `.gitkeep`. No apareció un AGENTS.md versionado en el inventario. No se inspeccionaron credenciales ni evidencias privadas.

## 2. Base heredada y precedencia documental

LAB-029 permanece CERRADO. PostgreSQL/Aiven es autoridad documental y de clínicas activas; Qdrant mantiene conocimiento persistente separado por clínica, visibilidad, versión activa y permisos. La autorización interna precede a la entrega de contexto a IA. La saga de ingesta/activación conserva la versión anterior ante fallos y admite rollback.

Evidencia declarada en [README LAB-029](../lab029/README.md), secciones «Resultado funcional y validaciones» y «Cleanup seguro», y [HANDOFF LAB-029](../lab029/HANDOFF_CODEX.md), secciones finales:

- 109 pruebas runtime **locales con mocks**, 1395 checks estructurales, contrato Management 12/12 y 26 pruebas de lógica PASS. Son resultados históricos, no ejecutados en esta auditoría; no sumar checks como casos E2 independientes.
- Público P-01 a P-04 WARN y P-05 PASS; Interno I-01/I-02 WARN e I-03 a I-05 PASS. No convertir WARN en PASS silenciosamente. El runner contempla advertencia temporal por encima de 10 s y fallo por encima de 15 s salvo excepción de caso.
- PS-01/STATE PASS, 9.222 s: fingerprint conservado después de recrear n8n sin reconstrucción de vectores. Esto no demuestra restauración desde backup.
- Cleanup run D: execute y postcheck PASS, cero residuos del conjunto de prueba. No significa que todos los datos de la instancia estuvieran vacíos. Evidencias finales declaradas en E2: `manifest.json`, `cleanup_precheck_snapshot.json`, `cleanup_evidence.json`; no verificadas aquí.
- Multiclínica local PASS, cero referencias a la clínica piloto en el export Público final, autorización cerrada ante clínica ausente/inválida/inactiva o error de autoridad.
- Evento operativo posterior: Management publicado; Público e Interno LAB-029 no publicados. Ocho temporales LAB-029 despublicados y conservados; temporales LAB-027 no intervenidos. Debe verificarse qué cadena atiende realmente Streamlit antes de un smoke operacional.

El [roadmap](../roadmap_mvp_comercial.md) aún llama a LAB-030 «Integración completa, configuración por clínica y mejora de Streamlit» y reserva seguridad/piloto para LAB-031. Para esta tarea prevalece la instrucción actual: QA integral y preparación, sin implementar aquellas mejoras. README LAB-029 conserva textos anteriores al commit; el evento post-cierre del HANDOFF y los hashes indicados prevalecen. Las versiones n8n/task-runners 2.39.5 y Qdrant 1.19.0 son las documentadas al cierre, no versiones verificadas hoy.

## 3. Mapa LAB → capacidad → evidencia → reutilización

| LAB | Capacidad y prueba histórica | Evidencia versionada | Recurso reutilizable | QA / cobertura |
|---|---|---|---|---|
| 021 | RAG público: horarios, precios, ausencia de información y no invención | [README](../lab021/README.md), Validaciones realizadas | Casos semánticos; reemplazar expectativa de memoria por persistencia 029 | 02; B/C |
| 022 | Reserva médica, fechas/horas, alternativas, conflicto al confirmar, aislamiento de sesiones, contrato público | [README](../lab022/README.md), Validaciones funcionales | Casos + validador 026 para herencia; no reutilizar recarga Simple Vector Store | 01/03/07; B/C/E |
| 023 | Peluquería 60–180 min, adyacencia, cierre, errores Calendar, continuidad RAG | [README](../lab023/README.md), Pruebas finales aprobadas y Limpieza | Matriz 026 + runtime 028 adaptado | 03/07; B/C |
| 024/024.1 | Urgencias deterministas/ambiguas, negación, histórico, prioridad, deduplicación, Telegram | [README](../lab024/README.md), Validación complementaria y Resultado validado | Casos clínicos históricos; checks heredados 026; contrato interno 027 | 05/06; B/C |
| 025 | OIDC, identidad, roles, aislamiento, alertas/pendientes/tareas, auditoría, sanitización | [README](../lab025/README.md), Pruebas finales aprobadas | Casos UI y autorización; checks 027 y runtime interno 029 | 02/05/06/07; B/C |
| 026 | Cancelación/reprogramación, mismo evento, conflicto, timeout, compensación, revisión humana | [Matriz](../lab026/MATRIZ_PRUEBAS.md) A–G y [README](../lab026/README.md) | Validador histórico 1570 aserciones; matriz con oráculos Calendar + tablas | 03/04/05/08; B/C |
| 027 | Scheduler, seguimientos, respuestas, idempotencia, fallback y cierre humano | [README](../lab027/README.md); 40/40 runtime y cleanup 3/3 PASS | Lógica 245 checks y validador 2791; ejecutores runtime retirados | 05/06/07; A/B/C |
| 028 | Aviso contextual literal post-reserva, supresión por urgencia, selección combinada y rendimiento | [HANDOFF](../lab028/HANDOFF_CODEX.md), Cierre técnico final; [README](../lab028/README.md) | 38 lógica, 7 fixtures mock, 18 runner mock, 8 analizador; runner/fixtures reales | 03/05/06/08; A/C |
| 029 | Dominio documental, autoridad clínica, permisos, saga, persistencia, cleanup exacto | README/HANDOFF citados arriba | Lógica, contratos, runtime mock/real, SQL y verificadores | 01/02/07/08; A/C |

La demo Challenge y `docs/evidencias/lab010_pruebas_integrales_mvp.md`, `lab011_despliegue_oci_validacion_operativa.md` son antecedentes históricos, no certificación del MVP comercial actual. `n8n/workflows/lab008_vetatiende_test_registro_operativo_google_sheets.json` es un workflow de prueba histórico, no un ejecutor LAB-030. Las apps Streamlit son producto, no suites QA. Los JSON base/canon de scripts/lab026 son fixtures canónicos de generación, no scripts ni fixtures runtime.

## 4. Inventario exacto de scripts

Unidad de conteo: un archivo `.mjs` o `.sql` en `scripts/lab026` a `scripts/lab029`, incluidas utilidades, generadores y migraciones vinculadas al QA: **37 archivos (32 MJS, 5 SQL): 11 reutilizables directamente, 19 requieren adaptación y 7 históricos/soporte no integrables como ejecución periódica**. Las migraciones se incluyen como soporte histórico, no como pruebas. El resto de artefactos se registra en §3 y no infla este total.

Cada ruta siguiente es relativa a la raíz. El LAB de origen es el directorio. Destino: **R** reutilizable directamente para su alcance original; **A** adaptar mediante nuevos archivos LAB-030, sin editar históricos; **H** conservar como histórico/soporte y no integrar como ejecución periódica. R no implica que valide automáticamente el export 029 ni que deba correrse en cada smoke.

Entorno: **L** solo local; **E** E2-AUTO; **X** EXTERNO. Servicios enumerados exhaustivamente para el uso indicado: N=n8n/Data Tables, P=PostgreSQL, Q=Qdrant, C=Calendar, IA=Groq/Cohere. «—» significa ninguno. Para generadores se distingue creación local de ejecución futura. Mutación **F**=archivos, **M**=memoria/mocks, **D**=datos reales del entorno de prueba, **0**=lectura. Fixtures y cleanup se indican por fila.

| Ruta | Tipo / propósito y capacidad | Nivel; servicios requeridos | Mutación; fixtures; cleanup | Destino y razón |
|---|---|---|---|---|
| `scripts/lab026/generar_workflow_lab026.mjs` | Generador de export canónico agenda/gestión | L; — | F por defecto, stdout opcional; no; revisar salida | H: no regenerar histórico |
| `scripts/lab026/validar_workflow_lab026.mjs` | Estructura, lógica, seguridad y regresión heredada | L; — | 0; en memoria; no | A: fija hash/nodos; invoca generador por stdout, incompatible con política de cero generación sin separar checks |
| `scripts/lab027/generar_workflows_lab027.mjs` | Generador y biblioteca de lógica seguimientos | L; — | F en CLI; no runtime; revisar salida | H: fuente importada por tests, no ejecutar generador |
| `scripts/lab027/probar_logica_lab027.mjs` | Lógica de planificación, correlación, idempotencia, permisos y urgencia | L; — | M; sí en memoria; no | R: comportamiento puro de seguimiento |
| `scripts/lab027/validar_workflows_lab027.mjs` | Estructura e integración 024/025/026/027; incluye lógica | L; — | M; no persistentes; no | A: IDs/historia Git/export 025 fijos; evitar duplicar lógica |
| `scripts/lab028/generar_workflow_lab028.mjs` | Generador de avisos post-reserva | L; — | F; no; revisar salida | H: no regenerar histórico |
| `scripts/lab028/logica_lab028.mjs` | Biblioteca de reglas de aviso, vigencia y supresión | L; — | M; no; no | R: utilidad, no prueba autónoma |
| `scripts/lab028/seleccion_alternativas_lab028.mjs` | Biblioteca de selección conversacional | L; — | M; no; no | R: utilidad, no prueba autónoma |
| `scripts/lab028/probar_lab028.mjs` | Lógica de avisos y selección | L; — | M; sí; no | R: suite local existente |
| `scripts/lab028/validar_workflow_lab028.mjs` | Estructura y regresión de export 028 | L; — | M; no persistentes; no | A: adaptar invariantes al export vigente, no exigir conteos antiguos |
| `scripts/lab028/fixtures_runtime_contextual_lab028.mjs` | Fixture/integración/cleanup de configuración y campañas | E; N | D; sí; limpiar + verificar | A: clínica y marcador fijos; ampliar manifiesto por ejecución |
| `scripts/lab028/probar_fixtures_runtime_contextual_lab028.mjs` | Seguridad del cliente de fixtures con fetch simulado | L; — | M; sí; no | R: no conecta n8n |
| `scripts/lab028/probar_runtime_real_lab028.mjs` | Runtime conversacional de reservas y avisos | E+X; N,C; IA según ruta | D; sí vía cliente; tablas + eventos + estados | A: endpoints, clínica, fechas y cleanup completo |
| `scripts/lab028/probar_script_runtime_real_lab028.mjs` | Prueba local del runner real con mocks | L; — | M; sí; no | R: no es E2 |
| `scripts/lab028/analizar_rendimiento_runtime_lab028.mjs` | Rendimiento por nodo/categoría sobre ejecuciones | L con JSON o E con API; N solo API | 0; no; no | A: parametrizar workflow 029; preferir evidencia offline |
| `scripts/lab028/probar_analisis_rendimiento_lab028.mjs` | Prueba del analizador y de ausencia de escrituras | L; — | M; sí; no | R: verifica herramienta, no latencia real |
| `scripts/lab029/generar_workflows_lab029.mjs` | Generador Público/Interno/Management | L; — | F CLI, memoria al importar; no; revisar salida | H: dependencia canónica, fuera del runner |
| `scripts/lab029/logica_documental_lab029.mjs` | Modelo en memoria de versiones, filtros, rollback y salud | L; — | M; sí vía funciones; no | R: referencia de lógica, no prueba SQL |
| `scripts/lab029/probar_logica_lab029.mjs` | Lógica documental, aislamiento y fallos | L; — | M; sí; no | R: 26 casos históricos |
| `scripts/lab029/validar_lab029.mjs` | Estructura, seguridad, historia y contrato Management | L; — | M; no persistentes; no | A: llama generarTodo en memoria; separar checks de export para cero generación |
| `scripts/lab029/probar_runtime_lab029.mjs` | Prueba local de runner, verificadores, fixtures y cleanup con mocks | L; — | F+M; sí en directorio temporal; cleanup local requerido | A: controlar temporales y seleccionar contrato sin preparar workflows |
| `scripts/lab029/probar_postgres_lab029.sql` | Persistencia: FK, fechas, eventos y atomicidad de auditoría | E; P (también posible P local aislado) | D transaccional; sí; ROLLBACK, vigilar secuencias | R: solo base de prueba ya migrada; no necesita n8n |
| `scripts/lab029/preparar_runtime_lab029.mjs` | Generador de manifest, payloads, SQL y workflows temporales | L; —; artefactos destinados a E2 | F; sí; inventario local y remoto después de importar | A: namespace/paths y mínimo conjunto transversal |
| `scripts/lab029/crear_workflow_verificador_runtime_lab029.mjs` | Generador de verificador de estado y persistencia | L; —; ejecución futura N,P,Q | M; no; retirar temporal si se importa | A: esquema/IDs LAB-030; función, no test autónomo |
| `scripts/lab029/crear_workflow_precheck_cleanup_lab029.mjs` | Generador de inventario previo seguro | L; —; ejecución futura N,P,Q | F; no; retirar export temporal | A: incluir recursos de reservas/seguimiento |
| `scripts/lab029/crear_workflow_cleanup_execute_lab029.mjs` | Generador de borrado por IDs exactos del snapshot | L; —; ejecución futura N,P,Q | F; no; retirar export temporal | A: nuevo manifiesto multicapacidad |
| `scripts/lab029/verificar_runtime_lab029.mjs` | Salud PostgreSQL y colecciones/configuración vectorial | E+X; P,Q; psql local | 0; no; no | R: parametrizado por entorno; no prueba n8n ni IA |
| `scripts/lab029/verificar_estado_runtime_lab029.mjs` | Checkpoint/fingerprint vía webhook; rehidrata baseline histórico | E; N,P,Q; rehidratación L | F y posible auditoría del endpoint; no; conservar evidencia | A: contratos/manifest 029; no repetir reparación G09 regularmente |
| `scripts/lab029/ejecutar_runtime_lab029.mjs` | Runtime Management/Público/Interno/Persistencia | E+X; N,P,Q,IA; reinicio de persistencia manual | D+F; consume fixtures; cleanup obligatorio | A: casos mínimos, fechas y criterios de rendimiento |
| `scripts/lab029/validar_inventario_cleanup_lab029.mjs` | Seguridad: rechaza inventarios ajenos y exige postcheck | L; — | 0; no; no | A: IDs, colecciones y esquema ligados a LAB029_TEST |
| `scripts/lab029/ejecutar_precheck_cleanup_lab029.mjs` | Runtime de inventario previo y snapshot | E; N,P,Q | F, lectura remota; no; preservar snapshot | A: manifiesto/contrato LAB-030 |
| `scripts/lab029/ejecutar_cleanup_runtime_lab029.mjs` | Cleanup real exacto y postcheck; elimina payload local | E; N,P,Q | D+F; no; postcheck cero obligatorio | A: incorporar recursos Calendar y tablas heredadas |
| `scripts/lab029/limpiar_runtime_lab029.mjs` | Orquestador cleanup por adaptador inyectado | E; N,P,Q mediante adaptador; L con mocks | D+F; no; postcheck | A: no tiene adaptador CLI real; elegir una vía, no duplicarla |
| `scripts/lab029/fixtures/cargar_fixtures_lab029.sql` | Fixture de clínicas/documentos con IDs fijos | E; P | D; sí; eliminar por inventario exacto | A: IDs por run, no compartir fixture fijo |
| `scripts/lab029/fixtures/limpiar_fixtures_lab029.sql` | Cleanup SQL histórico por LIKE/prefijo | E; P | D; no; verifica solo dominio SQL | H: no reutilizar borrado amplio ni confundir con cleanup final seguro |
| `scripts/lab029/migraciones/001_dominio_documental.sql` | Soporte de persistencia: esquema y restricciones | E; P | D esquema; no; no es cleanup | H: precondición existente, no prueba periódica |
| `scripts/lab029/migraciones/002_activacion_rollback.sql` | Soporte de persistencia: funciones y eventos | E; P | D esquema; no; no es cleanup | H: precondición existente, no prueba periódica |

Todos los scripts están clasificados por efecto real, no por nombre. LOCAL-AUTO puede requerir Node/Git disponibles y temporales, pero no servicios externos. P local aislado es una posibilidad futura del SQL, no un entorno creado en esta fase. Los generadores no requieren E2 para escribir JSON, aunque sus productos sí lo requieren al importarse.

## 5. Cobertura, brechas y duplicaciones

Estados: **A YA CUBIERTO**, **B CUBIERTO PERO DISPERSO**, **C NECESITA ADAPTACIÓN**, **D BRECHA REAL**, **E NO DEBE REPETIRSE**. Son estados de cobertura, diferentes de los códigos R/A/H del inventario.

| Estado | Hallazgo sustentado | Acción propuesta |
|---|---|---|
| A | Lógica documental/avisos/seguimientos y contratos locales con suites existentes | Reutilizar selectivamente; evitar reescribir tests equivalentes |
| B | Reservas, gestión, urgencias y OIDC tienen cierres reales en 022–026 | Integrar oráculos en una matriz común; no declarar ausencia histórica de QA |
| C | Runners 028/029 fijan clínica, export, manifest o prefijo; validador 026 genera por stdout y 029 en memoria | Adaptadores LAB-030 con entradas explícitas y cero escritura en históricos |
| D1 | No se encontró evidencia de una cadena final completa Streamlit → Público/Interno 029 publicados → 027 sobre la base final; post-cierre indica dos inactivos | Verificación operativa y recorrido integrado actual, antes de afirmar piloto listo |
| D2 | No hay manifiesto/cleanup transversal que abarque Calendar, estados/citas, urgencias, tareas, seguimientos y dominio documental conjuntamente | Inventario exacto por run y postcheck global; reutilizar mecanismos 029, no borrado por prefijos |
| D3 | Runtime 027 aprobado pero ejecutores/fixtures retirados; falta una reproducción mantenible sobre la versión actual de n8n | Un escenario scheduler→respuesta→tarea→cierre con repetición idempotente; no reconstruir los 40 casos |
| D4 | Multiclínica RAG cubierta; no hay evidencia suficiente de aislamiento integral actual de calendario/configuración/operación en dos clínicas con misma sesión/teléfono | Prueba cruzada de lectura y mutación con recursos A/B; no inferir de cero hardcodes que todo esté aislado |
| D5 | Rendimiento tiene muestras históricas y WARN; falta criterio unificado y evidencia representativa de la cadena final | Presupuesto por ruta y percentiles solo cuando exista muestra suficiente; no usar una media histórica como SLA |
| D6 | No se encontró batería ejecutable vigente de UI/OIDC ni evidencia final completa de preparación operativa: restauración de backup, retención, eliminación, incidentes y responsables | Checklist de piloto con evidencia y dueño; coordinar alcance pendiente LAB-031, sin tocar infraestructura |
| E | Recarga Simple Vector Store, depuración de runner antiguo, migración A/B y reparación puntual baseline G09 | Conservar evidencia; repetir solo ante cambio material o regresión |

«No se encontró» se limita al repositorio y cierres examinados. No afirma que no exista evidencia privada adicional. D6 es una brecha de acreditación del piloto; no es permiso para implementar seguridad/infraestructura en LAB-030.

No duplicar 245 checks de lógica 027 si ya se invoca su validador completo; no sumar pruebas del runner mock como funcionales remotas; no ejecutar 026, 028 y 029 completos para demostrar tres veces la misma herencia. No convertir generadores/migraciones en smoke. No repetir cleanup de runs cerrados ni recreación n8n en cada regresión. Pruebas de herramientas se ejecutan cuando cambia la herramienta; fallos raros/concurrencia/reinicio se reservan para cambios que los afecten o la acreditación inicial del piloto.

## 6. QA-01 a QA-08 validado contra el repositorio

| QA | Contenido propuesto | Candidatos y niveles | Oráculo mínimo |
|---|---|---|---|
| QA-01 Salud técnica y contratos | JSON/export vigente, conexiones, contrato público, endpoints y salud P/Q | Invariantes 026/028/029 adaptadas LOCAL-AUTO; health 029 E2-AUTO/EXTERNO; publicación MANUAL-N8N | Export correcto + ruta realmente publicada + dependencias accesibles, sin secretos |
| QA-02 RAG y conocimiento | Consulta respaldada, ausencia de información, público/interno, roles, versión activa, fallo de actualización | Lógica 029 LOCAL-AUTO; runtime Management/P/I E2-AUTO+EXTERNO+CONTROLADA | Fuente/versión y clínica correctas, contexto no autorizado excluido antes de IA |
| QA-03 Reservas | Médica y peluquería; fechas, duración, alternativas combinadas, conflicto final, continuidad RAG | Casos 022/023 y A03/A04/A05 de 026, runner 028 adaptado E2-AUTO+EXTERNO+CONTROLADA; UI manual | Evento y cita durable coinciden; nunca confirmación ante estado incierto |
| QA-04 Gestión de citas | Identidad/teléfono, cancelar, reprogramar, mismo event_id, reintentos, revisión humana | B07/B10, C02/C03/C08, D09/D10/D11/D19, E04/E05 de matriz 026; E2-AUTO+EXTERNO+CONTROLADA | Calendar releído + estado/auditoría + pendiente único cuando corresponda |
| QA-05 Urgencias y seguridad funcional | Señal actual/negada/histórica, prioridad sobre agenda y publicidad, alerta deduplicada y fallback | Casos 024.1 + F01/F02 de 026 + lógica 027/028; LOCAL-AUTO y E2-AUTO+EXTERNO+CONTROLADA | Respuesta segura, ausencia de reserva/aviso indebido, alerta/tarea verificable |
| QA-06 Operación interna y seguimiento | OIDC, permisos, alertas/tareas, recordatorios simulados, respuesta y cierre; avisos comerciales literales | 025/027/028, LOCAL-AUTO, E2-AUTO+CONTROLADA y MANUAL-UI | Identidad y clínica canónicas; transición/auditoría persistida; idempotencia |
| QA-07 Multiclínica, aislamiento y persistencia | A/B con misma sesión/teléfono, clínica inválida, P/Q activos, citas/recursos cruzados, reinicio selectivo | 026 B07/B10, SQL y runtime 029; E2-AUTO+CONTROLADA; reinicio MANUAL-N8N/operación Cristian | Cero lectura/mutación cruzada; fingerprint antes/después sin rebuild |
| QA-08 Piloto, rendimiento y regresión global | Recorrido extremo a extremo, latencia por ruta, evidencia, cleanup y checklist de preparación | Analizador 028 adaptado LOCAL-AUTO sobre evidencia; MANUAL-UI/N8N; ejecución E2 selectiva | Sin fallos críticos, WARN resueltos o aceptados con evidencia, cero residuos del run |

Se mantienen ocho bloques. Avisos comerciales pertenecen a QA-06 y se observan en QA-03/05; la seguridad se distribuye entre seguridad funcional, autorización y aislamiento sin crear QA-09. No probar outbound comercial inexistente ni tratar el adaptador simulado 027 como transporte real de recordatorios. Un mismo caso puede aportar evidencia a varios QA, sin repetirse por esa razón.

## 7. Smoke propuesto, sin implementación

Dos escalones, sin mezclar resultados locales con disponibilidad real:

1. **S1 local:** export vigente parseable, conexiones/contratos y filtros críticos de clínica/permisos; inspección sin regenerar y sin correr todas las suites históricas. QA-01/07.
2. **S2 operativo:** comprobar workflow/endpoint realmente usado por Streamlit y salud P/Q con `verificar_runtime_lab029.mjs`; publicación visual por Cristian. QA-01.
3. **S3 conocimiento:** una consulta pública con respuesta esperada y una consulta interna autorizada, más rechazo sin identidad. QA-02/06/07. Las consultas pueden escribir auditoría: registrarlas en manifest.
4. **S4 reserva:** recorrido ficticio médico hasta confirmación durable, incluyendo un aviso autorizado si está habilitado; lectura de Calendar/tabla y cancelación con verificación. Reutilizar esa cita; no crear otra para QA-04.
5. **S5 seguridad:** urgencia determinista y reintento en la misma sesión: prioridad, supresión comercial y deduplicación; verificar alerta interna. Notificación real solo en destino de prueba controlado.
6. **S6 cierre:** precheck, cleanup de todos los IDs del smoke y postcheck; registrar duración por ruta y residuos. Sin cleanup completo el smoke mutante no queda PASS.

S1 solo permite informar «smoke local PASS». S2–S6 requieren entorno preparado y autorización de la futura fase; hoy no se ejecutaron. OIDC visual y peluquería quedan en la regresión compacta, no duplicados en cada smoke. Si faltan recursos seguros, marcar BLOCKED; no degradar a PASS por usar mocks.

## 8. Regresión inicial compacta

Propuesta de ocho escenarios integrados más checks locales seleccionados, compartiendo fixtures A/B y evidencia. No es una batería implementada ni una estimación de número de asserts:

| Escenario | QA | Reutilización / nivel y escrituras |
|---|---|---|
| R1 Salud, contrato y clínica ausente/inactiva/inválida | 01/07 | Verificador 029 + invariantes adaptadas; LOCAL-AUTO/E2-AUTO; lectura y auditoría |
| R2 Documento v1→v2, no_changes, fallo compensado y rollback; consulta pública/interna y exclusión por permiso | 02/07 | Runner 029 reducido; E2-AUTO/EXTERNO/CONTROLADA, P/Q y auditoría |
| R3 Reserva médica, alternativa combinada, aviso literal y cancelación con reintento | 03/04/06 | 026/028 adaptados; E2-AUTO/EXTERNO/CONTROLADA, Calendar/tablas |
| R4 Peluquería de duración variable, conflicto final y reprogramación conservando evento | 03/04 | Matriz 023/026; E2-AUTO/EXTERNO/CONTROLADA |
| R5 Urgencia interrumpe gestión; negativo/histórico no alerta; fallo del adaptador deriva | 05/06 | Casos 024.1 y contratos 027; LOCAL-AUTO y E2 controlado; Telegram test |
| R6 Seguimiento exigible, scheduler repetido, respuesta, tarea y cierre autorizado; denegación de rol | 06 | Lógica 027 + escenario runtime a reconstruir; E2-AUTO/CONTROLADA y MANUAL-UI OIDC |
| R7 A/B con misma sesión/teléfono, reserva/lectura/mutación cruzada rechazada; persistencia tras reinicio selectivo | 07 | Reusar fixtures R2–R4; E2-AUTO/CONTROLADA y acción de Cristian para reinicio |
| R8 Recorrido Streamlit público/interno, medición y cierre del manifest | 08 | MANUAL-UI/N8N, analizador offline y cleanup exacto; no repetir llamadas solo para medir |

El reinicio de R7 y fallos inyectados de R2/R5 son hitos controlados, no smoke ni repetición rutinaria. La matriz 026 conserva pruebas de concurrencia y fallos parciales; seleccionar C09/D18 o D16/D17 si cambia bloqueo/Calendar/persistencia, sin proclamar que su cobertura actual fue reproducida.

## 9. Dependencias, mutaciones y cleanup

- Local: Node, Git y archivos versionados; psql solo para SQL/health P. No instalar dependencias en esta fase.
- E2: n8n, runners, Data Tables y bindings de workflows correctos. IDs históricos y publicación documentada no garantizan bindings actuales.
- Externos: PostgreSQL/Aiven, Qdrant, Cohere, Groq, Calendar y Telegram según caso; OIDC/Streamlit para prueba humana. El canal 027 permanece simulado. No se requiere Google Sheets para el dominio documental ni para la batería comercial propuesta.
- Credenciales fuera del repositorio; evidencias sanitizadas y datos exclusivamente ficticios. No copiar tokens, URLs con credenciales, payloads documentales ni datos reales a la auditoría.

Mutaciones a inventariar: clínicas/documentos/versiones/eventos y puntos Qdrant de R2/R7; usuarios/permisos/auditorías ficticias; citas/eventos Calendar/holds y estados conversacionales de R3/R4; episodios/alertas/historial/tareas de R5; instrucciones/seguimientos/tareas de R6; configuración/campañas contextuales si se crean para el caso. Registrar IDs retornados, clínica, relación con el run y estado previo. Las notificaciones ya enviadas no se revierten como una fila: usar destino de prueba y registrar su efecto.

Protocolo futuro: manifest único → precheck que rechace IDs ajenos/inventario inesperado → ejecución acotada → reconciliación ante timeout → cleanup por IDs exactos en orden de dependencias → lectura posterior de cada almacén → evidencia con cero residuos del run. Conservar evidencia incluso ante fallo; no marcar PASS con cleanup pendiente. Proteger usuarios/permisos base, configuraciones existentes y documentos no pertenecientes al run. No borrar colecciones Qdrant, calendarios, tablas completas ni usar LIKE/prefijos como autorización de borrado.

El cliente fixtures 028 solo cubre sus dos tablas: no demuestra limpieza de Calendar ni del resto de estados. El cleanup 029 cubre dominio documental, usuarios/permisos/auditorías y temporales de su contrato, no todas las capacidades acumuladas. El SQL de pruebas usa ROLLBACK, pero requiere una base aislada y no garantiza revertir el avance de secuencias PostgreSQL. Los temporales del test local 029 también necesitan política de eliminación acotada.

## 10. Riesgos y recomendación para Fase 2

1. **Disponibilidad final no acreditada:** Público/Interno 029 inactivos en el último registro. Primero verificar despliegue/ruta real con Cristian; no reabrir LAB-029 ni publicar nada en esta fase.
2. **Falsos positivos de cobertura:** mocks, generadores y hashes prueban propiedades distintas de un runtime. Guardar tipo de evidencia, revisión Git, entorno, fecha y casos omitidos; distinguir PASS/WARN/FAIL/BLOCKED/NO EJECUTADO.
3. **Datos y cleanup incompletos:** reservar fixtures aislados, IDs exactos y postcheck integral antes de habilitar mutaciones.
4. **Latencia y proveedores:** WARN históricos y modelos/servicios externos impiden asegurar rendimiento actual; acordar umbrales por ruta antes del nuevo runtime, conservando las muestras históricas como referencia.
5. **Acoplamiento histórico:** hashes, conteos e IDs fijos de validadores impiden aplicarlos sin adaptación al workflow acumulado. Los bloques grandes heredados son deuda aceptada; no justifican refactor.
6. **Piloto con datos reales:** no queda autorizado por este informe. Cerrar evidencia operativa, seguridad/retención/restauración y responsabilidad de aprobación, coordinando el alcance LAB-031 pendiente.

Secuencia recomendada tras revisión de Chat: aprobar matriz y criterios → elegir invariantes mínimas sin generación → definir manifest y cleanup transversal → implementar wrapper local → comprobar bindings/publicación con Cristian → ejecutar smoke controlado → completar solo brechas y regresión selectiva. Chat coordina/decide; Codex prepara repositorio y automatización; Cristian ejecuta acciones visuales, credenciales e infraestructura/E2 que correspondan.

## 11. Archivos exactos propuestos para después de la revisión

Lista propuesta, no creada ni autorizada para esta fase. Concentrar casos por capacidad en un catálogo, sin ocho runners independientes:

| Acción futura | Ruta | Propósito |
|---|---|---|
| Crear | `docs/comercial/lab030/QA_VETATIENDE_MASTER.md` | Matriz definitiva, criterios y trazabilidad aprobados |
| Crear | `docs/comercial/lab030/GUIA_EJECUCION_QA.md` | Precondiciones, niveles, acciones humanas y cleanup |
| Crear | `docs/comercial/lab030/REGISTRO_EVIDENCIAS.md` | Índice sanitizado de ejecuciones y límites |
| Crear | `scripts/lab030/catalogo_qa.mjs` | Casos seleccionados, QA, nivel, dependencias y oráculos |
| Crear | `scripts/lab030/ejecutar_qa.mjs` | Futuro runner con smoke/regresión y ejecución explícita por nivel |
| Crear | `scripts/lab030/validar_contratos_vigentes.mjs` | Leer export final sin generar ni modificar históricos |
| Crear | `scripts/lab030/adaptadores_qa.mjs` | Adaptar runners/verificadores y analizador existentes |
| Crear | `scripts/lab030/fixtures_qa.mjs` | Manifest y fixtures mínimos por run con IDs exactos |
| Crear | `scripts/lab030/cleanup_qa.mjs` | Precheck/ejecución/postcheck transversal |
| Crear | `scripts/lab030/probar_orquestacion_qa.mjs` | Solo seguridad relevante: gating externo, bloqueo de cleanup ajeno y clasificación de resultados |
| Modificar | `docs/comercial/lab030/QA_AUDITORIA_INICIAL.md` | Registrar decisiones de revisión sin borrar evidencia inicial |

No se propone modificar LAB-021–029, workflows, compose, infraestructura, credenciales o `.gitignore`. Usar `private-storage/lab030/` ya bajo el árbol privado ignorado para artefactos runtime futuros; no crearlos hoy. Alinear el roadmap queda como decisión documental posterior separada, no cambio incluido aquí. HANDOFF final solo al cierre futuro, fuera de esta lista de Fase 2 inicial.

## 12. Control de cierre de esta auditoría

Único archivo creado: `docs/comercial/lab030/QA_AUDITORIA_INICIAL.md`. El status final muestra únicamente `?? docs/comercial/lab030/`. `git diff --stat` no muestra cambios trackeados; el diff sin índice del archivo nuevo registra 214 líneas añadidas. `git diff --check` y la comprobación sin índice no reportan errores de whitespace; solo aparece la advertencia informativa LF→CRLF. La comparación de rutas del inventario con los scripts versionados no presentó diferencias: 37/37, sin omisiones ni entradas adicionales. Revisión del contenido y escaneo de patrones sensibles sin secretos detectados. Sin cambios fuera de documentación LAB-030.

No se ejecutaron tests históricos ni scripts de proyecto. NO COMMIT REALIZADO. NO PUSH REALIZADO. NO WORKFLOWS MODIFICADOS. NO E2 EJECUTADO. Fase 2 pendiente de nuevas instrucciones.
