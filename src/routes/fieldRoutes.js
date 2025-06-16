import express from 'express'
import fieldController from '../controller/fieldController.js'
import checkToken from '../middleware/checkToken.js'
import ROLES from '../constant/roles.js'

const fieldRoutes = express.Router()

fieldRoutes.get('/', fieldController.getFields)
fieldRoutes.get('/:id', fieldController.getFieldDetail)
fieldRoutes.get('/:id/schedules', fieldController.getSchedules)
fieldRoutes.post('/:id/review', checkToken(ROLES.CUSTOMER), fieldController.createReview)
fieldRoutes.get('/:id/review', fieldController.getReview)

export default fieldRoutes