import { Worker } from 'bullmq';
import redisConnection from '../../config/redisConnection.js';
import Booking from '../../model/mongodb/bookingModel.js';
import { sendReminderEmail } from '../../utils/email.js';

const runBookingWorker = () => {
  const bookingWorker = new Worker('booking', async job => {
    try {      
      if(job.name === 'FINISH_BOOKING') { // update status booking to selesai
        await Booking.updateOne({
          _id: job.data.bookingId
        }, {
          $set: {
            status: 'selesai'
          }
        })
      } else if(job.name === 'REMIND_BOOKING') { // send email reminder
        sendReminderEmail(job.data)
      }
    } catch(err) {
      console.log(err.message);
      throw new Error(err.message)
    }
  }, {
    connection: redisConnection,
    removeOnFail: { count: 0 }
  });

  bookingWorker.on('completed', job => {
    console.log(`job with id ${job.id} has completed!`);
  });
  
  bookingWorker.on('failed', (job, err) => {
    console.log(`job with id ${job.id} has failed with ${err.message}`);
  });

  bookingWorker.on('error', err => {
    console.log(err.message);
  });
}

export default runBookingWorker