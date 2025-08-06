import { jsonResponse } from "../lib/json-response.mjs";
import { UsuariosModel } from "../models/usuarios.mjs";


export class UsuariosController{

    static async userRequest(req, res){
        res.status(200).json(jsonResponse(200, req.user))
    }

    static async getAll(req, res){
        const response = await UsuariosModel.getAll();

        if (response.length === 0)
          return res.status(404).json({ message: "Users not found" });
    
        return res.status(200).json(response);
    }
}