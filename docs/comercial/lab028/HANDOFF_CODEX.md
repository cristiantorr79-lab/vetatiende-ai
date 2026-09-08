# LAB-028 — HANDOFF CODEX

## ARQUITECTURA CORREGIDA — avisos comerciales contextuales post-reserva

LAB-028 añade, como máximo, un aviso comercial literal al final de una respuesta de reserva médica o de peluquería ya confirmada. El aviso procede exclusivamente de `lab028_campanas` y nunca modifica la confirmación, Calendar, `appointment_id`, horario, duración ni estado de la cita.

La arquitectura anterior de scheduler, campañas salientes y adaptador independiente fue **descartada antes del commit** porque no correspondía al alcance funcional acordado. Sus workflows, runtime HTTP, fixtures, persistencia de envíos, idempotencia outbound e integración administrativa exclusiva con LAB-025 fueron eliminados. No deben usarse como arquitectura vigente.

## Estado actual

El rediseño contextual está implementado y sus pruebas focalizadas pasan. El export se genera reproduciblemente desde `n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json`, cuyo SHA-256 permanece `cf11e321b995438eb07fcb33f30e647d4e24e62447943fa92a835daafdd3239a`.

LAB-025 y `scripts/lab027/validar_workflows_lab027.mjs` fueron restaurados byte a byte desde `8df810bb35de7a58ef04ae42fe65f8bcb30526a1`. LAB-026 no fue modificado.

## Arquitectura implementada

Nuevo workflow: `LAB-028 - Avisos comerciales contextuales post-reserva`.

Nuevo export: `n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json`.

En cada una de las dos rutas confirmadas se insertan cuatro nodos entre la preparación de la respuesta y `Respond to Webhook`:

1. lectura de `lab028_configuracion` por `clinic_id`;
2. lectura de `lab028_campanas` por `clinic_id`;
3. lectura de `lab024_estado_urgencia` por `state_key = clinic_id::session_id`;
4. evaluación determinista que conserva la respuesta original y agrega, cuando corresponde, un único texto literal.

La configuración requiere `habilitado == "true"` y `canal == "contextual"`. El aviso debe estar activo, vigente, programado y tener tipo `producto`, `servicio` o `medicamento`. La categoría `general` sirve para ambas rutas; `medica` y `peluqueria` sirven solo para su ruta. Si hay varios avisos elegibles, se ordenan por `programada_at` y luego por `campana_id`.

La urgencia se evalúa únicamente para la clínica y sesión actuales. Una urgencia de otra sesión no bloquea. Cualquier error al leer configuración, avisos o urgencia conserva la confirmación y omite el aviso. El texto se concatena literalmente; no existe generación, adaptación, prescripción ni indicación de dosis mediante IA.

## Complejidad

El commit base contiene 303 nodos, 102 Code y 1 Wait heredado (`Esperar antes de reintento Telegram`). Aunque el objetivo recibido describía la base como 0 Wait, el export real del commit contiene ese nodo. Se mantuvo intacto para no alterar LAB-026 ni urgencias.

Resultado LAB-028: **311 nodos, 104 Code y 1 Wait total**. Incremento: **8 nodos, 2 Code y 0 Wait**. LAB-028 no añade Schedule Trigger, Wait, webhook, Execute Workflow, scheduler, adaptador, cola ni persistencia comercial.

## Archivos vigentes

- `scripts/lab028/logica_lab028.mjs`
- `scripts/lab028/generar_workflow_lab028.mjs`
- `scripts/lab028/validar_workflow_lab028.mjs`
- `scripts/lab028/probar_lab028.mjs`
- `n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json`
- `docs/comercial/lab028/HANDOFF_CODEX.md`

## Pruebas

Ejecutadas únicamente las verificaciones focalizadas:

- `node scripts/lab028/probar_lab028.mjs`: **19 pruebas, PASS**.
- `node scripts/lab028/validar_workflow_lab028.mjs`: **PASS**.

Cubren las dos rutas confirmadas, aviso general, configuración deshabilitada, aviso inactivo/futuro/expirado/incompatible/ausente, urgencia de la misma sesión, aislamiento entre sesiones, tres fallos de lectura, selección única determinista, medicamento literal, restricciones estructurales, reproducibilidad y conservación byte a byte de LAB-025/026 y el validador LAB-027.

No se ejecutó la regresión histórica masiva de LAB-026.

## Git y siguiente paso

No se hizo stage, commit ni push. No hubo despliegue ni modificación de n8n runtime.

Siguiente paso recomendado: revisar el diff contextual y, al cierre definitivo, ejecutar una sola vez la regresión histórica LAB-026 junto con la validación focalizada LAB-028 antes de importar o desplegar.

## Utilidad mínima de fixtures runtime contextuales

Se añadieron `scripts/lab028/fixtures_runtime_contextual_lab028.mjs` y `scripts/lab028/probar_fixtures_runtime_contextual_lab028.mjs`. La utilidad opera exclusivamente sobre `lab028_configuracion` y `lab028_campanas`; no usa ni recrea preferencias, envíos, scheduler, adaptadores outbound, colas o estados comerciales.

Prepara una configuración `clinica_piloto_001` habilitada para canal `contextual`, marcada mediante `updated_by=LAB028_TEST`, y cinco avisos con `campana_id` prefijado por `LAB028_TEST_`: médico, peluquería, general, medicamento literal autorizado e inactivo para prueba negativa. La carga es repetible y actualiza una coincidencia exacta sin duplicarla. Si existe una configuración no LAB028_TEST para la clínica piloto, la carga falla sin sobrescribirla.

Comandos de uso desde PowerShell, después de definir temporalmente `LAB028_N8N_BASE_URL` y `LAB028_N8N_API_TOKEN` en el proceso:

- `node scripts/lab028/fixtures_runtime_contextual_lab028.mjs cargar`
- `node scripts/lab028/fixtures_runtime_contextual_lab028.mjs verificar`
- `node scripts/lab028/fixtures_runtime_contextual_lab028.mjs limpiar`
- `node scripts/lab028/fixtures_runtime_contextual_lab028.mjs verificar_limpieza`

La limpieza enumera únicamente filas reconocidas por el manifiesto: configuración con clínica y marcador exactos, y campañas con clínica e identificadores LAB028_TEST conocidos. Antes de cada DELETE vuelve a leer, exige cardinalidad uno y compara el fingerprint completo. El filtro se envía por query parameter JSON URL-encoded con `returnData=true`. No existe borrado general.

Prueba ejecutada: `node scripts/lab028/probar_fixtures_runtime_contextual_lab028.mjs`. Resultado: **7 pruebas, PASS, 0 FAIL**. Cubren fixtures mínimos, carga, verificación, repetición sin duplicados, limpieza, conservación de filas ajenas, cero residuos y conflicto con configuración real.

Estado final de datos ficticios: el runtime simulado terminó con **0 residuos LAB028_TEST**. No se ejecutó la utilidad contra n8n real. No se hizo stage, commit ni push.

## Corrección runtime — incompatibilidad `structuredClone`

Causa confirmada: el task runner real de n8n no define `structuredClone`. La función estaba en `resolverAvisoContextual` y, al ser embebida por el generador, aparecía tanto en `Añadir aviso contextual médica LAB-028` como en `Añadir aviso contextual peluquería LAB-028`. La reserva médica alcanzaba correctamente la confirmación y las tres lecturas, pero el Code fallaba antes de devolver la respuesta.

Corrección aplicada: `scripts/lab028/logica_lab028.mjs` usa ahora una copia defensiva compatible mediante `JSON.parse(JSON.stringify(respuestaOriginal))`. La respuesta de webhook es un valor JSON, por lo que esta copia conserva sus datos y evita mutar el objeto base sin añadir dependencias. `scripts/lab028/generar_workflow_lab028.mjs` usa la misma alternativa únicamente durante la generación local. El mock de fixtures también dejó de depender de `structuredClone`.

Archivos modificados:

- `scripts/lab028/logica_lab028.mjs`
- `scripts/lab028/generar_workflow_lab028.mjs`
- `scripts/lab028/validar_workflow_lab028.mjs`
- `scripts/lab028/probar_lab028.mjs`
- `scripts/lab028/probar_fixtures_runtime_contextual_lab028.mjs`
- `n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json` (regenerado)
- `docs/comercial/lab028/HANDOFF_CODEX.md`

Se añadió una prueba específica y una regla del validador que fallan si cualquier Code LAB-028 generado contiene `structuredClone`. El export regenerado aplica la corrección a las rutas médica y de peluquería.

Resultados:

- `node scripts/lab028/probar_lab028.mjs`: **20 pruebas, PASS**.
- `node scripts/lab028/validar_workflow_lab028.mjs`: **PASS**; 311 nodos, 104 Code, 1 Wait total heredado, 8 nodos LAB-028, 2 Code LAB-028 y 0 Wait LAB-028.
- `node scripts/lab028/probar_fixtures_runtime_contextual_lab028.mjs`: **7 pruebas, PASS**.

LAB-026 conserva SHA-256 `cf11e321b995438eb07fcb33f30e647d4e24e62447943fa92a835daafdd3239a`; las pruebas focalizadas confirman además LAB-025, LAB-026 y el validador LAB-027 contra el commit base. No se ejecutó la regresión histórica completa. No hubo despliegue ni modificación del runtime n8n. No se hizo stage, commit ni push.

## Script automatizado de pruebas runtime reales

Se crearon `scripts/lab028/probar_runtime_real_lab028.mjs` y `scripts/lab028/probar_script_runtime_real_lab028.mjs`. El primero queda listo para que Chat lo ejecute después contra el webhook publicado; Codex no abrió ninguna conexión real en este bloque.

El runner ejecuta secuencialmente cuatro pruebas: reserva médica confirmada con exactamente un aviso, reserva confirmada sin aviso, urgencia en la misma sesión sin publicidad y urgencia en otra sesión que no bloquea una reserva limpia. Cada sesión incorpora un identificador nuevo por ejecución y nunca reutiliza `lab028_runtime_medica_001` ni `lab028_runtime_medica_002`. El diálogo conserva `session_id`, interpreta solicitudes de datos, selección y confirmación, y avanza hasta 12 interacciones sin intervención manual.

Para preparar el caso sin aviso, el runner usa la utilidad segura de fixtures: elimina solo filas del manifiesto LAB028_TEST y las vuelve a cargar en `finally`. Si la restauración falla, el resultado completo queda en FAIL con causa `fixtures_no_restaurados`. Las citas usan nombres LAB028_TEST y la salida conserva `appointment_id` o `event_id` cuando el contrato público los expone, para una limpieza posterior controlada.

Variables requeridas en el proceso de PowerShell:

- `LAB028_RUNTIME_WEBHOOK_URL`: webhook publicado.
- `LAB028_N8N_BASE_URL`: URL base de n8n para preparar/restaurar fixtures.
- `LAB028_N8N_API_TOKEN`: API Key para las dos Data Tables permitidas.

Ejecución en exactamente dos bloques PowerShell:

```powershell
# BLOQUE 1 — ejecutar y medir
if (-not $env:LAB028_RUNTIME_WEBHOOK_URL -or -not $env:LAB028_N8N_BASE_URL -or -not $env:LAB028_N8N_API_TOKEN) { throw 'Faltan variables LAB028 runtime.' }
$lab028Resultado = Join-Path $PWD 'scripts/lab028/runtime_real_lab028_resultado.json'
$lab028Cronometro = [System.Diagnostics.Stopwatch]::StartNew()
node scripts/lab028/probar_runtime_real_lab028.mjs | Set-Content -LiteralPath $lab028Resultado -Encoding utf8
$lab028ExitCode = $LASTEXITCODE
$lab028Cronometro.Stop()
$lab028TiempoPowerShellS = [Math]::Round($lab028Cronometro.Elapsed.TotalSeconds, 3)
```

```powershell
# BLOQUE 2 — procesar y mostrar PASS/FAIL, tiempos y causa
$lab028Data = Get-Content -LiteralPath $lab028Resultado -Raw | ConvertFrom-Json
$lab028Data.pruebas | Select-Object nombre, @{n='PASS/FAIL';e={$_.'PASS/FAIL'}}, cantidad_pasos, tiempo_total_s, minimo_s, maximo_s, promedio_s, causa | Format-Table -AutoSize
$lab028Data.resumen | Format-List total, pass, fail, tiempo_total_s, minimo_s, maximo_s, promedio_s
[pscustomobject]@{ resultado = $(if ($lab028Data.ok) {'PASS'} else {'FAIL'}); exit_code = $lab028ExitCode; tiempo_powershell_s = $lab028TiempoPowerShellS }
```

La salida del runner es JSON estructurado. No imprime tokens, API Keys ni URL. Registra por interacción número de paso, estado HTTP y tiempo real; por prueba incluye total, mínimo, máximo, promedio, PASS/FAIL, causa, sesiones e identificadores de cita disponibles.

Pruebas locales ejecutadas:

- `node --check scripts/lab028/probar_runtime_real_lab028.mjs`: PASS.
- `node --check scripts/lab028/probar_script_runtime_real_lab028.mjs`: PASS.
- `node scripts/lab028/probar_script_runtime_real_lab028.mjs`: **7 pruebas con mocks, PASS**.

Las pruebas cubren parsers, contador exacto de avisos, cuatro escenarios runtime simulados, métricas por interacción, restauración fallida, ausencia de `structuredClone` y URLs hardcodeadas, conservación byte a byte de LAB-025/026/027 y arquitectura LAB-028 de 311 nodos, 104 Code y 1 Wait heredado.

No se ejecutó el runner contra n8n ni Calendar. No se ejecutó regresión histórica completa, no se optimizó rendimiento y no se rediseñó LAB-028. No se hizo stage, commit ni push.

### Corrección de diagnóstico del runner runtime

La primera ejecución real produjo tres FAIL con causa genérica y pasos que solo contenían número, tiempo y estado HTTP. Esa salida era insuficiente para distinguir un contrato inválido, una confirmación no reconocida, un aviso ausente, una acción equivocada o un bucle conversacional. El mapa superior de sesiones tampoco permitía recuperar los identificadores usados.

Se modificaron únicamente `scripts/lab028/probar_runtime_real_lab028.mjs`, `scripts/lab028/probar_script_runtime_real_lab028.mjs` y este HANDOFF. El workflow LAB-028, sus fixtures y LAB-025/026/027 permanecieron intactos.

Cada paso registra ahora: `paso`, `mensaje_enviado`, `http_status`, `tiempo_s`, `reply_recibido`, `ok_recibido`, `clinic_id_recibido`, `session_id_recibido`, `estado_interpretado` y `siguiente_accion`. La salida superior incluye `sesiones`. Cada prueba incluye `session_id`, `session_id_urgencia`, `respuesta_final`, `confirmacion_detectada`, `cantidad_avisos_detectados`, `aviso_detectado`, `contrato_publico_valido`, compatibilidad de categoría, causa exacta e identificadores de cita disponibles.

El runner distingue `respuesta_vacia`, `respuesta_no_interpretable`, `session_id_incorrecta`, `contrato_publico_invalido`, `confirmacion_no_detectada`, `aviso_esperado_no_detectado`, `aviso_inesperado`, `multiples_avisos`, `aviso_categoria_incorrecta`, `bucle_conversacional` y `maximo_pasos_alcanzado`. Compara respuestas normalizadas por similitud y detiene la prueba ante repetición sustancial; también detiene tres acciones consecutivas iguales. No continúa enviando mensajes tras confirmación, urgencia, respuesta vacía, texto no interpretable o bucle.

Pruebas locales ejecutadas:

- `node --check scripts/lab028/probar_runtime_real_lab028.mjs`: PASS.
- `node scripts/lab028/probar_script_runtime_real_lab028.mjs`: **10 pruebas, PASS**.

Los mocks cubren confirmación flexible, aviso literal, confirmación sin aviso, aviso de categoría incorrecta, respuesta repetida, máximo de pasos, contrato inválido, respuesta vacía, ausencia de URL/secretos en la salida y conservación de la arquitectura LAB-028. No se ejecutó contra n8n real y no se optimizó rendimiento.

Comando de la próxima ejecución, usando las mismas variables y los dos bloques PowerShell ya documentados: `node scripts/lab028/probar_runtime_real_lab028.mjs`.

No se hizo stage, commit ni push.

### Corrección del parser para solicitud combinada

Causa confirmada: Luna devolvió alternativas y solicitó en la misma respuesta número de opción, nombre del tutor, nombre de la mascota y teléfono. El parser evaluaba primero la coincidencia parcial de mascota, enviaba solo ese dato y recibía de nuevo la misma solicitud; el detector de bucle funcionó correctamente, pero el conductor había elegido una acción incompleta.

Se modificaron únicamente `scripts/lab028/probar_runtime_real_lab028.mjs`, `scripts/lab028/probar_script_runtime_real_lab028.mjs` y este HANDOFF. El parser prioriza ahora: selección con datos completos; datos completos sin selección; selección sola; tutor; mascota; teléfono. La solicitud combinada genera `enviar_seleccion_y_datos_completos` y un único mensaje con opción 1, tutor LAB028_TEST, mascota LAB028_TEST y teléfono ficticio. La detección de bucles no cambió.

Pruebas añadidas: respuesta real observada, selección con datos completos, datos completos sin selección, selección sola y solicitudes individuales de tutor, mascota y teléfono. Resultado: `node --check scripts/lab028/probar_runtime_real_lab028.mjs` **PASS** y `node scripts/lab028/probar_script_runtime_real_lab028.mjs` **18 pruebas, PASS**.

No se ejecutó el runner contra n8n real. No se modificaron workflow, fixtures, LAB-025, LAB-026 ni LAB-027. No se hizo stage, commit ni push.

### Selección de una sola prueba runtime

El runner acepta `LAB028_RUNTIME_TEST` con los valores `medica_aviso`, `sin_aviso`, `urgencia_misma_sesion`, `urgencia_otra_sesion` y `all`. Si la variable no está definida, usa `all` y conserva el comportamiento anterior. Un valor desconocido falla antes de llamar al webhook o modificar fixtures con causa `seleccion_prueba_invalida:<valor>`.

Para ejecutar únicamente la primera prueba en el BLOQUE 1 de PowerShell:

```powershell
$env:LAB028_RUNTIME_TEST = 'medica_aviso'
node scripts/lab028/probar_runtime_real_lab028.mjs | Set-Content -LiteralPath $lab028Resultado -Encoding utf8
```

La salida mantiene el mismo contrato JSON, mapa de sesiones, evidencia por paso, diagnóstico y métricas; `resumen.total` y `pruebas` contienen únicamente las pruebas seleccionadas. `medica_aviso` no ejecuta la limpieza temporal requerida por `sin_aviso`.

Validación local: sintaxis PASS y `node scripts/lab028/probar_script_runtime_real_lab028.mjs` con **13 pruebas, PASS**. Incluye selección única, `all` y valor inválido. No se ejecutó contra n8n real, no se optimizó rendimiento y no se modificaron workflow, fixtures, lógica funcional ni LAB-025/026/027. No se hizo stage, commit ni push.

## Auditoría focalizada e instrumentación de rendimiento

### Diagnóstico estructural concluido

La comparación entre LAB-026 cerrado y LAB-028 actual encontró 303/102/1 frente a 311/104/1 nodos/Code/Wait. LAB-028 añadió exactamente seis lecturas Data Table y dos Code. No eliminó ni modificó ningún nodo heredado. Las únicas conexiones heredadas desviadas son las salidas de `Preparar respuesta cita confirmada` y `Preparar respuesta cita peluquería confirmada`; ambas vuelven a sus `Respond to Webhook` originales después de cuatro nodos contextuales.

Inicio de reserva médica, inicio de grooming y urgencia ejecutan cero nodos LAB-028. Después de una confirmación médica se ejecutan, en serie: `Leer configuración contextual médica LAB-028`, `Leer avisos contextuales médica LAB-028`, `Leer urgencia sesión médica LAB-028` y `Añadir aviso contextual médica LAB-028`. Grooming ejecuta los cuatro equivalentes. El export no contiene cambios indirectos fuera de esos ocho nodos y conexiones.

El camino estructural heredado hasta preparar una confirmación médica contiene 20 Code, 8 Data Table y 3 Google Calendar; grooming contiene 23 Code, 8 Data Table y 3 Google Calendar. Incluye consultas de disponibilidad, revalidación, creación de evento y persistencia/verificación durable. La urgencia de 6–7 segundos frente a inicios de agenda de hasta 54 segundos demuestra que LAB-028 no explica la latencia previa a confirmar.

Causas ordenadas por evidencia: primero, task runner frío/saturado o infraestructura; segundo, latencia serial acumulada de Calendar y Data Tables del tramo LAB-026; tercero, las tres lecturas LAB-028 como contribución posible únicamente después de confirmar; cuarto, Groq/Cohere/RAG solo en ejecuciones donde los tiempos por nodo demuestren su intervención. El repositorio configura `N8N_RUNNERS_MAX_CONCURRENCY=5` y `N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT=0` en n8n y task-runners, pero esta auditoría no confirma los valores efectivos de los contenedores publicados. El único Wait es el reintento Telegram heredado y no pertenece a la ruta normal de agenda.

No se implementó optimización: la evidencia estructural no identifica todavía una corrección funcional segura.

### Analizador de ejecuciones

Archivos creados:

- `scripts/lab028/analizar_rendimiento_runtime_lab028.mjs`
- `scripts/lab028/probar_analisis_rendimiento_lab028.mjs`

El analizador es estrictamente de solo lectura. Puede consumir archivos JSON exportados o hacer únicamente GET a `/api/v1/executions/{id}?includeData=true`. No modifica workflows, Data Tables, Calendar, task runners ni configuración runtime.

Por ejecución informa duración de pared, ventana temporal cubierta por nodos, tiempo fuera de esa ventana, clasificación agenda/urgencia, tiempos acumulados y máximos de Code, Data Table, Google Calendar, IA/RAG y Wait, nodos LAB-028, quince nodos más lentos, reintentos, Wait ejecutados y pausas mayores a un segundo. Marca como `posible_pausa_task_runner` una pausa de al menos cinco segundos adyacente a un Code; es una señal para investigar, no prueba causal. Con al menos una ejecución de cada clase calcula la diferencia promedio agenda versus urgencia.

Variables necesarias para lectura directa desde la API:

- `LAB028_N8N_BASE_URL`
- `LAB028_N8N_API_TOKEN`
- `LAB028_EXECUTION_IDS`, con IDs separados por coma; debe incluir al menos una ejecución lenta de agenda y una de urgencia.

Ejecución desde PowerShell en dos bloques:

```powershell
# BLOQUE 1 — ejecutar y medir
if (-not $env:LAB028_N8N_BASE_URL -or -not $env:LAB028_N8N_API_TOKEN -or -not $env:LAB028_EXECUTION_IDS) { throw 'Faltan variables para analizar ejecuciones LAB-028.' }
$lab028AnalisisPath = Join-Path $PWD 'scripts/lab028/analisis_rendimiento_runtime.json'
$lab028AnalisisCronometro = [System.Diagnostics.Stopwatch]::StartNew()
node scripts/lab028/analizar_rendimiento_runtime_lab028.mjs | Set-Content -LiteralPath $lab028AnalisisPath -Encoding utf8
$lab028AnalisisExitCode = $LASTEXITCODE
$lab028AnalisisCronometro.Stop()
```

```powershell
# BLOQUE 2 — procesar y mostrar
$lab028Analisis = Get-Content -LiteralPath $lab028AnalisisPath -Raw | ConvertFrom-Json
$lab028Analisis.ejecuciones | Select-Object execution_id, clasificacion, estado, tiempo_pared_ms, ventana_nodos_ms, tiempo_fuera_ventana_nodos_ms | Format-Table -AutoSize
$lab028Analisis.ejecuciones | ForEach-Object { Write-Host "`nEjecución $($_.execution_id) — $($_.clasificacion)"; $_.nodos_mas_lentos | Select-Object nombre, tipo_metrica, duracion_ms, intento, error | Format-Table -AutoSize; $_.posibles_pausas_task_runner | Format-Table -AutoSize }
$lab028Analisis.comparacion_agenda_urgencia | Format-List
[pscustomobject]@{ resultado = $(if ($lab028Analisis.ok) {'PASS'} else {'FAIL'}); exit_code = $lab028AnalisisExitCode; tiempo_powershell_s = [Math]::Round($lab028AnalisisCronometro.Elapsed.TotalSeconds, 3) }
```

También admite archivos locales sin conexión: `node scripts/lab028/analizar_rendimiento_runtime_lab028.mjs ejecucion_agenda.json ejecucion_urgencia.json`.

Limitación: la atribución depende de que n8n conserve `data.resultData.runData` y los campos `startTime`/`executionTime`. Si la configuración de retención elimina datos o la API no los entrega, el analizador falla con `runData_ausente`. `executionTime` mide lo reportado por cada nodo; pausas, cola del runner o espera de infraestructura pueden aparecer solo como huecos entre nodos o tiempo fuera de la ventana, por lo que requieren correlación con logs de n8n/task-runners para confirmar causalidad.

Validación local: sintaxis PASS y `node scripts/lab028/probar_analisis_rendimiento_lab028.mjs` con **8 pruebas, PASS**. No se ejecutó la regresión histórica, no se modificaron LAB-025/026/027 ni el workflow LAB-028, y no se hizo stage, commit ni push.

## Diagnóstico A/B temporal LAB-026 vs LAB-028

Se creó `n8n/workflows/comercial/temporal_lab026_diagnostico_rendimiento_ab.json` desde el export oficial LAB-026. Conserva exactamente 303 nodos, 102 Code, todos los tipos, contenido Code y conexiones. Las únicas diferencias son nombre, `id`, `versionId`, `webhookId` y path temporal `vetatiende-diagnostico-lab026-ab`. LAB-026 oficial conserva SHA-256 `cf11e321b995438eb07fcb33f30e647d4e24e62447943fa92a835daafdd3239a`.

Archivos temporales creados:

- `n8n/workflows/comercial/temporal_lab026_diagnostico_rendimiento_ab.json`
- `scripts/lab028/validar_lab026_temporal_ab.mjs`
- `scripts/lab028/probar_runtime_lab026_ab.mjs`
- `scripts/lab028/probar_script_runtime_lab026_ab.mjs`
- `scripts/lab028/limpiar_runtime_lab026_ab.mjs`

Validación local:

- `node scripts/lab028/validar_lab026_temporal_ab.mjs`: PASS; equivalencia funcional y SHA oficial confirmados.
- `node scripts/lab028/probar_script_runtime_lab026_ab.mjs`: **4 pruebas, PASS**.
- Sintaxis de validador, runner, prueba y limpieza: PASS.

Publicación manual mínima: importar en n8n únicamente `temporal_lab026_diagnostico_rendimiento_ab.json`, comprobar que el nombre sea `LAB-026 TEMP - Diagnóstico rendimiento A/B` y que el webhook sea exclusivamente `vetatiende-diagnostico-lab026-ab`, y publicar/activar solo esa copia durante la medición. No sustituir ni editar el workflow oficial LAB-026 o LAB-028. El webhook esperado es `<BASE_PUBLICA>/webhook/vetatiende-diagnostico-lab026-ab`.

Ejecución en PowerShell:

```powershell
# BLOQUE 1 — ejecutar y medir
$env:LAB026_AB_WEBHOOK_URL = '<URL_TEMPORAL_COMPLETA>'
$env:LAB026_AB_SESSION_ID = 'lab026_ab_medica_' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$lab026AbResultado = Join-Path $PWD 'scripts/lab028/runtime_lab026_ab_resultado.json'
$lab026AbCronometro = [System.Diagnostics.Stopwatch]::StartNew()
node scripts/lab028/probar_runtime_lab026_ab.mjs | Set-Content -LiteralPath $lab026AbResultado -Encoding utf8
$lab026AbExitCode = $LASTEXITCODE
$lab026AbCronometro.Stop()
```

```powershell
# BLOQUE 2 — mostrar resultado comparable
$lab026Ab = Get-Content -LiteralPath $lab026AbResultado -Raw | ConvertFrom-Json
$lab026Ab.pasos | Select-Object paso, mensaje_enviado, http_status, tiempo_s, estado_interpretado, siguiente_accion, reply_recibido | Format-List
$lab026Ab | Select-Object 'PASS/FAIL', causa, session_id, cantidad_pasos, tiempo_total_s, minimo_s, maximo_s, promedio_s, confirmacion_detectada, contrato_publico_valido, identificadores_limpieza | Format-List
[pscustomobject]@{ resultado = $lab026Ab.'PASS/FAIL'; exit_code = $lab026AbExitCode; tiempo_powershell_s = [Math]::Round($lab026AbCronometro.Elapsed.TotalSeconds, 3) }
```

El runner usa únicamente tutor, mascota, teléfono y sesión `LAB026_AB`, no exige `appointment_ref`, conserva el contrato público y registra `appointment_id`, `event_id` y `calendar_id` si están expuestos.

Limpieza: `node scripts/lab028/limpiar_runtime_lab026_ab.mjs scripts/lab028/runtime_lab026_ab_resultado.json` produce `dry_run`. Añadir `--execute` elimina únicamente filas cuya `session_id` pertenezca al resultado LAB026_AB o cuyo `state_key` sea exactamente `clinica_piloto_001::<session_id>`, en una allowlist cerrada de tablas de cita/operación/auditoría/estado. Vuelve a leer y exige fingerprint antes de cada DELETE. Calendar no se elimina automáticamente: si el contrato expone `event_id`, la utilidad lo muestra para eliminación manual controlada; si no lo expone, informa explícitamente la limitación. Tras medir, desactivar/eliminar el workflow temporal y borrar estos archivos cuando ya no sean necesarios.

La prueba real A/B no fue ejecutada por Codex. No se modificaron LAB-025/026/027, LAB-028, infraestructura ni datos runtime. No se hizo stage, commit ni push.

## Corrección funcional de selección combinada heredada de LAB-026

El runtime E2 confirmó que `1. Tutor Prueba E2, mascota Max E2, teléfono +56911111111` conservaba los datos personales, pero no seleccionaba inmediatamente la alternativa 1. La causa era el patrón de número directo heredado en `Interpretar fecha y hora agenda`: solo aceptaba el número aislado, con punto o paréntesis final, y exigía fin de mensaje. `Interpretar fecha y hora peluquería` contenía la misma construcción.

Se añadió `scripts/lab028/seleccion_alternativas_lab028.mjs` con una detección determinista y anclada al inicio. Acepta un número del 1 al 9, opcionalmente precedido por `opción`/`opcion`, y permite después punto, coma, dos puntos, guion o espacio. Antes de devolverlo comprueba que el número corresponda a una alternativa efectivamente guardada. No extrae números de teléfonos, fechas, horas ni texto en posiciones posteriores. El mensaje original no se recorta ni reemplaza, por lo que el procesamiento existente conserva tutor, mascota y teléfono presentes en la misma interacción.

El generador aplica esta corrección únicamente a los nodos `Interpretar fecha y hora agenda` e `Interpretar fecha y hora peluquería` de la copia LAB-028; el export histórico LAB-026 no fue modificado. Se regeneró `n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json` sin agregar nodos ni conexiones.

Archivos creados/modificados en esta corrección:

- `scripts/lab028/seleccion_alternativas_lab028.mjs`
- `scripts/lab028/generar_workflow_lab028.mjs`
- `scripts/lab028/probar_lab028.mjs`
- `n8n/workflows/comercial/lab028_avisos_comerciales_contextuales_post_reserva.json`
- `docs/comercial/lab028/HANDOFF_CODEX.md`

Pruebas focalizadas: `node scripts/lab028/probar_lab028.mjs` dio **38 pruebas, PASS**. Incluye todos los formatos solicitados, casos negativos con teléfono, fecha, hora y texto sin selección, y rechazo de una opción no ofrecida. `node scripts/lab028/validar_workflow_lab028.mjs` dio **PASS** con 311 nodos, 104 Code, 1 Wait, +8 nodos LAB-028, +2 Code y +0 Wait. LAB-026 histórico conserva SHA-256 `cf11e321b995438eb07fcb33f30e647d4e24e62447943fa92a835daafdd3239a`.

Aplicación pendiente en E2: importar o actualizar el workflow vigente con el export regenerado, revisar el diff de esos dos Code en la interfaz y publicar la nueva versión. Validar con una sesión ficticia nueva enviando selección y datos completos en una sola respuesta. No se modificaron infraestructura, OAuth, Caddy, Docker, credenciales, Calendar ni Data Tables. No se hizo stage, commit ni push.

## Cierre técnico final

LAB-028 quedó validado funcionalmente en la E2 nueva. La selección combinada confirma directamente, la reserva añade un solo aviso contextual y el rendimiento de agenda volvió al rango esperado. La VM principal (`10.0.0.225`) mantiene Caddy, Streamlit público e interno y Qdrant; n8n y task-runners están detenidos. E2 (`10.0.0.97`) mantiene n8n, task-runners, LAB-028 y el scheduler LAB-027. Streamlit y el callback OAuth alcanzan n8n por la red privada en TCP 5678, restringido por OCI a `10.0.0.225/32` y por una regla iptables persistente. Google Calendar fue reconectado, el RAG fue copiado y E2 configura `N8N_SKIP_AUTH_ON_OAUTH_CALLBACK=true`. La VM principal y los snapshots/backups permiten rollback.

Rendimiento documentado: LAB-026 original tardó 47–57 s en agenda directa en la VM principal. En E2 registró 4,329 s, 4,972 s y 4,896 s, con promedio 4,732 s. La confirmación real E2 tardó 11,052 s; RAG E2, 15,162 s total; Streamlit final, aproximadamente 5 s para horarios. La validación de selección combinada registró 8,69 s en el primer paso y 8,689 s en el segundo, con confirmación directa.

Validación local final ejecutada una vez:

- `probar_lab028.mjs`: 38 pruebas, PASS.
- `validar_workflow_lab028.mjs`: PASS; 311 nodos, 104 Code, 1 Wait, +8 nodos, +2 Code y +0 Wait LAB-028.
- `probar_fixtures_runtime_contextual_lab028.mjs`: 7 pruebas, PASS.
- `probar_script_runtime_real_lab028.mjs`: 18 pruebas, PASS.
- `probar_analisis_rendimiento_lab028.mjs`: 8 pruebas, PASS.
- Regresión completa `validar_workflow_lab026.mjs`: PASS, 303 nodos, 102 Code y 1.570 aserciones.
- `validar_workflows_lab027.mjs`: PASS, 2.791 comprobaciones y 245 comprobaciones de lógica.
- LAB-026 conserva SHA-256 `cf11e321b995438eb07fcb33f30e647d4e24e62447943fa92a835daafdd3239a`.

Se retiraron la copia temporal A/B, su validador, runner, prueba y utilidad de limpieza, junto con tres JSON locales de resultados/diagnóstico. Se conservaron las herramientas LAB-028 útiles para mantenimiento.

La limpieza runtime final fue ejecutada externamente contra E2 con la utilidad segura: `limpiar` dio PASS y `verificar_limpieza` confirmó cero residuos `LAB028_TEST` en `lab028_configuracion` y `lab028_campanas`. Las citas ficticias inequívocas también fueron eliminadas de Google Calendar. No quedan acciones runtime pendientes.

No se hizo stage, commit ni push.
