import { Worker } from 'bullmq';
import redisConnection from '../../config/redisConnection.js';
import Booking from '../../model/mongodb/bookingModel.js';
import { sendReminderEmail } from '../../utils/email.js';
import DeletedBooking from '../../model/mongodb/deletedBookingModel.js';
import bookedScheduleRepository from '../../model/redis/bookedScheduleRepository.js';
import { EntityId } from 'redis-om';

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
      } else if(job.name === 'TURN_PENDING_BOOKING') { // delete outdated booking
        const booking = await Booking.findOne({ _id: job.data.bookingId })
        const paymentStatus = booking.payment_status

        if(paymentStatus === 'pending') {
          await DeletedBooking.insertOne({
            _id: booking._id,
            user_id: booking.user_id,
            field_id: booking.field_id,
            schedule: booking.schedule,
            status: 'pending',
            payment_type: booking.payment_type,
            payment_status: booking.payment_status
          })
          await Booking.deleteOne({ _id: booking._id })
          const bookedSchedule = (await bookedScheduleRepository.search().where('id').match(booking._id).return.all())[0]
          await bookedScheduleRepository.remove(bookedSchedule[EntityId])
        }
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