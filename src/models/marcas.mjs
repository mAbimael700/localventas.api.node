import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { setClause } from "../utils/setClauses.mjs";

export class MarcaModel {
  static async getAll({ cve_tienda }) {
    const getAllQuery = `SELECT 
        m.cve_marca as id,
        m.nombre as marca,
        m.codigo,
        m.activo AS estado
        FROM marcas as m
            INNER JOIN marcas_tienda AS mt ON mt.cve_marca = m.cve_marca
            INNER JOIN tiendas AS t ON  t.cve_tienda = mt.cve_tienda
        WHERE t.cve_tienda = ?
        ORDER BY m.nombre ASC
        `;

    const marcas = await pool.query(getAllQuery, [cve_tienda]);

    return marcas;
  }

  static async getById({ cve_marca, cve_tienda }) {
    try {
      const getMarca = `SELECT 
    m.cve_marca as id,
    m.nombre as marca,
    m.codigo
    FROM marcas as m
      INNER JOIN marcas_tienda AS mt ON mt.cve_marca = m.cve_marca
      INNER JOIN tiendas AS t ON t.cve_tienda = mt.cve_tienda
        WHERE (mt.cve_marca = ?) AND (mt.cve_tienda = ?)`;

      const marca = await pool.query(getMarca, [
        parseInt(cve_marca),
        parseInt(cve_tienda),
      ]);

      if (marca.length > 0) {
        return marca[0];
      } else {
        return undefined;
      }
    } catch (error) {
      console.log(error);
      throw new Error(
        "Hubo un error al seleccionar la marca en la base de datos"
      );
    }
  }

  static async existeMarca({ input }) {
    const { nombre, cve_tienda } = input;

    const existeMarcaQuery = `SELECT m.nombre FROM marcas AS m
      INNER JOIN marcas_tienda AS mt ON mt.cve_marca = m.cve_marca
      INNER JOIN tiendas AS t ON t.cve_tienda = mt.cve_tienda
      WHERE (m.nombre = ?) AND (t.cve_tienda = ?)
      `;

    const existeMarca = await pool.query(existeMarcaQuery, [
      nombre,
      cve_tienda,
    ]);

    return existeMarca.length > 0;
  }

  static async existeMarcaById({ input }) {
    const { cve_tienda } = input;

    const existeMarcaQuery = `SELECT m.nombre FROM marcas AS m
      INNER JOIN marcas_tienda AS mt ON mt.cve_marca = m.cve_marca
      INNER JOIN tiendas AS t ON t.cve_tienda = mt.cve_tienda
      WHERE (t.cve_tienda = ?)
      `;

    const existeMarca = await pool.query(existeMarcaQuery, [, cve_tienda]);

    return existeMarca.length > 0;
  }
  static async create({ input }) {
    const { nombre, cve_tienda, codigo, estado } = input;

    const createQuery = `INSERT INTO marcas (cve_marca, nombre, codigo, activo) VALUES (?, ?, ?, ?) RETURNING *`;
    const relationTiendaMarcaQuery = `INSERT INTO marcas_tienda (cve_marca, cve_tienda) VALUES (?, ?)`;

    try {
      const newMarcaId = await generateId({ table: "marcas" });
      const newMarca = await pool.query(createQuery, [
        newMarcaId,
        nombre,
        codigo,
        estado,
      ]);

      await pool.query(relationTiendaMarcaQuery, [newMarcaId, cve_tienda]);

      return newMarca[0];
    } catch (error) {
      return { message: "Hubo un error al acceder a la base de datos." };
    }
  }

  static async update({ input, cve_marca, cve_tienda }) {
    try {
      const updateClauses = setClause(input);
      const updateQuery = `UPDATE marcas SET ${updateClauses} WHERE (marcas.cve_marca = ?)`;

      await pool.query(updateQuery, [
        ...Object.values(input),
        parseInt(cve_marca),
      ]);

      return;

      /* const updatedMarca = await this.getById({ cve_marca: cve_marca, cve_tienda });

      return updatedMarca; */
    } catch (error) {
      console.log(error);
      throw new Error(
        "Hubo un error al actualizar la marca en la base de datos"
      );
    }
  }

  static async delete({ cve_marca, cve_tienda }) {
    const query = `UPDATE marcas 
    SET activo = ? 
    WHERE cve_marca = ?;
    `;
    await pool.query(query, [false, parseInt(cve_marca)]);

    try {
      const deactivatedMarca = await this.getById({ cve_marca, cve_tienda });
      return deactivatedMarca;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al acceder a la base de datos.");
    }
  }
}
