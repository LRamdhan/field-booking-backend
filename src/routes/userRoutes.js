import express from 'express'
import userController from './../controller/userController.js'

const userRoutes = express.Router()

userRoutes.post('/register', userController.register)
userRoutes.get('/email/confirm', userController.confirmEmail)
userRoutes.get('/login/google', userController.loginGoogle)
userRoutes.get('/oauth/google', userController.processGoogleLogin)

export default userRoutes