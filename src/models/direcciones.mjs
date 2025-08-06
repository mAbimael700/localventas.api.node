import { pool } from "../database/dbconnect.mjs";

export class DireccionesModel {
  static async getPaises() {
    const query = `SELECT 
        p.nombre,
        p.cve_pais AS id
        FROM paises AS p
        `;

    try {
      const response = await pool.query(query);
      return response;
    } catch (error) {
      throw new Error("Hubo un error al consultar los paises en el servidor");
    }
  }

  static async getEstadosByPais({ cve_pais }) {
    const query = `SELECT 
        e.nombre, 
        e.cve_estado AS id,
        JSON_OBJECT('nombre', p.nombre, 'id', p.cve_pais) AS pais
            FROM estados AS e
                INNER JOIN paises AS p ON p.cve_pais = e.cve_pais
        WHERE p.cve_pais = ?
        `;

    try {
      const response = await pool.query(query, [cve_pais]);
      return response;
    } catch (error) {
      throw new Error(
        "Hubo un error al consultar los estados del país seleccionado."
      );
    }
  }

  
}
