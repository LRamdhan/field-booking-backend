import connectMongoDb from './config/mongodb.js'
import { connectRedis } from './config/redisConfig.js'
import { app } from './config/expressConfig.js'
import startJob from './job/job.js'

// connect mongodb
await connectMongoDb()

// connect redis
await connectRedis()

// start delayed job
startJob()

// start express server
const PORT = 3000
app.listen(PORT, () => console.log('Express runs on port:' + PORT))