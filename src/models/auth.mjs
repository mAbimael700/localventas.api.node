import {
  compararContrasena,
  existeUsuarioEmail,
} from "../utils/validaciones_db/usuarios.mjs";
import { UsuariosModel } from "./usuarios.mjs";
export class AuthModel {
  static async login({ input }) {
    const { correo_electronico, contrasena } = input;

    const userExist = await existeUsuarioEmail({ correo_electronico });

    if (userExist) {
      const correctPassword = await compararContrasena({
        correo_electronico,
        contrasena,
      });

      const result =  await UsuariosModel.getIdByEmail({correo_electronico})

      const accessToken = UsuariosModel.createAccessToken()
      const refreshToken = UsuariosModel.createRefreshToken()

      return {accessToken, refreshToken}
    } 
  }
}
