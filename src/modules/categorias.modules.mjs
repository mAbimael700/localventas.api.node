import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const categoriasMainModule = 2;
export const getCategoriasModules = async () =>
  await getModulosByPadre({ padreId: categoriasMainModule });
