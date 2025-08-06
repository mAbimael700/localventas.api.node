import { z } from "zod";

const tiendasSchema = z.object({
  cve_usuario: z.number().int(),
  nombre: z.string().min(2).max(50),
  descripcion: z.string().max(200).optional(),
  fecha_creacion: z.date().default(() => new Date()),
});

const direccionSchema = z.object({
  direcciones: z
    .array(
      z.object({
        cve_direccion: z.number().int().positive().optional(),
        cve_estado: z.number().int().positive(),
        calle: z.string().min(2).max(300),
        codigo_postal: z.string().length(5),
        ciudad: z.string().min(2).max(50),
        referencia: z.string().max(200).optional(),
        principal: z.boolean(),
        numInt: z.string().max(30).optional(),
        numExt: z.string().min(1).max(10),
        activo: z.boolean(),
      })
    )
    .max(5),
});

export function validarTienda(input) {
  return tiendasSchema.safeParseAsync(input);
}

export function validarPartialTienda(input) {
  return tiendasSchema.partial().safeParse(input);
}

export function validarDireccion(input) {
  return direccionSchema.safeParse(input);
}

export function validarDireccionPartial(input) {
  return direccionSchema.partial().safeParse(input);
}
