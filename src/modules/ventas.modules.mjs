import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const ventasMainModule = 4;
export const getVentasModules = async () =>
  await getModulosByPadre({ padreId: ventasMainModule });
