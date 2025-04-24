import { createClient } from 'redis'
import { REDIS_URL } from './env.js'

const redisClient = createClient({
  url: REDIS_URL
})

const connectRedis = async (stopLog) => {
  try {
    await redisClient.connect()
    if(!stopLog) {
      const ping = await redisClient.ping()    
      console.log('PING...' + ping);
      console.log('Redis is Conected');
    }
  } catch(err) {
    console.log(err.message);
  }
}

export {
  redisClient,
  connectRedis
}