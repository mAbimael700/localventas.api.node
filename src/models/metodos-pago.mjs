import { pool } from "../database/dbconnect.mjs";

export class MetodosPagoModel {
  static async getMetodosPago() {
    const query = `SELECT mp.cve_metodo_pago as id, mp.nombre FROM metodos_pago AS mp`;

    const metodosPago = await pool.query(query);

    return metodosPago;
  }
}
