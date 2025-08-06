import { z } from "zod";
import { existeUsuarioEmail } from "../utils/validaciones_db/usuarios.mjs";
import { pool } from "../database/dbconnect.mjs";

const usuarioSchema = z.object({
  nombre: z.string().min(2).max(50),
  paterno: z.string().min(2).max(40),
  materno: z.string().min(2).max(40),
  telefono: z
    .string({ required_error: "Su número de teléfono es requerido." })
    .length(10, { message: "El número de teléfono debe tener 10 dígitos." })
    .refine((numero) => /^[0-9]+$/.test(numero), {
      message: "El número telefónico debe contener solo dígitos.",
    }),
  correo_electronico: z.string().email(),
  contrasena: z.string().min(6).max(20),
  fecha_nacimiento: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .refine((date) => {
      const currentDate = new Date();
      const age = currentDate.getFullYear() - date.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();
      const birthMonth = date.getMonth() + 1;
      const birthDay = date.getDate();

      if (age > 18) {
        return true;
      } else if (age === 18) {
        if (currentMonth > birthMonth) {
          return true;
        } else if (currentMonth === birthMonth && currentDay >= birthDay) {
          return true;
        }
      }
    }),
  sexo: z.enum(["H", "M", "O"]),
});

export function validarUsuario(input) {
  try {
    const result = usuarioSchema.safeParse(input);
    return result;
  } catch (error) {
    console.log("Hubo un error", error);
  }
}

export function validarPartialUsuario(input) {
  return usuarioSchema.partial().safeParse(input);
}

const loginSchema = z.object({
  correo_electronico: z.string().email(),
  contrasena: z.string(),
});

export function validarLogin(input) {
  return loginSchema.safeParse(input);
}
