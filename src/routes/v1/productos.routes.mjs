import { Router } from "express";
import { ProductoController } from "../../controllers/productos.controller.mjs";
import { authenticate } from "../../auth/authenticate.mjs";
import { upload } from "../../config/multer.config.mjs";

const router = Router();

router.get("/", ProductoController.getAllByTienda);
router.get("/tienda/:tiendaId", ProductoController.getAllByTienda);
router.get("/:folio", ProductoController.getByFolio);

router.post(
  "/",
  authenticate,
  upload.array("files"),
  ProductoController.create
);

router.patch("/:folio", upload.array("files"), ProductoController.update);

export default router;
