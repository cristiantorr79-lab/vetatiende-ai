# LAB-026 — Actualización de experiencia y rendimiento

## Motivo

Durante A04 se comprobó que la reserva de peluquería separaba innecesariamente el tamaño y los datos mínimos en dos respuestas. También se observó una latencia excesiva entre mensajes de una misma conversación.

La infraestructura tenía `N8N_RUNNERS_AUTO_SHUTDOWN_TIMEOUT` en 15 segundos. Una pausa normal del cliente superaba ese intervalo y permitía que el runner de código se apagara entre mensajes.

## Cambios

- La respuesta de peluquería agrupa los datos faltantes del servicio con tutor, mascota y teléfono.
- La etapa siguiente queda dedicada a fecha y hora.
- El runner externo permanece disponible durante 300 segundos.
- La confirmación médica normaliza el punto final de la hora.
- La prioridad de urgencias y sus controles no se modifican.

## Aplicación controlada

1. Aplicar el paquete incremental al repositorio local sin commit.
2. Validar el export actualizado.
3. Actualizar el workflow LAB-026 existente mediante la interfaz visual de n8n.
4. No volver a ejecutar la inicialización: las tablas existentes se conservan.
5. Confirmar la credencial `Google Calendar comercial LAB-022`.
6. Publicar una nueva versión de LAB-026.
7. Cambiar en el servidor ambos valores del timeout de 15 a 300 segundos y recrear solamente `n8n` y `task-runners`.
8. Retomar A04 con una sesión ficticia nueva.

## Reversión

- El workflow LAB-024 permanece disponible sin eliminarse.
- La versión publicada anterior de LAB-026 se conserva en el historial de n8n.
- El `compose.yaml` del servidor debe respaldarse antes de cambiar el timeout.
