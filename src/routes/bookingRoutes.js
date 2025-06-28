import express from 'express'
import bookingController from '../controller/bookingController.js'
import checkToken from '../middleware/checkToken.js'
import ROLES from '../constant/roles.js'

const bookingRoutes = express.Router()

bookingRoutes.post('/', checkToken(ROLES.CUSTOMER), bookingController.createBooking)
bookingRoutes.post('/update', bookingController.updateTransaction)
bookingRoutes.get('/', checkToken(ROLES.CUSTOMER), bookingController.getBookings)
bookingRoutes.get('/:id', checkToken(ROLES.CUSTOMER), bookingController.getDetailBooking)
bookingRoutes.delete('/:id', checkToken(ROLES.CUSTOMER), bookingController.deleteBooking)
bookingRoutes.patch('/:id/activate', checkToken(ROLES.ADMIN), bookingController.activateBooking)

export default bookingRoutes