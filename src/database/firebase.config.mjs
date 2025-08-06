// Import the functions you need from the SDKs you need
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getApp } from "firebase-admin/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Initialize Firebase
export const app = initializeApp({
  credential: applicationDefault(),
  databaseURL: process.env.FB_DATABASE_URL,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  
});

export const storage = getStorage(app);
