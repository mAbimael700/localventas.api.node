import { jsonResponse } from "../lib/json-response.mjs";
import { MarcaModel } from "../models/marcas.mjs";
import {
  validarMarca,
  validarPartialMarca,
} from "../schemas/marcas-schema.mjs";

export class MarcasController {
  static async getAllByTienda(req, res) {
    const { tienda } = req.query;

    if (tienda) {
      const marcas = await MarcaModel.getAll({ cve_tienda: tienda });

      if (marcas.length === 0)
        return res
          .status(404)
          .json(jsonResponse(404, { message: "No se encontraron marcas" }));

      return res.status(200).json(jsonResponse(200, marcas));
    }

    res
      .status(404)
      .json(jsonResponse(404, { message: "Debes ingresar el id una tienda" }));
  }

  static async getById(req, res) {
    const { tiendaId, marcaId } = req.params;

    const marca = await MarcaModel.getById({
      cve_marca: marcaId,
      cve_tienda: tiendaId,
    });

    if (marca?.length === 0)
      return res
        .status(400)
        .json({ message: "No hay marca referente a este id." });

    res.status(200).json(jsonResponse(200, marca));
  }

  static async create(req, res) {
    const result = validarMarca(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error: result.error.errors,
          error_message: "Los datos recibidos no fueron los correctos.",
        })
      );
    }

    try {
      const marcaExiste = await MarcaModel.existeMarca({ input: result.data });

      if (!marcaExiste) {
        const newMarca = await MarcaModel.create({ input: result.data });
        return res.status(201).json(jsonResponse(200, newMarca));
      } else {
        return res.status(400).json(
          jsonResponse(400, {
            error_message:
              "Ya existe una marca registrada con ese nombre a esta tienda.",
          })
        );
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(
        jsonResponse(500, {
          error_message:
            "Hubo un error en la base de datos, intenté más tarde...",
        })
      );
    }
  }

  static async update(req, res) {
    const { marcaId } = req.params;

    const result = validarPartialMarca(req.body);

    if (!result.success)
      return res.status(400).json({ error: JSON.parse(result.error.errors) });

    try {
      const marcaExiste = await MarcaModel.existeMarca({ input: result.data });

      if (marcaExiste) {
        return res.status(400).json(
          jsonResponse(400, {
            error_message:
              "Ya existe una marca registrada con ese nombre a esta tienda.",
          })
        );
      }

      const updatedMarca = await MarcaModel.update({
        cve_marca: marcaId,
        input: result.data,
      });

      res.status(200).json(jsonResponse(200, updatedMarca));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async delete(req, res) {
    const { marcaId, tiendaId } = req.params;

    try {
      const marcaExiste = await MarcaModel.getById({
        cve_marca: marcaId,
        cve_tienda: tiendaId,
      });

      if (!marcaExiste) {
        return res.status(400).json(
          jsonResponse(400, {
            error_message: "No existe esta marca.",
          })
        );
      }

      const deactivatedMarca = await MarcaModel.delete({
        cve_marca: marcaId,
        cve_tienda: tiendaId,
      });

      return res.status(200).json(jsonResponse(200, deactivatedMarca));
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }
}
