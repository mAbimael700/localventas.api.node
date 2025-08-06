import { EmpleadosController } from "../../controllers/empleados.controller.mjs";
import { Router } from "express";
import { authenticate } from "../../auth/authenticate.mjs";

const router = Router();

router.post("/", authenticate, EmpleadosController.sendEmailRequest);
router.patch("/:solicitudId", authenticate, EmpleadosController.responseToEmpleoRequest);

export default router;

