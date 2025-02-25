import dotenv from 'dotenv'
dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL
const REDIS_URL = process.env.REDIS_URL

export {MONGODB_URL, REDIS_URL}