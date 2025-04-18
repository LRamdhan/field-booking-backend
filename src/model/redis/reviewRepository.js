import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const reviewSchema = new Schema('reviews', {
  id: {
    type: 'string'
  },
  user_id: {
    type: 'string'
  },
  field_id: {
    type: 'string'
  },
  rating: {
    type: 'number'
  },
  description: {
    type: 'string'
  },
  created_at: {
    type: 'number'
  },
})

const reviewRepository = new Repository(reviewSchema, redisClient)

export default reviewRepository