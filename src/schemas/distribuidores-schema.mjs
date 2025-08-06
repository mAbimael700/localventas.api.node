import { z } from "zod";

const distribuidorSchema = z.object({
  cve_marca: z
    .string({ required_error: "Por favor ingresa la clave de la marca." })
    .min(1, {
      message: "Por favor ingresa la clave de la marca.",
    })
    .refine((id) => !isNaN(parseFloat(id)), {
      message: "La clave debe ser un número",
    })
    .transform((str) => {
      const parsedValue = parseFloat(str);
      return isNaN(parsedValue) ? undefined : parsedValue;
    }),
  nombre: z.string().min(2),
  paterno: z.string().max(2),
  materno: z.string().min(2),
  telefono: z
    .string({ required_error: "Su número de teléfono es requerido." })
    .length(10, { message: "El número de teléfono debe tener 10 dígitos." })
    .refine((numero) => /^[0-9]+$/.test(numero), {
      message: "El número telefónico debe contener solo dígitos.",
    }),
  genero: z.enum(["H", "M", "O"]),
  correo_electronico: z.string().email(),
  activo: z.boolean().default(true),
});

export function validarDistribuidor(input) {
  return distribuidorSchema.safeParse(input);
}

export function validarPartialDistribuidor(input) {
  return distribuidorSchema.partial().safeParse(input);
}
