import { pool } from "../database/dbconnect.mjs";
import { setClause } from "../utils/setClauses.mjs";
import { VentasModel } from "./ventas.mjs";

export class PedidosModel {
  static async getAllByTienda({ cve_tienda, params }) {
    const { cve_usuario, estado_entrega } = params || {};

    let ventasQuery = `SELECT DISTINCT
      v.cve_venta AS folio,
      JSON_OBJECT('id', vend.cve_persona, 'nombre', CONCAT_WS(" ", vend.nombre, vend.paterno, vend.materno), 'correo_electronico', vend.correo_electronico) AS vendedor,
      JSON_OBJECT('id', cli.cve_persona, 'nombre', CONCAT_WS(" ", cli.nombre, cli.paterno, cli.materno), 'correo_electronico', cli.correo_electronico) AS cliente,     
      v.fecha_venta,
      v.pagado AS estado,
      v.estado_entrega,
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
      ) AS direccion,
      v.total,
      v.subtotal
    FROM ventas AS v
      INNER JOIN personas AS vend ON vend.cve_persona = v.cve_vendedor
      LEFT JOIN personas AS cli ON cli.cve_persona = v.cve_cliente
      INNER JOIN direcciones AS dir ON dir.cve_direccion = v.cve_direccion_entrega
      INNER JOIN estados AS est ON est.cve_estado = dir.cve_estado
      INNER JOIN paises AS p ON p.cve_pais = est.cve_pais
    WHERE (v.cve_tienda = ?) AND v.cve_direccion_entrega IS NOT NULL;
`;

    let queryParams = [parseInt(cve_tienda)];
    let result;

    if (cve_usuario) {
      ventasQuery = ventasQuery.concat(` AND v.cve_vendedor = ? `);
      queryParams.push(parseInt(cve_usuario));
    }

    if (estado_entrega) {
      ventasQuery = ventasQuery.concat(` AND v.estado = ? `);
      queryParams.push(parseInt(estado_entrega));
    }

    /* ventasQuery = ventasQuery.concat(` GROUP BY 
    v.cve_venta,
    v.fecha_venta,
    v.pagado,
    v.estado_entrega,
    v.total,
    v.subtotal
        ORDER BY v.fecha_venta DESC`); */

    try {
      result = await pool.query(ventasQuery, queryParams);

      let ventasArray = [];

      for (const venta of result) {
        const detalles = await VentasModel.getAllDetalleVenta({
          cve_venta: venta.folio,
          cve_tienda: cve_tienda,
        });

        ventasArray.push({ ...venta, productos: detalles.productos });
      }

      return ventasArray;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar los pedidos de la tienda");
    }
  }

  static async getbyId({ cve_venta }) {
    const ventaQuery = `SELECT
    v.cve_venta AS folio,
    JSON_OBJECT('nombre', CONCAT_WS(" ", vend.nombre, vend.paterno, vend.materno), 'correo_electronico', vendUser.correo_electronico, 'id', vendUser.cve_usuario ) AS vendedor,
    JSON_OBJECT('nombre', CONCAT_WS(" ", cli.nombre, cli.paterno, cli.materno), 'correo_electronico', cliUser.correo_electronico, 'id', cliUser.cve_usuario ) AS cliente,
    v.fecha_venta,
    v.pagado AS estado,
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
    WHERE v.cve_venta = ?
    `;

    try {
      const pedido = await pool.query(ventaQuery, [parseInt(cve_venta)]);

      return pedido[0];
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al acceder al pedido");
    }
  }

  static async create({ input }) {
    const { cve_direccion_entrega, cve_venta, estado_entrega } = input;
    let query = `UPDATE ventas AS v SET cve_direccion_entrega = ?, estado_entrega = ? WHERE v.cve_venta = ?`;

    try {
      await pool.query(query, [
        parseInt(cve_direccion_entrega),
        estado_entrega,
        parseInt(cve_venta),
      ]);

      const pedidoUpdated = this.getbyId({ cve_venta });
      return pedidoUpdated;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al crear el pedido");
    }
  }

  static async update({ input, cve_venta }) {
    try {
      const updateClauses = setClause(input);
      const updateQuery = `UPDATE ventas AS v SET ${updateClauses} WHERE (v.cve_venda = ?)`;

      await pool.query(updateQuery, [
        ...Object.values(input),
        parseInt(cve_venta),
      ]);

      return;

      /* const updatedMarca = await this.getById({ cve_marca: cve_marca, cve_tienda });

      return updatedMarca; */
    } catch (error) {
      console.log(error);
      throw new Error(
        "Hubo un error al actualizar el pedido en la base de datos"
      );
    }
  }
}
