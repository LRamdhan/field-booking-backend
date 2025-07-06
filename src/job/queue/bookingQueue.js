import { Queue } from 'bullmq';
import redisConnection from '../../config/redisConnection.js';

const bookingQueue = new Queue('booking', {
  connection: redisConnection
});

export default bookingQueue