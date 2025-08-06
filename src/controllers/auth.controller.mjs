import { jsonResponse } from "../lib/json-response.mjs";
import { validarLogin, validarUsuario } from "../schemas/usuarios-schema.mjs";
import { UsuariosModel } from "../models/usuarios.mjs";
import {
  existeUsuario,
  existeUsuarioEmail,
  compararContrasena,
} from "../utils/validaciones_db/usuarios.mjs";
import { getTokenFromHeader } from "../auth/get-token-from-header.mjs";
import { verifyRefreshToken } from "../auth/verify-tokens.mjs";
import { generateAccessToken } from "../auth/generate-tokens.mjs";
import { TokenModel } from "../models/token.mjs";

export class AuthController {
  static async signUp(req, res) {
    const response = validarUsuario(req.body);

    if (!response.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message:
            "Los datos ingresados en los campos no son los correctos.",
          error: response.error.errors,
        })
      );
    }

    try {
      const userId = response.data.correo_electronico;
      const exist = await existeUsuarioEmail({ correo_electronico: userId });

      if (exist) {
        return res.status(400).json(
          jsonResponse(400, {
            error_message:
              "Ya existe una cuenta registrada con esa dirección de correo electrónico.",
          })
        );
      }

      const createUser = await UsuariosModel.create({ input: response.data });
      res.status(201).json(
        jsonResponse(201, {
          message: "Usuario creado satisfactoriamente.",
          data: response.data,
        })
      );
    } catch (error) {
      console.error("Error al crear el usuario:", error);
      res.status(500).json({
        error_message: "Error interno del servidor.",
      });
    }
  }

  static async logIn(req, res) {
    const response = validarLogin(req.body);

    if (!response.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message:
            "Los datos ingresados en los campos no son los correctos.",
          error: response.error.errors,
        })
      );
    }

    const { correo_electronico, contrasena } = response.data;
    const userExist = await existeUsuarioEmail({ correo_electronico });

    if (userExist) {
      const correctPassword = await compararContrasena({
        correo_electronico,
        contrasena,
      });

      const id = await UsuariosModel.getIdByEmail({ correo_electronico });
      const user = await UsuariosModel.getById({ usuarioId: id });

      if (correctPassword) {
        const accessToken = await TokenModel.createAccessToken({
          input: id,
        });
        const refreshToken = await TokenModel.createRefreshToken({
          input: id,
        });


        
        return res.status(200).json(
          jsonResponse(200, {
            message: "Sesión iniciada correctamente.",
            accessToken,
            refreshToken,
            user,
          })
        );
      } else {
        return res.status(400).json(
          jsonResponse(400, {
            error_message:
              "El correo electrónico y/o la contraseña son incorrectos.",
          })
        );
      }
    } else {
      return res.status(401).json(
        jsonResponse(401, {
          error_message: "Usuario no encontrado.",
        })
      );
    }
  }

  static async token(req, res) {
    const refreshToken = getTokenFromHeader(req.headers);

    if (refreshToken) {
      try {
        const found = await TokenModel.getToken({ token: refreshToken });
        if (!found) {
          return res
            .status(401)
            .json(jsonResponse(401, { error: "Unauthorized" }));
        }

        const payload = verifyRefreshToken(found);

        if (payload) {
          const accessToken = generateAccessToken(payload.user);

          return res.status(200).json(jsonResponse(200, { accessToken }));
        }

        res.status(401).json(jsonResponse(401, { error: "Unauthorized" }));
      } catch (error) {
        return res
          .status(401)
          .json(jsonResponse(401, { error: "Unauthorized" }));
      }
    }
  }

  static async signOut(req, res) {
    try {
      const refreshToken = getTokenFromHeader(req.headers);
      if (refreshToken) {
        await TokenModel.delete({ token: refreshToken });
        res.status(200).json(jsonResponse(200, { message: "Token deleted" }));
      }
    } catch (error) {
      res
        .status(500)
        .json(jsonResponse(500, { error_message: "Server error" }));
    }
  }
}
