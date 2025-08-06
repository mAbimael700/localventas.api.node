import { storage } from "../database/firebase.config.mjs";
import multer from "multer";

export const bucket = storage.bucket();
export const store = multer.memoryStorage();
export const upload = multer({ storage: store });