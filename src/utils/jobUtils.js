import dayjs from "dayjs";
import bookingQueue from "../job/queue/bookingQueue.js";
import utc from 'dayjs/plugin/utc.js' 
import timezone from 'dayjs/plugin/timezone.js'
import Field from "../model/mongodb/fieldModel.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export const addFinishBookingJob = async (booking) => {
  const certainTime = dayjs(booking.schedule); 
  const now = dayjs();
  const secondsPassed = now.diff(certainTime, 'second');
  let delay = (secondsPassed * 1000) + (60 * 60 * 1000);
  delay = delay < 0 ? delay * -1 : delay
  const job = await bookingQueue.add('FINISH_BOOKING', { 
    bookingId: booking._id.toString(),
  }, {
    delay,
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
  });
}

export const addReminderBookingJob = async (email, scheduleMilis, bookingInfo) => {  
  // make current time (dayjs) instance
  const current = dayjs()

  // calculate the difference between current time with schedule
  let schedule = dayjs(scheduleMilis)
  let difference = schedule.diff(current, 'hour')
  difference = difference < 0 ? difference * -1 : difference
  
  // if difference is less than 3 days -> return
  if(difference < 72) return

  // create delay time (dayjs) for 2 days before the schedule
  schedule = schedule.subtract(48, 'hour')
  // schedule = schedule.tz(dayjs.tz.guess())

  // create delay in second
  let delay = schedule.diff(dayjs(), 'second')
  delay = delay < 0 ? delay * -1 : delay
  delay = delay * 1000

  const schedule2 = dayjs(scheduleMilis)
  const field = await Field.findById(bookingInfo.field_id)

  // create job
  const job = await bookingQueue.add('REMIND_BOOKING', { 
    userEmail: email,
    date: schedule2.format("DD MMMM YYYY"),
    time: schedule2.format("HH:mm") + " WIB",
    namaLapang: field.name,
    hargaLapang: field.price,
    paymentType: bookingInfo.payment_type
  }, {
    delay,
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
  });
  return String(job.id)
}

export const removeReminderBookingJob = async (jobId) => {
  await bookingQueue.remove(jobId)
}