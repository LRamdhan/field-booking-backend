import Joi from 'joi'

const userValidation = {
  register: Joi.object({
    name: Joi.string().max(100).min(1).trim().required(),
    city: Joi.string().max(100).min(1).trim().required(),
    district: Joi.string().max(100).min(1).trim().required(),
    sub_district: Joi.string().max(100).min(1).trim().required(),
    email: Joi.string().max(100).email().trim().required(),
    password: Joi.string().min(8).trim().alphanum().required()
  }),

  login: Joi.object({
    email: Joi.string().max(100).email().trim().required(),
    password: Joi.string().min(8).trim().required()
  }),

  refreshToken: Joi.object({
    refresh_token: Joi.string().min(10).trim().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().max(100).min(1).trim(),
    city: Joi.string().max(100).min(1).trim(),
    district: Joi.string().max(100).min(1).trim(),
    sub_district: Joi.string().max(100).min(1).trim(),
  }),

  deleteDevice: Joi.string().min(25).trim().required(),

  changePassword: Joi.object({
    otp: Joi.string().min(6).max(6).trim().pattern(/^\d{6}$/).required(),
    new_password: Joi.string().min(8).trim().alphanum().required(),
  }),

  requestResetPassword: Joi.object({
    email: Joi.string().max(100).email().trim().required(),
  }),
}

export default userValidation