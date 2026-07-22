# LAB-019 — Infraestructura segura del MVP comercial

## Estado

**Cerrado y validado técnicamente el 21 de julio de 2026.**

LAB-019 construye una infraestructura comercial separada del Challenge y preparada como base reutilizable para el primer piloto de VetAtiende AI.

## Objetivo

Implementar en Oracle Cloud una base técnica segura con contenedores, acceso HTTPS, servicios internos protegidos, persistencia, respaldos y una interfaz Streamlit inicial.

La integración funcional completa entre Streamlit, n8n, Luna y la agenda comercial corresponde a LAB-020.

## Qué hicimos realmente

Durante este LAB:

- creamos una instancia OCI comercial separada;
- configuramos Ubuntu, Docker y Docker Compose;
- agregamos memoria swap persistente;
- desplegamos n8n con versión fija;
- habilitamos task runners externos para JavaScript y Python;
- desplegamos una interfaz Streamlit comercial inicial;
- instalamos Caddy como proxy reverso;
- habilitamos acceso HTTPS;
- dejamos expuestos públicamente solo los puertos 80 y 443;
- mantuvimos los puertos internos sin publicación directa;
- configuramos firewall persistente;
- deshabilitamos el acceso SSH por contraseña y el acceso directo de root;
- configuramos retención limitada de ejecuciones de n8n;
- deshabilitamos telemetría no necesaria;
- verificamos el inicio automático después de reiniciar la instancia;
- creamos y validamos un respaldo completo;
- comprobamos una restauración de prueba;
- registramos evidencia técnica y su huella SHA-256;
- exportamos una plantilla segura sin secretos ni datos privados.

## Resultado técnico

La infraestructura comercial quedó operativa con:

- n8n;
- task runners externos;
- Streamlit;
- Caddy;
- HTTPS;
- persistencia;
- firewall;
- endurecimiento SSH;
- respaldo y restauración;
- reinicio automático;
- variables sensibles separadas del repositorio.

La validación se realizó exclusivamente con datos ficticios.

## Arquitectura validada

Ruta pública:

    Internet -> puertos 80 y 443 -> Caddy con HTTPS -> Streamlit

Comunicación interna:

    Streamlit -> n8n -> task runners

Los puertos internos de n8n, Streamlit y task runners no están publicados directamente hacia Internet.

## Archivos reutilizables

La plantilla comercial se encuentra en:

    infra/comercial/
    |-- .env.example
    |-- compose.yaml
    |-- caddy/
    |   `-- Caddyfile
    `-- streamlit/
        |-- Dockerfile
        |-- app.py
        `-- requirements.txt

El archivo `.env.example` contiene solamente variables de ejemplo.

El archivo `.env` real, las claves, los tokens, las bases de datos, los certificados privados y los respaldos no forman parte del repositorio.

## Evidencia

La validación técnica se conserva en:

- `evidencias/lab019_validacion_infraestructura_comercial.txt`
- `evidencias/lab019_validacion_infraestructura_comercial.txt.sha256`

La huella SHA-256 permite comprobar que la evidencia no fue alterada después de su exportación.

## Límites actuales

LAB-019 no implementa todavía:

- la conversación completa de Luna desde la nueva interfaz;
- la conexión funcional Streamlit a n8n;
- la agenda comercial parametrizable;
- la separación lógica completa por clínica;
- la autenticación de usuarios de la interfaz;
- el dominio comercial definitivo;
- el uso de datos personales reales.

## Próximo LAB

LAB-020 implementará la primera integración funcional comercial usando datos ficticios:

    Streamlit -> webhook n8n -> Luna -> respuesta y operaciones controladas

## Condición sobre datos reales

VetAtiende AI continuará utilizando únicamente datos ficticios hasta implementar y validar los controles críticos pendientes de privacidad, autenticación, aislamiento por clínica, eliminación, trazabilidad y gestión de derechos.

