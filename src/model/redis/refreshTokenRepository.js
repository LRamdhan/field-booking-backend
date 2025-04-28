import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const refreshTokenSchema = new Schema('refresh_token', {
  id: {
    type: 'text'
  },
  user_id: {
    type: 'string'
  },
  access_token_id: {
    type: 'string'
  },
  refresh_token: {
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
  created_at: {
    type: 'date'
  },
  updated_at: {
    type: 'date'
  },
})

const refreshTokenRepository = new Repository(refreshTokenSchema, redisClient)

export default refreshTokenRepository