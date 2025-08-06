import { v4 } from "uuid";
import { pool } from "../database/dbconnect.mjs";

export class SolicitudEmpleosModel {
  static async existeCurrentSolicitud({ cve_usuario }) {
    const query = `SELECT
    cve_solicitud, 
    cve_empleador,
    cve_usuario,
    cve_tienda,
    estado,
    fecha_expiracion 
    FROM solicitudes_empleo
    WHERE cve_usuario = ?
    ORDER BY fecha_expiracion DESC
    LIMIT 1
    `;

    try {
      const solicitud = await pool.query(query, [cve_usuario]);
      return solicitud[0];
    } catch (error) {
      console.log(error);
      throw Error("Hubo un error al consultar las solicitudes de empleo.");
    }
  }

  static async getById({ cve_solicitud }) {
    const query = `SELECT 
    se.cve_solicitud AS id,
    se.estado,
    se.fecha_expiracion,
    JSON_OBJECT('nombre', t.nombre, 'id', t.cve_tienda) AS tienda,
    JSON_OBJECT('nombre', CONCAT_WS(" ", emp.nombre, emp.paterno, emp.materno), 'id', se.cve_empleador) AS empleador,
    JSON_OBJECT('nombre', CONCAT_WS(" ", user.nombre, user.paterno, user.materno), 'id', se.cve_usuario) AS usuario
      FROM solicitudes_empleo AS se
      INNER JOIN personas AS emp ON emp.cve_persona = se.cve_empleador
      INNER JOIN personas AS user ON user.cve_persona = se.cve_usuario
      INNER JOIN tiendas AS t ON t.cve_tienda = se.cve_tienda
    WHERE se.cve_solicitud = ?
    `;

    const solicitudEmpleo = await pool.query(query, [cve_solicitud]);
    return solicitudEmpleo[0];
  }

  static async create({ cve_empleador, cve_usuario, cve_tienda }) {
    const solicitudId = v4();
    const estado = "pendiente";

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 1);
    const query = `
    INSERT INTO solicitudes_empleo 
        (
            cve_solicitud,
            cve_empleador,
            cve_usuario,
            cve_tienda,
            estado,
            fecha_expiracion
        )
    VALUES (?, ?, ?, ?, ?, ?) RETURNING *`;

    try {
      const newSolicitud = await pool.query(query, [
        solicitudId,
        cve_empleador,
        cve_usuario,
        cve_tienda,
        estado,
        fechaExpiracion,
      ]);

      console.log(newSolicitud);
      return newSolicitud[0];
    } catch (error) {
      console.log(error);
      throw Error("Hubo un error al crear una solicitud de empleo.");
    }
  }

  static async update({ estado , cve_solicitud }) {
    const query = `UPDATE solicitudes_empleo set estado = ? WHERE cve_solicitud = ?`;

    try {
      const newSolicitud = await pool.query(query, [estado, cve_solicitud]);
      return;
    } catch (error) {
      throw Error("Hubo un error al actualizar la solicitud de empleo.");
    }
  }

  static async getAllByUser({ cve_usuario }) {
    const query = `SELECT 
    se.cve_solicitud AS id,
    se.estado,
    se.fecha_expiracion,
    JSON_OBJECT('nombre', t.nombre, 'id', t.cve_tienda) AS tienda,
    JSON_OBJECT('nombre', CONCAT_WS(" ", emp.nombre, emp.paterno, emp.materno), 'id', se.cve_empleador) AS empleador,
    JSON_OBJECT('nombre', CONCAT_WS(" ", user.nombre, user.paterno, user.materno), 'id', se.cve_usuario) AS usuario
      FROM solicitudes_empleo AS se
      INNER JOIN personas AS emp ON emp.cve_persona = se.cve_empleador
      INNER JOIN personas AS user ON user.cve_persona = se.cve_usuario
      INNER JOIN tiendas AS t ON t.cve_tienda = se.cve_tienda
    WHERE se.cve_usuario = ? AND se.fecha_expiracion > NOW()
    `;

    try {
      
      const solicitudes = await pool.query(query, [parseInt(cve_usuario)]);
      return solicitudes;
    } catch (error) {
      console.log(error);
      throw Error("Hubo un error al consultar las solicitudes del usuario");
    }
  }
}
