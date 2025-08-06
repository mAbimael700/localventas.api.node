import { jsonResponse } from "../lib/json-response.mjs";
import { RolesModel } from "../models/roles.mjs";
import { VentasModel } from "../models/ventas.mjs";
import { validarVenta } from "../schemas/ventas-schemas.mjs";

export class VentasController {
  static async getAll(req, res) {
    const { tiendaId } = req.params;

    if (tiendaId) {
      if (req.user) {
        const { id: userRequestId } = req.user;

        const userRol = await RolesModel.getRolTiendaByUser({
          cve_tienda: tiendaId,
          cve_usuario: userRequestId,
        });

        if (!userRol)
          return res.status(401).json(
            jsonResponse(401, {
              message: "Usuario no autorizado.",
            })
          );

        let data;

        if (userRol.nombre !== "emprendedor") {
          data = await VentasModel.getAll({
            tiendaId: tiendaId,
            params: { cve_usuario: userRequestId },
          });
        } else {
          data = await VentasModel.getAll({ tiendaId: tiendaId });
        }

        if (data.length === 0)
          return res.status(400).json({
            message: "No se encontrarón ventas referentes a esta tienda.",
          });

        return res.status(200).json(jsonResponse(200, { data }));
      }
      return res.status(404).json({ message: "Debes iniciar sesión." });
    }

    return res
      .status(404)
      .json({ message: "Debes ingresar la referencia de la tienda." });
  }

  static async getById(req, res) {
    const { ventaId } = req.params;

    const data = await VentasModel.getbyId({ id: ventaId });

    if (data.length === 0)
      return res
        .status(404)
        .json(jsonResponse(404, { message: "Venta no encontrada." }));

    return res.status(200).json(jsonResponse(200, { data }));
  }

  static async getDetallesById(req, res) {
    const { ventaId, tiendaId } = req.params;

    const data = await VentasModel.getAllDetalleVenta({
      cve_venta: ventaId,
      cve_tienda: tiendaId,
    });

    if (data.length === 0)
      return res
        .status(404)
        .json(jsonResponse(404, { message: "Venta no encontrada." }));

    if (req.user) {
      const { id: userRequestId } = req.user;
      const rol = await RolesModel.getRolTiendaByUser({
        cve_usuario: userRequestId,
        cve_tienda: tiendaId,
      });

      if (rol.nombre !== "emprendedor") {
        if (data.venta.vendedor.id === userRequestId) {
          return res.status(200).json(jsonResponse(201, { data }));
        }

        return res.status(403).json(jsonResponse(403, {message: 'No tienes permisos para ver esta venta'}))
      }

      return res.status(200).json(jsonResponse(201, { data }));
    }
  }

  static async getGanancias(req, res) {
    const { ventaId, tiendaId } = req.params;

    try {
      const data = await VentasModel.getGanancias({
        cve_tienda: tiendaId,
      });

      if (!data)
        return res
          .status(404)
          .json(jsonResponse(404, { message: "Venta no encontrada." }));

      return res.status(200).json(jsonResponse(200, { data }));
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async getCantidad(req, res) {
    const { tiendaId } = req.params;

    try {
      const data = await VentasModel.getCountVentas({
        cve_tienda: tiendaId,
      });

      if (!data)
        return res
          .status(404)
          .json(jsonResponse(404, { message: "Venta no encontrada." }));

      return res
        .status(200)
        .json(jsonResponse(200, { data: { cantidad: data } }));
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async create(req, res) {
    const result = validarVenta(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: JSON.parse(result?.error.message),
      });
    }

    try {
      const newVenta = await VentasModel.create({
        input: result.data,
      });

      res.status(201).json(jsonResponse(201, { data: newVenta }));
    } catch (error) {
      console.log(error);
      res.status(500).json(
        jsonResponse(500, {
          error_message:
            "Hubo un error en la base de datos, intente más tarde...",
        })
      );
    }
  }
}
