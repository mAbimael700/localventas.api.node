import { z } from "zod";

const itemCarritoComprasSchema = z.object({
  folio: z.number().int().positive(),
  cantidad: z.number().int().positive().min(1),
});

const carritoComprasSchema = z.object ({
  cve_usuario: z.number().int().positive(),
  cve_tienda: z.number().int().positive().min(1),
});

export function validarItemCarritoCompras(input) {
  return itemCarritoComprasSchema.safeParse(input);
}

export function validarCarritoCompras(input){
    return carritoComprasSchema.safeParse(input);

}
