import { UsuariosModel } from "./usuarios.mjs";
import { pool } from "../database/dbconnect.mjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../auth/generate-tokens.mjs";
import { RolesModel } from "./roles.mjs";

export class TokenModel {
  static async createAccessToken({ input }) {
    return generateAccessToken(
      await UsuariosModel.getById({ usuarioId: input })
    );
  }

  static async createRefreshToken({ input }) {
    try {
      const userData = await UsuariosModel.getById({ usuarioId: input });
      

      let user = { ...userData };


      const refreshToken = generateRefreshToken(user);

      const result = await pool.query(
        "INSERT INTO refresh_tokens (cve_usuario, refresh_token) VALUES (?, ?)",
        [input, refreshToken]
      );

      return refreshToken;
    } catch (error) {
      console.log(error);
    }
  }

  static async getToken({ token }) {
    const query = `SELECT refresh_token as refreshToken FROM refresh_tokens WHERE (refresh_token = ?)`;

    const response = await pool.query(query, [token]);

    if (response.length > 0) {
      return response[0].refreshToken;
    }

    return null;
  }

  static async delete({ token }) {
    const query = `DELETE FROM refresh_tokens WHERE (refresh_token = ?)`;

    try {
      const response = await this.getToken({ token: token });

      if (response) {
        await pool.query(query, [token]);
        return "Token deleted";
      }

      return;
    } catch (error) {}
  }
}
