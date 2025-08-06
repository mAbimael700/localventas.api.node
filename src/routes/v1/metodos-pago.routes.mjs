import { Router } from "express";
import { MetodosPagoController } from "../../controllers/metodos-pago.controller.mjs";
const router = Router();

router.get("/", MetodosPagoController.getMetodosPago);

export default router;
