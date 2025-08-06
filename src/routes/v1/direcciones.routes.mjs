import { DireccionesController } from "../../controllers/direcciones.controller.mjs";
import { Router } from "express";

const router = Router();

router.get("/paises", DireccionesController.getPaises);
router.get("/paises/:paisId/estados", DireccionesController.getEstadosByPais);

export default router;
