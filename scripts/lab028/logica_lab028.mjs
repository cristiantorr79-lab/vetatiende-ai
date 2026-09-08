// Lógica pura de avisos contextuales post-reserva. Sin red, persistencia ni IA.
export function resolverAvisoContextual({ respuestaOriginal, tipoReserva, configuraciones = [], campanas = [], estadosUrgencia = [], ahora, errorConfiguracion = false, errorCampanas = false, errorUrgencia = false } = {}) {
  const original = respuestaOriginal && typeof respuestaOriginal === 'object' && !Array.isArray(respuestaOriginal)
    ? JSON.parse(JSON.stringify(respuestaOriginal))
    : {};
  const sinAviso = (motivo) => ({ respuesta: original, aviso: null, motivo });
  const texto = (value) => typeof value === 'string' ? value.trim() : '';
  const iso = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  const clinicId = texto(original.clinic_id), sessionId = texto(original.session_id), reply = texto(original.reply);
  if (!clinicId || !sessionId || !reply || !['medica', 'peluqueria'].includes(tipoReserva)) return sinAviso('contexto_invalido');
  if (errorConfiguracion || errorCampanas || errorUrgencia) return sinAviso('lectura_comercial_insegura');
  if (![configuraciones, campanas, estadosUrgencia].every(Array.isArray) || !iso(ahora)) return sinAviso('lectura_comercial_insegura');
  const cerrados = new Set(['', 'sin_episodio', 'atencion_reportada', 'cerrado']);
  const urgencia = estadosUrgencia.filter((row) => row && row.clinic_id === clinicId && row.session_id === sessionId).some((row) => texto(row.episode_id_activo) || !cerrados.has(texto(row.estado_episodio).toLowerCase()));
  if (urgencia) return sinAviso('urgencia_sesion_actual');
  const configs = configuraciones.filter((row) => row && row.clinic_id === clinicId);
  if (configs.length !== 1 || configs[0].habilitado !== 'true' || texto(configs[0].canal) !== 'contextual') return sinAviso('configuracion_deshabilitada');
  const now = Date.parse(ahora);
  const elegibles = campanas.filter((row) => {
    if (!row || row.clinic_id !== clinicId || row.estado !== 'activa') return false;
    if (!['producto', 'servicio', 'medicamento'].includes(row.tipo) || !['general', tipoReserva].includes(row.categoria)) return false;
    if (!texto(row.texto) || !texto(row.campana_id) || ![row.inicio, row.fin, row.programada_at].every(iso)) return false;
    const inicio = Date.parse(row.inicio), fin = Date.parse(row.fin), programada = Date.parse(row.programada_at);
    return inicio < fin && programada >= inicio && programada < fin && now >= inicio && now < fin && now >= programada;
  }).sort((a, b) => a.programada_at.localeCompare(b.programada_at) || a.campana_id.localeCompare(b.campana_id));
  if (!elegibles.length) return sinAviso('sin_aviso_elegible');
  const aviso = elegibles[0];
  return { respuesta: { ...original, reply: `${reply}\n\n${aviso.texto}` }, aviso: { campana_id: aviso.campana_id, tipo: aviso.tipo, categoria: aviso.categoria, texto: aviso.texto }, motivo: 'aviso_contextual_incluido' };
}
