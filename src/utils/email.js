import nodemailer from 'nodemailer'
import mustache from 'mustache'
import fs from 'fs'
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
let template = (fs.readFileSync('./src/view/email-confirm.html')).toString()
let templateReminder = (fs.readFileSync('./src/view/booking-reminder.html')).toString()
let templateChangePasswordOTP = (fs.readFileSync('./src/view/change-password-otp.html')).toString()
let templateResetPasswordLink = (fs.readFileSync('./src/view/reset-password-link.html')).toString()
  
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

const sendReminderEmail = async (data) => {
  const attachedData = {
    tanggal: data.date,
    jam: data.time,
    namaLapang: data.namaLapang,
    hargaLapang: data.hargaLapang,
    paymentType: data.paymentType,
  }

  const mailOptions = {
    from: `FieldBooking <${EMAIL_USER}>`,
    to: data.userEmail,
    subject: "Booking Reminder",
    html: mustache.render(templateReminder, attachedData),
    amp: mustache.render(templateReminder, attachedData),
  }

  const result = await transporter.sendMail(mailOptions);
  return result
}

const sendChangePasswordOTPEmail = async (data) => {
  const attachedData = {
    otp: data.otp
  }

  const mailOptions = {
    from: `FieldBooking <${EMAIL_USER}>`,
    to: data.userEmail,
    subject: "Password OTP",
    html: mustache.render(templateChangePasswordOTP, attachedData),
    amp: mustache.render(templateChangePasswordOTP, attachedData),
  }

  const result = await transporter.sendMail(mailOptions);
  return result
}

const sendResetPasswordLinkEmail = async (data) => {
  const attachedData = {
    resetUrl: encodeURI(data.resetPasswordUrl + '?otp=' + data.otp)
  }

  const mailOptions = {
    from: `FieldBooking <${EMAIL_USER}>`,
    to: data.userEmail,
    subject: "Reset Password",
    html: mustache.render(templateResetPasswordLink, attachedData),
    amp: mustache.render(templateResetPasswordLink, attachedData),
  }

  const result = await transporter.sendMail(mailOptions);
  return result
}

export { sendConfirmEmail, sendReminderEmail, sendChangePasswordOTPEmail, sendResetPasswordLinkEmail}