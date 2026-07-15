# Registro de transferencias y tratamiento internacional — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** MVP comercial

## Objetivo

Identificar los proveedores que pueden almacenar o procesar datos fuera de Chile, las categorías de información involucradas y las condiciones que deben validarse antes del primer piloto.

## Regla general

Ninguna transferencia o tratamiento internacional deberá habilitarse con datos reales sin:

- identificar el proveedor y la ubicación conocida o posible;
- justificar la necesidad del tratamiento;
- minimizar los datos enviados;
- revisar el acuerdo contractual aplicable;
- identificar subencargados relevantes;
- informar el tratamiento cuando corresponda;
- documentar la aprobación previa al piloto.

La existencia de infraestructura o contratos publicados por un proveedor no reemplaza la validación de la cuenta, configuración y servicio utilizados por VetAtiende AI.

## 1. Matriz inicial de transferencias y ubicaciones

| Proveedor o componente | Datos que podría recibir | Ubicación conocida o prevista | Situación internacional | Estado |
|---|---|---|---|---|
| Oracle Cloud Infrastructure | Workflows, base de datos, ejecuciones y registros técnicos | Región chilena `sa-santiago-1` o `sa-valparaiso-1`, por confirmar en la instancia | El alojamiento principal puede mantenerse en Chile; soporte y subencargados deben revisarse | Condicionado |
| Google Workspace | Citas, disponibilidad, datos del tutor, mascota y registros operativos | Estados Unidos, Europa o sin preferencia, según edición y configuración | Tratamiento o almacenamiento fuera de Chile | Condicionado |
| GroqCloud | Mensajes y fragmentos enviados al modelo | Estados Unidos | Tratamiento internacional directo | Condicionado a minimización y Zero Data Retention |
| Cohere SaaS | Consultas y fragmentos utilizados para embeddings | Región `US-Central` | Tratamiento internacional directo | Condicionado a cuenta comercial, DPA y controles de datos |
| Telegram | Alertas enviadas mediante bots y grupos | Infraestructura de nube sin residencia exclusiva en Chile confirmada | Posible tratamiento internacional | Uso restringido a alertas mínimas |
| Streamlit autohospedado | Interfaz, sesiones y registros técnicos | Oracle Cloud en Chile, según configuración prevista | No genera transferencia adicional por sí mismo si permanece autohospedado en Chile | Condicionado a despliegue y configuración |
| n8n autohospedado | Mensajes, citas, credenciales y ejecuciones | Oracle Cloud en Chile, según configuración prevista | No genera transferencia adicional por sí mismo; las integraciones sí pueden hacerlo | Condicionado a despliegue y configuración |

La ubicación del servidor principal no determina por sí sola todos los lugares donde pueden tratarse los datos. También deberán considerarse servicios de soporte, registros, subencargados, integraciones y copias de seguridad.

## 2. Garantías y controles requeridos

| Proveedor | Garantías o controles requeridos antes del piloto | Evidencia necesaria |
|---|---|---|
| Oracle Cloud Infrastructure | Confirmar región chilena, acuerdo de tratamiento, subencargados, cifrado, respaldos y controles de acceso | Captura o registro de región, contrato aplicable y evidencia de configuración |
| Google Workspace | Cuenta corporativa, acuerdo de procesamiento, verificación en dos pasos, permisos restringidos y región configurada cuando esté disponible | Contrato aceptado, edición contratada y revisión de configuración administrativa |
| GroqCloud | Acuerdo de procesamiento, Zero Data Retention, minimización y exclusión de identificadores innecesarios | Evidencia de ZDR activado e inspección de datos enviados |
| Cohere SaaS | Cuenta comercial, Data Processing Addendum, entrenamiento desactivado y Zero Data Retention aprobado | Contrato, configuración de Data Controls y confirmación de ZDR |
| Telegram | Alerta mínima, grupo privado, política del bot, eliminación periódica y ausencia de datos personales directos | Prueba del mensaje, revisión de integrantes y procedimiento de eliminación |
| Streamlit autohospedado | Alojamiento en región chilena, HTTPS, autenticación, aislamiento de sesiones y secretos externos | Evidencia del despliegue, certificado, acceso y pruebas entre usuarios |
| n8n autohospedado | Región chilena, clave de cifrado protegida, poda de ejecuciones, TLS y reducción de datos almacenados | Configuración sanitizada, auditoría de seguridad y prueba de eliminación |

## 3. Criterio de aprobación

Cada proveedor deberá clasificarse antes del piloto como:

- **Aprobado:** las garantías fueron verificadas y existe evidencia;
- **Aprobado con restricciones:** solo puede utilizarse bajo condiciones específicas;
- **Pendiente:** faltan contratos, configuraciones o pruebas;
- **Rechazado:** no ofrece garantías suficientes para el tratamiento previsto.

En esta etapa, todos los proveedores permanecen pendientes o condicionados. Ninguno está aprobado todavía para recibir datos personales reales.

