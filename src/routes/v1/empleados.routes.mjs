import { Router } from "express";
import { authenticate } from "../../auth/authenticate.mjs";
import { EmpleadosController } from "../../controllers/empleados.controller.mjs";
const router = Router();

//router.post("/", EmpleadosController.sendEmail);

export default router;
