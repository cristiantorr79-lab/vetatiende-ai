# LAB-021 — RAG público comercial inicial

## Estado

Cerrado y validado técnicamente el 23 de julio de 2026 con datos exclusivamente ficticios.

## Objetivo

Permitir que Luna responda consultas públicas utilizando información controlada de una clínica ficticia, sin depender de horarios, servicios, precios y preguntas frecuentes escritos directamente en el prompt.

## Alcance implementado

- Reutilización y adaptación comercial de la lógica RAG pública validada durante el Challenge.
- Implementación separada dentro del entorno comercial de n8n.
- Lectura de documentos públicos ficticios desde el volumen RAG de la infraestructura comercial.
- Procesamiento de archivos PDF y CSV.
- Generación de embeddings multilingües mediante Cohere.
- Almacén vectorial en memoria para la validación inicial.
- Recuperación de contexto como herramienta del agente.
- Generación de respuestas mediante Luna y Groq.
- Integración de punta a punta con Streamlit comercial.
- Conservación de `clinic_id`, `session_id`, `message` y `channel`.
- Respuesta compatible con el contrato definido en LAB-020.

## Fuera de alcance

LAB-021 no incorpora:

- agenda;
- calendario;
- peluquería operativa;
- registros en Google Sheets;
- urgencias;
- alertas por Telegram;
- funciones internas;
- datos personales reales;
- aislamiento completo entre múltiples clínicas.

## Clínica ficticia utilizada

~~~text
clinica_piloto_001
~~~

## Base documental comercial

Los documentos controlados y versionados quedaron en:

~~~text
data/comercial/clinica_piloto_001/publico/
~~~

Archivos:

- `faq_clientes.html`
- `faq_clientes.pdf`
- `servicios_precios.csv`

La copia operativa del servidor se almacena bajo:

~~~text
/opt/vetatiende-comercial/data/rag/clinica_piloto_001/publico/
~~~

Dentro del contenedor n8n está disponible como:

~~~text
/home/node/.n8n-files/data/clinica_piloto_001/publico/
~~~

La carpeta operativa `infra/comercial/data/rag/` está excluida de Git.

## Workflow comercial

Nombre en n8n:

~~~text
LAB-021-RAG publico comercial inicial
~~~

Exportación:

~~~text
n8n/workflows/comercial/lab021_rag_publico_comercial_inicial.json
~~~

Ruta permanente:

~~~text
/webhook/vetatiende-comercial-rag-lab021
~~~

## Flujo implementado

~~~text
Streamlit comercial
→ webhook permanente de n8n
→ normalización de entrada
→ preparación de consulta pública
→ Luna comercial con Groq
→ búsqueda de información pública mediante RAG
→ respuesta JSON
→ Streamlit muestra la respuesta
~~~

## Nodos principales

- Entrada webhook RAG público comercial LAB-021
- Normalizar entrada comercial
- Preparar consulta pública comercial
- Luna comercial con RAG público
- Modelo de Luna comercial con Groq
- Buscar información pública de la clínica
- Responder consulta pública comercial
- Leer documentos públicos comerciales
- Preparar documentos públicos para RAG
- Generar embeddings públicos con Cohere
- Cargar documentos públicos en RAG

## Contrato de entrada

~~~json
{
  "clinic_id": "clinica_piloto_001",
  "session_id": "sesion_ficticia",
  "message": "Consulta pública ficticia",
  "channel": "streamlit"
}
~~~

## Contrato de respuesta

~~~json
{
  "ok": true,
  "clinic_id": "clinica_piloto_001",
  "session_id": "sesion_ficticia",
  "reply": "Respuesta generada por Luna"
}
~~~

## Validaciones realizadas

### Lectura documental

n8n leyó correctamente:

- `faq_clientes.pdf`
- `servicios_precios.csv`

Los documentos fueron transformados en 30 fragmentos y cargados correctamente en el almacén vectorial.

### Horarios

Consulta validada:

~~~text
¿Cuál es el horario de atención de la clínica?
~~~

Luna recuperó desde el PDF los horarios ficticios de lunes a viernes, sábados, domingos y festivos.

### Servicios y precios

Consulta validada:

~~~text
¿Cuánto cuesta una consulta general veterinaria?
~~~

Luna recuperó desde el CSV:

- precio referencial de 25.000 CLP;
- duración estimada de 30 minutos;
- descripción de la evaluación clínica general;
- exclusión de exámenes, medicamentos y procedimientos adicionales.

### Preguntas frecuentes

Consulta validada:

~~~text
¿Qué medios de pago acepta la clínica?
~~~

Luna recuperó desde el PDF:

- efectivo;
- transferencia bancaria;
- tarjeta de débito;
- tarjeta de crédito.

### Información inexistente

Consulta validada:

~~~text
¿La clínica tiene estacionamiento privado para clientes?
~~~

Luna no inventó información y recomendó contactar directamente a la clínica para confirmarla.

### Producción

La ruta permanente fue validada mediante una solicitud HTTP directa y posteriormente desde la interfaz pública de Streamlit por HTTPS.

Resultado validado:

~~~text
Streamlit comercial
→ webhook permanente LAB-021
→ RAG público
→ Cohere
→ Luna mediante Groq
→ respuesta correcta mostrada en Streamlit
~~~

## Seguridad y privacidad

- Se utilizaron exclusivamente datos ficticios.
- Las claves de Groq y Cohere permanecen en el gestor de credenciales de n8n.
- La exportación no contiene API keys ni secretos evidentes.
- No se incluyeron credenciales de Google, Telegram u otros servicios históricos.
- No se expusieron bases de datos, respaldos, certificados ni contenido completo del archivo `.env`.
- El volumen documental está montado en modo de solo lectura para n8n.
- El entorno continúa explícitamente no habilitado para datos personales reales.

## Limitación técnica actual

El almacén vectorial utilizado en esta etapa reside en memoria. Puede perder su contenido cuando n8n se reinicia, por lo que los documentos deben volver a cargarse.

Una solución vectorial persistente se evaluará en una etapa comercial posterior, una vez validada la necesidad operativa y el volumen esperado.

## Resultado

LAB-021 deja operativo el primer RAG público comercial de VetAtiende AI, conectado a Streamlit y preparado para responder horarios, servicios, precios, medios de pago y preguntas frecuentes de una clínica ficticia utilizando documentación controlada.