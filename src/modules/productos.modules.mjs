import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const productosMainModule = 1;
export const getProductosModules = async () =>
  await getModulosByPadre({ padreId: productosMainModule });
