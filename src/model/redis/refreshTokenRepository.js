import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const refreshTokenSchema = new Schema('refresh_token', {
  id: {
    type: 'string'
  },
  user_id: {
    type: 'string'
  },
  access_token_id: {
    type: 'string'
  },
  refresh_token: {
    type: 'string'
  }
})

const refreshTokenRepository = new Repository(refreshTokenSchema, redisClient)

export default refreshTokenRepository