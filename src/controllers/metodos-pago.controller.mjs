import { jsonResponse } from "../lib/json-response.mjs";
import { MetodosPagoModel } from "../models/metodos-pago.mjs";

export class MetodosPagoController {
  static async getMetodosPago(req, res) {
    const response = await MetodosPagoModel.getMetodosPago();

    if (response.length === 0) {
      return res
        .status(404)
        .json(
          jsonResponse(404, { message: "Metodos de pago no encontrados." })
        );
    }

    res.status(200).json(
      jsonResponse(200, {
        data: response,
      })
    );
  }
}
