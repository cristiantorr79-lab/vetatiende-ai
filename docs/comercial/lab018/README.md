# LAB-018 — Privacidad, seguridad y cumplimiento comercial

## Estado

**Cerrado documentalmente el 15 de julio de 2026.**

LAB-018 establece las reglas mínimas que deberá cumplir VetAtiende AI antes de utilizar datos personales reales o comenzar un piloto comercial.

## Qué hicimos realmente

Durante este LAB:

- identificamos qué datos manejará VetAtiende AI;
- definimos que la clínica será responsable de las finalidades y VetAtiende AI actuará como encargado;
- establecimos reglas de privacidad, retención, eliminación y atención de derechos;
- revisamos Oracle, Google Workspace, Groq, Cohere, Telegram, Streamlit y n8n;
- documentamos los riesgos de transferencias y tratamiento fuera de Chile;
- definimos límites para el uso de inteligencia artificial;
- establecimos medidas de seguridad y respuesta ante incidentes;
- creamos una matriz con 47 controles;
- organizamos los controles técnicos pendientes para los siguientes LAB.

## Resultado final

La base documental comercial quedó completada.

La matriz contiene:

- 27 controles documentados;
- 4 controles en implementación;
- 16 controles pendientes;
- 0 controles bloqueados.

Esto no significa que el sistema ya pueda utilizar datos reales.

Antes del primer piloto todavía deberán implementarse y probarse HTTPS, autenticación, gestión de secretos, respaldos, eliminación, aislamiento entre clínicas y configuración segura de la infraestructura.

## Documentos principales

- `matriz_preparacion_piloto.md`: muestra qué está listo y qué falta.
- `plan_implementacion_controles.md`: organiza el trabajo técnico pendiente.
- `revision_proveedores.md`: evalúa los proveedores utilizados.
- `registro_transferencias_internacionales.md`: identifica tratamientos fuera de Chile.
- `base_contractual_responsable_encargado.md`: base para el contrato con una clínica.
- `anexo_instrucciones_tratamiento.md`: define qué puede hacer VetAtiende AI con los datos.
- `politica_retencion_eliminacion.md`: propone plazos y acciones de eliminación.
- `plan_respuesta_incidentes.md`: define cómo responder ante problemas de seguridad.
- `evidencia_avance_lab018.md`: conserva la evidencia final del LAB.

Los demás archivos de esta carpeta contienen el detalle de respaldo de estas decisiones.

## Regla para los próximos LAB

Los siguientes LAB estarán orientados principalmente a implementación y pruebas.

Cada LAB tendrá como máximo un archivo de evidencia nuevo. No se volverá a crear un documento separado para cada control.

## Condición sobre datos reales

VetAtiende AI no utilizará datos personales reales hasta que los controles críticos de la matriz hayan sido implementados, probados y validados.
