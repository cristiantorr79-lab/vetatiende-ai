# VetAtiende AI

Asistente inteligente operacional para clínicas veterinarias.

Proyecto desarrollado para el Challenge Alura Agente / ONE IA for Tech y como base de un MVP comercial orientado a clínicas veterinarias pequeñas y medianas.

## 1. Descripción general

VetAtiende AI es un agente de inteligencia artificial diseñado para responder preguntas usando documentación oficial de una clínica veterinaria.

El objetivo inicial es construir una solución funcional que permita:

- Leer y procesar documentos PDF y CSV.
- Responder preguntas en lenguaje natural.
- Apoyar consultas frecuentes de clientes.
- Apoyar consultas internas básicas del personal.
- Derivar emergencias veterinarias a atención presencial.
- Ejecutarse localmente con Docker y n8n.
- Desplegarse posteriormente en Oracle Cloud Infrastructure.

## 2. Problema que resuelve

Muchas clínicas veterinarias reciben preguntas repetidas todos los días:

- Horarios de atención.
- Valores referenciales de servicios.
- Vacunas.
- Peluquería canina y felina.
- Urgencias.
- Preparación para procedimientos.
- Cuidados posteriores.
- Disponibilidad de farmacia o pet shop.

Esto consume tiempo del equipo de recepción y genera respuestas poco estandarizadas.

VetAtiende AI busca ordenar esa información en documentos y permitir que un agente responda usando esa base de conocimiento.

## 3. Contexto del Challenge

El Challenge Alura Agente solicita construir un agente capaz de leer documentos, procesarlos y responder preguntas sobre su contenido.

Este proyecto cumple ese objetivo usando una clínica veterinaria ficticia pero realista como caso de uso.

## 4. Arquitectura inicial

```text
Usuario / Evaluador
        |
        v
n8n Chat Trigger o Webhook
        |
        v
Agente IA en n8n
        |
        |-- Documentos públicos PDF/CSV
        |-- Documentos internos PDF/CSV
        |-- Reglas de seguridad veterinaria
        |
        v
Modelo LLM
        |
        v
Respuesta en lenguaje natural
```

## 5. Tecnologías utilizadas

- n8n
- Docker
- Docker Compose
- LLM mediante integración en n8n
- Documentos PDF y CSV
- GitHub
- Oracle Cloud Infrastructure para deploy final

## 6. Estructura del proyecto

```text
VetAtiendeAI/
├── README.md
├── compose.yaml
├── .gitignore
├── docs/
│   └── capturas/
├── data/
├── n8n/
│   └── workflows/
├── scripts/
├── backend/
└── tests/
```

## 7. Ejecución local

Levantar n8n:

```bash
docker compose up -d
```

Verificar estado:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f n8n
```

Detener el entorno:

```bash
docker compose down
```

Abrir n8n localmente:

```text
http://localhost:5678
```

## 8. Documentación base del agente

La base documental será creada para el proyecto usando información ficticia pero realista.

Documentos públicos previstos:

- `servicios_precios.csv`
- `faq_clientes.pdf`
- `guia_cuidados_mascotas.pdf`

Documentos internos previstos:

- `manual_procedimientos_internos.pdf`
- `protocolo_stock.csv`
- `manual_seguridad_y_derivacion.pdf`

## 9. Ejemplos de preguntas

Preguntas de cliente externo:

- ¿Cuál es el horario de atención?
- ¿Hacen peluquería canina?
- ¿Cuánto cuesta una consulta general?
- ¿Atienden urgencias?
- ¿Qué vacunas necesita un cachorro?
- Mi perro comió chocolate, ¿qué hago?
- ¿Qué cuidados necesita mi mascota después de una cirugía?

Preguntas de personal interno:

- ¿Cuál es el flujo de recepción para un paciente nuevo?
- ¿Qué hacemos si llega un paciente con sospecha infecciosa?
- ¿Cómo se registra una falta de stock?
- ¿Qué información debe tomar recepción antes de una cirugía?
- ¿Cuándo se deriva una consulta a veterinario de turno?

## 10. Reglas de seguridad

VetAtiende AI no reemplaza a un veterinario.

El agente no debe entregar diagnósticos médicos definitivos ni tratamientos de riesgo.

Si detecta una emergencia veterinaria, debe recomendar atención presencial inmediata o contacto urgente con la clínica.

Ejemplos de emergencia:

- Atropello.
- Convulsión activa.
- Dificultad respiratoria.
- Envenenamiento.
- Hemorragia abundante.
- Pérdida de conciencia.
- Asfixia.
- Golpe de calor.
- Ingestión de tóxicos.

## 11. Estado del proyecto

LAB-000 en desarrollo.

Avances actuales:

- Estructura local creada.
- Docker Compose configurado.
- n8n levantado localmente.
- Cuenta local de n8n creada.
- Pendiente: Git local, primer commit y evidencia de captura.

## 12. Roadmap de laboratorios

- LAB-000: Preparación entorno local.
- LAB-002: Creación de base documental PDF/CSV.
- LAB-003: Workflow n8n base.
- LAB-004: RAG público.
- LAB-005: RAG interno.
- LAB-006: Seguridad y filtro de emergencias.
- LAB-007: Pruebas del challenge.
- LAB-008: Deploy en OCI.
- LAB-009: README final, evidencias y entrega.

## 13. Evidencia de deploy

Pendiente para LAB-008.

Se agregará:

- URL pública de OCI, o
- Captura de pantalla de la aplicación funcionando en OCI.

## 14. Autor

Cristian Torres

Proyecto desarrollado como parte del Challenge Alura Agente / ONE IA for Tech.
