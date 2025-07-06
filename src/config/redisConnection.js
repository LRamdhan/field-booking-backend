import Redis from 'ioredis'
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USER } from './env.js';

const redisConnection = new Redis({
  port: REDIS_PORT, // Redis port
  host: REDIS_HOST, // Redis host
  username: REDIS_USER, // needs Redis >= 6
  password: REDIS_PASSWORD,
  db: 0, // Defaults to 0
  maxRetriesPerRequest: null,
});

export default redisConnection