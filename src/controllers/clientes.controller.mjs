import { ClientesModel } from "../models/clientes.mjs";
import { jsonResponse } from "../lib/json-response.mjs";
import {
  validarCliente,
  validarPartialCliente,
} from "../schemas/clientes-schema.mjs";
export class ClienteController {
  static async getAll(req, res) {
    const { tiendaId } = req.params;

    try {
      const clientes = await ClientesModel.getClientesByTienda({
        cve_tienda: tiendaId,
      });

      if (clientes.length === 0) {
        return res
          .status(404)
          .json(
            jsonResponse(404, { message: "No hay clientes en esta tienda" })
          );
      }

      return res.status(200).json(jsonResponse(200, { data: clientes }));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(jsonResponse(500, { error: "Hubo un error en el servidor" }));
    }
  }

  static async getById(req, res) {
    const { clienteId, tiendaId } = req.params;

    try {
      const cliente = await ClientesModel.getById({
        cve_tienda: tiendaId,
        cve_cliente: clienteId,
      });

      if (cliente.length === 0) {
        return res.status(404).json(
          jsonResponse(404, {
            message: "Se encontró el cliente en esta tienda",
          })
        );
      }

      return res.status(200).json(jsonResponse(200, { data: cliente }));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(jsonResponse(500, { error: "Hubo un error en el servidor" }));
    }
  }
  static async create(req, res) {
    const result = validarCliente(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message: "Los campos no son los correctos",
          error: result.error.errors,
        })
      );
    }

    try {
      const newCliente = await ClientesModel.create({
        cve_tienda: result.data.cve_tienda,
        input: result.data,
      });
      return res.status(201).json(jsonResponse(201, newCliente));
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
    const { clienteId } = req.params;
    const result = validarPartialCliente(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message: "Los campos no han sido ingresados correctamente.",
          error: result.error.errors,
        })
      );
    }

    try {
      const updatedCliente = await ClientesModel.update({
        input: result.data,
        cve_cliente: clienteId,
      });

      return res.status(200).json(
        jsonResponse(200, {
          message: "Cliente actualizada correctamente.",
          updatedCategoria,
        })
      );
    } catch (error) {
      return res.status(500).json(jsonResponse(500, error));
    }
  }

  static async delete(req, res) {
    const { clienteId } = req.params;

    try {
      await ClientesModel.delete({ cve_cliente: clienteId });
      res
        .status(200)
        .json(
          jsonResponse(200, { message: "Cliente desactivado correctamente." })
        );
    } catch (error) {
      res.status(500).json(jsonResponse(500, { error }));
    }
  }
}
