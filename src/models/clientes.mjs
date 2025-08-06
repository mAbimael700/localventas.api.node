import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { setClause } from "../utils/setClauses.mjs";

export class ClientesModel {
  static async getClientesByTienda({ cve_tienda }) {
    const query = `SELECT
    CONCAT_WS(" ", p.nombre, p.paterno, p.materno) as nombre,
    p.genero,
    p.fecha_nacimiento,
    p.telefono,
    p.correo_electronico
        FROM personas AS p
            INNER JOIN clientes AS c ON c.cve_cliente = p.cve_persona
            INNER JOIN tiendas AS t ON t.cve_tienda = c.cve_tienda
    WHERE c.cve_tienda = ?
    `;

    try {
      const clientes = await pool.query(query, [cve_tienda]);

      if (clientes.length > 0) return clientes;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar los clientes");
    }
  }

  static async getById({ cve_cliente, cve_tienda }) {
    const query = `SELECT
    CONCAT_WS(" ", p.nombre, p.paterno, p.materno) as nombre,
    p.genero,
    p.fecha_nacimiento,
    p.telefono,
    p.correo_electronico
        FROM personas AS p
            INNER JOIN clientes AS c ON c.cve_cliente = p.cve_persona
            INNER JOIN tiendas AS t ON t.cve_tienda = c.cve_tienda
    WHERE c.cve_cliente = ? AND t.cve_tienda = ?
    `;

    try {
      const cliente = await pool.query(query, [cve_cliente, cve_tienda]);

      if (cliente.length > 0) return cliente[0];

      return [];
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar los clientes");
    }
  }

  static async create({ cve_tienda, input }) {
    const { nombre, paterno, materno, telefono, correo_electronico, genero } =
      input;

    let query = `INSERT INTO personas 
    (cve_persona, nombre, paterno, materno, telefono, correo_electronico, genero) 
    VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`;

    const conn = await pool.getConnection();

    try {
      conn.beginTransaction();
      const newPersonId = await generateId({ table: "personas" });

      const newPersona = await conn.query(query, [
        newPersonId,
        nombre,
        paterno,
        materno,
        telefono,
        correo_electronico,
        genero,
      ]);

      const personaId = newPersona[0].CVE_PERSONA;

      let insertCliente = `INSERT INTO clientes (cve_cliente, cve_tienda, activo) VALUES (?, ?, ?) RETURNING *`;
      const newCliente = await conn.query(insertCliente, [
        personaId,
        cve_tienda,
        true,
      ]);

      conn.commit();
      return { ...newPersona[0], ...newCliente[0] };
    } catch (error) {
      console.log(error);
      conn.rollback();
      throw new Error("Hubo un error al registrar el cliente");
    }
  }

  static async update({ input, cve_cliente }) {
    try {
      const updateClauses = setClause(input);
      const updateQuery = `UPDATE clientes AS c SET ${updateClauses} WHERE (c.cve_cliente = ?)`;

      await pool.query(updateQuery, [...Object.values(input), cve_cliente]);

      const updatedCliente = await this.getById({ cve_cliente });

      return updatedCliente;
    } catch (error) {
      console.log(error);
      throw new Error(
        "Hubo un error al actualizar el cliente en la base de datos"
      );
    }
  }

  static async delete({ cve_cliente }) {
    const query = `UPDATE clientes SET (activo = ?) WHERE (cve_cliente = ?)`;
    await pool.query(query, [false, cve_cliente]);

    try {
      const deactivatedCliente = await this.getById({ cve_cliente });
      return deactivatedCliente;
    } catch (error) {
      throw new Error(
        "Hubo un error al desactivar el cliente en la base de datos."
      );
    }
  }
}
