export function toCamelCase(texto) {
  // Dividir el texto en palabras
  texto = texto.toLowerCase();
  let palabras = texto.split(" ");

  // Convertir la primera letra de cada palabra (excepto la primera) en mayúscula
  for (let i = 1; i < palabras.length; i++) {
    palabras[i] = palabras[i].charAt(0).toUpperCase() + palabras[i].slice(1);
  }

  // Concatenar las palabras y devolver el resultado
  return palabras.join("");
}
