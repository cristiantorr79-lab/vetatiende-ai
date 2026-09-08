export function detectarSeleccionInicial(mensaje, opciones = []) {
  const texto = String(mensaje || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const coincidencia = texto.match(/^(?:opcion\s+)?([1-9])(?=$|[\s.,:\-])(?:\s*[.,:\-])?/);
  if (!coincidencia) return null;
  const numero = Number(coincidencia[1]);
  const existe = opciones.some((opcion, indice) =>
    Number(opcion?.numero) === numero || indice + 1 === numero
  );
  return existe ? numero : null;
}
