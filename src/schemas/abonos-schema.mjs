import { z } from "zod";
import { pool } from "../database/dbconnect.mjs";

const abonosSchema = z.object({
  cve_tienda: z
    .number()
    .int()
    .positive()
    .min(1)
    .refine(async (id) => {
      const query = `SELECT cve_tienda FROM tiendas WHERE (cve_tienda = ?)`;
      const venta = await pool.query(query, [id]);
      if (venta.length > 0) return venta[0].cve_tienda;
    }),
  cve_vendedor: z.number().min(1).int().positive(),
  cve_venta: z
    .number()
    .min(1)
    .int()
    .positive()
    .refine(async (id) => {
      const query = `SELECT cve_venta FROM ventas WHERE (cve_venta = ?)`;
      const venta = await pool.query(query, [id]);
      if (venta.length > 0) return venta[0].cve_venta;
    }),
  cve_metodo_pago: z
    .number()
    .int()
    .positive()
    .refine(async (id) => {
      const validarMetodoQuery = `SELECT cve_metodo_pago FROM metodos_pago WHERE (cve_metodo_pago = ?)`;
      const metodoPago = await pool.query(validarMetodoQuery, [id]);
      if (metodoPago.length > 0) return metodoPago[0].cve_metodo_pago;
    }),
  monto: z.number().positive().min(1),
  fecha: z.date(),
});

export function validarAbono(input) {
  const { cve_venta, cve_metodo_pago, monto, cve_tienda, fecha } = input;

  
  input.fecha = new Date(fecha);
  input.cve_venta = parseInt(cve_venta);
  input.cve_metodo_pago = parseInt(cve_metodo_pago);
  input.cve_tienda = parseInt(cve_tienda);
  input.monto = parseFloat(monto);

  return abonosSchema.safeParseAsync(input);
}

export function validarParcialAbono(input) {
  return abonosSchema.partial().safeParse(input);
}
