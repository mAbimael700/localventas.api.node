import { pool } from "../database/dbconnect.mjs";

export class RolesModel {
  static async getRoles() {
    const query = `SELECT r.nombre
      FROM roles as r
    `;
    try {
      const roles = await pool.query(query);
      return roles;
    } catch (error) {
      throw Error("Hubo un error al consultar los roles del servidor.");
    }
  }

  static async getRolTiendaByUser({ cve_usuario, cve_tienda }) {
    const query = `SELECT 
    JSON_OBJECT('nombre', r.nombre, 'id', r.cve_rol) as rol
    FROM roles AS r 
      INNER JOIN roles_usuario AS ru ON ru.cve_rol = r.cve_rol
    WHERE ru.cve_usuario = ? AND ru.cve_tienda = ?
    `;

    try {
      const result = await pool.query(query, [
        parseInt(cve_usuario),
        parseInt(cve_tienda),
      ]);

      return result[0].rol;
    } catch (error) {
      throw new Error("Hubo un error al consultar el rol del usuario.");
    }
  }
  static async getRolesPerTienda({ usuarioId }) {
    const query = `SELECT r.nombre AS rol, t.nombre AS tienda
            FROM roles AS r
                INNER JOIN roles_usuario AS ru ON ru.cve_rol = r.cve_rol
                INNER JOIN usuarios AS u ON u.cve_usuario = ru.cve_usuario
                INNER JOIN tiendas AS t ON t.cve_tienda = ru.cve_tienda
            WHERE (u.cve_usuario = ?)
            `;

    try {
      const rolesUsuario = await pool.query(query, [usuarioId]);

      if (rolesUsuario.length > 0) {
        const rolesPorTienda = {};

        rolesUsuario.forEach(({ rol, tienda }) => {
          if (!rolesPorTienda[tienda]) {
            rolesPorTienda[tienda] = [];
          }
          rolesPorTienda[tienda].push(rol);
        });

        return rolesPorTienda;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
    }
  }

  static async verificarPermisos({ cve_usuario, cve_tienda, cve_modulo }) {
    try {
      const query = `SELECT m.cve_modulo FROM
      modulos AS m
        INNER JOIN permisos AS p ON p.cve_modulos = m.cve_modulo
        INNER JOIN roles AS r ON r.cve_rol = p.cve_rol
        INNER JOIN roles_usuario AS ru ON ru.cve_rol = r.cve_rol
        INNER JOIN tiendas AS t ON t.cve_tienda = ru.cve_tienda
        INNER JOIN usuarios AS u ON u.cve_usuario = ru.cve_usuario
      WHERE (u.cve_usuario = ?) AND (t.cve_tienda = ?) AND (m.cve_modulo = ?) AND (ru.activo = true)
      `;

      const permiso = await pool.query(query, [
        cve_usuario,
        cve_tienda,
        cve_modulo,
      ]);

    
      return permiso[0];
    } catch (error) {
      console.log(error);
      throw Error(
        "Hubo un error al verificar si existe permiso a este usuario."
      );
    }
  }
}
