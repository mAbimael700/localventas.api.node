import { Router } from "express";
import { CategoriasController } from "../../controllers/categorias.controller.mjs";
import { authenticate } from "../../auth/authenticate.mjs";
import { authMiddleware } from "../../middlewares/authMiddleware.mjs";
const router = Router();

router.get("/", CategoriasController.getAllByTienda);

router.get("/:categoriaId",  CategoriasController.getById);

router.post(
  "/",
  authenticate,
  CategoriasController.create
);

router.patch("/:categoriaId", [authenticate], CategoriasController.update);

router.delete("/:categoriaId", [authenticate], CategoriasController.delete);

export default router;
