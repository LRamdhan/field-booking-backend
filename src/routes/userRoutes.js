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
userRoutes.get('/', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), userController.getProfile)
userRoutes.post('/refresh-token', userController.refreshToken)
userRoutes.patch('/', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), upload.single('img'), userController.updateProfile)
userRoutes.get('/devices', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), userController.getDevices)
userRoutes.delete('/devices/:id', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), userController.deleteDevice)
userRoutes.get('/password/request-change', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), userController.requestChangePassword)
userRoutes.post('/password/request-reset', userController.requestResetPassword)
userRoutes.patch('/password', userController.changePassword)

export default userRoutes