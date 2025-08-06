import { z } from "zod";

const ventaSchema = z.object({
  cve_vendedor: z.number().int().positive(),
  cve_cliente: z.number().int().positive().optional(),
  productos: z
    .array(
      z.object({
        cve_producto: z.number().int().positive(),
        cantidad: z.number().int().min(1),
      })
    )
    .optional(),
  cve_tienda: z.number().int().positive(),
  fecha_venta: z.string().datetime(),
  total: z.number().optional(),
  subtotal: z.number().optional(),
  descripcion: z.string().max(100).optional(),
});

export function validarVenta(input) {
  return ventaSchema.safeParse(input);
}

export function validarParcialVenta(input) {
  return ventaSchema.partial().safeParse(input);
}
