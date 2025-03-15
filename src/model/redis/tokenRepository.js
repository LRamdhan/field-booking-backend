import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const tokenSchema = new Schema('token', {
  id: {
    type: 'string'
  },
  user_id: {
    type: 'string'
  },
  browser: {
    type: 'text'
  },
  os: {
    type: 'text'
  },
  platform: {
    type: 'text'
  },
  device: {
    type: 'text'
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