import { transporter } from "../config/mailer.config.mjs";
import { CLIENT_DOMAIN, SERVER_DOMAIN } from "../constants/constanst.mjs";
import { roles } from "../constants/roles.mjs";
import { jsonResponse } from "../lib/json-response.mjs";
import { EmpleadosModel } from "../models/empleados.mjs";
import { SolicitudEmpleosModel } from "../models/solicitud-empleo.mjs";
import { TiendasModel } from "../models/tiendas.mjs";
import { UsuariosModel } from "../models/usuarios.mjs";
import {
  validarEmpleado,
  validarPartialEmpleado,
} from "../schemas/empleados-schema.mjs";
import {
  validarPartialSolicitudEmpleado,
  validarSolicitudEmpleado,
} from "../schemas/solicitud_empleo-schema.mjs";

export class EmpleadosController {
  static async getAllByTienda(req, res) {
    const { tiendaId } = req.params;

    
    try {
      const empleados = await EmpleadosModel.getAllByTienda({
        cve_tienda: tiendaId,
      });

      return res.status(200).json(jsonResponse(200, { data: empleados }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static async delete(req, res) {
    const { tiendaId, empleadoId } = req.params;
    const { id } = req.user;

    try {
      const existeEmpleado = await EmpleadosModel.getById({
        cve_tienda: tiendaId,
        cve_empleado: empleadoId,
      });

      if (existeEmpleado) {


        if (existeEmpleado.id === id) {
          return res.status(400).json(
            jsonResponse(400, {
              message: "No puedes desactivarte a ti mismo cómo empleado.",
            })
          );
        }
        const deactivatedEmpleado = await EmpleadosModel.delete({
          cve_empleado: empleadoId,
          cve_tienda: tiendaId,
        });

        return res
          .status(200)
          .json(jsonResponse(200, { data: deactivatedEmpleado }));
      }

      return res
        .status(400)
        .json(jsonResponse(400, { message: "No existe el empleado" }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error: error.message }));
    }
  }

  static async update(req, res) {
    const { tiendaId, empleadoId } = req.params;

    
    const result = validarPartialEmpleado(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error: JSON.parse(result.error.message),
          message: "Los campos no son validos",
        })
      );
    }
    try {
      const existeEmpleado = await EmpleadosModel.getById({
        cve_tienda: tiendaId,
        cve_empleado: empleadoId,
      });

      if (existeEmpleado) {
        const updatedEmpleado = await EmpleadosModel.update({
          cve_empleado: empleadoId,
          cve_tienda: tiendaId,
          input: result.data,
        });

        return res
          .status(200)
          .json(jsonResponse(200, { data: updatedEmpleado }));
      }

      return res
        .status(400)
        .json(jsonResponse(400, { message: "No existe el empleado" }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error: error.message }));
    }
  }

  static async sendEmailRequest(req, res) {
    const result = validarSolicitudEmpleado(req.body);
    const { id: userRequestId } = req.user;

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error: JSON.parse(result.error.message),
          error_message: "Los campos no son validos",
        })
      );
    }

    try {
      const userId = await UsuariosModel.getIdByEmail({
        correo_electronico: result.data.correo_electronico_usuario,
      });

      if (userId) {
        if (userId === userRequestId) {
          return res.status(400).json(
            jsonResponse(400, {
              message: "No puedes solicitarte a tí mismo como empleado.",
            })
          );
        }

        const existeEmpleado = await EmpleadosModel.getById({
          cve_empleado: userId,
          cve_tienda: result.data.cve_tienda,
        });

        if (existeEmpleado) {
          return res.status(400).json(
            jsonResponse(400, {
              message:
                "Este usuario ya está en la lista de empleados de la tienda.",
            })
          );
        }

        const user = await UsuariosModel.getById({ usuarioId: userId });

        const tienda = await TiendasModel.getByID({
          tiendaId: result.data.cve_tienda,
        });

        const validarExisteSolicitud =
          await SolicitudEmpleosModel.existeCurrentSolicitud({
            cve_usuario: userId,
          });

        if (validarExisteSolicitud) {
          const fechaActual = new Date();
          const fechaExpiracion = new Date(
            validarExisteSolicitud.fecha_expiracion
          ); // Convertir fecha_expiracion de la base de datos a un objeto Date
          if (fechaExpiracion > fechaActual) {
            return res.status(400).json(
              jsonResponse(400, {
                error:
                  "Ya hay una solicitud pendiente por contestar del usuario.",
                message:
                  "Ya hay una solicitud pendiente por contestar del usuario.",
              })
            );
          }
        }

        const newSolicitud = await SolicitudEmpleosModel.create({
          ...result.data,
          cve_usuario: userId,
        });

        const emailSend = await transporter.sendMail({
          from: `"Localventas App ${process.env.MAIL_USER}"`,
          to: `${user.correo_electronico}`,
          subject: "Solicitud de empleo",
          html: `
  
          <style>
            a {
                padding: 0.3rem;
                background: none;
                border: solid 1px;
                border-color: rgb(114, 114, 114);
                border-radius: 100%;
              }
          </style>
          <h1>Hola ${user.nombre}</h1>,
  
              <p>
                  Has recibido una solicitud de empleo para trabajar en la tienda <strong>${String(
                    tienda.nombre
                  ).toUpperCase()}</strong>. Por favor, haz clic en el siguiente enlace para aceptarla:
                  
                      <a href="${CLIENT_DOMAIN}/my-account/solicitudes-empleo/${
            newSolicitud.cve_solicitud
          }">Aceptar solicitud</a>
                    
                  
              </p>
              
              <span>Atentamente,
              Localventas App</span>`,
        });

        return res
          .status(201)
          .json(jsonResponse(JSON.stringify(emailSend.accepted)));
      }

      return res.status(400).json(
        jsonResponse(400, {
          error_message:
            "No existe un usuario registrado a ese correo electrónico.",
        })
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json(
        jsonResponse(400, {
          error_message: error,
        })
      );
    }
  }

  static async responseToEmpleoRequest(req, res) {
    // Aquí procesas la solicitud y actualizas el estado en la base de datos
    const { solicitudId } = req.params;
    const { id } = req.user;

    const result = validarPartialSolicitudEmpleado({
      estado: req.body?.estado,
    });
    //const empleadoValidation = validarEmpleado(req.body);

    const solicitudEmpleo = await SolicitudEmpleosModel.getById({
      cve_solicitud: solicitudId,
    });

    if (!solicitudEmpleo) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message: "La solicitud de empleo no es válida",
        })
      );
    }

    if (id !== solicitudEmpleo.usuario.id) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message:
            "No tienes permisos de realizar esta solicitud de empleo.",
        })
      );
    }

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error_message: "Los campos no son los correctos",
          error: result.error.errors,
        })
      );
    }

    /* if (req.body) {
      if (!empleadoValidation.success) {
        return res.status(400).json(
          jsonResponse(400, {
            error_message: "Los campos no son los correctos",
            error: empleadoValidation.error.errors,
          })
        );
      }
    } */

    const { estado } = result.data;

    if (estado === "rechazada") {
      await SolicitudEmpleosModel.update({
        estado,
        cve_solicitud: solicitudId,
      });

      return res.status(200).json(
        jsonResponse(200, {
          message: "La solicitud ha sido rechazada exitosamente",
        })
      );
    }

    // Verifica si la solicitud ha expirado
    const fechaActual = new Date();
    const fechaExpiracion = new Date(solicitudEmpleo.fecha_expiracion);

    if (fechaExpiracion < fechaActual) {
      await SolicitudEmpleosModel.update({
        estado: "expirada",
        cve_solicitud: solicitudId,
      });

      return res
        .status(400)
        .json(jsonResponse(400, { error: "La solicitud ha expirado" }));
    }

    // Lógica para aceptar la solicitud de empleo...
    await EmpleadosModel.create({
      cve_rol: roles.capturista,
      cve_tienda: solicitudEmpleo.tienda.id,
      cve_usuario: solicitudEmpleo.usuario.id,
    });
    // Procesa la solicitud y actualiza el estado en la base de datos
    // ...

    await SolicitudEmpleosModel.update({
      estado: "aceptada",
      cve_solicitud: solicitudId,
    });

    // Envía una respuesta al cliente
    res.status(200).json(
      jsonResponse(200, {
        message: "Solicitud de empleo aceptada correctamente",
      })
    );

    // Después de procesar la solicitud, rediriges al usuario a una página en el cliente
    //res.redirect(`https://${CLIENT_DOMAIN}/solicitud-aceptada`);
  }
}
