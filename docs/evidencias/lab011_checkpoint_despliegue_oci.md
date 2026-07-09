# LAB-011 - Checkpoint despliegue OCI del MVP operativo

Fecha: 2026-07-08  
Estado: checkpoint parcial, LAB-011 aún no cerrado.

## Objetivo del LAB-011

Desplegar el MVP operativo de VetAtiende AI en Oracle Cloud Infrastructure para permitir acceso externo al flujo de atención, dejando n8n funcionando fuera del equipo local.

## Avance validado

Se creó y configuró una instancia en Oracle Cloud Infrastructure para ejecutar n8n self-hosted mediante Docker.

Componentes validados:

- Instancia OCI creada y accesible por SSH.
- Docker instalado y funcionando.
- Docker Compose instalado y funcionando.
- n8n ejecutándose en contenedor Docker.
- Contenedor activo: `vetatiende-n8n`.
- Carpeta de despliegue en servidor: `/home/ubuntu/vetatiende-ai-oci`.
- Acceso público temporal a n8n mediante `http://IP_PUBLICA:5678`.
- `WEBHOOK_URL` configurado para IP pública en `compose.yaml`.
- Configuración pública respaldada como `compose.yaml.ip_publica_ok`.

## Workflows importados en n8n OCI

Se importaron los workflows oficiales del proyecto:

- `LAB-010 - MVP público operativo`.
- `LAB-006 - Seguridad de acceso y separación de canales`.

Archivos fuente locales:

- `n8n/workflows/lab010_vetatiende_mvp_publico_operativo.json`
- `n8n/workflows/lab006_vetatiende_seguridad_acceso_canales.json`

## Documentos RAG subidos a OCI

Se copiaron los documentos del proyecto desde:

`C:\Users\DELL\VetAtiendeAI\data`

hacia el servidor OCI:

`/home/ubuntu/vetatiende-ai-oci/data`

Los documentos quedaron visibles dentro del contenedor n8n en:

`/home/node/.n8n-files/data`

Archivos verificados:

- `faq_clientes.pdf`
- `manual_seguridad_y_derivacion.pdf`
- `servicios_precios.csv`
- `manual_procedimientos_internos.pdf`
- `protocolo_stock.csv`

## Credenciales configuradas

Se configuraron correctamente en n8n OCI:

- Groq Chat Model con API Key nueva para OCI.
- Cohere Embeddings con API Key nueva de prueba para OCI.

## Pendiente detectado

Falta configurar correctamente Google Calendar y Google Sheets en el n8n público de OCI.

Problema detectado:

- Google no aceptó la URL OAuth con IP pública.
- Se intentó usar `localhost:5678`, pero pudo haberse confundido con una instancia local previa de n8n.
- En n8n público (`http://IP_PUBLICA:5678`) los nodos de Google Calendar y Google Sheets aparecen sin credencial disponible.

## Próximo paso definido

Usar un túnel SSH corregido con puerto distinto para evitar confusión:

- `n8n 1 corregido`: `http://localhost:5679`
- `n8n 2 público`: `http://IP_PUBLICA:5678`

Plan pendiente:

1. Cambiar temporalmente `WEBHOOK_URL` a `http://localhost:5679/`.
2. Reiniciar n8n en OCI.
3. Abrir túnel SSH `5679 -> OCI:5678`.
4. Conectar Google OAuth en el n8n real de OCI.
5. Confirmar credenciales Google Calendar y Google Sheets en n8n público.
6. Restaurar `compose.yaml.ip_publica_ok`.
7. Probar LAB-010 completo en OCI.
8. Probar LAB-006 interno protegido.
9. Exportar workflows finales si hubo cambios.
10. Documentar cierre final del LAB-011.

## Estado del LAB

LAB-011 continúa abierto.

Este checkpoint documenta el avance parcial para no perder trazabilidad antes de continuar en un nuevo chat.
