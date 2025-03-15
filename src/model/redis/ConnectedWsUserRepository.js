import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const ConnectedWsUserSchema = new Schema('connected_ws_user', {
  email: {
    type: 'string'
  },
  ws_id: {
    type: 'string'
  }
})

const ConnectedWsUserRepository = new Repository(ConnectedWsUserSchema, redisClient)

export default ConnectedWsUserRepository