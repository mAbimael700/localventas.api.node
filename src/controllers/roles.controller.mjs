import { jsonResponse } from "../lib/json-response.mjs";
import { RolesModel } from "../models/roles.mjs";

export class RolesController {
  static async getAll(req, res) {
    try {
      const roles = await RolesModel.getRoles();
      return res.status(200).json(jsonResponse(200, { data: roles }));
    } catch (error) {
      return res.status(500).json(jsonResponse(500, error));
    }
  }
}
