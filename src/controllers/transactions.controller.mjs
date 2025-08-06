import { jsonResponse } from "../lib/json-response.mjs";
import { TransactionModel } from "../models/transaction.mjs";
import { validateTransactionSchema } from "../schemas/transaction-schema.mjs";

export class TransactionsController {
  static async getTransactionsById(req, res) {
    const { transactionId } = req.params;
    const { id } = req.user;

    try {
      const result = await TransactionModel.getTransactionsById({
        cve_transaction: transactionId,
      });

      if (!result) {
        return res
          .status(404)
          .json(
            jsonResponse(404, { message: "No existe una compra con ese id." })
          );
      }

      if (result.venta.cliente.id === id) {
        return res.status(200).json(jsonResponse(200, { data: result }));
      }

      return res.status(403).json(
        jsonResponse(403, {
          message: "No tienes permiso para ver esta compra.",
        })
      );
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async getTransactionsByUser(req, res) {
    const { id } = req.user;

    try {
      const result = await TransactionModel.getTransactionsByUser({
        cve_usuario: id,
      });

      if (result.length === 0) {
        return res.status(400).json(
          jsonResponse(400, {
            message: "No se encontraron compras realizadas por este usuario",
          })
        );
      }

      return res.status(200).json(jsonResponse(200, { data: result }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async create(req, res) {
    const result = validateTransactionSchema(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error: result.error.errors,
          message: "Los datos ingresados no son los correctos",
        })
      );
    }

    try {
      const createdTransaction = await TransactionModel.create({
        input: result.data,
      });

      return res.status(201).json(
        jsonResponse(201, {
          data: createdTransaction,
          message: "Compra realizada correctamente.",
        })
      );
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }
}
