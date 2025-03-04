import express from 'express'
import userController from './../controller/userController.js'

const userRoutes = express.Router()

userRoutes.post('/register', userController.register)
userRoutes.get('/email/confirm', userController.confirmEmail)

export default userRoutes