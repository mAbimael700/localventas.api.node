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

const SolicitudEmpleoSchema = z.object({
  cve_tienda: IntZodObject,
  correo_electronico_usuario: z.string().email(),
  cve_empleador: IntZodObject,
  estado: z.enum(["aceptada", "rechazada", "pendiente"]).default('pendiente'),
});

export function validarSolicitudEmpleado(input) {
  return SolicitudEmpleoSchema.safeParse(input);
}

export function validarPartialSolicitudEmpleado(input) {
  return SolicitudEmpleoSchema.partial().safeParse(input);
}
