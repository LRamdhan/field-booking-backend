import dayjs from "dayjs";
import bookingQueue from "../job/queue/bookingQueue.js";

const addFinishBookingJob = (booking) => {
  const certainTime = dayjs(booking.schedule); 
  const now = dayjs();
  const secondsPassed = now.diff(certainTime, 'second');
  let delay = (secondsPassed * 1000) + (60 * 60 * 1000);
  delay = delay < 0 ? delay * -1 : delay
  bookingQueue.add('FINISH_BOOKING', { 
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

export default addFinishBookingJob