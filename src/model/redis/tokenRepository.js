import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const tokenSchema = new Schema('token', {
  id: {
    type: 'text'
  },
  user_id: {
    type: 'string'
  },
  role: {
    type: 'string'
  },
  token: {
    type: 'string'
  },
  created_at: {
    type: 'date'
  },
  updated_at: {
    type: 'date'
  },
})

const tokenRepository = new Repository(tokenSchema, redisClient)

export default tokenRepository