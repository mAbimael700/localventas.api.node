import Decimal from "decimal.js";
import { pool } from "../database/dbconnect.mjs";
import { ProductoModel } from "./productos.mjs";
import { VentasModel } from "./ventas.mjs";
import { generateId } from "../utils/generateNewId.mjs";

export class CarritoComprasModel {
  static async getById({ cve_carrito }) {
    const query = `SELECT
        cp.cve_carrito_compra AS id,
        JSON_OBJECT
        (
            'id', u.cve_usuario,
            'nombre', CONCAT_WS(' ', p.nombre, p.paterno, p.materno)
        ) AS usuario,
        JSON_OBJECT
        (
            'id', t.cve_tienda,
            'nombre', t.nombre
        ) AS tienda,
        cp.fecha_creacion,
        CASE WHEN SUM(dv.precio) IS NULL THEN 0 ELSE SUM(dv.precio) END AS total,
        CASE WHEN SUM(dv.precio) IS NULL THEN 0 ELSE SUM(dv.precio) END  AS subtotal,
        cp.aplicado
            FROM carrito_compras AS cp
            INNER JOIN usuarios AS u ON u.cve_usuario = cp.cve_usuario
            INNER JOIN tiendas AS t ON t.cve_tienda = cp.cve_tienda
            INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
            LEFT JOIN detalle_venta AS dv ON dv.cve_carrito = cp.cve_carrito_compra
        WHERE cp.cve_carrito_compra = ?
    `;

    try {
      const [result] = await pool.query(query, [parseInt(cve_carrito)]);
      return result;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar el carrito de compras");
    }
  }

  static async getByUser({ cve_usuario, cve_tienda }) {
    const query = `SELECT
        cp.cve_carrito_compra AS id,
        JSON_OBJECT
        (
            'id', u.cve_usuario,
            'nombre', CONCAT_WS(' ', p.nombre, p.paterno, p.materno)
        ) AS usuario,
        JSON_OBJECT
        (
            'id', t.cve_tienda,
            'nombre', t.nombre
        ) AS tienda,
        cp.fecha_creacion,
        cp.aplicado
            FROM carrito_compras AS cp
            INNER JOIN usuarios AS u ON u.cve_usuario = cp.cve_usuario
            INNER JOIN tiendas AS t ON t.cve_tienda = cp.cve_tienda
            INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
        WHERE 
          cp.cve_usuario = ? 
          AND cp.cve_tienda = ?
          AND cp.aplicado = false
        ORDER BY cp.fecha_creacion DESC
        LIMIT 1
    `;

    try {
      const [result] = await pool.query(query, [
        parseInt(cve_usuario),
        parseInt(cve_tienda),
      ]);

      return result;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar el carrito de compras");
    }
  }

  static async getCurrentByUserTienda({ cve_usuario, cve_tienda }) {
    const cartData = await this.getByUser({ cve_usuario, cve_tienda });

    const query = `SELECT
    
      p.cve_producto AS folio, 
      p.existencias AS stock,
      p.nombre, 
      JSON_OBJECT('nombre', c.nombre, 'id', c.cve_categoria) AS categoria,
      JSON_OBJECT('nombre', m.nombre, 'id', m.cve_marca) AS marca,
      p.precio_venta,
      JSON_OBJECT('id', fp.cve_fotografia, 'path', fp.ruta) AS principal_photo,
    dv.cantidad
FROM 
    carrito_compras as cp
    LEFT JOIN detalle_venta AS dv ON dv.cve_carrito = cp.cve_carrito_compra
    LEFT JOIN productos AS p ON p.cve_producto = dv.cve_producto
    LEFT JOIN marcas AS m ON m.cve_marca = p.cve_marca
    LEFT JOIN categorias AS c ON c.cve_categoria = p.cve_categoria
    LEFT JOIN usuarios AS u ON u.cve_usuario = cp.cve_usuario
    LEFT JOIN fotografias_producto AS fp ON fp.cve_producto = p.cve_producto
WHERE 
    cp.cve_carrito_compra = ? 
    AND u.cve_usuario = ?
    AND fp.principal = true
    ;

     `;

    if (cartData) {
      const result = await pool.query(query, [
        parseInt(cartData.id),
        parseInt(cve_usuario),
      ]);

      let cart;

      cart = {
        ...cartData,
        items: result,
      };

      if (result[0]?.folio && result[0].folio === null) {
        cart.items = [];
      }

      return cart;
    }

    return;
    //throw new Error("El carrito no existe");
  }

  static async create({ cve_usuario, cve_tienda }) {
    const query = `INSERT INTO carrito_compras
    (
        cve_carrito_compra,
        cve_usuario,
        cve_tienda,
        fecha_creacion,
        aplicado
    )   VALUES 
    (
        ?,
        ?,
        ?,
        ?,
        ?
    )
    RETURNING *
    `;

    const currentDate = new Date();

    try {
      const newId = await generateId({ table: "carrito_compras" });

      const [result] = await pool.query(query, [
        newId,
        parseInt(cve_usuario),
        parseInt(cve_tienda),
        currentDate,
        false,
      ]);

      return result;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al crear el carrito de compras.");
    }
  }

  static async getDetalleVenta({ cve_carrito, cve_producto, conn = pool }) {
    const getDetalleVentaQuery = `SELECT 
    p.nombre, 
    dv.cantidad,
    dv.precio
    FROM detalle_venta as dv
        INNER JOIN carrito_compras AS cp ON cp.cve_carrito_compra = dv.cve_carrito
        INNER JOIN productos AS p ON p.cve_producto = dv.cve_producto
    WHERE (cp.cve_carrito_compra = ?) AND (p.cve_producto = ?)`;

    const detalleVentaLista = await conn.query(getDetalleVentaQuery, [
      parseInt(cve_carrito),
      parseInt(cve_producto),
    ]);

    return detalleVentaLista;
  }

  static async existeDetalleVenta({ cve_carrito, cve_producto }) {
    const detalleVenta = await this.getDetalleVenta({
      cve_carrito,
      cve_producto,
    });
    return detalleVenta.length > 0;
  }

  static async setDetalleVenta({
    input,
    cve_carrito,
    cve_tienda,
    conn = pool,
  }) {
    const { folio } = input;
    let { cantidad } = input;

    const productoRefExiste = await this.existeDetalleVenta({
      cve_carrito,
      cve_producto: folio,
    });

    const producto = await ProductoModel.getById({
      cve_producto: folio,
      cve_tienda,
    });

    if (cantidad >= producto.stock) {
      cantidad = producto.stock;
    }

    if (!productoRefExiste) {
      const createDetalleVentaQuery = `INSERT INTO detalle_venta
        (
            cve_carrito,
            cve_producto,
            cantidad,
            aplicado,
            precio_unidad
        ) 
        VALUES
        (?, ?, ?, ?, ?) RETURNING *`;

      try {
        const decimalGanancia = new Decimal(producto.ganancia);
        const decimalCantidad = new Decimal(cantidad);
        const decimalGananciaTotal = decimalCantidad
          .times(decimalGanancia)
          .toNumber();

        const [newdetalleVenta] = await conn.query(createDetalleVentaQuery, [
          cve_carrito,
          folio,
          cantidad,
          true,
          producto.precio,
        ]);

        return newdetalleVenta;
      } catch (error) {
        console.log(error);
        if (conn.rollback) {
          conn.rollback();
        }

        throw new Error(
          `No se pudo crear el detalle venta del producto de la clave: ${folio}`
        );
      }
    }

    const setCantidadQuery = `UPDATE detalle_venta as dv SET dv.cantidad = ? 
        WHERE (dv.cve_carrito = ?) AND (dv.cve_producto = ?)`;

    try {
      await conn.query(setCantidadQuery, [cantidad, cve_carrito, folio]);

      return "Detalle actualizado.";
    } catch (error) {
      if (conn.rollback) {
        conn.rollback();
      }
      throw new Error(
        `No se pudo crear el detalle venta del producto de la clave: ${folio}`
      );
    }
  }

  static async deleteItemCarrito({ cve_carrito, cve_producto }) {
    const query = `DELETE FROM detalle_venta WHERE cve_carrito = ? AND cve_producto = ?;`;

    try {
      const result = await pool.query(query, [
        parseInt(cve_carrito),
        parseInt(cve_producto),
      ]);

      return "Item deleted";
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al eliminar el item del carrito");
    }
  }
}
