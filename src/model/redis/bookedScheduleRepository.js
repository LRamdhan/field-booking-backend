import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const bookedScheduleSchema = new Schema('booked_schedule', {
  id: {
    type: 'string'
  },
  user_id: {
    type: 'string'
  },
  field_id: {
    type: 'string'
  },
  schedule: {
    type: 'number'
  },
})

const bookedScheduleRepository = new Repository(bookedScheduleSchema, redisClient)

export default bookedScheduleRepository