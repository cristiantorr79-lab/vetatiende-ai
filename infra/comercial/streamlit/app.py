import os
import uuid

import requests
import streamlit as st


st.set_page_config(
    page_title="VetAtiende AI | Piloto comercial",
    page_icon="",
    layout="centered",
)

clinic_id = os.getenv("CLINIC_ID", "clinica_piloto_001").strip()
webhook_url = os.getenv("N8N_INTERNAL_WEBHOOK_URL", "").strip()

if "session_id" not in st.session_state:
    st.session_state.session_id = f"streamlit_{uuid.uuid4().hex}"

if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": (
                "Hola, soy Luna, asistente virtual de la clínica ficticia "
                "Patitas del Sur. ¿En qué puedo ayudarte?"
            ),
        }
    ]

st.title(" VetAtiende AI")
st.subheader("Piloto comercial con datos ficticios")

st.info(
    "Este entorno está en validación. No ingreses nombres, teléfonos, "
    "direcciones ni otros datos personales reales."
)

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

user_message = st.chat_input("Escribe una consulta ficticia para Luna")

if user_message:
    st.session_state.messages.append(
        {"role": "user", "content": user_message}
    )

    with st.chat_message("user"):
        st.markdown(user_message)

    with st.chat_message("assistant"):
        with st.spinner("Luna está preparando su respuesta..."):
            try:
                if not webhook_url:
                    raise RuntimeError(
                        "La dirección interna del webhook no está configurada."
                    )

                payload = {
                    "clinic_id": clinic_id,
                    "session_id": st.session_state.session_id,
                    "message": user_message,
                    "channel": "streamlit",
                }

                response = requests.post(
                    webhook_url,
                    json=payload,
                    timeout=45,
                )
                response.raise_for_status()

                result = response.json()
                reply = str(result.get("reply", "")).strip()

                if not reply:
                    raise RuntimeError(
                        "n8n respondió, pero no entregó el campo reply."
                    )

            except requests.Timeout:
                reply = (
                    "Luna tardó demasiado en responder. "
                    "Intenta nuevamente en unos segundos."
                )
            except requests.RequestException:
                reply = (
                    "No fue posible comunicarse con Luna en este momento. "
                    "Intenta nuevamente."
                )
            except (ValueError, RuntimeError) as error:
                reply = f"No fue posible completar la consulta: {error}"

            st.markdown(reply)

    st.session_state.messages.append(
        {"role": "assistant", "content": reply}
    )

st.divider()
st.caption(
    f"Clínica ficticia configurada: {clinic_id}  "
    "Entorno no habilitado para datos reales."
)
