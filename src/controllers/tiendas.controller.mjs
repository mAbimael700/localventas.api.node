import { getTokenFromHeader } from "../auth/get-token-from-header.mjs";
import { jsonResponse } from "../lib/json-response.mjs";
import { TiendasModel } from "../models/tiendas.mjs";
import {
  validarDireccion,
  validarDireccionPartial,
  validarPartialTienda,
  validarTienda,
} from "../schemas/tiendas-schema.mjs";

export class TiendaController {
  static async getAll(req, res) {
    const { usuario } = req.query;

    if (usuario) {
      const data = await TiendasModel.getByUserID({ usuarioId: usuario });

      if (data.length === 0)
        return res.status(404).json({ error_message: "Commerces not found" });

      return res.status(200).json(jsonResponse(200, data));
    } else {
      const data = await TiendasModel.getAll();

      if (data.length === 0)
        return res.status(404).json({ message: "Commerces not found" });

      return res.status(200).json(jsonResponse(200, { data }));
    }
  }

  static async getAllByUser(req, res) {
    const { id: userRequestId } = req.id;

    await TiendasModel.getByUserID({ usuarioId: userRequestId });
  }

  static async getById(req, res) {
    const { tiendaId } = req.params;

    const data = await TiendasModel.getByID({ tiendaId });

    if (data) return res.status(200).json(data);

    res.status(404).json({ message: "No existe la tienda" });
  }

  static async create(req, res) {
    //const token = getTokenFromHeader(req.headers);

    const result = await validarTienda(req.body);

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.errors) });
    }

    try {
      const newTienda = await TiendasModel.create({ input: result.data });
      res.status(201).json(newTienda);
    } catch (error) {
      return res.status(500).json(
        jsonResponse(500, {
          error_message:
            "Hubo un error en la base de datos al registrar la tienda, intente más tarde...",
        })
      );
    }
  }

  static async update(req, res) {
    const { tiendaId } = req.params;

    const result = validarPartialTienda(req.body);

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const updatedTienda = await TiendasModel.update({
      tiendaId: tiendaId,
      updatedFields: result.data,
    });

    return res.status(200).json(jsonResponse(200, updatedTienda));
  }

  static async getDireccionesByTienda(req, res) {
    const { tiendaId } = req.params;

    try {
      const response = await TiendasModel.getDireccionesByTienda({
        cve_tienda: tiendaId,
      });

      if (response.length === 0)
        return res.status(404).json(
          jsonResponse(404, {
            message: "No existen direcciones en tu tienda.",
          })
        );

      return res.status(200).json(jsonResponse(200, { data: response }));
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async getDireccionById(req, res) {
    const { tiendaId, direccionId } = req.params;

    try {
      const response = await TiendasModel.getDireccionById({
        cve_tienda: tiendaId,
        cve_direccion: direccionId,
      });

      if (!response)
        return res.status(404).json(
          jsonResponse(404, {
            message: "No existen dirección en tu tienda con esta Id.",
          })
        );

      return res.status(200).json(jsonResponse(200, { data: response }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async createDirecciones(req, res) {
    const { tiendaId } = req.params;
    const result = validarDireccion(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error: JSON.parse(result.error),
          message: "Los campos no son válidos.",
        })
      );
    }

    try {
      const tiendasCreated = await Promise.all(
        result.data.direcciones.map(
          async (direccion) =>
            await TiendasModel.createDireccion({
              cve_tienda: tiendaId,
              input: direccion,
            })
        )
      );
      return res.status(201).json(jsonResponse(201, { data: tiendasCreated }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error: error.message }));
    }
  }

  static async updateDirecciones(req, res) {
    const { tiendaId, direccionId } = req.params;
    const result = validarDireccionPartial(req.body);

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.errors) });
    }

    try {
      const tiendaUpdated = await TiendasModel.updateDireccion({
        cve_direccion: direccionId,
        cve_tienda: tiendaId,
        input: result.data.direcciones[0],
      });

      return res.status(201).json(jsonResponse(201, { data: tiendaUpdated }));
    } catch (error) {
      return res.status(500).json(
        jsonResponse(500, {
          error,
        })
      );
    }
  }

  static async deleteDireccion(req, res) {
    const { tiendaId, direccionId } = req.params;

    try {
      const result = await TiendasModel.updateDireccion({
        cve_direccion: direccionId,
        cve_tienda: tiendaId,
        input: { activo: false },
      });

      return res.status(200).json(jsonResponse(200, { data: result }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }
}
