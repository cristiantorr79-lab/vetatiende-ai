# Inventario y mapa de datos — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** MVP comercial

Este documento identifica los datos que VetAtiende AI recibe, procesa, almacena o transmite antes de utilizar información real.

## 1. Datos del tutor

| Dato | Finalidad actual | Origen | Sistemas que lo procesan |
|---|---|---|---|
| Nombre del tutor | Identificar a quien solicita la atención | Conversación con Luna | n8n, Google Calendar y Google Sheets |
| Teléfono | Contactar y confirmar la atención | Conversación con Luna | n8n, Google Calendar y Google Sheets |
| Mensaje enviado | Comprender la consulta, agenda o urgencia | Conversación con Luna | Streamlit, n8n y proveedor de IA |

## 2. Datos de la mascota

| Dato | Finalidad actual | Origen | Sistemas que lo procesan |
|---|---|---|---|
| Nombre de la mascota | Identificar la cita o atención solicitada | Conversación con Luna | n8n, Google Calendar y Google Sheets |
| Tipo de mascota | Orientar la agenda y registrar la atención | Conversación con Luna | n8n, Google Calendar y Google Sheets |
| Tamaño de la mascota | Calcular duración estimada de peluquería o lavado | Conversación con Luna | n8n, Google Calendar y Google Sheets |
| Situación reportada | Comprender la consulta o detectar una posible urgencia | Conversación con Luna | n8n, proveedor de IA, Google Sheets y Telegram interno |

## 3. Datos de agenda y operación

| Dato | Finalidad actual | Origen | Sistemas que lo procesan |
|---|---|---|---|
| Fecha y hora solicitada | Consultar disponibilidad y agendar | Conversación con Luna | n8n y Google Calendar |
| Servicio solicitado | Determinar agenda, duración y flujo correspondiente | Conversación con Luna | n8n, Google Calendar y Google Sheets |
| Duración estimada | Reservar correctamente el bloque de atención | Reglas de VetAtiende | n8n y Google Calendar |
| Estado de la cita | Registrar si está solicitada, confirmada o cancelada | Flujo de agenda | n8n, Google Calendar y Google Sheets |
| Canal de origen | Identificar desde dónde llegó la solicitud | Sistema | n8n y Google Sheets |

## 4. Datos de urgencias

| Dato | Finalidad actual | Origen | Sistemas que lo procesan |
|---|---|---|---|
| Situación reportada | Detectar una posible urgencia y derivar de forma segura | Conversación con Luna | n8n, proveedor de IA, Google Sheets y Telegram interno |
| Tipo de urgencia | Clasificar el evento para gestión interna | Reglas de VetAtiende | n8n, Google Sheets y Telegram interno |
| Fecha de registro | Mantener trazabilidad del evento | Sistema | n8n y Google Sheets |
| Estado de gestión | Saber si la alerta está pendiente, enviada o atendida | Flujo interno | n8n y Google Sheets |
| Canal de aviso | Registrar cómo fue informado el personal de la clínica | Sistema | n8n, Google Sheets y Telegram interno |

## 5. Datos técnicos y de acceso

| Dato | Finalidad actual | Origen | Sistemas que lo procesan |
|---|---|---|---|
| Dirección IP | Seguridad, diagnóstico y control de acceso | Infraestructura y solicitudes web | Oracle Cloud, n8n y Streamlit |
| Registros de ejecución | Diagnóstico de errores y trazabilidad | n8n y aplicaciones | n8n y Oracle Cloud |
| Identificadores de usuario interno | Controlar acceso del personal autorizado | Clínica | n8n y servicios internos |
| Credenciales y claves de integración | Conectar servicios externos de forma segura | Configuración administrativa | n8n y variables de entorno |
| Identificador del canal de Telegram | Enviar alertas al equipo autorizado | Configuración de la clínica | n8n y Telegram |

## 6. Datos de la clínica y personal autorizado

| Dato | Finalidad prevista | Origen | Sistemas que lo procesarán |
|---|---|---|---|
| Nombre y datos de contacto de la clínica | Configurar el servicio y mantener comunicación comercial | Clínica | VetAtiende y sistemas administrativos |
| Nombre y correo del representante | Gestionar contrato, soporte y facturación | Clínica | VetAtiende y sistemas administrativos |
| Usuarios internos | Permitir acceso al personal autorizado | Clínica | VetAtiende y n8n |
| Rol o perfil de acceso | Limitar las funciones disponibles para cada usuario | Clínica | VetAtiende y n8n |
| Registros de acceso y acciones | Seguridad, auditoría y trazabilidad | Sistema | VetAtiende, n8n y Oracle Cloud |

## 7. Mapa general del flujo de datos

```text
Tutor
→ Streamlit o canal de atención
→ n8n
→ proveedor de IA
→ Google Calendar / Google Sheets
→ Telegram interno cuando existe una urgencia
→ personal autorizado de la clínica
```

Los datos técnicos y registros de ejecución pueden además almacenarse temporalmente en Oracle Cloud y n8n para seguridad, diagnóstico y trazabilidad.

## 8. Sistemas involucrados

| Sistema | Función dentro del tratamiento |
|---|---|
| Streamlit o canal de atención | Recibir la consulta del tutor |
| n8n | Coordinar y ejecutar los flujos de VetAtiende |
| Proveedor de IA | Interpretar consultas y generar respuestas autorizadas |
| Google Calendar | Consultar disponibilidad y registrar citas |
| Google Sheets | Mantener registros operativos y de urgencias |
| Telegram | Enviar alertas al personal autorizado |
| Oracle Cloud | Alojar la infraestructura y los registros técnicos |

## 9. Observaciones preliminares

- La versión actual del Challenge utiliza datos ficticios o simulados.
- El MVP comercial no debe recibir datos reales hasta completar LAB-018.
- Los mensajes libres pueden contener información personal no solicitada.
- Las consultas de urgencia pueden incluir información delicada y requieren acceso restringido.
- Las credenciales, claves e identificadores técnicos son información confidencial y no deben almacenarse en el repositorio.
- Antes del piloto se deben definir los tiempos de conservación y eliminación para cada categoría de datos.

