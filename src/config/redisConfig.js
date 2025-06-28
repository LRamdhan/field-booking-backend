import { createClient } from 'redis'
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USER } from './env.js'

const redisClient = createClient({
  url: `redis://${REDIS_USER}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`,
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