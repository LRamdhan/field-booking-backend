import connectMongoDb from './config/mongodb.js'
import { connectRedis } from './config/redisConfig.js'
import { app } from './config/expressConfig.js'
import startJob from './job/job.js'
import { transporter } from './utils/email.js';

// timezone
process.env.TZ = 'Asia/Jakarta';

// test email connection
try {
  await transporter.verify();
  console.log("Server is ready to send email");
} catch (err) {
  console.error("Email error:", err);
}

// connect mongodb
await connectMongoDb()

// connect redis
await connectRedis()

// start delayed job
startJob()

// start express server
const PORT = 3000
app.listen(PORT, () => console.log('Express runs on port ' + PORT))