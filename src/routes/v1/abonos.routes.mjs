import { Router } from "express";
import { AbonosController } from "../../controllers/abonos.controller.mjs";
import { authenticate } from "../../auth/authenticate.mjs";
import { authMiddleware } from "../../middlewares/authMiddleware.mjs";

const router = Router();

router.post("/", authenticate, AbonosController.create);

export default router;
