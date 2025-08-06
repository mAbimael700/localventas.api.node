import { jsonResponse } from "../lib/json-response.mjs";
import { PedidosModel } from "../models/pedidos.mjs";
import { VentasModel } from "../models/ventas.mjs";
import {
  validarPartialPedido,
  validarPedido,
} from "../schemas/pedidos-schema.mjs";

export class PedidosController {
  static async getAllByTienda(req, res) {
    const { tiendaId } = req.params;

    if (tiendaId) {
      try {
        const pedidos = await PedidosModel.getAllByTienda({
          cve_tienda: tiendaId,
        });

        if (pedidos.length === 0)
          return res
            .status(404)
            .json(jsonResponse(404, { message: "No se encontraron pedidos" }));

        return res.status(200).json(jsonResponse(200, { data: pedidos }));
      } catch (error) {
        console.log(error);
        return res.status(500).json(jsonResponse(500, { error: error.message }));
      }
    }

    res
      .status(404)
      .json(jsonResponse(404, { message: "Debes ingresar el id una tienda" }));
  }

  static async getById(req, res) {
    const { pedidoId, tiendaId } = req.params;

    if (pedidoId) {
      try {
        const pedido = await PedidosModel.getbyId({
          cve_tienda: tiendaId,
          cve_venta: pedidoId,
        });

        if (pedido) {
          return res.status(200).json(jsonResponse(200, { data: pedido }));
        }

        return res.status(400).json(
          jsonResponse(400, {
            message: "No hay un pedido con ese id en la tienda.",
          })
        );
      } catch (error) {
        return res
          .status(500)
          .json(jsonResponse(500, { error: error.message }));
      }
    }
    res
      .status(404)
      .json(jsonResponse(404, { message: "Debes ingresar el id del pedido" }));
  }

  static async create(req, res) {
    const { tiendaId } = req.params;

    const result = validarPedido(req.body);

    if (!result.success) {
      return res
        .status(400)
        .json(jsonResponse(400, { error: result.error.errors }));
    }

    try {
      const existeVenta = await VentasModel.getAllDetalleVenta({
        cve_venta: result.data.cve_venta,
        cve_tienda: tiendaId,
      });

      if (existeVenta.length === 0) {
        return res.status(400).json(
          jsonResponse(400, {
            message: "No existe una venta con ese Id en la tienda",
          })
        );
      }

      const newPedido = await PedidosModel.create({
        input: result.data,
      });

      return res.status(201).json(jsonResponse(201, { data: newPedido }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error: error.message }));
    }
  }

  static async update(req, res) {
    const { pedidoId } = req.params;
    const result = validarPartialPedido(req.body);

    if (!result.success) {
      return res
        .status(400)
        .json(jsonResponse(400, { error: result.error.errors }));
    }

    try {
      if (pedidoId) {
        const existeVenta = await VentasModel.getAllDetalleVenta({
          cve_venta: pedidoId,
          cve_tienda: tiendaId,
        });

        if (existeVenta.length === 0) {
          return res.status(400).json(
            jsonResponse(400, {
              message: "No existe una venta con ese Id en la tienda",
            })
          );
        }

        const updatedPedido = await PedidosModel.update({
          input: result.data,
          cve_venta: pedidoId,
        });

        return res.status(201).json(jsonResponse(201, { data: updatedPedido }));
      }

      return res.status(400).json(
        jsonResponse(400, {
          message: "Debes ingresar el id del pedido ",
        })
      );
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error: error.message }));
    }
  }
}
