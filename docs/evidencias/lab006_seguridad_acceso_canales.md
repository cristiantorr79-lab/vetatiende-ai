# Evidencia LAB-006 - Seguridad de acceso y separación de canales

Fecha: 05-07-2026

## Objetivo

Validar que VetAtiende AI separa el acceso de clientes externos y personal autorizado, evitando que el flujo interno dependa de frases escritas por el usuario como "soy veterinario", "soy recepción" o "modo interno".

## Arquitectura validada

Flujo público:
Cliente externo → Luna recepción → RAG público

Flujo interno:
Personal autorizado → Aplicación interna VetAtiende → Webhook interno protegido → Luna Interna → RAG interno

## Workflow implementado

Archivo exportado:

n8n/workflows/lab006_vetatiende_seguridad_acceso_canales.json

Nodos principales:

- Webhook Interno Protegido
- Normalizar Entrada Interna
- Luna Interna - RAG Autorizado
- RAG Interno - Procedimientos
- Responder App Interna

## Validaciones realizadas

### Prueba 1 - Acceso con header correcto

Resultado:
APROBADO

Detalle:
Se envió una solicitud POST al Webhook interno protegido incluyendo el header autorizado.

Header usado en entorno local:
x-vetatiende-interno-key

Resultado obtenido:
El flujo aceptó la solicitud, normalizó la entrada, consultó Luna Interna y devolvió respuesta mediante Respond to Webhook.

Consulta probada:
"Cual es el procedimiento de aislamiento?"

Respuesta:
Luna Interna respondió correctamente usando documentación interna autorizada.

### Prueba 2 - Acceso sin header

Resultado:
APROBADO

Detalle:
Se envió una solicitud POST al mismo Webhook sin incluir el header interno autorizado.

Resultado obtenido:
n8n bloqueó la solicitud con error 403 Prohibido.

### Prueba 3 - Verificación de secretos en workflow exportado

Resultado:
APROBADO

Detalle:
Se revisó que el archivo exportado del workflow LAB-006 no incluyera la clave local vetatiende-lab006-local en texto plano.

Resultado obtenido:
No se encontró la clave dentro del JSON exportado.

## Criterio de salida LAB-006

Cumplido.

Un cliente externo no puede acceder al flujo interno solo por escribir que pertenece al personal de la clínica. El acceso interno queda preparado mediante una puerta técnica protegida, pensada para ser consumida por una futura aplicación o panel interno de VetAtiende AI.

## Nota de producto

WhatsApp se mantiene como canal principal para clientes externos.

El personal autorizado deberá usar una aplicación interna o panel separado, evitando mezclar consultas públicas con procedimientos internos.
