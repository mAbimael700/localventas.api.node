import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  pool: true,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true, // use TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_AUTH_PASSWORD,
  },
});

transporter.verify().then(()=> console.log("Ready for send emails")).catch(()=> console.log("An error ocurred"))