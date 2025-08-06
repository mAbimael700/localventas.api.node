import { VentasModel } from "./ventas.mjs";
import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";

export class AbonosModel {
  static async getAllByTienda({ tiendaId, params }) {
    const { cve_usuario } = params || {};

    let getAbonosQuery = `SELECT 
      v.cve_venta AS folio_venta,
      a.cve_abono AS folio_pago,
      mp.nombre AS metodo_pago,
      JSON_OBJECT('nombre',  CONCAT_WS(" ", vend.nombre, vend.paterno, vend.materno), 'id', vendu.cve_usuario, 'correo_electronico', vend.correo_electronico) as vendedor_registro,
      vendu.correo_electronico AS email_vendedor,
      a.monto,
      a.fecha
        FROM abonos AS a
          INNER JOIN ventas_abonos AS va ON va.cve_abono = a.cve_abono
          INNER JOIN ventas AS v ON v.cve_venta = va.cve_venta
          INNER JOIN metodos_pago AS mp ON mp.cve_metodo_pago = a.cve_metodo_pago
          INNER JOIN usuarios AS vendu ON vendu.cve_usuario = a.cve_vendedor_registro
          INNER JOIN personas AS vend ON vend.cve_persona = vendu.cve_usuario 
          INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
        WHERE t.cve_tienda = ?`;

    try {
      let queryParams = [parseInt(tiendaId)];

      if (cve_usuario) {
        getAbonosQuery = getAbonosQuery.concat(
          " AND a.cve_vendedor_registro = ?"
        );
        queryParams.push([parseInt(cve_usuario)]);
      }

      const result = await pool.query(getAbonosQuery, queryParams);

      return result;
    } catch (error) {
      throw new Error("Hubo un error al consultar los abonos de esta venta.");
    }
  }

  static async getAllByVenta({ ventaId }) {
    const getAbonosQuery = `SELECT 
      v.cve_venta AS folio_venta,
      a.cve_abono AS folio_pago,
      mp.nombre AS metodo_pago,
      JSON_OBJECT('nombre',  CONCAT_WS(" ", vend.nombre, vend.paterno, vend.materno), 'id', vendu.cve_usuario, 'correo_electronico', vend.correo_electronico) as vendedor_registro,
      a.monto,
      a.fecha
      FROM abonos AS a
        INNER JOIN ventas_abonos AS va ON va.cve_abono = a.cve_abono
        INNER JOIN ventas AS v ON v.cve_venta = va.cve_venta
        INNER JOIN metodos_pago AS mp ON mp.cve_metodo_pago = a.cve_metodo_pago
        INNER JOIN usuarios AS vendu ON vendu.cve_usuario = a.cve_vendedor_registro
        INNER JOIN personas AS vend ON vend.cve_persona = vendu.cve_usuario 
      WHERE va.cve_venta = ?`;

    try {
      const abonos = await pool.query(getAbonosQuery, [parseInt(ventaId)]);

      return abonos;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar los abonos de esta venta.");
    }
  }

  static async create({ input }) {
    const {
      cve_venta,
      cve_metodo_pago,
      cve_vendedor,
      monto,
      fecha,
      cve_tienda,
    } = input;

    const newAbonoId = await generateId({ table: "abonos" });

    const newAbonoQuery = `INSERT INTO abonos (cve_abono, cve_metodo_pago, cve_vendedor_registro, monto, fecha)
        VALUES (?, ?, ?, ?, ?) RETURNING *`;

    const newAbono = await pool.query(newAbonoQuery, [
      newAbonoId,
      cve_metodo_pago,
      cve_vendedor,
      monto,
      fecha,
    ]);

    const detalleAbonoQuery = `INSERT INTO ventas_abonos (cve_venta, cve_abono)
        VALUES (?, ?) RETURNING *`;

    await pool.query(detalleAbonoQuery, [cve_venta, newAbonoId]);

    await this.getSumAbonos({ cve_venta, cve_tienda });

    return { abono: newAbono[0], cve_venta, message: "Abono realizado." };
  }

  static async getSumAbonos({ cve_venta, cve_tienda }) {
    const venta = await VentasModel.getbyId({ id: cve_venta, cve_tienda });
    const totalVentaValue = venta.total;
    const abonosTotalesQuery = `SELECT SUM(a.MONTO) as pagos FROM abonos AS a
            INNER JOIN ventas_abonos AS va ON va.CVE_ABONO = a.CVE_ABONO
            INNER JOIN ventas AS v ON v.CVE_VENTA = va.CVE_VENTA
        WHERE v.CVE_VENTA = ?`;

    const abonosTotales = await pool.query(abonosTotalesQuery, [cve_venta]);

    if (abonosTotales[0].pagos === totalVentaValue) {
      const changeStatusVentaQuery = `UPDATE ventas SET pagado = ? WHERE cve_venta = ?`;

      await pool.query(changeStatusVentaQuery, [true, cve_venta]);
      return { message: "Total de la venta pagado." };
    }
  }
}
