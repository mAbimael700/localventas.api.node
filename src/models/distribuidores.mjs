import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { setClause } from "../utils/setClauses.mjs";

export class DistribuidoresModel {
  static async getAllByTienda({ cve_tienda }) {
    const query = `SELECT
    CONCAT_WS(" ", p.nombre, p.paterno, p.materno) as nombre,
    p.genero,
    p.fecha_nacimiento,
    p.telefono,
    p.correo_electronico,
    m.nombre as marca
        FROM personas AS p
            INNER JOIN distribuidores AS d ON d.cve_distribuidor = p.cve_persona
            INNER JOIN distribuidores_marcas AS dm ON dm.cve_distribuidor = d.cve_distribuidor
            INNER JOIN marcas AS m ON m.cve_marca = dm.cve_marca
            INNER JOIN marcas_tienda as mt ON mt.cve_marca = m.cve_marca
            INNER JOIN tiendas AS t ON t.cve_tienda = mt.cve_tienda
    WHERE mt.cve_tienda = ?
    `;

    try {
      const distribuidores = await pool.query(query, [cve_tienda]);

      if (distribuidores.length > 0) return distribuidores;

      return [];
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar los clientes");
    }
  }

  static async getById({ cve_distribuidor }) {
    const query = `SELECT
    CONCAT_WS(" ", p.nombre, p.paterno, p.materno) as nombre,
    p.genero,
    p.fecha_nacimiento,
    p.telefono,
    p.correo_electronico
    m.nombre as marca
        FROM personas AS p
            INNER JOIN distribuidores AS d ON d.cve_distribuidor = p.cve_persona
            INNER JOIN distribuidores_marcas AS dm ON dm.cve_distribuidor = d.cve_distribuidor
            INNER JOIN marcas AS m ON m.cve_marca = dm.cve_marca
            INNER JOIN marcas_tienda as mt ON mt.cve_marca = m.cve_marca
            INNER JOIN tiendas AS t ON t.cve_tienda = mt.cve_tienda
    WHERE mt.cve_tienda = ?
    `;

    try {
      const distribuidor = await pool.query(query, [cve_distribuidor]);

      if (distribuidor.length > 0) return distribuidor[0];

      return undefined;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar los distribuidores");
    }
  }

  static async create({ input }) {
    const {
      nombre,
      paterno,
      materno,
      telefono,
      correo_electronico,
      genero,
      direccion,
      cve_marca,
    } = input;

    let query = `INSERT INTO personas 
    (cve_persona, nombre, paterno, materno, telefono, correo_electronico, genero) 
    VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`;

    const conn = await pool.getConnection();

    try {
      conn.beginTransaction();

      const newId = await generateId({ table: "distribuidores" });

      const newPersona = await conn.query(query, [
        newId,
        nombre,
        paterno,
        materno,
        telefono,
        correo_electronico,
        genero,
      ]);

      const personaId = newPersona[0].CVE_PERSONA;

      let insertDistribuidor = `INSERT INTO distribuidores (cve_distribuidor, direccion, activo) VALUES (?, ?, ?) RETURNING *`;
      const newDistribuidor = await conn.query(insertDistribuidor, [
        personaId,
        direccion ? direccion : null,
        true,
      ]);

      let distribuidorMarcaRelationQuery = `INSERT INTO distribuidores_marca (cve_marca, cve_distribuidor) VALUES (?, ?) RETURNING *`;

      await conn.query(distribuidorMarcaRelationQuery, [cve_marca, personaId]);
      conn.commit();
      return { ...newPersona[0], ...newDistribuidor[0], cve_marca };
    } catch (error) {
      conn.rollback();
      console.log(error);
      throw new Error("Hubo un error al registrar el distribuidor");
    }
  }

  static async update({ input, cve_distribuidor }) {
    try {
      const updateClauses = setClause(input);
      const updateQuery = `UPDATE distribuidores AS d SET ${updateClauses} WHERE (d.cve_distribuidor = ?)`;

      await pool.query(updateQuery, [
        ...Object.values(input),
        cve_distribuidor,
      ]);

      const updatedDistribuidor = await this.getById({ cve_distribuidor });

      return updatedDistribuidor;
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
