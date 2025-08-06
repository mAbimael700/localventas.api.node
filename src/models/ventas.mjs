import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { setClause } from "../utils/setClauses.mjs";
import { ProductoModel } from "./productos.mjs";
import Decimal from "decimal.js";

export class VentasModel {
  static async getAll({ tiendaId, params }) {
    const { cve_usuario } = params || {};

    let ventasQuery = `SELECT
    v.cve_venta AS folio,
    JSON_OBJECT('nombre', CONCAT_WS(" ", vend.nombre, vend.paterno, vend.materno), 'correo_electronico', vend.correo_electronico, 'id',  vend.cve_persona ) AS vendedor,
    JSON_OBJECT('nombre', CONCAT_WS(" ", cli.nombre, cli.paterno, cli.materno), 'correo_electronico', cli.correo_electronico, 'id', cli.cve_persona ) AS cliente,
    v.fecha_venta,
    v.pagado AS estado,
    CASE WHEN v.cve_direccion_entrega IS NOT NULL THEN
        JSON_OBJECT(
            'id', dir.cve_direccion,
            'pais', JSON_OBJECT('id', p.cve_pais, 'nombre', p.nombre),
            'estado', JSON_OBJECT('id', est.cve_estado, 'nombre', est.nombre),
            'calle', dir.calle,
            'numInt', dir.numInt,
            'numExt', dir.numExt,
            'codigo_postal', dir.codigo_postal,
            'ciudad', dir.ciudad,
            'colonia', dir.colonia
        ) 
    END AS direccion,
    CASE WHEN SUM(a.monto) IS NULL THEN v.total ELSE v.total - SUM(a.monto) END AS deuda,
    v.total,
    v.subtotal
FROM ventas AS v
INNER JOIN personas AS vend ON vend.cve_persona = v.cve_vendedor
LEFT JOIN personas AS cli ON cli.cve_persona = v.cve_cliente
LEFT JOIN ventas_abonos AS va ON va.cve_venta = v.cve_venta
LEFT JOIN abonos AS a ON a.cve_abono = va.cve_abono
LEFT JOIN direcciones AS dir ON dir.cve_direccion = v.cve_direccion_entrega -- Cambio a LEFT JOIN aquí
LEFT JOIN estados AS est ON est.cve_estado = dir.cve_estado
LEFT JOIN paises AS p ON p.cve_pais = est.cve_pais
WHERE v.cve_tienda = ?

    `;

    let queryParams = [parseInt(tiendaId)];
    let result;

    if (cve_usuario) {
      ventasQuery = ventasQuery.concat(` AND v.cve_vendedor = ? `);
      queryParams.push(parseInt(cve_usuario));
    }

    ventasQuery =
      ventasQuery.concat(` GROUP BY v.cve_venta, vend.nombre, vend.paterno, vend.materno, vend.correo_electronico, cli.nombre, cli.correo_electronico, v.fecha_venta, v.pagado, v.total, v.subtotal
    ORDER BY v.fecha_venta DESC`);

    result = await pool.query(ventasQuery, queryParams);

    let ventasArray = [];

    for (const venta of result) {
      const detalles = await this.getAllDetalleVenta({
        cve_venta: venta.folio,
        cve_tienda: tiendaId,
      });
      ventasArray.push({ ...venta, productos: detalles.productos });
    }

    return ventasArray;
  }

  static async getbyId({ id, cve_tienda }) {
    const ventaQuery = `SELECT
    v.cve_venta AS folio,
    JSON_OBJECT('id', t.cve_tienda, 'nombre', t.nombre) AS tienda,
    JSON_OBJECT('nombre', CONCAT_WS(" ", vend.nombre, vend.paterno, vend.materno), 'correo_electronico', vend.correo_electronico, 'id', vend.cve_persona ) AS vendedor,
    JSON_OBJECT('nombre', CONCAT_WS(" ", cli.nombre, cli.paterno, cli.materno), 'correo_electronico', cli.correo_electronico, 'id', cli.cve_persona ) AS cliente,
    v.descripcion,
    v.fecha_venta,
    v.pagado AS estado,
    CASE WHEN v.cve_direccion_entrega IS NOT NULL THEN
        JSON_OBJECT(
            'id', dir.cve_direccion,
            'pais', JSON_OBJECT('id', p.cve_pais, 'nombre', p.nombre),
            'estado', JSON_OBJECT('id', est.cve_estado, 'nombre', est.nombre),
            'calle', dir.calle,
            'numInt', dir.numInt,
            'numExt', dir.numExt,
            'codigo_postal', dir.codigo_postal,
            'ciudad', dir.ciudad,
            'colonia', dir.colonia
        ) 
    END AS direccion,
    CASE WHEN SUM(a.monto) IS NULL THEN v.total ELSE v.total - SUM(a.monto) END AS deuda,
    v.total,
    CASE WHEN (v.subtotal) IS NULL THEN 0 ELSE v.subtotal END AS subtotal
      FROM ventas AS v
        INNER JOIN personas AS vend ON vend.cve_persona = v.cve_vendedor
        INNER JOIN usuarios AS vendUser ON vendUser.cve_usuario = v.cve_vendedor
        INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
        LEFT JOIN usuarios AS cliUser ON cliUser.cve_usuario = v.cve_cliente
        LEFT JOIN personas AS cli ON cli.cve_persona = v.cve_cliente
        LEFT JOIN ventas_abonos AS va ON va.cve_venta = v.cve_venta
        LEFT JOIN abonos AS a ON a.cve_abono = va.cve_abono
        LEFT JOIN direcciones AS dir ON dir.cve_direccion = v.cve_direccion_entrega -- Cambio a LEFT JOIN aquí
        LEFT JOIN estados AS est ON est.cve_estado = dir.cve_estado
        LEFT JOIN paises AS p ON p.cve_pais = est.cve_pais
    WHERE v.cve_venta = ? AND v.cve_tienda = ?
    GROUP BY v.cve_venta, vend.nombre, vend.paterno, vend.materno, vendUser.correo_electronico, cli.nombre, cliUser.correo_electronico, v.fecha_venta, v.pagado, v.total, v.subtotal
    ORDER BY v.fecha_venta DESC
    `;

    const venta = await pool.query(ventaQuery, [
      parseInt(id),
      parseInt(cve_tienda),
    ]);

    return venta[0];
  }

  static async getCountVentas({ cve_tienda }) {
    let query = `SELECT COUNT(v.cve_venta) as cantidad
      FROM ventas AS v
        INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
      WHERE (t.cve_tienda = ?) AND (v.fecha_venta >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
      `;

    try {
      const cantidad = await pool.query(query, [parseInt(cve_tienda)]);
      if (cantidad.length > 0) return cantidad[0].cantidad.toString();
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar las ventas.");
    }
  }

  static async getAllDetalleVenta({ cve_venta, cve_tienda }) {
    const detalleVentaQuery = `SELECT
      v.cve_venta,
      p.cve_producto as folio,
      p.nombre as producto,
      m.nombre as marca,
      fp.ruta as principal_photo,
      c.nombre as categoria,
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
    WHERE (v.cve_venta = ?) AND (v.cve_tienda = ?) AND (fp.principal = true)
    `;

    const detalleVenta = await pool.query(detalleVentaQuery, [
      parseInt(cve_venta),
      parseInt(cve_tienda),
    ]);
    const datosVenta = await this.getbyId({ id: cve_venta, cve_tienda });

    if (datosVenta === undefined) return [];

    return { venta: datosVenta, productos: detalleVenta };
  }

  static async getGanancias({ cve_tienda, params }) {
    let query = `SELECT SUM(dv.ganancia) as ganancia
      FROM detalle_venta AS dv
        INNER JOIN ventas AS v ON v.cve_venta = dv.cve_venta
        INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
      WHERE (t.cve_tienda = ?) AND (v.fecha_venta >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
      `;

    try {
      const ganancias = await pool.query(query, [parseInt(cve_tienda)]);
      console.log(ganancias);
      if (ganancias.length > 0) return ganancias[0];
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar las ganancias.");
    }
  }

  static async getTotalVentas({ cve_tienda, params }) {
    let query = `SELECT COUNT(v.cve_venta) AS no_ventas
      FROM ventas AS v
        INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
      WHERE (t.cve_tienda = ?) AND (v.fecha_venta >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) 
      `;

    try {
      const noVentas = await pool.query(query, [parseInt(cve_tienda)]);

      if (noVentas.length > 0) return noVentas[0];
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar las ventas.");
    }
  }

  static async create({ input }) {
    const conn = await pool.getConnection();

    const {
      descripcion,
      cve_vendedor,
      cve_cliente,
      cve_tienda,
      fecha_venta,
      total,
      subtotal,
      productos,
    } = input;

    let values = [
      "cve_venta",
      "cve_vendedor",
      "cve_tienda",
      "fecha_venta",
      "pagado",
      "aplicado",
    ];

    let createValues = [
      cve_vendedor,
      cve_tienda,
      new Date(fecha_venta),
      false,
      true,
    ];

    if (cve_cliente) {
      values.push("cve_cliente");
      createValues.push(cve_cliente);
    }

    if (descripcion) {
      values.push("descripcion");
      createValues.push(descripcion);
    }

    if (total) {
      values.push("total");
      createValues.push(total);
    }

    let placeholders = values.map((e, i) =>
      i !== values.length - 1 ? "?, " : "?"
    );

    let query = `INSERT INTO ventas 
    (${values.join(", ")})
    VALUES (${placeholders.join("")}) RETURNING *`;

    conn.beginTransaction();

    try {
      const newVentaId = await generateId({ table: "ventas" });
      const newVenta = await conn.query(query, [newVentaId, ...createValues]);

      if (productos) {
        const insertedProductos = await Promise.all(
          productos.map(async (producto) => {
            const detalleVentas = await this.createDetalleVenta({
              input: producto,
              cve_venta: newVentaId,
              cve_tienda: cve_tienda,
              conn: conn,
            });
            return detalleVentas;
          })
        );

        conn.commit();
        return { venta: newVenta, detalles_venta: insertedProductos };
      } else if (total && subtotal) {
        const insertTotalQuery = `UPDATE ventas SET (total = ?, subtotal = ?) WHERE (cve_venta = ?)`;

        await conn.query(insertTotalQuery, [total, subtotal, newVentaId]);
        const newVenta = await this.getbyId({ id: newVentaId });
        conn.commit();
        return { venta: newVenta };
      }

      conn.commit();

      return { venta: newVenta };
    } catch (error) {
      console.log(error);
      conn.rollback();
      throw new Error("Error al registrar la venta...");
    }
  }

  static async createDetalleVenta({
    input,
    cve_venta,
    cve_tienda,
    conn = pool,
  }) {
    const { cve_producto, cantidad } = input;

    const productoRefExiste = await this.existeDetalleVenta({
      cve_venta,
      cve_producto,
    });

    const producto = await ProductoModel.getById({ cve_producto, cve_tienda });

    if (!productoRefExiste) {
      const createDetalleVentaQuery = `INSERT INTO detalle_venta
        (CVE_VENTA, CVE_PRODUCTO, CANTIDAD, APLICADO, PRECIO_UNIDAD, GANANCIA) VALUES
        (?, ?, ?, ?, ?, ?) RETURNING *`;

      try {
        const decimalGanancia = new Decimal(producto.ganancia);
        const decimalCantidad = new Decimal(cantidad);
        const decimalGananciaTotal = decimalCantidad.times(decimalGanancia);

        const newdetalleVenta = await conn.query(createDetalleVentaQuery, [
          cve_venta,
          cve_producto,
          cantidad,
          true,
          producto.precio,
          decimalGananciaTotal.toNumber(),
        ]);

        return newdetalleVenta[0];
      } catch (error) {
        console.log(error);
        conn.rollback();
        throw new Error(
          `No se pudo crear el detalle venta del producto de la clave: ${cve_producto}`
        );
      }
    }

    const detalleVenta = await this.getDetalleVenta({
      cve_venta,
      cve_producto,
      conn: conn,
    });

    const currentCantidad = new Decimal(detalleVenta[0].cantidad);
    const addedCantidad = new Decimal(cantidad);
    const newCantidad = currentCantidad.add(addedCantidad).toNumber();

    const setCantidadQuery = `UPDATE detalle_venta as dv SET dv.cantidad = ? 
        WHERE (dv.cve_venta = ?) AND (dv.cve_producto = ?)`;

    try {
      await conn.query(setCantidadQuery, [
        newCantidad,
        cve_venta,
        cve_producto,
      ]);
    } catch (error) {
      conn.rollback();
      throw new Error(
        `No se pudo crear el detalle venta del producto de la clave: ${cve_producto}`
      );
    }
  }

  static async getDetalleVenta({ cve_venta, cve_producto, conn = pool }) {
    const getDetalleVentaQuery = `SELECT v.cve_venta, p.nombre, dv.cantidad, dv.precio FROM detalle_venta as dv
        INNER JOIN ventas AS v ON v.cve_venta = dv.cve_venta
        INNER JOIN productos AS p ON p.cve_producto = dv.cve_producto
    WHERE (v.cve_venta = ?) AND (p.cve_producto = ?)`;

    const detalleVentaLista = await conn.query(getDetalleVentaQuery, [
      cve_venta,
      cve_producto,
    ]);

    return detalleVentaLista;
  }

  static async obtenerSumaTotalDetalleVentaPorVenta({ cve_venta }) {
    const sumTotalQuery = `SELECT SUM(dv.precio) FROM detalle_venta AS dv
        INNER JOIN ventas AS v ON v.cve_venta = dv.cve_venta
    WHERE (v.cve_venta = ?)`;

    const sumaTotal = await pool.query(sumTotalQuery, [cve_venta]);

    return sumaTotal[0];
  }

  static async existeDetalleVenta({ cve_venta, cve_producto }) {
    const detalleVenta = await this.getDetalleVenta({
      cve_venta,
      cve_producto,
    });
    return detalleVenta.length > 0;
  }

  static async calcularPrecioPorDetalleVenta({ cve_venta }) {
    const conn = await pool.getConnection();

    try {
      conn.beginTransaction();

      const detalleVentaLista = await this.getAllDetalleVenta({ cve_venta });

      await Promise.all(
        detalleVentaLista.map(async (e) => {
          const producto = await ProductoModel.getById({
            cve_producto: e.cve_producto,
          });

          const precioProducto = new Decimal(producto.precio_venta);

          const precioDetalleVenta = precioProducto
            .times(new Decimal(e.cantidad))
            .toNumber();

          const setDetalleVentaPrecioQuery = `UPDATE detalle_venta AS dv SET (precio = ?) WHERE (dv.cve_producto = ?)`;

          await conn.query(setDetalleVentaPrecioQuery, [
            precioDetalleVenta,
            e.cve_producto,
          ]);
        })
      );

      await conn.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
