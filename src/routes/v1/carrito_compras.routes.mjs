import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller.mjs";
const router = Router();

router.post('/', AuthController.signUp)
router.get('/', AuthController.logIn)
router.patch('/:ventaId', AuthController.token)
router.delete('/:ventaId', AuthController.signOut)
export default router;