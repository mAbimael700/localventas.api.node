import { z } from "zod";
import { pool } from "../database/dbconnect.mjs";
import Decimal from "decimal.js";

export const productosBaseSchema = z.object({
  cve_categoria: z
    .number()
    .int()
    .refine(
      async (id) => {
        const query = `SELECT cve_categoria FROM categorias WHERE (cve_categoria = ?)`;
        const categoria = await pool.query(query, [id]);
        if (categoria.length > 0) return categoria[0].cve_categoria;
      },
      { message: "No existe esta categoria en la base de datos." }
    ),
  cve_marca: z
    .number()
    .int()
    .refine(
      async (idMarca) => {
        const getMarcaQuery = `SELECT cve_marca FROM marcas WHERE (cve_marca = ?)`;
        const marca = await pool.query(getMarcaQuery, [idMarca]);

        if (marca.length > 0) return marca[0].cve_marca;
      },
      { message: "No existe esta marca en la base de datos." }
    ),
  cve_tienda: z
    .number()
    .int()
    .refine(
      async (idTienda) => {
        const getTiendaQuery = `SELECT cve_tienda FROM tiendas WHERE (cve_tienda = ?)`;
        const tienda = await pool.query(getTiendaQuery, [idTienda]);

        if (tienda.length > 0) return tienda[0].cve_tienda;
      },
      { message: "No existe esta tienda en la base de datos." }
    ),
  nombre: z.string().min(2).max(50),
  descripcion: z.string(),
  fecha_creacion: z.date().default(() => new Date()),
  precio_compra: z.number().positive(),
  ganancia: z.number().positive().min(1),
  precio_venta: z.number().positive(),
  existencias: z.number().int().positive(),
  estado: z.boolean().default(true),
  fotografias: z
    .array(
      z.object({
        nombre: z.string().optional(),
        path: z.string().optional(),
        id: z.number().int().positive().optional(),
        estado: z.string().transform((val) => val === "true"),
        principal: z.string().transform((val) => val === "true"),
      })
    )
    .min(1)
    .max(10, {
      message:
        "Solo puedes mostrar 10 fotografías en una publicación por producto.",
    }),
});

const productoSchema = productosBaseSchema
  .refine(
    (data) => {
      const precioVenta = new Decimal(data.precio_venta);
      const precioCompra = new Decimal(data.precio_compra);
      const precioGanancia = new Decimal(data.ganancia);

      return precioVenta.equals(precioCompra.add(precioGanancia));
    },
    {
      message:
        "El precio de venta debe ser la suma de precio_compra y ganancia.",
    }
  )
  .transform((data) => ({
    ...data,

    precio_venta: new Decimal(data.precio_compra)
      .add(new Decimal(data.ganancia))
      .toNumber(),
  }));

export function validarProducto(input) {
  input.cve_categoria = parseInt(input.cve_categoria);
  input.cve_marca = parseInt(input.cve_marca);
  input.cve_tienda = parseInt(input.cve_tienda);
  input.precio_compra = parseFloat(input.precio_compra);
  input.ganancia = parseFloat(input.ganancia);
  input.precio_venta = parseFloat(input.precio_venta);
  input.existencias = parseInt(input.existencias);

  input.fotografias.forEach((e) => {
    if (e.id) {
      e.id = parseInt(e.id);
    }
  });

  return productoSchema.safeParseAsync(input);
}

export async function validarPartialProducto(input) {
  // Aplicar transformación y refinamiento manualmente a las propiedades necesarias

  if (input.cve_categoria) input.cve_categoria = parseInt(input.cve_categoria);
  if (input.cve_marca) input.cve_marca = parseInt(input.cve_marca);
  if (input.cve_tienda) input.cve_tienda = parseInt(input.cve_tienda);
  if (input.precio_compra)
    input.precio_compra = parseFloat(input.precio_compra);
  if (input.ganancia) input.ganancia = parseFloat(input.ganancia);
  if (input.precio_venta) input.precio_venta = parseFloat(input.precio_venta);
  if (input.existencias) input.existencias = parseInt(input.existencias);

  if (input.precio_compra || input.precio_venta || input.precio_venta)
    input.precio_venta = new Decimal(input.precio_compra)
      .add(new Decimal(input.ganancia))
      .toNumber();

  if (input.fotografias) {
    input.fotografias.forEach((e) => {
      if (e.id) e.id = parseInt(e.id);
    });
  }

  // Validar el objeto transformado con el esquema completo
  const validationResult = await productosBaseSchema
    .partial()
    .safeParseAsync(input);

  return validationResult;
}
