import { z } from "zod";

const pedidoSchema = z.object({
  cve_venta: z.number().int().positive(),
  cve_direccion_entrega: z.number().int().positive(),
  estado_entrega: z.enum(["Entregado", "No entregado", "Pendiente"]),
});

export function validarPedido(input) {
  return pedidoSchema.safeParse(input);
}

export function validarPartialPedido(input) {
  return pedidoSchema.partial().safeParse(input);
}
