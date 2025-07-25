import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const otpSchema = new Schema('otps', {
  id: {
    type: 'text'
  },
  otp: {
    type: 'string'
  },
  email: {
    type: 'string'
  },
  last_sent_at: {
    type: 'number'
  },
  expires_at: {
    type: 'number'
  },
  created_at: {
    type: 'number'
  },
})

const otpRepository = new Repository(otpSchema, redisClient)

export default otpRepository