import { z } from "zod";

const IntZodObject = z
  .string({ required_error: "Por favor ingresa la clave del campo." })
  .min(1, {
    message: "Por favor ingresa la clave de la campo.",
  })
  .refine((id) => !isNaN(parseFloat(id)), {
    message: "La clave debe ser un número",
  })
  .transform((str) => {
    const parsedValue = parseFloat(str);
    return isNaN(parsedValue) ? undefined : parsedValue;
  });

const EmpleadoSchema = z.object({
  cve_tienda: IntZodObject,
  cve_usuario: IntZodObject,
  cve_rol: IntZodObject,
  activo: z.boolean(),
});

export function validarEmpleado(input) {
  return EmpleadoSchema.safeParse(input);
}

export function validarPartialEmpleado(input) {
  return EmpleadoSchema.partial().safeParse(input);
}
