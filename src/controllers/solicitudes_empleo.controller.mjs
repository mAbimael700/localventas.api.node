import { jsonResponse } from "../lib/json-response.mjs";
import { SolicitudEmpleosModel } from "../models/solicitud-empleo.mjs";

export class SolicitudEmpleosController {
  static async getAllByUser(req, res) {
    const { id } = req.user;

    try {
      const solicitudes = await SolicitudEmpleosModel.getAllByUser({
        cve_usuario: id,
      });

      if (solicitudes.length === 0) {
        return res
          .status(400)
          .json(
            jsonResponse(400, { message: "No hay solicitudes por contestar." })
          );
      }

      return res.status(200).json(jsonResponse(200, { data: solicitudes }));
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(500, { error_message: error }));
    }
  }

  static async getById(req, res) {
    const { id: userRequestId } = req.user;
    const { solicitudId } = req.params;

    try {
      const solicitud = await SolicitudEmpleosModel.getById({cve_solicitud:
        solicitudId,
      });
      if (!solicitud) {
        return res
          .status(400)
          .json(jsonResponse(400, { message: "No hay existe la solicitud." }));
      }

      if (solicitud.usuario.id !== userRequestId) {
        return res
          .status(400)
          .json(jsonResponse(400, { message: "No existe esa solicitud en tu bandeja de solicitudes." }));
      }

      return res.status(200).json(jsonResponse(200, { data: solicitud }));
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(500, { error_message: error }));
    }
  }
}
