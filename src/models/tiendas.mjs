import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { setClause } from "../utils/setClauses.mjs";

export class TiendasModel {
  static async getAll() {
    const getQuery = `SELECT t.cve_tienda AS id, t.nombre, t.descripcion, 
    CONCAT_WS(' ', p.nombre, p.paterno, p.materno) AS creador
    FROM tiendas AS t
      INNER JOIN tiendas_usuario AS tu ON tu.cve_tienda = t.cve_tienda
      INNER JOIN usuarios AS u ON u.cve_usuario = tu.cve_usuario
      INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario

    `;

    const tiendas = await pool.query(getQuery);
    return tiendas;
  }

  static async getByUserID({ usuarioId }) {
    const query = `SELECT 
    t.cve_tienda AS id, 
    t.nombre,
    t.descripcion,
    t.logotipo,
    JSON_OBJECT('nombre', r.nombre, 'id', r.cve_rol) AS rol
      FROM tiendas AS t
        INNER JOIN roles_usuario AS ru ON ru.cve_tienda = t.cve_tienda
        INNER JOIN roles AS r ON r.cve_rol = ru.cve_rol
        INNER JOIN usuarios AS u ON u.cve_usuario = ru.cve_usuario
      WHERE (ru.cve_usuario = ?) AND (ru.activo = true)
      `;

    const tiendas = await pool.query(query, [usuarioId]);
    return tiendas;
  }

  static async getByID({ tiendaId }) {
    const getQuery = `SELECT t.cve_tienda AS id, t.nombre, t.descripcion,
    CONCAT_WS(' ', p.nombre, p.paterno, p.materno) AS creador
    FROM tiendas AS t  
      INNER JOIN tiendas_usuario AS tu ON tu.cve_tienda = t.cve_tienda
      INNER JOIN usuarios AS u ON u.cve_usuario = tu.cve_usuario
      INNER JOIN roles_usuario AS ru ON ru.cve_usuario = u.cve_usuario
      INNER JOIN roles_usuario AS ruc ON ruc.cve_tienda = t.cve_tienda
      INNER JOIN roles AS r ON r.cve_rol = ru.cve_rol
      INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
      
    WHERE (t.CVE_TIENDA = ?)`;

    let tienda = await pool.query(getQuery, [tiendaId]);

    const direcciones = await this.getDireccionesByTienda({
      cve_tienda: tiendaId,
    });
    return { ...tienda[0], direcciones };
  }

  static async getByUserRol({ usuarioId, usuarioRol }) {
    const getQuery = `SELECT t.NOMBRE AS tienda, t.DESCRIPCION AS descripcion, u.nombre as creador
    FROM tiendas AS t  
      INNER JOIN roles_usuario AS ru ON ru.CVE_TIENDA = t.CVE_TIENDA 
      INNER JOIN usuarios AS u ON u.CVE_USUARIO = ru.CVE_USUARIO  
      INNER JOIN roles AS r ON r.CVE_ROLES = ru.CVE_ROLES 
    WHERE (u.CVE_USUARIO = ?) AND (r.NOMBRE = ?)`;

    const tiendas = await pool.query(getQuery, [usuarioId, usuarioRol]);
    return tiendas;
  }

  static async create({ input }) {
    const { nombre, descripcion, cve_usuario } = input;
    const newTiendaId = await generateId({ table: "tiendas" });
    const newTiendaQuery = `INSERT INTO tiendas (cve_tienda, nombre, descripcion) VALUES (?, ?, ?)`;
    const newTienda = await pool.query(newTiendaQuery, [
      newTiendaId,
      nombre,
      descripcion,
    ]);

    const relationTiendaUsuarioQuery = `INSERT INTO tiendas_usuario (cve_tienda, cve_usuario) VALUES (?, ?)`;
    await pool.query(relationTiendaUsuarioQuery, [newTiendaId, cve_usuario]);

    const rolEmprendedorQuery = `SELECT cve_rol FROM roles WHERE nombre = 'emprendedor'`;
    const rolEmprendedor = await pool.query(rolEmprendedorQuery);

    const today = new Date();
    const relationRolUsuarioTiendaQuery = `INSERT INTO roles_usuario 
    ( 
      cve_usuario,
      cve_rol,
      cve_tienda,
      fecha_contrato, 
      fecha_modificacion, 
      activo 
    ) VALUES (?, ?, ?, ?, ?, ?)`;
    await pool.query(relationRolUsuarioTiendaQuery, [
      cve_usuario,
      rolEmprendedor[0].cve_rol,
      newTiendaId,
      today,
      today,
      true,
    ]);

    const data = await this.getByID({ tiendaId: newTiendaId });

    return data[0];
  }

  static async update({ tiendaId, updatedFields }) {
    // Crear la parte SET de la consulta con los campos actualizados
    const clauses = setClause(updatedFields);

    // Construir la consulta UPDATE con una consulta preparada
    const updateQuery = `UPDATE tiendas SET ${clauses} WHERE cve_tienda = ?`;

    // Crear un array con los valores a actualizar y agregar el ID de la tienda al final
    const updateValues = [...Object.values(updatedFields), tiendaId];

    try {
      const updatedTienda = await pool.query(updateQuery, updateValues);

      const result = await this.getByID({ tiendaId: tiendaId });

      return result[0];
    } catch (error) {
      console.log(error);
      throw Error("Hubo un error en la base de datos...");
    }
    // Ejecutar la consulta preparada
  }

  static async createDirecciones({ tiendaId, direcciones }) {
    const response = await Promise.all(
      Array.from(direcciones).map(
        async (direccion) =>
          await this.createDireccion({ tiendaId, input: direccion })
      )
    );

    return response;
  }

  static async updateDireccion({ cve_direccion, cve_tienda, input }) {
    const clauses = setClause(input);
    const query = `UPDATE direcciones AS d SET ${clauses} WHERE d.cve_direccion = ? AND d.cve_tienda = ?`;

    try {
      await pool.query(query, [
        ...Object.values(input),
        parseInt(cve_direccion),
        parseInt(cve_tienda),
      ]);

      const response = await this.getDireccionById({
        cve_direccion,
        cve_tienda,
      });

      return response;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al actualizar los datos de la dirección");
    }
  }

  static async createDireccion({ cve_tienda, input }) {
    const {
      cve_estado,
      calle,
      colonia,
      codigo_postal,
      ciudad,
      referencia,
      principal,
      numInt,
      numExt,
    } = input;

    const query = `INSERT INTO direcciones 
    ( cve_estado,
      calle,
      colonia,
      codigo_postal,
      ciudad,
      principal,
      numInt,
      numExt,
      activo,
      cve_tienda ) VALUES
     (?,?,?,?,?,?,?,?,?,?) RETURNING *
    `;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const result = await conn.query(query, [
        cve_estado,
        calle,
        colonia,
        codigo_postal,
        ciudad,
        principal,
        numInt,
        numExt,
        true,
        parseInt(cve_tienda),
      ]);

      if (referencia) {
        const query = `UPDATE direcciones SET referencia = ? WHERE cve_direccion = ?`;
        await conn.query(query, [referencia, result[0].cve_direccion]);
      }

      await conn.commit();
      return result[0];
    } catch (error) {
      await conn.rollback();
      console.log(error);
      throw new Error("Hubo un error al crear la dirección en la tienda");
    }
  }

  static async getDireccionesByTienda({ cve_tienda }) {
    const query = `SELECT
      d.cve_direccion as id,
      d.calle,
      d.colonia,
      d.codigo_postal,
      d.ciudad,
      d.referencia,
      d.principal,
      d.numInt,
      d.numExt,
      e.cve_estado,
      p.cve_pais,
      JSON_OBJECT('nombre', e.nombre, 'id', e.cve_estado) AS estado,
      JSON_OBJECT('nombre', p.nombre, 'id', p.cve_pais) AS pais,
      JSON_OBJECT('nombre', t.nombre, 'id', t.cve_tienda) AS tienda,
      d.activo
        FROM direcciones AS d
          INNER JOIN estados AS e ON e.cve_estado = d.cve_estado
          INNER JOIN paises AS p ON p.cve_pais = e.cve_pais
          INNER JOIN tiendas AS t ON t.cve_tienda = d.cve_tienda
      WHERE (d.cve_tienda = ?) AND (d.activo = true)
      `;

    try {
      const response = await pool.query(query, [parseInt(cve_tienda)]);

      return response;
    } catch (error) {
      console.log(error);
      throw new Error(
        "Hubo un error al consultar las direcciones de la tienda"
      );
    }
  }

  static async getDireccionById({ cve_direccion, cve_tienda }) {
    const query = `SELECT d.cve_direccion as id,
      d.calle,
      d.colonia,
      d.codigo_postal,
      d.ciudad,
      d.referencia,
      d.principal,
      d.numInt,
      d.numExt,
      JSON_OBJECT('nombre', e.nombre, 'id', e.cve_estado) AS estado,
      JSON_OBJECT('nombre', p.nombre, 'id', p.cve_pais) AS pais,
      JSON_OBJECT('nombre', t.nombre, 'id', t.cve_tienda) AS tienda,
      d.activo
        FROM direcciones AS d
          INNER JOIN estados AS e ON e.cve_estado = d.cve_estado
          INNER JOIN paises AS p ON p.cve_pais = e.cve_estado
          INNER JOIN tiendas AS t ON t.cve_tienda = d.cve_tienda
      WHERE (d.cve_direccion = ?) AND (d.cve_tienda = ?)
      `;

    try {
      const response = await pool.query(query, [
        parseInt(cve_direccion),
        parseInt(cve_tienda),
      ]);
      return response[0];
    } catch (error) {
      throw new Error("Hubo un error al consultar la dirección");
    }
  }
}
