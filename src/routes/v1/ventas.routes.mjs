import { Router } from "express";
import { VentasController } from "../../controllers/ventas.controller.mjs";
import { authenticate } from "../../auth/authenticate.mjs";
import { authMiddleware } from "../../middlewares/authMiddleware.mjs";

const router = Router();

router.get("/:ventaId", VentasController.getById);
router.post(
  "/",
  authenticate,
  VentasController.create
);

export default router;
