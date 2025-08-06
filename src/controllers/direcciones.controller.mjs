import { jsonResponse } from "../lib/json-response.mjs";
import { DireccionesModel } from "../models/direcciones.mjs";

export class DireccionesController {
  static async getPaises(req, res) {
    try {
      const paises = await DireccionesModel.getPaises();

      if (paises.length === 0) {
        return res.status(400).json(
          jsonResponse(400, {
            message: "No se encontraron paises en el servidor",
          })
        );
      }

      return res.status(200).json(jsonResponse(200, { data: paises }));
    } catch (error) {
      return res.status(500).json(
        jsonResponse(500, {
          error: {
            message: error.message,
            title: error.title,
          },
        })
      );
    }
  }

  static async getEstadosByPais(req, res) {
    const { paisId } = req.params;

    try {
      const estados = await DireccionesModel.getEstadosByPais({
        cve_pais: paisId,
      });

      if (estados.length === 0) {
        return res.status(400).json(
          jsonResponse(400, {
            message: "No se encontraron estados en el pais seleccionado.",
          })
        );
      }

      return res.status(200).json(jsonResponse(200,{ data: estados }));
    } catch (error) {
      return res.status(500).json(
        jsonResponse(500, {
          error: {
            message: error.message,
            title: error.title,
          },
        })
      );
    }
  }
}
