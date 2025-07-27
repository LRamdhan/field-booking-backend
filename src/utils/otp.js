import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime.js'
import otpRepository from "../model/redis/otpRepository.js";
import generateRandomString from "./generateRandomString.js";
import { EntityId } from "redis-om";
import DatabaseError from "../exception/DatabaseError.js";

dayjs.extend(relativeTime)

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
}

export const saveOtp = async (otp, email) => {
  let expiresAt = dayjs().tz("Asia/Jakarta")
  expiresAt = expiresAt.add(10, 'minute')
  const createdAt = dayjs().tz("Asia/Jakarta")
  const lastSentAt = dayjs().tz("Asia/Jakarta")
  const newOtp = await otpRepository.save({
    id: generateRandomString(),
    otp,
    email,
    last_sent_at: lastSentAt.valueOf(),
    expires_at: expiresAt.valueOf(),
    created_at: createdAt.valueOf()
  })
  await otpRepository.expire(newOtp[EntityId], 60 * 10)
}

export const checkExistingOtp = async (userEmail) => {
  const existingOtp = await otpRepository.search()
    .where('email').equals(userEmail)
    .return.all()
  if(existingOtp.length > 0) {
    const expiresAt = dayjs(existingOtp[0].expires_at) // already in Asia/Jakarta
    let now = dayjs().tz("Asia/Jakarta")
    const gap = dayjs(expiresAt).diff(now, 'second')
    throw new DatabaseError('Request has been done before, wait for 10 minutes', 409, 'json', null, {
      remaining_time_in_seconds: gap
    })
  }
}

export const checkNotFoundOtp = async (userEmail, message) => {
  const existingOtp = await otpRepository.search()
    .where('email').equals(userEmail)
    .return.all()
  if(existingOtp.length === 0) {
    throw new DatabaseError(message, 404)
  }
  return existingOtp[0]
}