import express from 'express'
import userController from './../controller/userController.js'
import checkToken from '../middleware/checkToken.js'
import ROLES from '../constant/roles.js'
import upload from '../config/multerCloudinary.js'

const userRoutes = express.Router()

userRoutes.post('/register', userController.register)
userRoutes.get('/email/confirm', userController.confirmEmail)
userRoutes.get('/login/google', userController.loginGoogle)
userRoutes.get('/oauth/google', userController.processGoogleLogin)
userRoutes.post('/login', userController.login)
userRoutes.delete('/logout', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), userController.logout)
userRoutes.post('/refresh-token', userController.refreshToken)
userRoutes.get('/', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), userController.getProfile)
userRoutes.patch('/', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), upload.single('img'), userController.updateProfile)

export default userRoutes