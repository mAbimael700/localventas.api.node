import { DistribuidoresModel } from "../models/distribuidores.mjs";
import { jsonResponse } from "../lib/json-response.mjs";
import { validarDistribuidor } from "../schemas/distribuidores-schema.mjs";

export class DistribuidoresController {
  static async getAll(req, res) {
    const { tiendaId } = req.params;

    try {
      const data = await DistribuidoresModel.getAllByTienda({
        cve_tienda: tiendaId,
      });

      if (data.lenght === 0) {
        return res.status(404).json(
          jsonResponse(404, {
            message: "No hay distribuidores en esta tienda",
          })
        );
      }

      return res.status(200).json(jsonResponse({ data }));
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async getById(req, res) {
    const { distribuidorId } = req.params;

    const data = await DistribuidoresModel.getById({
      cve_distribuidor: distribuidorId,
    });

    if (!data) {
      return res
        .status(404)
        .json(jsonResponse(404, { message: "No existe este distribuidor" }));
    }

    return res.status(200).json(jsonResponse(200, { data }));
  }

  static async create(req, res) {
    const result = validarDistribuidor(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message: "Los campos no son los correctos",
          error: result.error.errors,
        })
      );
    }

    try {
      const newDistribuidor = await DistribuidoresModel.create({
        input: result.data,
      });

      return res.status(201).json(jsonResponse(201, newDistribuidor));
    } catch (error) {
      console.log(error);
      res.status(500).json(
        jsonResponse(500, {
          error_message:
            "Hubo un error en la base de datos al registrar el distribuidor, intente más tarde...",
        })
      );
    }
  }
}
