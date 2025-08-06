import createError from "http-errors";
import logger from "morgan";
import express from "express";
import cors from "cors";
import closePoolMiddleware from "./middlewares/closePool.mjs";

import categoriasRouter from "./routes/v1/categorias.routes.mjs";
import productosRouter from "./routes/v1/productos.routes.mjs";
import tiendasRouter from "./routes/v1/tiendas.routes.mjs";
import authRouter from "./routes/v1/auth.routes.mjs";
import usuariosRouter from "./routes/v1/usuarios.routes.mjs";
import marcasRouter from "./routes/v1/marcas.routes.mjs";
import ventasRouter from "./routes/v1/ventas.routes.mjs";
import rolesRouter from "./routes/v1/roles.routes.mjs";
import abonosRouter from "./routes/v1/abonos.routes.mjs";
import clientesRouter from "./routes/v1/clientes.routes.mjs";
import metodosPagoRouter from "./routes/v1/metodos-pago.routes.mjs";
import direccionesRouter from "./routes/v1/direcciones.routes.mjs";
import solicitudesEmpleoRouter from "./routes/v1/solicitudes_empleo.routes.mjs";

import { authenticate } from "./auth/authenticate.mjs";
import { jsonResponse } from "./lib/json-response.mjs";
import { getModulosByPadre } from "./lib/getModulesByPadre.mjs";
const app = express();

app.disable("x-powered-by");

// view engine setup

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(cors({origin:'*'}))
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        "http://localhost:5173",
        process.env.CLIENT_DOMAIN,
      ];

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      if (!origin) {
        return callback(null, true);
      }
    },
  })
);

app.use(closePoolMiddleware);

// En tu archivo de rutas principal o app.js
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/api/productos", productosRouter);
app.use("/api/tiendas", tiendasRouter);
app.use("/api/ventas", ventasRouter);
app.use("/api/auth", authRouter);
app.use("/api/usuarios", authenticate, usuariosRouter);
app.use("/api/marcas", marcasRouter);
app.use("/api/clientes", clientesRouter);
app.use("/api/categorias", categoriasRouter);
app.use("/api/metodos-pago", metodosPagoRouter);
app.use("/api/direcciones", direccionesRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/abonos", abonosRouter);
app.use("/api/solicitudes-empleo", solicitudesEmpleoRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development

  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(jsonResponse(404, { message: err.message }));
});



export default app;
