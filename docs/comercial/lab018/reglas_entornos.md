# Reglas de entornos — VetAtiende AI

**LAB:** LAB-018  
**Estado:** Versión inicial completada  
**Ámbito:** MVP comercial

Este documento define la separación obligatoria entre los entornos de demostración, pruebas y producción.

## 1. Entorno de demostración

El entorno de demostración debe utilizar exclusivamente datos ficticios, simulados o anonimizados.

Reglas obligatorias:

- no crear citas reales;
- no escribir en hojas operativas reales;
- no enviar alertas reales por Telegram;
- no utilizar credenciales de producción;
- no conectarse a recursos de una clínica real;
- no almacenar nombres, teléfonos ni conversaciones reales;
- mostrar claramente que se trata de una demostración;
- mantener workflows, variables y recursos separados de producción.

## 2. Entorno de pruebas

El entorno de pruebas debe validar funcionalidades sin exponer datos reales ni afectar recursos productivos.

Reglas obligatorias:

- usar datos ficticios o anonimizados;
- utilizar calendarios, hojas y canales de prueba separados;
- usar credenciales exclusivas para pruebas;
- evitar copiar bases de datos reales completas;
- limitar el acceso al equipo autorizado;
- eliminar los datos de prueba cuando dejen de ser necesarios;
- documentar errores sin incluir información personal innecesaria;
- no reutilizar secretos de producción.

## 3. Entorno de producción

El entorno de producción es el único autorizado para tratar datos reales de clínicas, tutores y mascotas.

Reglas obligatorias:

- activar producción solo después de completar y validar LAB-018;
- utilizar credenciales exclusivas de producción;
- separar los datos de cada clínica;
- limitar los accesos según rol y necesidad;
- cifrar las comunicaciones y proteger las credenciales;
- mantener respaldos y procedimientos de recuperación;
- registrar accesos, errores y acciones relevantes;
- aplicar plazos de conservación y eliminación definidos;
- mantener un canal activo para incidentes y solicitudes de privacidad;
- no utilizar datos reales para pruebas, demostraciones o entrenamiento de modelos sin autorización específica.

## 4. Movimiento de datos entre entornos

Los datos personales reales no deberán copiarse desde producción hacia demostración o pruebas.

Reglas obligatorias:

- no exportar bases reales para probar nuevas funciones;
- no copiar conversaciones reales a entornos no productivos;
- usar datos ficticios cuando se necesite reproducir un error;
- anonimizar previamente cualquier información excepcionalmente necesaria;
- documentar y autorizar cualquier traslado de datos entre entornos;
- eliminar inmediatamente las copias temporales cuando termine la revisión.

## 5. Identificación y configuración de entornos

Cada entorno deberá estar claramente identificado en sus recursos, credenciales y workflows.

Reglas obligatorias:

- usar nombres que indiquen DEMO, TEST o PROD;
- mantener variables y secretos separados por entorno;
- identificar calendarios, hojas y canales según su entorno;
- impedir que un workflow de pruebas apunte a recursos de producción;
- revisar la configuración antes de activar un workflow;
- documentar quién puede modificar cada entorno.

## 6. Acceso y paso a producción

El acceso a cada entorno deberá limitarse según la función de cada persona.

Antes de pasar una funcionalidad a producción se deberá verificar:

- que fue probada con datos ficticios;
- que no contiene credenciales dentro del código o repositorio;
- que utiliza recursos exclusivos de producción;
- que respeta la separación entre clínicas;
- que registra errores sin exponer datos personales innecesarios;
- que existe un procedimiento para revertir el cambio;
- que la modificación quedó documentada y validada.

