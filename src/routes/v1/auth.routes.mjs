import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller.mjs";
const router = Router();

router.post('/signup', AuthController.signUp)
router.post('/login', AuthController.logIn)
router.post('/refresh-token', AuthController.token)
router.delete('/signout', AuthController.signOut)
export default router;