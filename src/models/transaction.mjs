import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { CarritoComprasModel } from "./carrito-compras.mjs";
import { TiendasModel } from "./tiendas.mjs";
import { VentasModel } from "./ventas.mjs";

export class TransactionModel {
  static async getTransactionsById({ cve_transaction }) {
    const detalleVentaQuery = `SELECT
          JSON_OBJECT('id', t.cve_tienda, 'nombre', t.nombre) AS tienda,
          p.cve_producto as folio,
          p.nombre as producto,
          JSON_OBJECT ('id', m.cve_marca,'nombre', m.nombre) as marca,
          fp.ruta as principal_photo,
          JSON_OBJECT ('id', c.cve_categoria,'nombre', c.nombre) as categoria,
          p.precio_venta as precio,
          dv.cantidad,  
          dv.precio as total
        FROM detalle_venta as dv
            INNER JOIN ventas as v ON v.CVE_VENTA = dv.CVE_VENTA
            INNER JOIN productos as p ON p.cve_producto = dv.cve_producto
            INNER JOIN marcas as m ON m.cve_marca = p.cve_marca
            INNER JOIN categorias as c ON c.cve_categoria = p.cve_categoria
            INNER JOIN fotografias_producto AS fp ON fp.cve_producto = p.cve_producto
            INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
            
        WHERE (v.cve_venta = ?) AND (fp.principal = true)
        `;

    try {
      const detalleVenta = await pool.query(detalleVentaQuery, [
        parseInt(cve_transaction),
      ]);

      const datosVenta = await VentasModel.getbyId({
        id: cve_transaction,
        cve_tienda: detalleVenta.tienda?.id,
      });

      if (!datosVenta) return undefined;

      return { venta: datosVenta, productos: detalleVenta };
    } catch (error) {
      throw new Error("Error al consultar la compra");
    }
  }

  static async getTransactionsByUser({ cve_usuario }) {
    const query = ` SELECT 
        v.cve_venta AS id,
        JSON_OBJECT('id', v.cve_cliente, 'nombre', CONCAT_WS(' ', cli.nombre, cli.paterno, cli.materno)) AS cliente,
        JSON_OBJECT('id', v.cve_tienda, 'nombre', t.nombre) AS tienda
        v.cve_direccion_entrega,
        v.total,
        v.subtotal,
        v.estado
            FROM ventas AS v
                INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
            WHERE v.cve_cliente = ?
        `;

    try {
      const result = await pool.query(query, [cve_usuario]);

      const transactions = result.map(async (transaction) => {
        const direccion_entrega = await TiendasModel.getDireccionById({
          cve_direccion: result.cve_direccion_entrega,
          cve_tienda: result.tienda.id,
        });

        transaction.direccion_entrega = direccion_entrega;
      });

      return transactions;
    } catch (error) {
      throw new Error("Hubo un error al consultar las compras del usuario");
    }
  }

  static async create({ input }) {
    const { cve_carrito, cve_cliente, cve_tienda, cve_direccion_entrega } =
      input;

    const query = `INSERT INTO ventas 
    (
        cve_venta,
        cve_cliente,
        cve_tienda,
        cve_direccion_entrega,
        fecha_venta,
        pagado,
        subtotal,
        total,
        estado
    )   VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
    ) RETURNING *`;

    try {
      const newVentaId = await generateId({ table: "ventas" });
      const cartData = await CarritoComprasModel.getById({ cve_carrito });
      const dateTransaction = new Date();

      const { total, subtotal } = cartData;

      const params = [
        newVentaId,
        cve_cliente,
        cve_tienda,
        cve_direccion_entrega,
        dateTransaction,
        false,
        subtotal,
        total,
        "Pendiente",
      ];

      const [result] = await pool.query(query, params);

      const detalleVentaUpdateQuery = `UPDATE detalle_venta SET cve_venta = ? WHERE cve_carrito = ?`;
      
      await pool.query(detalleVentaUpdateQuery, [
        newVentaId,
        parseInt(cve_carrito),
      ]);

      return result;
    } catch (error) {
      console.log("Hubo un error al crear el carrito.", error);
      throw new Error("Hubo un error al crear la transacción del carrito.");
    }
  }
}
