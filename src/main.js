import connectMongoDb from './config/mongodb.js'
import { connectRedis } from './config/redisConfig.js'
import app from './config/expressConfig.js'

// connect mongodb
await connectMongoDb()

// connect redis
await connectRedis()

// start server
const PORT = 1122
app.listen(PORT, () => console.log('Express runs on locahost:' + PORT))


