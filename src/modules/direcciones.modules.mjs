import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const direccionesMainModule = 41;
export const getDireccionesModules = async () =>
  await getModulosByPadre({ padreId: direccionesMainModule });
