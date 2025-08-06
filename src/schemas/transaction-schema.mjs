import { z } from "zod";

const cartTransactionSchema = z.object({
  cve_direccion_entrega: z.number().int().positive(),
  cve_usuario: z.number().int().positive(),
  cve_carrito: z.number().int().positive(),
  cve_tienda: z.number().int().positive(),
});


export function validateTransactionSchema(input) {
  return cartTransactionSchema.safeParse(input);
}
