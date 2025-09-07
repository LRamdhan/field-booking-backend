// Date & dayjs Behavior
// - When generating the current Date (without parameters), the timestamp generated
//   is the current time in the server or browser's timezone. The primary timestamp in 
//   this object is the previous timestamp, converted to UTC 0.
// - When generating a specific Date (with parameters), the primary timestamp is 
//   the timestamp passed as a parameter. However, if parsed to a specific format, 
//   the timestamp will be converted to the server or browser's timezone.

// the epoch time used here is in milis

import dayjs from "dayjs";
import "dayjs/locale/id.js"
import relativeTime from 'dayjs/plugin/relativeTime.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.locale('id');
dayjs.extend(relativeTime)
dayjs.extend(utc)

const utcDateTime = (milis) => dayjs.utc(milis);

export default utcDateTime;