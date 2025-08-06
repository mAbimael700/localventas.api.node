import { jsonResponse } from "../lib/json-response.mjs";
import { CategoriasModel } from "../models/categorias.mjs";
import {
  validarCategoria,
  validarPartialCategoria,
} from "../schemas/categorias-schema.mjs";

export class CategoriasController {
  static async getAllByTienda(req, res) {
    const { tiendaId } = req.params;

    if (tiendaId) {
      try {
        const response = await CategoriasModel.getAllByTienda({
          tiendaId,
          params: req.query,
        });

        if (response.length === 0) {
          return res.status(404).json(
            jsonResponse(404, {
              message: "No existen categorías en esta tienda.",
            })
          );
        }

        return res.status(200).json(jsonResponse(200, response));
      } catch (error) {
        console.log(error);
        return res.status(500).json(
          jsonResponse(500, {
            error_message: "Hubo un error en la base de datos",
          })
        );
      }
    }

    res
      .status(400)
      .json(jsonResponse(400, { message: "Debes de seleccionar una tienda." }));
  }

  static async getById(req, res) {
    const { tiendaId, categoriaId } = req.params;
    try {
      const response = await CategoriasModel.getById({ categoriaId, tiendaId });

      if (response.lenght === 0) {
        return res
          .status(404)
          .json(
            jsonResponse(404, { message: "No existen categoría con ese id" })
          );
      }

      return res.status(200).json(jsonResponse(200, { data: response }));
    } catch (error) {
      res.status(500).json(
        jsonResponse(500, {
          message: "Hubo un error al acceder a la base de datos.",
        })
      );
    }
  }

  static async create(req, res) {
    const result = validarCategoria(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message: "Los campos no son los correctos",
          error: result.error.errors,
        })
      );
    }

    try {
      const existeCategoria = await CategoriasModel.existeCategoriaEnTienda({
        input: result.data,
      });

      if (existeCategoria) {
        return res.status(400).json(
          jsonResponse(400, {
            error_message: "Ya existe una categoría con ese nombre.",
          })
        );
      }

      const newCategoria = await CategoriasModel.create({ input: result.data });
      return res.status(201).json(jsonResponse(201, newCategoria));
    } catch (error) {
      // Manejo de errores
      console.log(error);
      return res.status(500).json(
        jsonResponse(500, {
          error_message: "Error en el servidor.",
        })
      );
    }
  }

  static async update(req, res) {
    const { categoriaId } = req.params;
    const result = validarPartialCategoria(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message: "Los campos no han sido ingresados correctamente.",
          error: result.error.errors,
        })
      );
    }

    try {
      const existeCategoria = await CategoriasModel.existeCategoriaEnTienda({
        input: result.data,
      });

      if (existeCategoria) {
        return res.status(400).json(
          jsonResponse(400, {
            error_message: "Ya existe una categoría con ese nombre.",
          })
        );
      }

      const updatedCategoria = await CategoriasModel.update({
        input: result.data,
        categoriaId,
      });

      return res.status(200).json(
        jsonResponse(200, {
          message: "Categoria actualizada correctamente.",
          updatedCategoria,
        })
      );
    } catch (error) {
      return res.status(500).json(jsonResponse(500, error));
    }
  }

  static async delete(req, res) {
    const { categoriaId } = req.params;

    try {
      await CategoriasModel.delete({ categoriaId });
      res
        .status(200)
        .json(
          jsonResponse(200, { message: "Categoría desactivada correctamente." })
        );
    } catch (error) {
      res.status(500).json(jsonResponse(500, { error }));
    }
  }
}
