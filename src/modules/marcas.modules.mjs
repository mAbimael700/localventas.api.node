import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const marcasMainModule = 3;
export const getMarcasModules = async () =>
  await getModulosByPadre({ padreId: marcasMainModule });
