import { Router } from "express";
import { authenticate } from "../../auth/authenticate.mjs";
import { ClienteController } from "../../controllers/clientes.controller.mjs";
const router = Router();

router.post("/", authenticate, ClienteController.create);
router.patch("/:clienteId", authenticate, ClienteController.update);

export default router;
