import { pool } from "../../database/dbconnect.mjs";
import bcrypt from 'bcrypt'
export async function existeUsuario({ cve_usuario }) {
  const usuarioExisteQuery = `SELECT cve_usuario FROM usuarios WHERE cve_usuario = ?`;

  try {
    const result = await pool.query(usuarioExisteQuery, [cve_usuario]);
    return result.length > 0;
  } catch (error) {
    console.error("Error al verificar si existe el usuario:", error);
    
  }
}

export async function existeUsuarioEmail({ correo_electronico }) {
  const usuarioExistsQuery = `SELECT cve_persona FROM personas WHERE correo_electronico = ?`;
  try {
    const result = await pool.query(usuarioExistsQuery, [correo_electronico]);
    return result.length > 0;
  } catch (error) {
    console.error("Error al verificar si existe el usuario:", error);
    next("Hubo un error al verificar si existe el usuario.");
  }
}

export async function compararContrasena({ correo_electronico, contrasena }) {
  const usuarioQuery = `SELECT u.contrasena 
  FROM usuarios as u
    INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
  WHERE p.correo_electronico = ? `;

  try {
    const usuario = await pool.query(usuarioQuery, [correo_electronico]);
    if (usuario.length < 1) {
      // Usuario no encontrado
      return false;
    }

    const result = await bcrypt.compare(contrasena, usuario[0].contrasena);
    return result;
  } catch (error) {
    console.error("Error al comparar contraseñas:", error);
    throw error;
  }
}
