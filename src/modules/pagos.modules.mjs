import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const pagosMainModule = 5;
export const getPagosModules = async () =>
  await getModulosByPadre({ padreId: pagosMainModule });
