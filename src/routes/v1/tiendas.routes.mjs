import { Router } from "express";
import { TiendaController } from "../../controllers/tiendas.controller.mjs";
import {
  asignarModuloId,
  authenticate,
  verificarPermisosEndpoint,
} from "../../auth/authenticate.mjs";
import { upload } from "../../config/multer.config.mjs";
import { ProductoController } from "../../controllers/productos.controller.mjs";
import { VentasController } from "../../controllers/ventas.controller.mjs";
import { MarcasController } from "../../controllers/marcas.controller.mjs";
import { AbonosController } from "../../controllers/abonos.controller.mjs";
import { CategoriasController } from "../../controllers/categorias.controller.mjs";
import { ClienteController } from "../../controllers/clientes.controller.mjs";
import { EmpleadosController } from "../../controllers/empleados.controller.mjs";
import { getProductosModules } from "../../modules/productos.modules.mjs";
import { getPagosModules } from "../../modules/pagos.modules.mjs";
import { getVentasModules } from "../../modules/ventas.modules.mjs";
import { getEmpleadoModules } from "../../modules/empleados.modules.mjs";
import { getTiendasModules } from "../../modules/tiendas.modules.mjs";
import { getDireccionesModules } from "../../modules/direcciones.modules.mjs";
import { getMarcasModules } from "../../modules/marcas.modules.mjs";
import { getCategoriasModules } from "../../modules/categorias.modules.mjs";
import { PedidosController } from "../../controllers/pedidos.controller.mjs";
const router = Router();

/* Modulos */
const productosModules = await getProductosModules();
const pagosModules = await getPagosModules();
const ventasModules = await getVentasModules();
const empleadosModules = await getEmpleadoModules();
const tiendasModules = await getTiendasModules();
const direccionesModules = await getDireccionesModules();
const marcasModules = await getMarcasModules();
const categoriasModules = await getCategoriasModules();

/* Tiendas */
router.get("/", TiendaController.getAll);
router.get("/:tiendaId", TiendaController.getById);
router.post("/", authenticate, TiendaController.create);
router.patch(
  "/:tiendaId",
  authenticate,
  asignarModuloId(tiendasModules["editarTiendas"]),
  verificarPermisosEndpoint,
  TiendaController.update
);

/* Direcciones */
router.get("/:tiendaId/direcciones", TiendaController.getDireccionesByTienda);
router.get(
  "/:tiendaId/direcciones/:direccionId",
  TiendaController.getDireccionById
);
router.post(
  "/:tiendaId/direcciones",
  authenticate,
  asignarModuloId(direccionesModules["crearDirecciones"]),
  verificarPermisosEndpoint,
  TiendaController.createDirecciones
);
router.patch(
  "/:tiendaId/direcciones/:direccionId",
  authenticate,
  asignarModuloId(direccionesModules["editarDirecciones"]),
  verificarPermisosEndpoint,
  TiendaController.updateDirecciones
);

router.delete(
  "/:tiendaId/direcciones/:direccionId",
  authenticate,
  asignarModuloId(direccionesModules["editarDirecciones"]),
  verificarPermisosEndpoint,
  TiendaController.deleteDireccion
);
/* Productos */
router.get(
  "/:tiendaId/productos",
  authenticate,
  asignarModuloId(productosModules["verProductos"]),
  verificarPermisosEndpoint,
  ProductoController.getAllByTienda
);
router.get(
  "/:tiendaId/productos/:productoId",
  authenticate,
  asignarModuloId(productosModules["verProductos"]),
  verificarPermisosEndpoint,
  ProductoController.getByFolio
);
router.post(
  "/:tiendaId/productos",
  upload.array("files"),
  authenticate,
  asignarModuloId(productosModules["crearProductos"]),
  verificarPermisosEndpoint,
  ProductoController.create
);
router.patch(
  "/:tiendaId/productos/:folio",
  upload.array("files"),
  authenticate,
  asignarModuloId(productosModules["editarProductos"]),
  verificarPermisosEndpoint,
  ProductoController.update
);
router.delete(
  "/:tiendaId/productos/:productoId",
  authenticate,
  asignarModuloId(productosModules["eliminarProductos"]),
  verificarPermisosEndpoint,

  ProductoController.deactivate
);
router.get(
  "/:tiendaId/public/productos",
  ProductoController.getAllPublicByTienda
);
router.get(
  "/:tiendaId/public/productos/:productoId",
  ProductoController.getPublicByFolio
);

/* Clientes */

router.get("/:tiendaId/clientes", authenticate, ClienteController.getAll);
router.get(
  "/:tiendaId/clientes/:clienteId",
  authenticate,
  ClienteController.getById
);
router.post("/:tiendaId/clientes", authenticate, ProductoController.update);
router.patch(
  "/:tiendaId/clientes/:clienteId",
  authenticate,
  ProductoController.update
);

/* Ventas */

router.get("/:tiendaId/ventas", authenticate, VentasController.getAll);
router.get(
  "/:tiendaId/ventas/:ventaId/detalles",
  authenticate,
  VentasController.getDetallesById
);
router.post(
  "/:tiendaId/ventas",
  authenticate,
  asignarModuloId(ventasModules["crearVentas"]),
  verificarPermisosEndpoint,
  VentasController.create
);

/* Ganancias */

router.get(
  "/:tiendaId/ganancias",
  authenticate,
  asignarModuloId(productosModules["estadísticasProductos"]),
  verificarPermisosEndpoint,
  VentasController.getGanancias
);
router.get(
  "/:tiendaId/cantidad-ventas",
  authenticate,
  asignarModuloId(ventasModules["estadísticasVentas"]),
  verificarPermisosEndpoint,
  VentasController.getCantidad
);

/* Abonos */
router.get("/:tiendaId/abonos", authenticate, AbonosController.getAllByTienda);
router.get(
  "/:tiendaId/ventas/:ventaId/abonos",
  authenticate,
  AbonosController.getAllByVenta
);
router.post(
  "/:tiendaId/abonos",
  authenticate,
  asignarModuloId(pagosModules["crearPagos"]),
  verificarPermisosEndpoint,
  AbonosController.create
);

/* Marcas */
router.get("/:tiendaId/marcas", MarcasController.getAllByTienda);
router.get("/:tiendaId/marcas/:marcaId", MarcasController.getById);
router.post(
  "/:tiendaId/marcas",
  authenticate,
  asignarModuloId(marcasModules["crearMarcas"]),
  verificarPermisosEndpoint,
  MarcasController.create
);
router.patch(
  "/:tiendaId/marcas/:marcaId",
  authenticate,
  asignarModuloId(marcasModules["editarMarcas"]),
  verificarPermisosEndpoint,
  MarcasController.update
);

router.delete(
  "/:tiendaId/marcas/:marcaId",
  authenticate,
  asignarModuloId(marcasModules["eliminarMarcas"]),
  verificarPermisosEndpoint,
  MarcasController.delete
);

/* Categorías */
router.get("/:tiendaId/categorias", CategoriasController.getAllByTienda);
router.get("/:tiendaId/categorias/:categoriaId", CategoriasController.getById);
router.post(
  "/:tiendaId/categorias",
  authenticate,
  asignarModuloId(categoriasModules["crearCategorías"]),
  verificarPermisosEndpoint,
  CategoriasController.create
);
router.patch(
  "/:tiendaId/categorias/:categoriaId",
  authenticate,
  asignarModuloId(categoriasModules["editarCategorías"]),
  verificarPermisosEndpoint,
  CategoriasController.update
);

router.delete(
  "/:tiendaId/categorias/:categoriaId",
  authenticate,
  asignarModuloId(categoriasModules["eliminarCategorías"]),
  verificarPermisosEndpoint,
  CategoriasController.delete
);

/* Empleados */
router.post(
  "/:tiendaId/solicitudes-empleo",
  authenticate,
  asignarModuloId(empleadosModules["crearEmpleados"]),
  verificarPermisosEndpoint,
  EmpleadosController.sendEmailRequest
);


router.patch(
  "/:tiendaId/empleados/:empleadoId",
  authenticate,
  asignarModuloId(empleadosModules["editarEmpleados"]),
  verificarPermisosEndpoint,
  EmpleadosController.update
);

router.delete(
  "/:tiendaId/empleados/:empleadoId",
  authenticate,
  asignarModuloId(empleadosModules["editarEmpleados"]),
  verificarPermisosEndpoint,
  EmpleadosController.delete
);

router.get(
  "/:tiendaId/empleados",
  authenticate,
  asignarModuloId(empleadosModules["verEmpleados"]),
  verificarPermisosEndpoint,
  EmpleadosController.getAllByTienda
);

/* Pedidos */
router.get(
  "/:tiendaId/pedidos",
  authenticate,
  PedidosController.getAllByTienda
);
router.get(
  "/:tiendaId/pedidos/:pedidoId",
  authenticate,
  PedidosController.getById
);
router.post("/:tiendaId/pedidos", authenticate, PedidosController.create);
router.patch(
  "/:tiendaId/pedidos/:pedidoId",
  authenticate,
  PedidosController.update
);

export default router;
