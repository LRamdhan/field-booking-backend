import dotenv from 'dotenv'
dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL
const REDIS_URL = process.env.REDIS_URL
const EMAIL_SERVICE = process.env.EMAIL_SERVICE
const EMAIL_HOST = process.env.EMAIL_HOST
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS
const BASE_URL = process.env.BASE_URL

export {
  MONGODB_URL, 
  REDIS_URL,
  EMAIL_SERVICE,
  EMAIL_HOST,
  EMAIL_USER,
  EMAIL_PASS,
  BASE_URL
}