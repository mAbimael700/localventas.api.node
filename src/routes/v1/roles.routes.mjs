import { Router } from "express";
import { RolesController } from "../../controllers/roles.controller.mjs";
const router = Router();

router.get("/", RolesController.getAll);

export default router;
