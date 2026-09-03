# Guía de importación controlada LAB-026

## Objetivo

Importar la implementación preparada sin alterar el workflow público activo hasta confirmar que el nuevo export abre correctamente y que las tablas LAB-026 pueden inicializarse.

## Archivo

~~~text
n8n/workflows/comercial/lab026_cancelacion_reprogramacion_citas_confirmadas.json
~~~

## Reglas

- Importar exclusivamente mediante la interfaz visual de n8n.
- No modificar SQLite, la API interna ni archivos de n8n.
- No activar LAB-026 al momento de importarlo.
- No desactivar ni eliminar el workflow LAB-024 vigente durante la revisión inicial.
- No crear datos reales.
- No modificar credenciales ni revelar sus valores.

## Secuencia mínima

1. Importar el JSON como un workflow nuevo.
2. Confirmar que aparece con el nombre:

   `LAB-026 - Cancelación y reprogramación segura de citas confirmadas`

3. Confirmar que permanece inactivo.
4. Verificar visualmente que los nodos de Google Calendar reconocen la credencial existente `Google Calendar comercial LAB-022`.
5. Ejecutar una sola vez la rama que comienza en:

   `Inicializar tablas LAB-026 (ejecutar una vez)`

6. Comprobar que terminan correctamente:

   - `Crear tabla lab026_citas`;
   - `Crear tabla lab026_operaciones_cita`;
   - `Crear tabla lab026_auditoria_citas`;
   - `Confirmar inicialización LAB-026`.

7. Verificar en Data Tables que existen exactamente esas tres tablas y que todavía no contienen citas reales.
8. Mantener LAB-026 inactivo hasta preparar y ejecutar la primera prueba ficticia de persistencia durable.

La inicialización es idempotente: si se ejecuta nuevamente, reutiliza las tablas existentes por nombre en vez de duplicarlas. No debe utilizarse para reemplazar tablas cuyo esquema haya sido alterado manualmente.

## Activación posterior

LAB-024 y LAB-026 comparten la ruta pública vigente. No deben permanecer activos simultáneamente.

La sustitución controlada se realizará solamente después de:

- revisar que el import no tenga nodos desconocidos;
- aprobar la inicialización;
- comprobar credenciales enlazadas;
- definir el bloque exacto de primera prueba ficticia;
- conservar un camino de reversión al workflow LAB-024 todavía intacto.

La activación no forma parte de la primera intervención de importación.
