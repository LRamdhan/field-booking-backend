import Joi from 'joi'

const userValidation = {
  register: Joi.object({
    name: Joi.string().max(100).min(1).trim().required(),
    city: Joi.string().max(100).min(1).trim().required(),
    district: Joi.string().max(100).min(1).trim().required(),
    sub_district: Joi.string().max(100).min(1).trim().required(),
    email: Joi.string().max(100).email().trim().required(),
    password: Joi.string().min(8).trim().required()
  })

}

export default userValidation