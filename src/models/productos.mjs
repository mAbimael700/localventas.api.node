import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { setClause } from "../utils/setClauses.mjs";
import { CategoriasModel } from "./categorias.mjs";

function alterQueryByParams({ query, params = {} }) {
  const { marca, categoria, search } = params;

  let newQuery = query;

  if (marca) {
    newQuery = String(newQuery).concat(" AND (m.cve_marca = ?)");
  }

  if (categoria) {
    newQuery = String(newQuery).concat(
      " AND (c.cve_categoria = ?) OR (c.cve_categoria_padre = ?)"
    );
  }

  if (search) {
    newQuery = String(newQuery).concat(
      ` AND (
        p.nombre LIKE CONCAT('%', ?, '%') OR
        c.nombre LIKE CONCAT('%', ?, '%') OR
        m.nombre LIKE CONCAT('%', ?, '%')
    )`
    );
  }

  return newQuery;
}

export class ProductoModel {
  static async getAll({ tiendaId, params }) {
    const { marca, categoria, search } = params;

    const getQuery = `SELECT 
    p.cve_producto AS folio, 
    p.nombre AS producto,
    p.descripcion, 
    p.fecha_creacion,
    c.nombre AS categoria, 
    m.nombre AS marca, 
    p.precio_compra,
    p.precio_venta,
    p.ganancia AS ganancia,
    p.existencias,
    p.estado
    FROM productos AS p
      INNER JOIN categorias AS c ON c.cve_categoria = p.cve_categoria
      INNER JOIN tiendas AS t ON t.cve_tienda = p.cve_tienda
      INNER JOIN marcas AS m ON m.cve_marca = p.cve_marca
    WHERE (t.cve_tienda = ?)`;

    const getPhotosQuery = `SELECT
      fp.cve_fotografia as id,
      fp.ruta as path,
      fp.activo as estado, 
      fp.principal
      FROM fotografias_producto as fp
        INNER JOIN productos AS p ON p.cve_producto = fp.cve_producto
        INNER JOIN tiendas AS t ON t.cve_tienda = p.cve_tienda
      WHERE (t.cve_tienda = ?) AND (fp.activo = true) AND (p.cve_producto = ?) AND (fp.principal = true)
      `;

    let getProductosQuery = alterQueryByParams({
      query: getQuery,
      params: { ...params },
    });

    let queryParams = [];

    if (marca) queryParams.push(parseInt(marca));

    if (categoria) {
      queryParams.push(parseInt(categoria));
      queryParams.push(parseInt(categoria));
    }

    if (search) {
      const searchTerm = search; // Término de búsqueda
      const searchWords = searchTerm.split(" ");

      const conditions = [];
      searchWords.forEach(() => {
        conditions.push(
          `(
            p.nombre LIKE CONCAT('%', ?, '%') OR
            m.nombre LIKE CONCAT('%', ?, '%') OR
            c.nombre LIKE CONCAT('%', ?, '%')
          )`
        );
      });

      getProductosQuery += ` AND (
        ${conditions.join(" OR ")}
        );`;

      Array.from({ length: 3 * 2 }).forEach(() => queryParams.push(search));
      searchWords.forEach((word) =>
        conditions.forEach(() => queryParams.push(word))
      );
    }

    try {
      let productos = [];

      if (params) {
        productos = await pool.query(getProductosQuery, [
          tiendaId,
          ...queryParams,
        ]);
      } else {
        productos = await pool.query(getProductosQuery, [tiendaId]);
      }

      if (productos.length > 0) {
        const photos = await Promise.all(
          productos.map(async (producto) => {
            const result = await pool.query(getPhotosQuery, [
              tiendaId,
              producto.folio,
            ]);

            if (result.length > 0) {
              return result.find((e) => e.principal === true);
            }
          })
        );

        productos.map((producto, i) => {
          producto.principal_photo = photos[i];
        });

        const gananciasNeta = await Promise.all(
          productos.map(async (e) => {
            return await this.getGananciaNetaById({
              cve_producto: e.folio,
              cve_tienda: tiendaId,
            });
          })
        );

        productos.forEach((producto, i) => {
          producto.ganancia_total = gananciasNeta[i];
        });

        return productos;
      }

      return [];
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error en la base de datos");
    }
  }

  static async getAllPublic({ tiendaId, params }) {
    const { marca, categoria, search } = params;

    const getQuery = `SELECT 
    p.cve_producto AS folio, 
    p.nombre AS producto,
    p.descripcion, 
    c.nombre AS categoria, 
    m.nombre AS marca, 
    p.precio_venta,
    p.existencias as stock,
    t.nombre as tienda,
    t.cve_tienda
    FROM productos AS p
      INNER JOIN categorias AS c ON c.cve_categoria = p.cve_categoria
      INNER JOIN tiendas AS t ON t.cve_tienda = p.cve_tienda
      INNER JOIN marcas AS m ON m.cve_marca = p.cve_marca
    WHERE (t.cve_tienda = ?) AND (p.estado = true) AND (p.existencias > 0)`;

    const getPhotosQuery = `SELECT
      fp.cve_fotografia as id,
      fp.ruta as path,
      fp.activo as estado, 
      fp.principal
      FROM fotografias_producto as fp
        INNER JOIN productos AS p ON p.cve_producto = fp.cve_producto
        INNER JOIN tiendas AS t ON t.cve_tienda = p.cve_tienda
      WHERE (t.cve_tienda = ?) AND (fp.activo = true) AND (p.cve_producto = ?) AND (fp.principal = true)
      `;

    let getProductosQuery = alterQueryByParams({
      query: getQuery,
      params: { ...params },
    });

    let queryParams = [];

    if (marca) queryParams.push(parseInt(marca));

    if (categoria) {
      queryParams.push(parseInt(categoria));
      queryParams.push(parseInt(categoria));
    }

    if (search) {
      const searchTerm = search; // Término de búsqueda
      const searchWords = searchTerm.split(" ");

      const conditions = [];
      searchWords.forEach(() => {
        conditions.push(
          `(
            p.nombre LIKE CONCAT('%', ?, '%') OR
            m.nombre LIKE CONCAT('%', ?, '%') OR
            c.nombre LIKE CONCAT('%', ?, '%')
          )`
        );
      });

      getProductosQuery += ` AND (
        ${conditions.join(" OR ")}
        );`;

      Array.from({ length: 3 * 2 }).forEach(() => queryParams.push(search));
      searchWords.forEach((word) =>
        conditions.forEach(() => queryParams.push(word))
      );
    }

    try {
      let productos = [];

      if (params) {
        productos = await pool.query(getProductosQuery, [
          tiendaId,
          ...queryParams,
        ]);
      } else {
        productos = await pool.query(getProductosQuery, [tiendaId]);
      }

      if (productos.length > 0) {
        const photos = await Promise.all(
          productos.map(async (producto) => {
            const result = await pool.query(getPhotosQuery, [
              tiendaId,
              producto.folio,
            ]);

            if (result.length > 0) {
              return result.find((e) => e.principal === true);
            }
          })
        );

        productos.map((producto, i) => {
          producto.principal_photo = photos[i];
          producto.tienda = {
            nombre: producto.tienda,
            id: producto.cve_tienda,
          };
        });

        return productos;
      }

      return [];
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error en la base de datos");
    }
  }

  static async getById({ cve_producto, cve_tienda }) {
    const getQuery = `SELECT
    p.cve_producto as folio, 
    p.nombre AS producto,
    p.descripcion, 
    p.fecha_creacion,
    p.cve_categoria,
    c.nombre AS categoria,
    p.cve_marca,
    m.nombre AS marca, 
    p.precio_compra AS costo,
    p.precio_venta AS precio,
    p.ganancia AS ganancia,
    p.existencias AS stock,
    p.estado AS estado
    FROM productos AS p 
    INNER JOIN categorias AS c ON c.cve_categoria = p.cve_categoria 
    INNER JOIN tiendas AS t ON t.cve_tienda = p.cve_tienda 
    INNER JOIN marcas AS m ON m.cve_marca = p.cve_marca 
    WHERE (p.cve_producto = ?) AND (t.cve_tienda = ?)`;

    try {
      let producto = await pool.query(getQuery, [
        parseInt(cve_producto),
        parseInt(cve_tienda),
      ]);

      if (producto[0]) {
        const photos = await this.getImagesByProduct({ cve_producto });

        producto[0].principal_photo = photos.find(
          (img) => img.principal === true
        )?.path;

        producto[0].photos = photos;

        const piezasVendidas = await this.getPiezasVendidas({
          cve_producto,
          cve_tienda,
        });

        producto[0].piezas_vendidas = piezasVendidas;

        return producto[0];
      }

      return undefined;
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al consultar el producto");
    }
  }

  static async getPublicById({ cve_producto, cve_tienda }) {
    const getQuery = `SELECT
    p.cve_producto as folio, 
    p.nombre AS producto,
    p.descripcion, 
    p.fecha_creacion,
    p.cve_categoria,
    c.nombre AS categoria,
    p.cve_marca,
    m.nombre AS marca, 
    p.precio_venta AS precio,
    p.existencias AS stock,
    t.nombre as tienda,
    t.cve_tienda,
    p.estado AS estado
    FROM productos AS p 
    INNER JOIN categorias AS c ON c.cve_categoria = p.cve_categoria 
    INNER JOIN tiendas AS t ON t.cve_tienda = p.cve_tienda 
    INNER JOIN marcas AS m ON m.cve_marca = p.cve_marca 
    WHERE (p.cve_producto = ?) AND (t.cve_tienda = ?)`;

    try {
      let producto = await pool.query(getQuery, [
        parseInt(cve_producto),
        parseInt(cve_tienda),
      ]);

      const photos = await this.getImagesByProduct({ cve_producto });

      producto[0].principal_photo = photos.find(
        (img) => img.principal === true
      )?.path;

      producto[0].photos = photos;

      const piezasVendidas = await this.getPiezasVendidas({
        cve_producto,
        cve_tienda,
      });

      producto[0].piezas_vendidas = piezasVendidas;
      producto[0].categoria = {
        nombre: producto[0].categoria,
        id: producto[0].cve_categoria,
        familia: await CategoriasModel.obtenerRamaCategoria(
          producto[0].cve_categoria
        ),
      };
      producto[0].marca = {
        nombre: producto[0].marca,
        id: producto[0].cve_marca,
      };
      producto[0].tienda = {
        nombre: producto[0].tienda,
        id: producto[0].cve_tienda,
      };

      producto[0].cve_categoria = undefined;
      producto[0].cve_tienda = undefined;
      producto[0].cve_marca = undefined;
      return producto[0];
    } catch (error) {
      console.log(error);
    }
  }

  static async create({ input }) {
    await pool.query("START TRANSACTION");

    const {
      cve_categoria,
      cve_marca,
      cve_tienda,
      nombre,
      fecha_creacion,
      descripcion,
      precio_compra,
      precio_venta,
      ganancia,
      existencias,
      estado,
    } = input;

    const newProductoQuery = `
      INSERT INTO productos 
      ( cve_producto,
        cve_categoria,
        cve_marca,
        cve_tienda,
        nombre,
        fecha_creacion,
        descripcion,
        precio_compra,
        ganancia,
        precio_venta,
        existencias,
        estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `;

    const createValues = [
      cve_categoria,
      cve_marca,
      cve_tienda,
      nombre,
      fecha_creacion,
      descripcion,
      precio_compra,
      ganancia,
      precio_venta,
      existencias,
      estado,
    ];

    try {
      // Ejecutar la consulta de inserción y obtener el producto insertado directamente
      const newProductoId = await generateId({ table: "productos" });

      const newProduct = await pool.query(newProductoQuery, [
        newProductoId,
        ...createValues,
      ]);
      await pool.query("COMMIT");

      // Devolver la información del nuevo producto
      return newProduct[0];
    } catch (err) {
      await pool.query("ROLLBACK");

      throw err;
    }
  }

  static async update({ input, cve_producto, cve_tienda }) {
    let object = {};

    Object.entries(input).forEach(([key, value]) => {
      if (key !== "fotografias") {
        // Excluir el campo 'file'
        object[key] = value;
      }
    });
    const updateProductosClauses = setClause(object);

    const conn = await pool.getConnection();
    try {
      conn.beginTransaction();
      const updatePartialProductoQuery = `UPDATE productos AS p SET ${updateProductosClauses} 
      WHERE (p.cve_producto = ?)`;
      const updatedValues = [...Object.values(object), parseInt(cve_producto)];
      await conn.query(updatePartialProductoQuery, updatedValues);

      conn.commit();
    } catch (err) {
      conn.rollback();
      console.log(err);
      throw new Error(
        "Hubo un error en la actualización del producto en la base de datos, intente más tarde..."
      );
    }

    const updatedProducto = await this.getById({
      cve_producto,
      cve_tienda,
    });

    return updatedProducto;
  }

  static async delete({ cve_producto, cve_tienda }) {
    const query = `UPDATE productos SET estado = ? WHERE (cve_producto = ?)`;
    await pool.query(query, [false, parseInt(cve_producto)]);

    try {
      const deactivatedProducto = await this.getById({
        cve_producto,
        cve_tienda,
      });

      return deactivatedProducto;
    } catch (error) {
      console.log(error);
      throw new Error(
        "Hubo un error al desactivar el producto en la base de datos."
      );
    }
  }

  static async getImagesByProduct({ cve_producto }) {
    const query = `SELECT 
      cve_fotografia as id,
      ruta as path,
      principal,
      nombre,
      fp.activo as estado
        FROM fotografias_producto AS fp
      WHERE (fp.cve_producto = ?) AND (fp.activo = true)`;

    const fotografias = await pool.query(query, [parseInt(cve_producto)]);

    return fotografias;
  }

  static async existeProducto({ input }) {
    const { nombre, cve_tienda } = input;

    const query = `SELECT 
    p.cve_producto AS id, 
    p.nombre AS producto, 
    m.nombre AS marca,
    c.nombre AS categoria,
    p.fecha_creacion,
    p.precio_venta,
    p.existencias AS stock
    FROM productos AS p
      INNER JOIN tiendas AS t ON t.cve_tienda = p.cve_tienda
      INNER JOIN marcas AS m ON m.cve_marca = p.cve_marca
      INNER JOIN categorias AS c ON c.cve_categoria = p.cve_categoria
    WHERE (p.nombre = ?) AND (t.cve_tienda = ?)`;

    const result = await pool.query(query, [nombre, cve_tienda]);

    if (result.length > 0) {
      const producto = {
        existe: true,
        data: result[0],
      };

      return producto;
    }

    const producto = {
      existe: false,
    };
    return producto;
  }

  static async selectPrincipalPhoto({ cve_producto }) {
    const query = `SELECT 
    fp.cve_fotografia as id,
    fp.ruta as path,
    fp.nombre
    FROM fotografias_producto AS fp WHERE (fp.cve_producto = ?) AND (fp.activo = true) AND (fp.principal = true)`;
    const principal_photo = await pool.query(query, [parseInt(cve_producto)]);

    if (principal_photo.length > 0) {
      return principal_photo[0];
    } else {
      return undefined;
    }
  }

  static async saveImages({ cve_producto, paths, files }) {
    const query = `INSERT INTO fotografias_producto (cve_producto, nombre, ruta, activo, principal) VALUES (?, ?, ?, ?, ?) RETURNING *`;

    const conn = await pool.getConnection();
    conn.beginTransaction();
    const insertions = await Promise.all(
      paths.map(async (path, i) => {
        try {
          const fotografias = await conn.query(query, [
            cve_producto,
            files[i].name,
            path,
            true,
            false,
          ]);
          conn.commit();
          return fotografias[0];
        } catch (error) {
          conn.rollback();
          console.error("Error al insertar ruta de imagen:", error);
          throw error;
        }
      })
    );

    return insertions;
  }

  static async getPiezasVendidas({ cve_producto, cve_tienda }) {
    const piezasVendidasQuery = `SELECT
      COUNT(dv.cve_producto) as piezas_vendidas
    FROM detalle_venta AS dv
      INNER JOIN ventas AS v ON v.cve_venta = dv.cve_venta
      INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda   
      WHERE (dv.cve_producto = ?) AND (t.cve_tienda = ?)`;

    const piezasVendidas = await pool.query(piezasVendidasQuery, [
      cve_producto,
      cve_tienda,
    ]);

    return piezasVendidas[0].piezas_vendidas.toString();
  }

  static async getGananciaNetaById({ cve_producto, cve_tienda }) {
    const gananciaQuery = `SELECT COALESCE(SUM(dv.ganancia), 0) AS ganancia
    FROM detalle_venta AS dv
    INNER JOIN ventas AS v ON v.cve_venta = dv.cve_venta
    INNER JOIN tiendas AS t ON t.cve_tienda = v.cve_tienda
    WHERE dv.cve_producto = ? AND t.cve_tienda = ?
    `;

    const piezasVendidas = await pool.query(gananciaQuery, [
      cve_producto,
      cve_tienda,
    ]);

    return piezasVendidas[0].ganancia;
  }
  static async setPrincipalPhoto({ cve_producto, nombre, value }) {
    const query = `UPDATE fotografias_producto AS fp SET fp.principal = ? 
    WHERE (fp.nombre= ?) AND (fp.cve_producto = ?)`;

    await pool.query(query, [value, nombre, cve_producto]);
    return;
  }

  static async setEstadoImages({ cve_producto, nombre, value }) {
    const query = `UPDATE fotografias_producto as fp SET fp.activo = ? 
    WHERE (fp.nombre = ?) AND (fp.cve_producto = ?)`;
    await pool.query(query, [value, nombre, cve_producto]);
    return;
  }
}
