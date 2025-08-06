import { z } from "zod";

const clienteSchema = z.object({
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
  nombre: z.string().min(2),
  paterno: z.string().min(2),
  materno: z.string().min(2),
  telefono: z
    .string({ required_error: "Su número de teléfono es requerido." })
    .length(10, { message: "El número de teléfono debe tener 10 dígitos." })
    .refine((numero) => /^[0-9]+$/.test(numero), {
      message: "El número telefónico debe contener solo dígitos.",
    }),
  correo_electronico: z.string().email(),
  genero: z.enum(["H", "M", "O"]),
});

export function validarCliente(input) {
  return clienteSchema.safeParse(input);
}

export function validarPartialCliente(input) {
  return clienteSchema.partial().safeParse(input);
}
