import { Router } from "express";
import { MarcasController } from "../../controllers/marcas.controller.mjs";
import { authenticate } from "../../auth/authenticate.mjs";
import { authMiddleware } from "../../middlewares/authMiddleware.mjs";
const router = Router();

router.get("/", MarcasController.getAllByTienda);

//router.get("/:marcaId", MarcasController.getById);

router.post(
  "/",
  authenticate,
  MarcasController.create
);

router.patch(
  "/:marcaId",
  authenticate,
  MarcasController.update
);

export default router;
