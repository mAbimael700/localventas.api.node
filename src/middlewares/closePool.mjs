// closePool.js

import { pool } from '../database/dbconnect.mjs';

const closePoolMiddleware = (req, res, next) => {
  const onClose = () => {
    pool.end().then(() => {
      console.log('Pool de conexiones cerrado.');
      process.exit(0);
    });
  };

  // Manejar la señal SIGINT para cerrar el pool de conexiones al finalizar la aplicación
  process.on('SIGINT', onClose);

  // Asegurarse de que onClose se ejecute al cerrar la aplicación
  process.on('exit', onClose);

  // Llamar al siguiente middleware o ruta
  next();
};

export default closePoolMiddleware;
