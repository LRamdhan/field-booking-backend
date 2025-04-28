import Joi from 'joi'

const fieldValidation = {
  getBookedSchedule: () => {
    // let currentDate = new Date()
    // currentDate = (currentDate.getMonth() + 1) + '-' + currentDate.getDate() + '-' + currentDate.getFullYear()
    return Joi.date().timestamp('javascript').required()
  },

  createReview: Joi.object({
    field_id: Joi.string().min(24).trim().required(),
    rating: Joi.number().min(1).max(5).required(),
    description: Joi.string().min(1).trim().required(),
  }),

  getReview: Joi.object({
    field_id: Joi.string().min(24).trim().required(),
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    star: Joi.number().min(1).max(5),
  }),
}

export default fieldValidation