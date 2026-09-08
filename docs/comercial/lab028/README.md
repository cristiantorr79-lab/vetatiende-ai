# LAB-028 — Avisos comerciales contextuales post-reserva

LAB-028 está funcionalmente validado en el runtime E2. Añade como máximo un aviso literal autorizado después de confirmar una reserva médica o de peluquería. No crea comunicaciones outbound, scheduler, colas ni estados comerciales de envío, y nunca modifica la cita o desplaza una urgencia.

## Arquitectura final

La VM principal (`10.0.0.225`) ejecuta Caddy, Streamlit público, Streamlit interno y Qdrant. Sus servicios n8n y task-runners permanecen detenidos. La E2 nueva (`10.0.0.97`) ejecuta n8n y task-runners, con LAB-028 y el scheduler LAB-027 activos.

Streamlit usa `N8N_INTERNAL_WEBHOOK_URL` hacia `10.0.0.97:5678`. El callback OAuth que recibe Caddy se dirige a la misma E2. El acceso a TCP 5678 está restringido en OCI a `10.0.0.225/32` y cuenta con una regla iptables equivalente persistente. Google Calendar fue reconectado, el RAG fue copiado y E2 usa `N8N_SKIP_AUTH_ON_OAUTH_CALLBACK=true` para el callback OAuth. El rollback conserva la VM principal y los snapshots/backups creados.

## Implementación

El workflow se genera desde el export histórico LAB-026, que permanece byte a byte intacto. LAB-028 suma ocho nodos: tres lecturas Data Table y un Code después de cada una de las dos confirmaciones. El resultado tiene 311 nodos, 104 Code y un Wait heredado; el incremento propio es +8 nodos, +2 Code y +0 Wait.

Las únicas tablas propias son `lab028_configuracion` y `lab028_campanas`. El texto se toma literalmente de una campaña activa, vigente y compatible con la clínica y el tipo de reserva. Una urgencia activa en la misma sesión, un error de lectura o una configuración deshabilitada conserva la confirmación sin publicidad.

La interpretación heredada de alternativas fue corregida en la copia vigente para reconocer una opción al inicio aunque venga acompañada por tutor, mascota y teléfono. La opción continúa limitada a las alternativas realmente ofrecidas. Los nodos corregidos son `Interpretar fecha y hora agenda` e `Interpretar fecha y hora peluquería`.

## Rendimiento validado

- LAB-026 original en VM principal: 47–57 s en agenda directa.
- LAB-026 original en E2 nueva: 4,329 s, 4,972 s y 4,896 s; promedio 4,732 s.
- Confirmación real E2: 11,052 s.
- RAG E2: 15,162 s total.
- Streamlit final: aproximadamente 5 s al buscar horarios.
- Selección combinada: paso 1 en 8,69 s y paso 2 en 8,689 s, con confirmación directa.

## Reproducción y mantenimiento

```powershell
node scripts/lab028/generar_workflow_lab028.mjs
node scripts/lab028/probar_lab028.mjs
node scripts/lab028/validar_workflow_lab028.mjs
node scripts/lab028/probar_fixtures_runtime_contextual_lab028.mjs
node scripts/lab028/probar_script_runtime_real_lab028.mjs
node scripts/lab028/probar_analisis_rendimiento_lab028.mjs
```

La utilidad `fixtures_runtime_contextual_lab028.mjs` carga, verifica y limpia únicamente registros de su manifiesto `LAB028_TEST`. Exige la URL y API key mediante `LAB028_N8N_BASE_URL` y `LAB028_N8N_API_TOKEN`; no guarda ni imprime secretos.

El cierre runtime terminó con limpieza PASS, verificación de cero residuos `LAB028_TEST` en las dos tablas propias y eliminación de las citas ficticias inequívocas en Google Calendar. No quedan acciones runtime pendientes.

El detalle técnico, los comandos runtime y la evidencia de cada bloque están en `HANDOFF_CODEX.md`.
