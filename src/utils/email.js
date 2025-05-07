import nodemailer from 'nodemailer'
import mustache from 'mustache'
import fs from 'fs/promises'
import { BASE_URL, EMAIL_HOST, EMAIL_PASS, EMAIL_SERVICE, EMAIL_USER } from './../config/env.js';

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  host: EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER, 
    pass: EMAIL_PASS
  },
});

const confirmEmailUrl = BASE_URL + "/api/users/email/confirm"
const template = await (async () => {
  const raw =  await fs.readFile('./src/view/email-confirm.html')
    .then(data => (data.toString()))
  return raw
})()  
  
const mailOptions = (destinationEmail, key) => ({
  from: `FieldBooking <${EMAIL_USER}>`,
  to: destinationEmail,
  subject: "Konfirmasi",
  html: mustache.render(template, {confirmEmailUrl, key}),
  amp: mustache.render(template, {confirmEmailUrl, key}),
})

const sendConfirmEmail = async (destinationEmail, key) => {
  const result = await transporter.sendMail(mailOptions(destinationEmail, key));
  return result
}

export default sendConfirmEmail