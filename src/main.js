import bcrypt from 'bcrypt'
import connectMongoDb from './config/mongodb.js'
import { connectRedis } from './config/redisConfig.js'

// const pass = 'lohkobisa'
// const WrongPass = 'beda'

// const hashPass = await bcrypt.hash(pass, 10)

// const result = await bcrypt.compare(WrongPass, hashPass)

// console.log(result);

// await connectMongoDb()

// await connectRedis()