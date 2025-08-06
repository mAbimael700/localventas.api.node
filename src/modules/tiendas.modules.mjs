import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const tiendasMainModule = 39;
export const getTiendasModules = async () =>
  await getModulosByPadre({ padreId: tiendasMainModule });
