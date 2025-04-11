import express from 'express'
import fieldController from '../controller/fieldController.js'
import checkToken from '../middleware/checkToken.js'

const fieldRoutes = express.Router()

fieldRoutes.get('/', checkToken, fieldController.getFields)
fieldRoutes.get('/:id', checkToken, fieldController.getFieldDetail)

export default fieldRoutes