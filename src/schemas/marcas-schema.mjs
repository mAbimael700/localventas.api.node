import { z } from "zod";

const marcaSchema = z.object({
  cve_tienda: z
    .string({ required_error: "Por favor ingresa la clave de la tienda." })
    .min(1, {
      message: "Por favor ingresa la clave de la tienda.",
    })
    .refine((id) => !isNaN(parseFloat(id)), {
      message: "La clave debe ser un número",
    })
    .transform((str) => {
      const parsedValue = parseFloat(str);
      return isNaN(parsedValue) ? undefined : parsedValue;
    }),
  nombre: z.string().min(2),
  codigo: z.string().max(3),
  activo: z.boolean().default(true),
});

export function validarMarca(input) {
  return marcaSchema.safeParse(input);
}

export function validarPartialMarca(input) {
  return marcaSchema.partial().safeParse(input);
}
