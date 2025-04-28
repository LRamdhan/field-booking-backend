import Joi from 'joi'
import PAYMENT from '../constant/payment.js'

const bookingValidation = {
  create: Joi.object({
    field_id: Joi.string().min(20).trim().required(),
    schedule: Joi.date().timestamp('javascript').greater('now').required(),
    payment_type: Joi.string().valid(PAYMENT.POA, PAYMENT.ONLINE).required(),
  }),

  getBookings: Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    create_order: Joi.string().valid('asc', 'desc').trim(),
    status: Joi.string().valid('aktif', 'pending', 'selesai').trim(),
    field_id: Joi.string().min(24).trim(),
  }),
  
  detailBooking: Joi.string().min(24).trim().required(),
  
  deleteBooking: Joi.string().min(24).trim().required(),
}

export default bookingValidation