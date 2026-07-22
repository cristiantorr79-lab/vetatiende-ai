import os

import streamlit as st


st.set_page_config(
    page_title="VetAtiende AI | Piloto comercial",
    page_icon="🐾",
    layout="centered",
)

clinic_id = os.getenv("CLINIC_ID", "no_configurada")

st.title("🐾 VetAtiende AI")
st.subheader("Entorno comercial protegido")

st.success("La interfaz Streamlit funciona correctamente dentro de Docker.")

st.write("Clínica configurada:")
st.code(clinic_id)

st.info(
    "Validación técnica con datos ficticios. "
    "Acceso temporal mediante HTTPS. Este entorno aún no está habilitado para datos reales."
)
