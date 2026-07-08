# LAB-010 - Inventario técnico de workflows públicos

Fecha: 2026-07-07
Proyecto: VetAtiende AI

Objetivo: revisar la estructura real de LAB-004 y LAB-009 antes de consolidar el flujo público operativo del MVP.

## LAB-004 - RAG público

Archivo: .\n8n\workflows\lab004_vetatiende_rag_publico.json
Nombre workflow: Lab-004-VetAtiende RAG publico

### Nodos

| Nodo | Tipo |
|---|---|
| Agente VetAtiende | @n8n/n8n-nodes-langchain.agent |
| Cargar RAG Publico | @n8n/n8n-nodes-langchain.vectorStoreInMemory |
| Default Data Loader | @n8n/n8n-nodes-langchain.documentDefaultDataLoader |
| Embeddings Cohere | @n8n/n8n-nodes-langchain.embeddingsCohere |
| Groq Chat Model | @n8n/n8n-nodes-langchain.lmChatGroq |
| RAG Publico | @n8n/n8n-nodes-langchain.vectorStoreInMemory |
| Read/Write Files from Disk | n8n-nodes-base.readWriteFile |
| When chat message received | @n8n/n8n-nodes-langchain.chatTrigger |

### Conexiones detectadas

- When chat message received --main--> Agente VetAtiende
- Groq Chat Model --ai_languageModel--> Agente VetAtiende
- Embeddings Cohere --ai_embedding--> RAG Publico
- Embeddings Cohere --ai_embedding--> Cargar RAG Publico
- RAG Publico --ai_tool--> Agente VetAtiende
- Default Data Loader --ai_document--> Cargar RAG Publico
- Read/Write Files from Disk --main--> Cargar RAG Publico

## LAB-009 - Seguridad veterinaria integrada

Archivo: .\n8n\workflows\lab009_vetatiende_seguridad_veterinaria_integrada.json
Nombre workflow: LAB-009 - Seguridad veterinaria integrada

### Nodos

| Nodo | Tipo |
|---|---|
| Consultar Disponibilidad Agenda | n8n-nodes-base.googleCalendar |
| Crear Cita en Google Calendar | n8n-nodes-base.googleCalendar |
| Detectar Urgencia | n8n-nodes-base.set |
| Es Urgencia | n8n-nodes-base.if |
| Evaluar Disponibilidad Agenda | n8n-nodes-base.if |
| Preparar Datos Agenda | n8n-nodes-base.set |
| Preparar Registro Urgencia | n8n-nodes-base.set |
| Registrar Alerta Urgencia | n8n-nodes-base.googleSheets |
| Responder Solicitud Agenda | n8n-nodes-base.respondToWebhook |
| Responder Urgencia | n8n-nodes-base.respondToWebhook |
| Respuesta Cita Confirmada | n8n-nodes-base.set |
| Respuesta Horario No Disponible | n8n-nodes-base.set |
| Webhook Solicitud Agenda | n8n-nodes-base.webhook |

### Conexiones detectadas

- Evaluar Disponibilidad Agenda --main--> Crear Cita en Google Calendar
- Evaluar Disponibilidad Agenda --main--> Respuesta Horario No Disponible
- Crear Cita en Google Calendar --main--> Respuesta Cita Confirmada
- Webhook Solicitud Agenda --main--> Preparar Datos Agenda
- Consultar Disponibilidad Agenda --main--> Evaluar Disponibilidad Agenda
- Respuesta Cita Confirmada --main--> Responder Solicitud Agenda
- Respuesta Horario No Disponible --main--> Responder Solicitud Agenda
- Preparar Datos Agenda --main--> Detectar Urgencia
- Detectar Urgencia --main--> Es Urgencia
- Es Urgencia --main--> Preparar Registro Urgencia
- Es Urgencia --main--> Consultar Disponibilidad Agenda
- Preparar Registro Urgencia --main--> Registrar Alerta Urgencia
- Registrar Alerta Urgencia --main--> Responder Urgencia

