import { jsonResponse } from "../lib/json-response.mjs";
import { AbonosModel } from "../models/abonos.mjs";
import { RolesModel } from "../models/roles.mjs";
import { VentasModel } from "../models/ventas.mjs";
import { validarAbono } from "../schemas/abonos-schema.mjs";

export class AbonosController {
  static async getAllByTienda(req, res) {
    const { tiendaId } = req.params;
    try {
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
            data = await AbonosModel.getAllByTienda({
              tiendaId: tiendaId,
              params: { cve_usuario: userRequestId },
            });
          } else {
            data = await AbonosModel.getAllByTienda({
              tiendaId: tiendaId,
            });
          }

          if (data.length === 0)
            return res.status(404).json(
              jsonResponse(404, {
                message: "No se encontraron abonos en esta tienda",
              })
            );

          return res.status(200).json(jsonResponse(200, { data }));
        }

        return res
          .status(401)
          .json({ message: "Debes iniciar sesión para recibir los datos" });
      }

      return res
        .status(404)
        .json({ message: "Debes ingresar la referencia de la tienda." });
    } catch (error) {
      console.log(error);
      res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async getAllByVenta(req, res) {
    const { ventaId } = req.params;

    try {
      const abonos = await AbonosModel.getAllByVenta({ ventaId: ventaId });

      if (abonos.length === 0)
        return res.status(404).json(
          jsonResponse(404, {
            message: "No se encontraron abonos en este producto",
          })
        );

      res.status(200).json(jsonResponse(200, { data: abonos }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async create(req, res) {
    const result = await validarAbono(req.body);

    if (!result.success)
      return res.status(400).json({ error: JSON.parse(result.error.message) });

    const currentMonto = result.data.monto;
    const venta = await VentasModel.getbyId({
      id: result.data.cve_venta,
      cve_tienda: result.data.cve_tienda,
    });

    if (currentMonto > venta.deuda) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message:
            "El monto ingresado supera la deuda a pagar de la venta.",
        })
      );
    }

    const newAbono = await AbonosModel.create({
      input: result.data,
    });

    res.status(201).json(jsonResponse(201, { data: newAbono }));
  }
}
