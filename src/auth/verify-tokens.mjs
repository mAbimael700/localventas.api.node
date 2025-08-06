import jwt from "jsonwebtoken";

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {algorithms:["HS256"]});
        return decoded;
      } catch (error) {
        return null; // o puedes lanzar una excepción según tu lógica de manejo de errores
      }
}
