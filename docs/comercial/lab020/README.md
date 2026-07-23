# LAB-020 - Integracion funcional comercial inicial

## Estado

Cerrado y validado.

## Objetivo

Conectar por primera vez la interfaz Streamlit comercial con el n8n comercial y Luna, utilizando exclusivamente datos ficticios.

## Flujo validado

`Streamlit -> webhook permanente de n8n -> Luna mediante Groq -> Streamlit`

## Resultado

- Streamlit envia una consulta ficticia.
- n8n recibe y normaliza los datos.
- Luna genera una respuesta mediante Groq.
- n8n devuelve una respuesta JSON controlada.
- Streamlit muestra la respuesta al usuario.
- La comunicacion Streamlit-n8n utiliza la red privada de Docker.
- Se mantiene `CLINIC_ID=clinica_piloto_001`.

## Workflow

- Nombre: `LAB-020 - Consulta comercial basica`
- Ruta del webhook: `/webhook/vetatiende-comercial-chat`
- Exportacion: `n8n/workflows/comercial/lab020_consulta_comercial_basica.json`

## Archivos modificados

- `infra/comercial/streamlit/app.py`
- `infra/comercial/streamlit/requirements.txt`
- `docs/comercial/roadmap_mvp_comercial.md`

## Seguridad y alcance

- Se utilizaron solamente datos ficticios.
- No se habilitaron datos personales reales.
- No se incorporaron agenda, RAG, registros, urgencias ni funciones internas.
- Los secretos permanecen fuera del repositorio.

## Pendientes

Continuan pendientes la autenticacion completa de usuarios, el aislamiento entre varias clinicas, el dominio comercial definitivo y los controles necesarios para utilizar datos personales reales.
