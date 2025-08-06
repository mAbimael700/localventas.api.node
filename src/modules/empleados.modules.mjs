import { getModulosByPadre } from "../lib/getModulesByPadre.mjs";

export const empleadosMainModule = 6;
export const getEmpleadoModules = async () =>
  await getModulosByPadre({ padreId: empleadosMainModule });
