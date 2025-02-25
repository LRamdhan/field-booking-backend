import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const refreshTokenSchema = new Schema('refresh_token', {
  user_id: {
    type: 'text'
  },
  refresh_token: {
    type: 'text'
  }
})

const refreshTokenRepository = new Repository(refreshTokenSchema, redisClient)

export default refreshTokenRepository