import { z } from "zod";

const categoriaSchema = z.object({
  cve_tienda: z
    .string({ required_error: "Por favor ingresa la clave de la tienda." })
    .min(1, {
      message: "Por favor ingresa la clave de la tienda.",
    })
    .refine((id) => !isNaN(parseInt(id)), {
      message: "La clave debe ser un número",
    })
    .transform((str) => {
      const parsedValue = parseFloat(str);
      return isNaN(parsedValue) ? undefined : parsedValue;
    }),
  cve_categoria_padre: z
    .number({
      required_error: "Por favor ingresa la clave de la categoria padre.",
    })
    .min(1, {
      message: "Por favor ingresa la clave de la categoria padre.",
    })
    .int()
    .optional(),
  nombre: z.string().min(2),
  activo: z.boolean().default(true),
});

export function validarCategoria(input) {
  return categoriaSchema.safeParse(input);
}

export function validarPartialCategoria(input) {
  return categoriaSchema.partial().safeParse(input);
}
