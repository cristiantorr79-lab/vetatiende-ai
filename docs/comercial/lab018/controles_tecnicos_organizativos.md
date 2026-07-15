# Controles técnicos y organizativos — VetAtiende AI

**LAB:** LAB-018
**Estado:** Versión inicial completada
**Ámbito:** MVP comercial

Este documento define los controles mínimos que deberán implementarse y comprobarse antes de utilizar datos reales.

## 1. Control de acceso

El acceso a VetAtiende AI deberá limitarse según la función y la clínica de cada usuario.

Controles mínimos:

- utilizar cuentas individuales;
- prohibir cuentas compartidas;
- aplicar contraseñas robustas;
- habilitar autenticación en dos pasos cuando esté disponible;
- asignar permisos según rol;
- separar completamente los accesos entre clínicas;
- revocar cuentas cuando una persona deje de estar autorizada;
- revisar periódicamente usuarios y permisos;
- registrar intentos de acceso y cambios relevantes.

## 2. Protección de credenciales y secretos

Las claves, tokens y credenciales no deberán almacenarse en el código ni en el repositorio.

Controles mínimos:

- utilizar variables de entorno o gestores de secretos;
- mantener credenciales distintas para DEMO, TEST y PROD;
- limitar cada credencial a los permisos necesarios;
- rotar claves y tokens periódicamente;
- revocar inmediatamente credenciales expuestas;
- evitar mostrar secretos en registros y mensajes de error;
- mantener protegida la clave de cifrado de n8n;
- documentar quién administra cada credencial.

## 3. Cifrado y comunicaciones seguras

Los datos deberán protegerse durante su transmisión y almacenamiento.

Controles mínimos:

- utilizar HTTPS en todos los accesos externos;
- bloquear accesos directos no cifrados;
- proteger la base de datos y los volúmenes de almacenamiento;
- cifrar respaldos cuando corresponda;
- evitar enviar datos sensibles por canales no protegidos;
- revisar certificados y configuraciones TLS;
- no exponer puertos administrativos directamente a Internet;
- utilizar conexiones seguras con proveedores externos.

## 4. Separación entre clínicas y entornos

VetAtiende AI deberá impedir que los datos, usuarios o recursos de una clínica se mezclen con los de otra.

Controles mínimos:

- utilizar identificadores únicos por clínica;
- separar calendarios, hojas, canales y configuraciones;
- validar la clínica antes de cada lectura o escritura;
- impedir consultas cruzadas entre organizaciones;
- mantener DEMO, TEST y PROD completamente separados;
- usar credenciales distintas por entorno;
- probar periódicamente que no exista acceso entre clínicas;
- registrar y corregir inmediatamente cualquier cruce de información.

## 5. Registros, monitoreo y trazabilidad

VetAtiende AI deberá conservar registros suficientes para detectar errores, accesos indebidos e incidentes.

Controles mínimos:

- registrar accesos administrativos;
- registrar cambios de configuración y permisos;
- registrar errores y fallas relevantes;
- evitar almacenar conversaciones completas cuando no sea necesario;
- proteger los registros contra modificación o eliminación no autorizada;
- definir plazos de conservación para los logs;
- revisar periódicamente eventos sospechosos;
- generar alertas ante accesos o comportamientos anómalos.

## 6. Respaldos y recuperación

VetAtiende AI deberá mantener respaldos suficientes para recuperar el servicio sin conservar datos indefinidamente.

Controles mínimos:

- definir frecuencia y duración de los respaldos;
- cifrar los respaldos;
- limitar el acceso a las copias;
- almacenar respaldos separados del sistema principal;
- probar periódicamente la restauración;
- registrar cada recuperación realizada;
- eliminar o sobrescribir respaldos vencidos;
- aplicar nuevamente las eliminaciones pendientes después de restaurar datos.

## 7. Actualizaciones y gestión de vulnerabilidades

VetAtiende AI deberá mantener actualizados los componentes que forman parte del servicio.

Controles mínimos:

- revisar periódicamente actualizaciones de n8n, Streamlit, Docker y dependencias;
- aplicar parches de seguridad con prioridad;
- probar los cambios en TEST antes de pasar a PROD;
- documentar versiones instaladas;
- eliminar componentes y servicios que no se utilicen;
- revisar vulnerabilidades conocidas;
- mantener un procedimiento para revertir actualizaciones fallidas;
- registrar las actualizaciones relevantes.

## 8. Minimización de datos y privacidad desde el diseño

VetAtiende AI deberá solicitar y procesar únicamente los datos necesarios para cada función.

Controles mínimos:

- no solicitar RUT, domicilio o datos bancarios para gestionar una cita;
- limitar los campos obligatorios;
- evitar copiar conversaciones completas entre sistemas;
- enviar a los proveedores solo la información necesaria;
- ocultar o reducir datos en alertas internas;
- configurar valores privados y restrictivos por defecto;
- revisar el impacto en privacidad antes de agregar nuevas funciones;
- eliminar campos y registros que dejen de ser necesarios.

## 9. Gestión de incidentes y respuesta

VetAtiende AI deberá contar con un procedimiento activo para detectar, contener y corregir incidentes de seguridad.

Controles mínimos:

- definir un canal interno para reportar incidentes;
- identificar responsables de contención y comunicación;
- aislar sistemas o credenciales comprometidas;
- conservar evidencia técnica suficiente;
- informar a la clínica sin demora indebida;
- registrar datos afectados, causas y medidas aplicadas;
- recuperar el servicio de forma controlada;
- revisar y corregir las causas después del incidente.

## 10. Controles organizativos y capacitación

Las personas con acceso a VetAtiende AI deberán conocer y respetar sus responsabilidades de privacidad y seguridad.

Controles mínimos:

- definir responsables de privacidad, seguridad y soporte;
- mantener acuerdos de confidencialidad;
- capacitar al personal autorizado antes de entregar accesos;
- documentar procedimientos de operación e incidentes;
- revisar accesos cuando cambien las funciones de una persona;
- informar cambios importantes en políticas y controles;
- conservar evidencia de capacitaciones y revisiones;
- aplicar medidas correctivas ante incumplimientos.

## 11. Validación previa a producción

Antes de activar una clínica con datos reales, cada control deberá clasificarse como:

- implementado;
- probado;
- documentado;
- pendiente;
- no aplicable, con justificación.

La producción no deberá habilitarse si permanecen pendientes controles críticos de acceso, separación entre clínicas, cifrado, respaldos, eliminación o respuesta ante incidentes.

