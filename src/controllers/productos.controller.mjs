import { ProductoModel } from "../models/productos.mjs";
import { bucket } from "../config/multer.config.mjs";
import sharp from "sharp";

import { format } from "date-fns";
import { v4 } from "uuid";

import {
  validarPartialProducto,
  validarProducto,
} from "../schemas/productos-schema.mjs";
import { jsonResponse } from "../lib/json-response.mjs";
import { getDownloadURL } from "firebase-admin/storage";

export class ProductoController {
  static async getAllByTienda(req, res) {
    const { tiendaId } = req.params;

    if (tiendaId) {
      let data;

      try {
        if (req.query) {
          data = await ProductoModel.getAll({
            tiendaId: tiendaId,
            params: req.query,
          });
        } else {
          data = await ProductoModel.getAll({ tiendaId: tiendaId });
        }

        if (data.length === 0)
          return res
            .status(400)
            .json(jsonResponse(400, { message: "Products not found" }));

        return res.status(200).json(jsonResponse(200, { data }));
      } catch (error) {
        return res.status(500).json(
          jsonResponse(500, {
            error,
            error_message: "Hubo un error en el servidor, intente mas tarde.",
          })
        );
      }
    }

    res.status(404).json({ message: "Debes ingresar el id una tienda" });
  }

  static async getAllPublicByTienda(req, res) {
    const { tiendaId } = req.params;

    if (tiendaId) {
      let data;

      try {
        if (req.query) {
          data = await ProductoModel.getAllPublic({
            tiendaId: tiendaId,
            params: req.query,
          });
        } else {
          data = await ProductoModel.getAllPublic({ tiendaId: tiendaId });
        }

        if (data.length === 0)
          return res
            .status(400)
            .json(jsonResponse(400, { message: "Products not found" }));

        return res.status(200).json(jsonResponse(200, { data }));
      } catch (error) {
        return res.status(500).json(
          jsonResponse(500, {
            error,
            error_message: "Hubo un error en el servidor, intente mas tarde.",
          })
        );
      }
    }

    res.status(404).json({ message: "Debes ingresar el id una tienda" });
  }

  static async getByFolio(req, res) {
    const { productoId, tiendaId } = req.params;

    const data = await ProductoModel.getById({
      cve_producto: productoId,
      cve_tienda: tiendaId,
    });

    if (!data) return res.status(400).json({ message: "Product not found" });

    return res.status(200).json(jsonResponse(200, { data }));
  }

  static async getPublicByFolio(req, res) {
    const { productoId, tiendaId } = req.params;

    const data = await ProductoModel.getPublicById({
      cve_producto: productoId,
      cve_tienda: tiendaId,
    });

    if (!data) return res.status(400).json({ message: "Product not found" });

    return res.status(200).json(jsonResponse(200, { data }));
  }

  static async create(req, res) {
    const result = await validarProducto(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: JSON.parse(result.error.message),
        body: { error_message: "Los datos enviados no son los correctos." },
      });
    }

    try {
      const validation = await ProductoModel.existeProducto({
        input: result.data,
      });

      if (!validation.existe) {
        const newProduct = await ProductoModel.create({ input: result.data });

        if (req.files) {
          if (req.files.length > 0) {
            const uploadedImageUrls =
              await ProductoController.saveImagesToFirebase({
                photoArray: result.data.fotografias,
                filesRequest: req.files,
                path: `productos/${newProduct.CVE_PRODUCTO}`,
                productoId: newProduct.CVE_PRODUCTO,
              });

            const photos = await ProductoModel.saveImages({
              cve_producto: newProduct.CVE_PRODUCTO,
              paths: uploadedImageUrls.paths,
              files: uploadedImageUrls.files,
            });

            await Promise.all(
              photos.map(async (e) => {
                await ProductoModel.setPrincipalPhoto({
                  cve_producto: newProduct.CVE_PRODUCTO,
                  nombre: e.nombre,
                  value: false,
                });
              })
            );

            await ProductoModel.setPrincipalPhoto({
              cve_producto: newProduct.CVE_PRODUCTO,
              nombre: uploadedImageUrls.files.find((e) => e.principal === true)
                ?.name,
              value: true,
            });

            return res.status(201).json(
              jsonResponse(201, {
                data: newProduct,
                photos: uploadedImageUrls,
              })
            );
          }
        }

        return res.status(201).json(jsonResponse(201, { data: newProduct }));
      } else {
        return res.status(400).json(
          jsonResponse(400, {
            message:
              "Ya existe un producto registrado con ese nombre a esa tienda.",
          })
        );
      }
    } catch (error) {
      console.log(error);

      return res.status(500).json(
        jsonResponse(500, {
          error_message: "Hubo un error en la base de datos.",
        })
      );
    }
  }

  static async update(req, res) {
    const { folio } = req.params;

    const result = await validarPartialProducto(req.body);

    if (!result.success) {
      return res.status(400).json(
        jsonResponse(400, {
          error: JSON.parse(result.error.message),
          error_message: "Datos recibidos no válidos.",
        })
      );
    }

    try {
      const productoRef = await ProductoModel.getById({
        cve_producto: folio,
        cve_tienda: result.data.cve_tienda,
      });

      if (productoRef) {
        const updatedProducto = await ProductoModel.update({
          input: result.data,
          cve_producto: folio,
          cve_tienda: result.data.cve_tienda,
        });

        if (req.files) {
          if (req.files.length > 0) {
            const fotografiasData = result.data.fotografias;

            const currPrincipalPhoto = await ProductoModel.selectPrincipalPhoto(
              {
                cve_producto: folio,
              }
            );


            

            const reqPrincipalPhoto = fotografiasData.find(
              (file) => file.id === currPrincipalPhoto?.id
            );

            if (reqPrincipalPhoto.principal === false) {
              // seteamos la actual imagen principal a falso

              await ProductoModel.setPrincipalPhoto({
                cve_producto: folio,
                nombre: currPrincipalPhoto.nombre,
                value: false,
              });

              // guardamos las imagenes en firebase y en la DB

              // En la declaración de la función saveImages en la clase

              const uploadedImageUrls =
                await ProductoController.saveImagesToFirebase({
                  photoArray: fotografiasData,
                  filesRequest: req.files,
                  path: `productos/${folio}`,
                  productoId: folio,
                });

              await ProductoModel.saveImages({
                cve_producto: folio,
                paths: uploadedImageUrls.paths,
                files: uploadedImageUrls.files,
              });

            

              //seteamos la nueva foto a verdadero
              await ProductoModel.setPrincipalPhoto({
                cve_producto: folio,
                nombre: uploadedImageUrls.files.find(
                  (e) => e.principal === true
                )?.name,
                value: true,
              });

              return res.status(201).json(
                jsonResponse(201, {
                  data: updatedProducto,
                  photos: uploadedImageUrls,
                })
              );
            }

            //si no hay modificaciones en el principal con una nueva imagen, solo guardamos las imágenes a firebase...
            const uploadedImageUrls =
              await ProductoController.saveImagesToFirebase({
                photoArray: fotografiasData,
                filesRequest: req.files,
                path: `productos/${folio}`,
                productoId: folio,
              });

            //guardamos las imagenes a la base de datos
            await ProductoModel.saveImages({
              cve_producto: folio,
              paths: uploadedImageUrls.paths,
              files: uploadedImageUrls.files,
            });


            
            return res.status(201).json(
              jsonResponse(201, {
                data: updatedProducto,
                photos: uploadedImageUrls.urls,
              })
            );
          }
        }

        if (result.data.fotografias) {
          const photos = result.data.fotografias;

          await Promise.all(
            photos.map(async (e) => {
              await ProductoModel.setPrincipalPhoto({
                cve_producto: folio,
                nombre: e.nombre,
                value: false,
              });
            })
          );

          const newPrincipalPhoto = photos.find((e) => e.principal === true);

          await ProductoModel.setPrincipalPhoto({
            nombre: newPrincipalPhoto.nombre,
            cve_producto: folio,
            value: true,
          });

          await Promise.all(
            photos.map(async (e) => {
              await ProductoModel.setEstadoImages({
                cve_producto: folio,
                nombre: e.nombre,
                value: e.estado,
              });
            })
          );
        }

        res.status(200).json(jsonResponse(200, { data: updatedProducto }));
      }
    } catch (error) {
      console.log(error);

      return res
        .status(500)
        .json(jsonResponse(200, { error: "Hubo un error en el servidor." }));
    }
  }

  static async deactivate(req, res) {
    const { productoId, tiendaId } = req.params;

    try {
      const deactivateProducto = await ProductoModel.delete({
        cve_producto: productoId,
        cve_tienda: tiendaId,
      });

      return res
        .status(200)
        .json(jsonResponse(200, { data: deactivateProducto }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, { error }));
    }
  }

  static generarNombreImagen({ folioProducto, nombreImagen }) {
    const fechaFormateada = format(new Date(Date.now()), "yyyyMMdd-HHmmss");

    // Generar un UUID único
    const uuid = v4();

    // Reemplazar los espacios en blanco por guiones bajos y eliminar caracteres especiales del nombre de la imagen
    const nombreImagenSinEspacios = nombreImagen
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");

    // Concatenar el folio del producto, la fecha actual, el UUID y el nombre de la imagen
    const nombreFinalImagen = `${folioProducto}_${fechaFormateada}_${uuid}_${nombreImagenSinEspacios}`;

    return nombreFinalImagen;
  }

  static async saveImagesToFirebase({
    filesRequest,
    path,
    productoId,
    photoArray,
  }) {
    const files = filesRequest;

    const metadata = files.map((file) => {
      return {
        contentType: file.mimetype,
        cacheControl: "public, max-age=31536000",
      };
    });

    const paths = await files.map((file) => {
      const newName = ProductoController.generarNombreImagen({
        folioProducto: productoId,
        nombreImagen: file.originalname,
      });

      const photosPrincipal = photoArray.find((e) => e.principal === true);
      let arrPath = { path: `${path}/${newName}`, name: newName };

      if (file.originalname === photosPrincipal.nombre) {
        arrPath.principal = true;
      }

      console.log(arrPath);
      return arrPath;
    }); // Rutas específicas para cada archivo

    const uploadPromises = paths.map(async (e, i) => {
      const blob = bucket.file(e.path);
      const blobStream = blob.createWriteStream({
        metadata: metadata[i],
        gzip: true,
      });

      const compressedImageBuffer = await sharp(files[i].buffer)
        .webp() // Convertir a formato WebP
        .toBuffer(); // Obtener el buffer de la imagen comprimida

      return new Promise((resolve, reject) => {
        blobStream.on("error", (err) => {
          reject(err);
        });

        blobStream.on("finish", async () => {
          try {
            // Subir el archivo comprimido
            await blob.save(compressedImageBuffer, {
              metadata: metadata[i],
              gzip: true,
            });

            // Obtener la URL de descarga del archivo comprimido
            const downloadURL = await getDownloadURL(blob);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        });

        blobStream.end(compressedImageBuffer);
      });
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);

    return { paths: uploadedImageUrls, files: paths };
  }
}
