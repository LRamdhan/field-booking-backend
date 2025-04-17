import express from 'express'
import fieldController from '../controller/fieldController.js'
import checkToken from '../middleware/checkToken.js'
import ROLES from '../constant/roles.js'

const fieldRoutes = express.Router()

fieldRoutes.get('/', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), fieldController.getFields)
fieldRoutes.get('/:id', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), fieldController.getFieldDetail)
fieldRoutes.get('/:id/schedules', checkToken(ROLES.ADMIN, ROLES.CUSTOMER), fieldController.getSchedules)

export default fieldRoutes