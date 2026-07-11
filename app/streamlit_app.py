import os
from typing import Any

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()


APP_TITLE = "VetAtiende AI - Challenge"


def get_env_value(name: str) -> str:
    """Obtiene una variable de entorno sin exponer valores sensibles."""
    return os.getenv(name, "").strip()


def call_n8n_webhook(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Llama a un webhook de n8n y devuelve una respuesta segura para la interfaz."""
    if not url:
        return {
            "ok": False,
            "error": "Webhook no configurado. Revisa el archivo .env local.",
        }

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers or {},
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
    except requests.exceptions.RequestException as exc:
        return {
            "ok": False,
            "error": f"No se pudo conectar con n8n: {exc}",
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

    if isinstance(data, str):
        return data.strip()

    return "Respuesta recibida, pero no se pudo interpretar automáticamente."


def render_client_mode() -> None:
    """Modo cliente externo: usa solo el webhook público con memoria básica de sesión."""
    st.subheader("Cliente externo")
    st.write("Consulta pública para atención, servicios, agenda y orientación segura.")

    if "client_history" not in st.session_state:
        st.session_state.client_history = []

    col1, col2 = st.columns([3, 1])
    with col2:
        if st.button("Limpiar conversación"):
            st.session_state.client_history = []
            st.rerun()

    if st.session_state.client_history:
        with st.expander("Ver conversación actual"):
            for item in st.session_state.client_history:
                role = item.get("role", "mensaje")
                content = item.get("content", "")
                if role == "cliente":
                    st.markdown(f"**Cliente:** {content}")
                else:
                    st.markdown(f"**Luna:** {content}")

    message = st.text_area(
        "Mensaje del cliente",
        placeholder="Ejemplo: Hola, quiero agendar una consulta para mi perro mañana en la tarde.",
        height=140,
    )

    if st.button("Enviar consulta", type="primary"):
        if not message.strip():
            st.warning("Escribe un mensaje antes de enviar.")
            return

        client_message = message.strip()

        history_lines = []
        for item in st.session_state.client_history[-6:]:
            role = item.get("role", "mensaje")
            content = item.get("content", "")
            if role == "cliente":
                history_lines.append(f"Cliente: {content}")
            else:
                history_lines.append(f"Luna: {content}")

        conversation_context = "\n".join(history_lines).strip()

        if conversation_context:
            chat_input = (
                "Contexto previo de esta conversación:\n"
                f"{conversation_context}\n\n"
                "Mensaje actual del cliente:\n"
                f"{client_message}"
            )
        else:
            chat_input = client_message

        payload = {
            "canal": "streamlit_challenge",
            "canal_origen": "streamlit_challenge",
            "mensaje": client_message,
            "mensajeActual": client_message,
            "chatInput": chat_input,
            "contextoConversacional": conversation_context,
        }

        with st.spinner("Consultando a Luna..."):
            result = call_n8n_webhook(
                get_env_value("N8N_PUBLIC_WEBHOOK_URL"),
                payload,
            )

        if not result["ok"]:
            st.error(result["error"])
            return

        answer = extract_answer(result["data"])

        st.session_state.client_history.append(
            {
                "role": "cliente",
                "content": client_message,
            }
        )
        st.session_state.client_history.append(
            {
                "role": "luna",
                "content": answer,
            }
        )

        st.success("Respuesta de Luna")
        st.write(answer)


def render_internal_mode() -> None:
    """Modo interno protegido simple: usa header privado local, sin exponerlo."""
    st.subheader("Modo interno protegido")
    st.warning(
        "Solo para personal autorizado. No usar claves reales dentro del código."
    )

    message = st.text_area(
        "Consulta interna",
        placeholder="Ejemplo: ¿Cuál es el protocolo interno ante sospecha de contagio?",
        height=140,
    )

    if st.button("Enviar consulta interna"):
        internal_key = get_env_value("VETATIENDE_INTERNAL_KEY")

        if not internal_key:
            st.error("Clave interna no configurada en .env local.")
            return

        if not message.strip():
            st.warning("Escribe una consulta interna antes de enviar.")
            return

        payload = {
            "canal": "streamlit_challenge_interno",
            "mensaje": message.strip(),
        }

        headers = {
            "x-vetatiende-interno-key": internal_key,
        }

        with st.spinner("Consultando canal interno..."):
            result = call_n8n_webhook(
                get_env_value("N8N_INTERNAL_WEBHOOK_URL"),
                payload,
                headers=headers,
            )

        if not result["ok"]:
            st.error(result["error"])
            return

        answer = extract_answer(result["data"])
        st.success("Respuesta interna")
        st.write(answer)


def main() -> None:
    st.set_page_config(
        page_title=APP_TITLE,
        page_icon="🐾",
        layout="centered",
    )

    st.title(APP_TITLE)
    st.caption(
        "Interfaz mínima para evaluación del Challenge. No corresponde a la app comercial final."
    )

    mode = st.radio(
        "Selecciona modo",
        options=("Cliente externo", "Interno protegido"),
        horizontal=True,
    )

    st.divider()

    if mode == "Cliente externo":
        render_client_mode()
    else:
        render_internal_mode()


if __name__ == "__main__":
    main()
