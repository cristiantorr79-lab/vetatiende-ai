import os
from typing import Any

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

APP_TITLE = "VetAtiende AI"
APP_SUBTITLE = "Asistente virtual para clínicas veterinarias"

SUGGESTED_QUESTIONS = (
    "¿Cuánto cuesta una consulta general?",
    "Quiero agendar una consulta para mi perro mañana.",
    "¿Tienen horas para peluquería esta semana?",
    "Mi perro tiene dificultad para respirar.",
)


def get_config_value(name: str) -> str:
    """Obtiene configuración desde Streamlit Secrets o variables de entorno."""
    try:
        secret_value = st.secrets.get(name, "")
    except (FileNotFoundError, KeyError):
        secret_value = ""

    if secret_value:
        return str(secret_value).strip()

    return os.getenv(name, "").strip()


def call_n8n_webhook(
    url: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Llama al webhook demo y devuelve una respuesta segura para la interfaz."""
    if not url:
        return {
            "ok": False,
            "error": (
                "La demo todavía no tiene configurado su webhook. "
                "Revisa la configuración privada de la aplicación."
            ),
        }

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=45,
        )
        response.raise_for_status()

        try:
            data = response.json()
        except ValueError:
            data = {"respuesta": response.text}

        return {
            "ok": True,
            "status_code": response.status_code,
            "data": data,
        }

    except requests.exceptions.Timeout:
        return {
            "ok": False,
            "error": "La solicitud tardó demasiado. Intenta nuevamente.",
        }
    except requests.exceptions.RequestException:
        return {
            "ok": False,
            "error": (
                "No fue posible comunicarse con Luna en este momento. "
                "Intenta nuevamente más tarde."
            ),
        }


def extract_answer(data: Any) -> str:
    """Extrae una respuesta legible desde distintos formatos posibles de n8n."""
    if isinstance(data, dict):
        for key in ("respuesta", "response", "output", "text", "message"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

        if "data" in data:
            return extract_answer(data["data"])

    if isinstance(data, list) and data:
        return extract_answer(data[0])

    if isinstance(data, str) and data.strip():
        return data.strip()

    return "Luna recibió la consulta, pero no pudo interpretar la respuesta."


def initialize_session() -> None:
    """Inicializa el historial conversacional de la sesión pública."""
    if "public_history" not in st.session_state:
        st.session_state.public_history = []


def build_conversation_context() -> str:
    """Convierte los últimos mensajes en contexto para el workflow demo."""
    history_lines: list[str] = []

    for item in st.session_state.public_history[-6:]:
        role = item.get("role", "mensaje")
        content = item.get("content", "")

        if role == "user":
            history_lines.append(f"Cliente: {content}")
        else:
            history_lines.append(f"Luna: {content}")

    return "\n".join(history_lines).strip()


def build_payload(client_message: str) -> dict[str, str]:
    """Construye el payload compatible con la continuidad conversacional."""
    conversation_context = build_conversation_context()

    if conversation_context:
        chat_input = (
            "Contexto previo de esta conversación:\n"
            f"{conversation_context}\n\n"
            "Mensaje actual del cliente:\n"
            f"{client_message}"
        )
    else:
        chat_input = client_message

    return {
        "canal": "streamlit_demo_publica",
        "canal_origen": "streamlit_demo_publica",
        "modo": "demo",
        "mensaje": client_message,
        "mensajeActual": client_message,
        "chatInput": chat_input,
        "contextoConversacional": conversation_context,
    }


def render_header() -> None:
    """Muestra la presentación y los límites de la demo."""
    st.title(APP_TITLE)
    st.subheader(APP_SUBTITLE)

    st.write(
        "Luna ayuda a clientes de una clínica veterinaria a consultar servicios "
        "y precios, solicitar horas médicas o de peluquería y recibir orientación "
        "segura ante posibles urgencias."
    )

    st.markdown(
        """
**Puedes probar estas funciones:**

- Consultar servicios, precios y horarios.
- Solicitar una hora veterinaria.
- Consultar peluquería y lavado.
- Recibir orientación segura ante una posible urgencia.
"""
    )

    st.warning(
        "Esta es una demo académica. Luna no realiza diagnósticos ni reemplaza "
        "la atención de un veterinario."
    )

    st.info(
        "Las citas mostradas en esta demo son simuladas y no generan reservas reales. "
        "Las urgencias no son monitoreadas en tiempo real."
    )


def render_suggested_questions() -> str | None:
    """Muestra preguntas sugeridas y devuelve la seleccionada."""
    st.markdown("#### Prueba una pregunta sugerida")

    selected_question: str | None = None
    columns = st.columns(2)

    for index, question in enumerate(SUGGESTED_QUESTIONS):
        column = columns[index % 2]
        with column:
            if st.button(
                question,
                key=f"suggested_question_{index}",
                use_container_width=True,
            ):
                selected_question = question

    return selected_question


def render_conversation() -> None:
    """Muestra el historial público con formato de chat."""
    for item in st.session_state.public_history:
        role = item.get("role", "assistant")
        content = item.get("content", "")
        avatar = "🐾" if role == "assistant" else "👤"

        with st.chat_message(role, avatar=avatar):
            st.markdown(content)


def process_message(client_message: str) -> None:
    """Envía un mensaje al webhook demo y guarda la respuesta en la sesión."""
    clean_message = client_message.strip()
    if not clean_message:
        return

    payload = build_payload(clean_message)

    st.session_state.public_history.append(
        {
            "role": "user",
            "content": clean_message,
        }
    )

    with st.chat_message("user", avatar="👤"):
        st.markdown(clean_message)

    with st.chat_message("assistant", avatar="🐾"):
        with st.spinner("Luna está revisando tu consulta..."):
            result = call_n8n_webhook(
                get_config_value("N8N_DEMO_WEBHOOK_URL"),
                payload,
            )

        if not result["ok"]:
            st.error(result["error"])
            return

        answer = extract_answer(result["data"])
        st.markdown(answer)

    st.session_state.public_history.append(
        {
            "role": "assistant",
            "content": answer,
        }
    )


def main() -> None:
    """Punto de entrada de la demo pública."""
    st.set_page_config(
        page_title=APP_TITLE,
        page_icon="🐾",
        layout="centered",
    )

    initialize_session()
    render_header()

    control_column, _ = st.columns([1, 2])
    with control_column:
        if st.button("Limpiar conversación", use_container_width=True):
            st.session_state.public_history = []
            st.rerun()

    selected_question = render_suggested_questions()

    st.divider()
    render_conversation()

    typed_message = st.chat_input("Escribe tu consulta para Luna")
    message_to_process = selected_question or typed_message

    if message_to_process:
        process_message(message_to_process)


if __name__ == "__main__":
    main()
