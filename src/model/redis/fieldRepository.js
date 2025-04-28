import { Repository, Schema } from 'redis-om'
import { redisClient } from './../../config/redisConfig.js'

const fieldSchema = new Schema('fields', {
  id: {
    type: 'string'
  },
  name: {
    type: 'string'
  },
  images: {
    type: 'string[]'
  },
  price: {
    type: 'string'
  },
  rating: {
    type: 'number'
  },
  location: {
    type: 'string'
  },
  floor_type: {
    type: 'string'
  },
  facilities: {
    type: 'string[]'
  }
})

const fieldRepository = new Repository(fieldSchema, redisClient)

export default fieldRepository