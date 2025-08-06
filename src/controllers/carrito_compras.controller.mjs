import { jsonResponse } from "../lib/json-response.mjs";
import { CarritoComprasModel } from "../models/carrito-compras.mjs";
import { ProductoModel } from "../models/productos.mjs";
import {
  validarCarritoCompras,
  validarItemCarritoCompras,
} from "../schemas/carrito_compras-schema.mjs";

export class CarritoComprasController {
  static async getCurrentByTienda(req, res) {
    const { id } = req.user;
    const { tiendaId } = req.params;

    try {
      const result = await CarritoComprasModel.getCurrentByUserTienda({
        cve_usuario: id,
        cve_tienda: tiendaId,
      });

      if (!result) {
        return res.status(404).json(
          jsonResponse(404, {
            message: "Carrito not found",
          })
        );
      }

      return res.status(200).json(
        jsonResponse(200, {
          data: result,
        })
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json(
        jsonResponse(500, {
          message: "Hubo un error al consultar tu carrito de compras",
        })
      );
    }
  }

  static async create(req, res) {
    const result = validarCarritoCompras(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: "Los campos no son validos",
          result: result.error.errors,
        },
      });
    }

    try {
      const existCurrCart = await CarritoComprasModel.getCurrentByUserTienda({
        cve_usuario: result.data.cve_usuario,
        cve_tienda: result.data.cve_tienda,
      });

      if (existCurrCart) {
        return res.status(403).json(
          jsonResponse(403, {
            message: "Existe un carrito pendiente en este cliente",
          })
        );
      }

      const createdCart = await CarritoComprasModel.create({
        cve_usuario: result.data.cve_usuario,
        cve_tienda: result.data.cve_tienda,
      });
      return res.status(201).json(jsonResponse(201, { data: createdCart }));
    } catch (error) {
      console.log(error);
      return res.status(500).json(
        jsonResponse(500, {
          error: error.message,
        })
      );
    }
  }

  static async setItem(req, res) {
    const { tiendaId } = req.params;
    const { id } = req.user;

    const result = validarItemCarritoCompras(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: "Los campos no son validos",
          result: result.error.errors,
        },
      });
    }

    const currCart = await CarritoComprasModel.getCurrentByUserTienda({
      cve_tienda: tiendaId,
      cve_usuario: id,
    });

    if (currCart) {
      try {
        const updatedCart = await CarritoComprasModel.setDetalleVenta({
          input: result.data,
          cve_carrito: currCart.id,
          cve_tienda: tiendaId,
        });

        return res.status(201).json(jsonResponse(201, { data: updatedCart }));
      } catch (error) {
        console.log(error);
        return res.status(500).json(
          jsonResponse(500, {
            error: error.message,
          })
        );
      }
    }

    return res
      .status(404)
      .json(jsonResponse(404, { message: "Cart not found" }));
  }

  static async deleteItem(req, res) {
    const { cartId, itemId } = req.params;

    try {
      const existCart = await CarritoComprasModel.getById({
        cve_carrito: cartId,
      });
      if (existCart) {
        const existProduct = await ProductoModel.getById({
          cve_producto: itemId,
          cve_tienda: existCart.tienda.id,
        });

        if (existProduct) {
          const response = await CarritoComprasModel.deleteItemCarrito({
            cve_carrito: cartId,
            cve_producto: itemId,
          });

          return res.status(200).json(
            jsonResponse(200, {
              response,
            })
          );
        }

        return res
          .status(400)
          .json(jsonResponse(400, { message: "Product not found" }));
      }

      return res
        .status(400)
        .json(jsonResponse(400, { message: "Cart not found" }));
    } catch (error) {
      return res.status(500).json(
        jsonResponse(500, {
          error: error.message,
        })
      );
    }
  }
}
