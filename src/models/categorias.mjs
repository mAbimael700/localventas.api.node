import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import { setClause } from "../utils/setClauses.mjs";

export class CategoriasModel {
  static async obtenerRamaCategoria(idCategoria) {
    try {
      // Función recursiva para buscar la categoría y sus padres
      const buscarRama = async (idCategoria) => {
        const categoria = await pool.query(
          `SELECT 
                c.cve_categoria,
                c.nombre,
                c.cve_categoria_padre,
                c.activo
                FROM categorias AS c
                WHERE c.cve_categoria = ?`,
          [idCategoria]
        );

        if (categoria.length === 0) {
          // La categoría no existe, retorna null
          return null;
        }

        const {  cve_categoria, nombre, cve_categoria_padre,  activo } =
          categoria[0];

        if (cve_categoria_padre === null || cve_categoria_padre === -1) {
          // Si es la categoría raíz, no hay más padres, retornar la categoría actual
          return {
            cve_categoria,
             nombre,
             activo,
          };
        } else {
          // Si no es la categoría raíz, buscar el padre recursivamente
          const padre = await buscarRama(cve_categoria_padre);
          return {
             cve_categoria,
             nombre,
             padre,
             activo,
          };
        }
      };

      // Llama a la función de búsqueda
      const ramaCategoria = await buscarRama(idCategoria);
      return ramaCategoria;
    } catch (err) {
      throw err;
    }
  }

  static async obtenerCategorias({ padre = -1, tiendaId }) {
    try {
      const rows = await pool.query(
        `SELECT 
        c.cve_categoria,
        c.nombre,
        c.activo
          FROM categorias AS c
            INNER JOIN categorias_tienda AS ct ON ct.cve_categoria = c.cve_categoria
            INNER JOIN tiendas AS t ON t.cve_tienda = ct.cve_tienda
        WHERE c.cve_categoria_padre = ? AND t.cve_tienda = ?`,
        [padre, parseInt(tiendaId)]
      );

      // Procesa las categorías
      const categorias = [];

      for (const row of rows) {
        const {  cve_categoria,  nombre,  activo } = row;
        const children = await this.obtenerCategorias({
          padre: cve_categoria,
          tiendaId,
        });

        categorias.push({
          cve_categoria,
          nombre,
          children: children.length > 0 ? children : undefined,
          activo,
        });
      }

      // Devuelve el resultado
      return categorias;
    } catch (err) {
      throw err;
    }
  }

  static async getAllByTienda({ tiendaId, params }) {
    const { activo } = params;
    return await this.obtenerCategorias({ tiendaId })
      .then((categorias) => {
        // Convierte los resultados a JSON

        return categorias;
      })
      .catch((error) => {
        throw new Error("Error al obtener categorías:", error);
      });
  }

  static async getById({ categoriaId, tiendaId }) {
    const query = `SELECT 
    c.cve_categoria as id, c.nombre as categoria, c.cve_categoria_padre
    FROM categorias AS c
      INNER JOIN categorias_tienda AS ct ON ct.cve_categoria = c.cve_categoria
      INNER JOIN tiendas AS t ON t.cve_tienda = ct.cve_tienda
    WHERE (c.cve_categoria = ?) AND (t.cve_tienda = ?)`;

    try {
      const categoria = await pool.query(query, [categoriaId, tiendaId]);
      const familia = await this.obtenerRamaCategoria(categoriaId, {
        tiendaId,
      });

      return { ...categoria[0], familia };
    } catch (error) {
      console.log(error);
      throw new Error("Hubo un error al buscar en la base de datos.");
    }
  }

  static async create({ input }) {
    const { nombre, cve_categoria_padre, cve_tienda } = input;

    const query = `INSERT INTO categorias (cve_categoria, cve_categoria_padre , nombre, activo) VALUES (?, ?, ?, ?) RETURNING *`;
    const categoriaTiendaQuery = `INSERT INTO categorias_tienda (cve_categoria, cve_tienda) VALUES (?, ?)`;

    try {
      const newCategoriaId = await generateId({ table: "categorias" });

      let newCategoria;

      if (cve_categoria_padre) {
        newCategoria = await pool.query(query, [
          newCategoriaId,
          cve_categoria_padre,
          nombre,
          true,
        ]);
      } else {
        newCategoria = await pool.query(query, [
          newCategoriaId,
          -1,
          nombre,
          true,
        ]);
      }

      const categoriaTienda = await pool.query(categoriaTiendaQuery, [
        newCategoriaId,
        cve_tienda,
      ]);

      return newCategoria[0];
    } catch (error) {}
  }

  static async update({ input, categoriaId }) {
    const updateCategoriaClauses = setClause(input);

    const query = `UPDATE categorias AS c SET ${updateCategoriaClauses} WHERE (c.cve_categoria = ?)`;
    const updatedValues = [...Object.values(input), parseInt(categoriaId)];
    await pool.query(query, updatedValues);

    const updatedCategoria = await this.getById({
      categoriaId,
    });

    return updatedCategoria;
  }

  static async delete({ categoriaId }) {
    const query = `UPDATE categorias AS c SET c.activo = ? WHERE (c.cve_categoria = ?)`;
    await pool.query(query, [false, parseInt(categoriaId)]);

   /*  const deactivatedCategoria = await this.getById({ categoriaId });

    return deactivatedCategoria; */
    return 'Categoria desactivada correctamente'
  }

  static async existeCategoriaEnTienda({ input }) {
    const { nombre, cve_tienda } = input;

    const query = `
    SELECT c.nombre 
    FROM categorias AS c 
      INNER JOIN categorias_tienda AS ct ON ct.cve_categoria = c.cve_categoria
      INNER JOIN tiendas AS t ON t.cve_tienda = ct.cve_tienda
    WHERE (t.cve_tienda = ?) AND (c.nombre = ?)`;

    const result = await pool.query(query, [cve_tienda, nombre]);

    if (result.length === 0) return false;

    return true;
  }
}
