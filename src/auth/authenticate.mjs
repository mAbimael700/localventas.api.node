import { jsonResponse } from "../lib/json-response.mjs";
import { RolesModel } from "../models/roles.mjs";
import { getTokenFromHeader } from "./get-token-from-header.mjs";
import { verifyAccessToken } from "./verify-tokens.mjs";

export function authenticate(req, res, next) {
  const token = getTokenFromHeader(req.headers);

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = { ...decoded.user };
      next();
    } else {
      res.status(401).json(
        jsonResponse(401, {
          message: "No token provided.",
        })
      );
    }
  } else {
    res.status(401).json(
      jsonResponse(401, {
        message: "No token provided.",
      })
    );
  }
}

export async function verificarPermisosEndpoint(req, res, next) {
  const usuarioId = req.user.id; // El ID del usuario está disponible en req.user
  const tiendaId = req.params.tiendaId; // Obtener el ID de la tienda desde los parámetros de la URL
  const moduloId = req.moduloId; // Obtener el ID del módulo desde el campo modulodId agregado a la solicitud

  try {
    // Verificar los permisos del usuario para acceder al módulo en la tienda especificada
    const tienePermisos = await RolesModel.verificarPermisos({
      cve_usuario: usuarioId,
      cve_tienda: tiendaId,
      cve_modulo: moduloId,
    });


  
    if (tienePermisos) {
      // Si el usuario tiene permisos, pasa la solicitud al siguiente middleware o controlador
      next();
    } else {
      // Si el usuario no tiene permisos, responder con un error 403 Forbidden
      res.status(403).json(
        jsonResponse(403, {
          error: "No tiene permisos para acceder a este módulo en esta tienda.",
          error_message:
            "No tiene permisos para realizar esta acción en esta tienda.",
        })
      );
    }
  } catch (error) {
    // Manejar cualquier error que pueda ocurrir durante la verificación de permisos
    console.error("Error al verificar permisos:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
}

export function asignarModuloId(moduloId) {
  return (req, res, next) => {
    // Asignar el ID del módulo asociado al endpoint a la solicitud
    req.moduloId = moduloId; // Aquí asignamos dinámicamente el ID del módulo asociado a este endpoint
    next();
  };
}
