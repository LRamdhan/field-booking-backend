import Joi from 'joi'

const fieldValidation = {
  getBookedSchedule: Joi.date().timestamp('javascript').greater('now').required()
}

export default fieldValidation