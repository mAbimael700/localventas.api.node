import { Router } from "express";
import { UsuariosController } from "../../controllers/usuarios.controller.mjs";
import { SolicitudEmpleosController } from "../../controllers/solicitudes_empleo.controller.mjs";
import { authenticate } from "../../auth/authenticate.mjs";
import { CarritoComprasController } from "../../controllers/carrito_compras.controller.mjs";
import { TransactionsController } from "../../controllers/transactions.controller.mjs";
const router = Router();

router.get("/", UsuariosController.userRequest);

router.get(
  "/solicitudes-empleo",
  authenticate,
  SolicitudEmpleosController.getAllByUser
);

router.get(
  "/solicitudes-empleo/:solicitudId",
  authenticate,
  SolicitudEmpleosController.getById
);

router.get("/tiendas", authenticate);

router.get(
  "/cart/:tiendaId",
  authenticate,
  CarritoComprasController.getCurrentByTienda
);

router.post("/cart", authenticate, CarritoComprasController.create);

router.patch("/cart/:tiendaId", authenticate, CarritoComprasController.setItem);

router.delete(
  "/cart/:cartId/items/:itemId",
  authenticate,
  CarritoComprasController.deleteItem
);

router.get(
  "/purchases",
  authenticate,
  TransactionsController.getTransactionsByUser
);
router.get(
  "/purchases/:transactionId",
  authenticate,
  TransactionsController.getTransactionsById
);
router.post("/purchases", authenticate, TransactionsController.create);
export default router;
