import { pool } from "../database/dbconnect.mjs";
import { generateId } from "../utils/generateNewId.mjs";
import bcrypt from "bcrypt";

export class UsuariosModel {
  static async getAll() {
    const getQuery = `SELECT u.cve_usuario AS id, CONCAT_WS(' ', p.nombre, p.paterno, p.materno) AS nombre, u.correo_electronico, u.fotografia
        FROM usuarios AS u 
            INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario`;

    const users = await pool.query(getQuery);

    return users;
  }

  static async getById({ usuarioId }) {
    const getQuery = `SELECT u.cve_usuario AS id, CONCAT_WS(' ', p.nombre, p.paterno, p.materno) AS nombre, p.correo_electronico, u.fotografia
    FROM usuarios AS u
        INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
    WHERE (cve_usuario = ?)
    `;

    const user = await pool.query(getQuery, [usuarioId]);

    return user[0];
  }

  static async getIdByEmail({ correo_electronico }) {
    const getQuery = `SELECT u.cve_usuario 
      FROM usuarios AS u
        INNER JOIN personas AS p ON p.cve_persona = u.cve_usuario
    WHERE (p.correo_electronico = ?)`;

    const user = await pool.query(getQuery, [correo_electronico]);

    return user[0]?.cve_usuario;
  }

  static async getRolesByUserId({ cve_usuario }) {
    const getQuery = `SELECT t.nombre as tienda, r.nombre as rol, 
      FROM usuarios AS u
        INNER JOIN roles_usuario AS ru ON ru.cve_usuario = u.cve_usuario
        INNER JOIN roles as r ON r.cve_rol = ru.cve_rol
        INNER JOIN tiendas AS t ON t.cve_tienda = ru.cve_tienda
    WHERE (u.cve_usuario = ?)`;

    const user = await pool.query(getQuery, [cve_usuario]);

    if (user.length > 0) {
      return user[0];
    }

    return null;
  }

  static async create({ input }) {
    const {
      nombre,
      paterno,
      materno,
      correo_electronico,
      contrasena,
      fecha_nacimiento,
      telefono,
      sexo,
    } = input;

    const createUsuarioQuery = `INSERT INTO usuarios (cve_usuario, contrasena, activo) VALUES
    (?, ?, ?)`;
    const createPersonaQuery = `INSERT INTO personas (cve_persona, nombre, paterno, materno, telefono, fecha_nacimiento, genero, correo_electronico) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
      const newUserId = await generateId({ table: "personas" });
      const cryptedPassword = await bcrypt.hash(contrasena, 10);

      const newPersona = await pool.query(createPersonaQuery, [
        newUserId,
        nombre,
        paterno,
        materno,
        telefono,
        fecha_nacimiento,
        sexo,
        correo_electronico,
      ]);

      const newUsuario = await pool.query(createUsuarioQuery, [
        newUserId,
        cryptedPassword,
        true,
      ]);

      return "Usuario creado correctamente.";
    } catch (error) {
      console.log(error);
    }
  }
}
