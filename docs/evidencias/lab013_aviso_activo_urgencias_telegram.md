# LAB-013 - Aviso activo de urgencias por Telegram interno

## Estado inicial

LAB-013 comienza después del cierre correcto de LAB-012.

Último commit validado:

ec40298 feat: implementa disponibilidad proactiva LAB-012

Estado esperado del repositorio al iniciar:

- Rama main limpia y sincronizada con origin/main.
- Workflow público funcionando desde LAB-012.
- Disponibilidad proactiva de agenda validada.
- Agenda específica funcionando con Google Calendar y Google Sheets.
- Urgencias veterinarias detectadas y registradas en Google Sheets.
- Nodo obsoleto Respuesta Horario No Disponible eliminado.
- Calendar registra correctamente tutor, mascota y teléfono.

## Objetivo LAB-013

Implementar aviso activo de urgencias veterinarias mediante Telegram interno privado.

La urgencia no debe quedar solamente registrada en Google Sheets. También debe generar un aviso activo para el equipo interno de la clínica.

## Decisión de canal MVP

Canal elegido para MVP:

Telegram privado interno

Canal diferido para mejora futura:

WhatsApp Business

## Motivo de la decisión

Telegram permite implementar un canal interno rápido, económico y práctico para una primera versión operativa vendible.

WhatsApp Business queda como mejora futura porque depende de requerimientos comerciales de cada clínica, configuración de Meta, costos, plantillas, aprobaciones y nivel de formalidad requerido por el cliente.

## Flujo esperado

1. Cliente reporta posible urgencia.
2. Luna detecta urgencia.
3. El sistema registra alerta en Google Sheets.
4. El sistema envía aviso activo a Telegram interno.
5. Luna responde al cliente con mensaje seguro.
6. No se entregan diagnósticos, tratamientos ni procedimientos internos.

## Reglas de seguridad

- No exponer token del bot.
- No exponer chat ID real en documentación pública.
- No exponer datos sensibles reales de clientes.
- Usar placeholders en documentación y pruebas.
- Mantener separado el canal público del canal interno.
- No permitir acceso interno mediante frases como soy veterinario, recepción o modo interno.

## Placeholders LAB-013

TELEGRAM_BOT_TOKEN=<TOKEN_PRIVADO>
TELEGRAM_CHAT_ID=<CHAT_ID_PRIVADO>
TELEGRAM_INTERNAL_CHANNEL=<CANAL_O_GRUPO_PRIVADO>

## Criterios de éxito

LAB-013 se considera exitoso cuando:

- Una urgencia detectada se registra correctamente en Google Sheets.
- La misma urgencia genera aviso activo en Telegram interno.
- El mensaje de Telegram incluye datos mínimos útiles para acción interna.
- Luna responde al cliente de forma segura.
- No se exponen tokens, claves, IP real ni datos sensibles.
- El workflow queda exportado y versionado en GitHub.

## Estado

Pendiente de implementación en n8n.

---

## Validación previa de Telegram

**Fecha:** 2026-07-10

Antes de modificar n8n, se validó el canal Telegram de forma independiente.

Validaciones realizadas:

- Bot interno creado mediante BotFather.
- Grupo privado interno creado para alertas de urgencia.
- Bot agregado correctamente al grupo privado.
- Mensaje de interacción enviado en el grupo.
- chat_id del grupo obtenido y resguardado como dato privado.
- Envío de mensaje de prueba realizado desde PowerShell.
- Mensaje recibido correctamente en el grupo interno de Telegram.

Resultado:

```text
Telegram interno validado correctamente para LAB-013.
```

Notas de seguridad:

- El token real del bot no se documenta.
- El chat_id real del grupo no se documenta.
- No se suben credenciales al repositorio.
- Los valores reales serán configurados únicamente como credenciales o campos privados en n8n.

---

## Validación desde n8n

**Fecha:** 2026-07-10

Se creó un workflow temporal de prueba en n8n para validar el envío de mensajes hacia Telegram interno antes de modificar el workflow público principal.

Workflow temporal:

```text
LAB-013 - TEST Telegram interno
```

Estructura probada:

```text
Manual Trigger -> Telegram Send Message
```

Validaciones realizadas:

- Credencial Telegram creada en n8n usando token privado del bot.
- Nodo Telegram configurado para enviar mensaje al grupo privado interno.
- chat_id real usado únicamente dentro de n8n, no documentado en el repositorio.
- Ejecución manual realizada correctamente.
- Mensaje recibido en el grupo privado interno de Telegram.

Resultado:

```text
Prueba n8n Telegram exitosa.
```

Conclusión:

Telegram interno queda validado como canal activo para implementar alertas de urgencia en LAB-013.

---

## Validación integrada final LAB-013

**Fecha:** 2026-07-10

Se integró el aviso activo por Telegram interno en la rama de urgencias del workflow público.

Estructura validada:

```text
Es Urgencia = true
-> Preparar Registro Urgencia
-> Registrar Alerta Urgencia
-> Enviar Alerta Telegram Interno
-> Responder Urgencia
```

Caso controlado usado:

```text
Cliente simulado reporta que su perro Firulais comió chocolate, presenta temblores y vómitos, e informa teléfono de contacto.
```

Resultados validados:

- La urgencia fue detectada correctamente.
- La alerta fue registrada correctamente en Google Sheets.
- El tutor fue extraído correctamente desde una frase tipo "Hola, soy Juan Perez".
- La mascota fue extraída correctamente desde una frase tipo "mi perro Firulais".
- El teléfono fue normalizado correctamente.
- El tipo de urgencia fue clasificado como chocolate.
- El canal de aviso quedó registrado como telegram_interno.
- El mensaje fue enviado correctamente al grupo privado interno de Telegram.
- El mensaje Telegram mostró el teléfono sin comilla inicial.
- El estado fue mostrado en Telegram como texto legible.
- Se desactivó el mensaje automático final de n8n para mejorar la presentación del aviso interno.
- Luna mantuvo respuesta segura al cliente, sin diagnóstico ni tratamiento.

Resultado final:

```text
LAB-013 validado en modo test: urgencia -> Sheets -> Telegram interno -> respuesta segura al cliente.
```

Notas de seguridad:

- No se documentó token real del bot.
- No se documentó chat_id real del grupo.
- No se expuso IP real ni URL real del webhook.
- La prueba usó datos simulados.

---

## Validación production LAB-013

**Fecha:** 2026-07-10

Se activó el workflow público y se ejecutó una prueba controlada usando la Production URL del Webhook.

Caso controlado usado:

```text
Cliente simulado informa que su gato Michi presenta dificultad para respirar y decaimiento, entregando teléfono de contacto.
```

Resultados validados en producción:

- El workflow público recibió correctamente la solicitud por Production URL.
- La urgencia fue detectada correctamente.
- La alerta fue registrada en Google Sheets.
- El tutor fue extraído correctamente como Maria Lopez.
- La mascota fue extraída correctamente como Michi.
- El tipo de mascota fue detectado como gato.
- El teléfono fue normalizado correctamente.
- El tipo de urgencia fue clasificado como dificultad para respirar.
- El canal de aviso quedó registrado como telegram_interno.
- El grupo privado interno de Telegram recibió la alerta activa.
- Luna respondió al cliente con mensaje seguro, sin diagnóstico ni tratamiento.

Respuesta production validada:

```text
tipo: urgencia_detectada
registrado: True
estado_gestion: registrada_pendiente_aviso
canal_aviso: telegram_interno
```

Resultado:

```text
LAB-013 validado en producción: urgencia -> Sheets -> Telegram interno -> respuesta segura al cliente.
```

Notas de seguridad:

- No se documentó token real del bot.
- No se documentó chat_id real del grupo.
- No se documentó URL real del webhook.
- No se expuso IP real.
- La prueba usó datos simulados.

---

## Export oficial sanitizado LAB-013

**Fecha:** 2026-07-10

Se exportó el workflow oficial de LAB-013 desde n8n y se generó una versión sanitizada para el repositorio.

Archivo oficial:

```text
n8n/workflows/lab013_vetatiende_aviso_activo_urgencias_telegram.json
```

Validaciones realizadas:

- El JSON exportado fue validado correctamente.
- El nodo Telegram fue encontrado en el workflow exportado.
- El campo chatId del nodo Telegram fue reemplazado por placeholder.
- El chat_id real no quedó expuesto en el archivo versionado.
- El token real del bot no fue documentado ni agregado al repositorio.

Placeholder usado:

```text
<TELEGRAM_CHAT_ID_PRIVADO>
```

Resultado:

```text
Export LAB-013 válido y sanitizado para GitHub.
```
