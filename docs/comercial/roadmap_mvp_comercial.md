# Roadmap MVP Comercial — VetAtiende AI

Este documento pertenece exclusivamente a la etapa comercial desarrollada en la rama `mvp-comercial`.

No modifica ni reemplaza la versión del Challenge congelada en `main` y en el tag `v1.0.0-challenge`.

## LAB-018 — Privacidad, seguridad y cumplimiento

**Estado:** Cerrado documentalmente el 15 de julio de 2026.

### Resultado

- base documental de privacidad y seguridad completada;
- proveedores y transferencias revisados;
- responsabilidades y límites del tratamiento definidos;
- matriz de 47 controles creada;
- plan de implementación técnica organizado;
- uso de datos reales todavía no autorizado.

## Estado actual

### LAB-019 — Infraestructura comercial segura

**Cerrado y validado técnicamente el 21 de julio de 2026.**

Resultados principales:

- entorno comercial separado de la versión académica;
- despliegue mediante Docker y Docker Compose;
- n8n, task runners, Streamlit y Caddy operativos;
- acceso HTTPS mediante proxy reverso;
- exposición pública limitada a los puertos 80 y 443;
- servicios internos sin publicación directa hacia Internet;
- secretos reales excluidos del repositorio;
- firewall persistente y acceso SSH endurecido;
- respaldo completo y restauración de prueba validados;
- reinicio automático de los servicios comprobado;
- validación realizada solamente con datos ficticios;
- plantilla segura exportada en infra/comercial/;
- una evidencia técnica registrada en docs/comercial/lab019/evidencias/.

## LAB-020 - Integración funcional comercial inicial

**Estado: cerrado y validado.**

LAB-020 conectó correctamente:

- interfaz Streamlit comercial;
- webhook permanente de n8n;
- Luna mediante Groq;
- respuesta devuelta y mostrada en Streamlit;
- identificación inicial mediante `CLINIC_ID=clinica_piloto_001`;
- comunicación privada entre Streamlit y n8n dentro de Docker;
- pruebas funcionales exclusivamente con datos ficticios.

El flujo validado es:

`Streamlit -> n8n comercial -> Luna -> Streamlit`

Workflow exportado:

`n8n/workflows/comercial/lab020_consulta_comercial_basica.json`

Continúan pendientes la autenticación de usuarios, el aislamiento completo entre clínicas, el dominio comercial definitivo y la autorización para utilizar datos personales reales.

## LAB-021 — RAG público comercial inicial

**Estado: cerrado y validado técnicamente el 23 de julio de 2026.**

LAB-021 incorporó información pública controlada de una clínica ficticia mediante RAG comercial:

- documentos públicos separados por clínica;
- lectura de archivos PDF y CSV desde el volumen comercial;
- embeddings multilingües mediante Cohere;
- búsqueda de contexto público como herramienta de Luna;
- generación de respuestas mediante Groq;
- conservación de `clinic_id`, `session_id`, `message` y `channel`;
- respuesta compatible con la interfaz Streamlit comercial;
- workflow limpio, publicado y validado mediante webhook permanente;
- integración completa desde Streamlit público por HTTPS;
- uso exclusivo de datos ficticios.

Se validaron consultas de horarios, precios, medios de pago e información inexistente. Luna recuperó información desde los documentos y evitó inventar respuestas cuando el dato no estaba disponible.

El almacén vectorial actual reside en memoria y deberá reemplazarse posteriormente por una solución persistente antes de ampliar el uso comercial.

Continúan pendientes la autenticación completa, el aislamiento entre múltiples clínicas y la autorización para utilizar datos personales reales.

## Próxima etapa

### LAB-022 — Agenda médica comercial parametrizable

La siguiente etapa incorporará agenda médica comercial reutilizando la lógica validada durante el Challenge.

El diseño deberá permitir configurar por clínica y servicio:

- duración de las atenciones;
- intervalos válidos de inicio;
- jornada de atención;
- horarios no disponibles;
- disponibilidad real;
- confirmación o registro pendiente según el estado de la agenda.

LAB-022 continuará utilizando exclusivamente datos ficticios.