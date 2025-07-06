import runBookingWorker from "./worker/bookingWorker.js"

const startJob = () => {
  try {
    runBookingWorker()
    console.log('Delayed Job is running');
  } catch(err) {
    console.log('Delayed Job fail to run');
    console.log(err.message);
  }
}

export default startJob