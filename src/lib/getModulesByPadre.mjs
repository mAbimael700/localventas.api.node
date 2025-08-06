import { pool } from "../database/dbconnect.mjs";
import { toCamelCase } from "../utils/stringToCamelCase.mjs";

export const getModulosByPadre = async ({ padreId }) => {
  const query = `SELECT m.nombre, m.cve_modulo AS id FROM modulos AS m WHERE m.cve_modulo_padre = ? `;
  const result = await pool.query(query, padreId);

  const modulos = {};
  result.forEach(({ nombre, id }) => {
    const newNombre = toCamelCase(nombre);

    modulos[newNombre] = id;
  });
  
  return modulos;
};
