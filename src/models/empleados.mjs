import { pool } from "../database/dbconnect.mjs";
import { setClause } from "../utils/setClauses.mjs";

export class EmpleadosModel {
  static async getAllByTienda({ cve_tienda }) {
    const getQuery = `SELECT p.cve_persona AS id, CONCAT_WS(' ', p.nombre, p.paterno, p.materno) AS nombre, p.correo_electronico, 
      r.nombre AS rol, ru.fecha_contrato, ru.activo
        FROM usuarios AS u
            INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
            INNER JOIN roles_usuario AS ru ON ru.cve_usuario = u.cve_usuario
            INNER JOIN roles AS r ON r.cve_rol = ru.cve_rol
            INNER JOIN tiendas AS t ON t.cve_tienda = ru.cve_tienda
        WHERE (t.cve_tienda = ?)`;

    const empleados = await pool.query(getQuery, [parseInt(cve_tienda)]);

    return empleados;
  }

  static async getAllByRol({ cve_tienda, cve_rol }) {
    const getQuery = `SELECT CONCAT_WS(' ', p.nombre, p.paterno, p.materno) AS nombre, p.correo_electronico, 
        r.nombre as rol, ru.fecha_contrato, ru.activo
        FROM usuarios AS u
            INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
            INNER JOIN roles_usuario AS ru ON ru.cve_usuario = u.cve_usuario
            INNER JOIN roles AS r ON r.cve_rol = ru.cve_rol
            INNER JOIN tiendas AS t ON t.cve_tienda = ru.cve_tienda
        WHERE (t.cve_tienda = ?) AND (r.cve_rol = ?)`;

    const empleados = await pool.query(getQuery, [
      parseInt(cve_tienda),
      parseInt(cve_rol),
    ]);

    return empleados;
  }

  static async getById({ cve_empleado, cve_tienda }) {
    const getQuery = `SELECT p.cve_persona AS id, CONCAT_WS(' ', p.nombre, p.paterno, p.materno) AS nombre, p.correo_electronico, 
    r.nombre AS rol, ru.fecha_contrato, ru.activo
      FROM usuarios AS u
          INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
          INNER JOIN roles_usuario AS ru ON ru.cve_usuario = u.cve_usuario
          INNER JOIN roles AS r ON r.cve_rol = ru.cve_rol
          INNER JOIN tiendas AS t ON t.cve_tienda = ru.cve_tienda
      WHERE (ru.cve_usuario = ?) AND (ru.cve_tienda = ?)`;

    try {
      const empleado = await pool.query(getQuery, [
        parseInt(cve_empleado),
        parseInt(cve_tienda),
      ]);

      return empleado[0];
    } catch (error) {
      throw new Error("Hubo un error al consultar el empleado");
    }
  }

  static async create({ cve_tienda, cve_usuario, cve_rol }) {
    const query = `
    INSERT INTO roles_usuario 
    ( 
      cve_usuario,
      cve_rol,
      cve_tienda,
      fecha_contrato,
      fecha_modificacion,
      activo
    ) 
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
    `;

    const generateDate = () => new Date(Date.now());
    const fechaModificacion = generateDate();

    try {
      const newEmpleado = await pool.query(query, [
        parseInt(cve_usuario),
        9,
        parseInt(cve_tienda),
        fechaModificacion,
        fechaModificacion,
        true,
      ]);

      return newEmpleado[0];
    } catch (error) {
      throw Error("Hubo un error al crear el empleado");
    }
  }
  static async update({ input, cve_empleado, cve_tienda }) {
    try {
      const updateClauses = setClause(input);
      const updateQuery = `UPDATE roles_usuario AS ru SET ${updateClauses} WHERE ru.cve_usuario = ? AND ru.cve_tienda = ?`;

      await pool.query(updateQuery, [
        ...Object.values(input),
        parseInt(cve_empleado),
        parseInt(cve_tienda)
      ]);

      return;

      /* const updatedMarca = await this.getById({ cve_marca: cve_marca, cve_tienda });

      return updatedMarca; */
    } catch (error) {
      console.log(error);
      throw new Error(
        "Hubo un error al actualizar el empleado en la base de datos"
      );
    }
  }

  static async delete({ cve_empleado, cve_tienda }) {
    const query = `UPDATE roles_usuario 
    SET activo = ? 
    WHERE cve_usuario = ? AND cve_tienda = ?;
    `;
    await pool.query(query, [
      false,
      parseInt(cve_empleado),
      parseInt(cve_tienda),
    ]);

    try {
      const deactivatedEmpleado = await this.getById({ cve_empleado, cve_tienda });
      return deactivatedEmpleado;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al acceder a la base de datos.");
    }
  }
}
