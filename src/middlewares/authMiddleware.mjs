import { pool } from "../database/dbconnect.mjs";
import { jsonResponse } from "../lib/json-response.mjs";

// authMiddleware.js
export class authMiddleware {
  static validateAuthorizarionByRoles({ roles = null }) {
    return async function (req, res, next) {
      const { id } = req.user;
      const { tiendaId } = req.params;

      let query = `SELECT r.nombre AS rol
      FROM roles AS r
        INNER JOIN roles_usuario AS ru ON ru.cve_rol = r.cve_rol
        INNER JOIN usuarios AS u ON u.cve_usuario = ru.cve_usuario
        INNER JOIN tiendas AS t ON t.cve_tienda = ru.cve_tienda
      WHERE (u.cve_usuario = ?) AND (t.cve_tienda = ?)
      `;

      let response;

      if (roles) {
        const conditionalClauses = Array.from(roles).map(
          () => "(r.nombre = ?)"
        );

        query = query.concat(` AND ( ${conditionalClauses.join(" OR ")} ) `);
        response = await pool.query(query, [
          parseInt(id),
          cve_tienda,
          ...roles,
        ]);
      } else {
        query = query.concat(' AND (r.nombre = "emprendedor")');
        response = await pool.query(query, [parseInt(id), parseInt(tiendaId)]);
      }

      if (response.length > 0) {
        next();
      } else {
        return res.status(401).json(
          jsonResponse(401, {
            message: "No tiene los permisos para realizar la acción.",
          })
        );
      }
    };
  }
}
