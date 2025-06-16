import ROLES from "./../src/constant/roles.js"
import UserTemp from './../src/model/mongodb/userTempModel.js';
import Field from '../src/model/mongodb/fieldModel.js';
import refreshTokenRepository from '../src/model/redis/refreshTokenRepository.js';
import tokenRepository from '../src/model/redis/tokenRepository.js';
import { app } from '../src/config/expressConfig.js';
import { EntityId } from 'redis-om';
import EXISTING_USER from '../src/constant/user.js';
import Review from '../src/model/mongodb/reviewsModel.js';
import reviewRepository from '../src/model/redis/reviewRepository.js';
import mongoose from 'mongoose';
import { connectRedis, redisClient } from '../src/config/redisConfig.js';
import Booking from '../src/model/mongodb/bookingModel.js';
import bookedScheduleRepository from '../src/model/redis/bookedScheduleRepository.js';
import User from '../src/model/mongodb/userModel.js';
import DeletedBooking from '../src/model/mongodb/deletedBookingModel.js';
import { generateRefreshToken, generateToken } from '../src/utils/jwtHelper.js';
import { ACCESS_TOKEN_EXPIRE_MINUTE, REFRESH_TOKEN_EXPIRE_DAY } from '../src/config/env.js';
import { DateTime } from 'luxon';
import generateRandomString from '../src/utils/generateRandomString.js';
import connectMongoDb from "../src/config/mongodb.js";

export const createTempUser= async () => {
  return await UserTemp.create({
    name: "Ramdhan",
    city: "Wado",
    district: "Malangbong",
    sub_district: "Cisarua",
    email: "dhan@yahoo.com",
    password: "secre832jf92t",
    img_url: "",
    role: ROLES.CUSTOMER,
    key: generateRandomString()
  })
}

export const getField = async () => {
  return await Field.find()
}

export const login = async () => {
  const accessToken = generateToken(EXISTING_USER.email, ACCESS_TOKEN_EXPIRE_MINUTE)
  const refreshToken = generateRefreshToken(EXISTING_USER.email, REFRESH_TOKEN_EXPIRE_DAY)
  const info = {
    browser: '',
    os: '',
    platform: '',
    device: ''
  }
  const tokenId = generateRandomString()
  const refreshTokenId = generateRandomString()
  const currentTime = new Date((DateTime.now().setZone('Asia/Jakarta')).toMillis())

  const user = await User.findOne({email: EXISTING_USER.email})

  let tokenEntity = {
    id: tokenId,
    user_id: user._id.toString(),
    role: user.role,
    token: accessToken,
    created_at: currentTime,
    updated_at: currentTime
  }
  tokenEntity = await tokenRepository.save(tokenEntity)
  const ttlInSeconds = 60 * ACCESS_TOKEN_EXPIRE_MINUTE
  await tokenRepository.expire(tokenEntity[EntityId], ttlInSeconds)

  let refreshTokenEntity = {
    id: refreshTokenId,
    access_token_id: tokenId,
    user_id: user._id.toString(),
    refresh_token: refreshToken,
    browser: info.browser,
    os: info.os,
    platform: info.platform,
    device: info.device,
    created_at: currentTime,
    updated_at: currentTime
  } 
  refreshTokenEntity = await refreshTokenRepository.save(refreshTokenEntity)
  const ttlRefreshTokenInSeconds = 60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAY
  await refreshTokenRepository.expire(refreshTokenEntity[EntityId], ttlRefreshTokenInSeconds)

  return {
    accessToken,
    accessTokenId: tokenId,
    refreshToken,
    refreshTokenId
  }
}

export const deleteSessionInRedis = async (accessTokenId, refreshTokenId) => {
  // remove refresh token
  let refreshToken = await refreshTokenRepository.search()
    .where('id').matchExact(refreshTokenId)
    .return.all()
  refreshToken = refreshToken[0]
  await refreshTokenRepository.remove(refreshToken[EntityId])

  // remove all access tokens
  let accessToken = await tokenRepository.search()
    .where('id').matchExact(accessTokenId)
    .return.all()
  accessToken = accessToken[0]
  await tokenRepository.remove(accessToken[EntityId])
}

export const deleteAllSessionInRedis= async () => {
  const refreshTokens = await refreshTokenRepository.search().return.all()
  for(const refreshToken of refreshTokens) {
    await refreshTokenRepository.remove(refreshToken[EntityId])
  }
  const accessTokens = await tokenRepository.search().return.all()
  for(const accessToken of accessTokens) {
    await tokenRepository.remove(accessToken[EntityId])
  }
}

export const restoreReviews = async () => {
  // get reviews
  const reviews = await Review.find()
  const newReviews = reviews.filter((e, idx) => {
    if(idx >= 5) return e
  })

  // delete those in mongodb and redis
  for(const review of newReviews) {
    await Review.findByIdAndDelete(review._id.toString())
    let cacheReview = await reviewRepository.search()
      .where('id').match(review._id.toString())
      .return.all()
    cacheReview = cacheReview[0]
    await reviewRepository.remove(cacheReview[EntityId])
  }
}

export const closeServer = async () => {
    // close server
    app.close()
    // disconnect db
    await mongoose.disconnect()
    await redisClient.quit()
}

export const openServer = async () => {
  await connectMongoDb(true)
  await connectRedis(true)
}

export const getExistingBooking = async (fieldId) => {
  return (await Booking.find(!fieldId ? {} : ({
    field_id: fieldId
  })))[0]
}

export const restoreBookings = async () => {
  const bookings = await Booking.find()
  const newBookings = bookings.filter((e, idx) => {
    if(idx >= 3) return e
  })
  for(const booking of newBookings) {
    await Booking.findByIdAndDelete(booking._id.toString())
    let cacheBooking = await bookedScheduleRepository.search()
      .where('id').match(booking._id.toString())
      .return.all()
    cacheBooking = cacheBooking[0]
    await bookedScheduleRepository.remove(cacheBooking[EntityId])
  }
}

export const createBooking = async () => {
  const field = await Field.findOne()
  const user = await User.findOne({
    email: EXISTING_USER.email
  })
  let schedule = new Date()
  schedule.setHours(14, 0, 0, 0)
  schedule = schedule.getTime() + 86400000
  const booking = await Booking.create({
    user_id: user._id.toString(),
    field_id: field._id.toString(),
    schedule,
    status: 'pending',
    payment_type: 'POA',
    payment_token: '123',
    payment_status: 'pending',
  })
  await bookedScheduleRepository.save({
    id: booking._id.toString(),
    user_id: user._id.toString(),
    field_id: field._id.toString(),
    schedule
  })
  return booking._id.toString()
}

export const clearDeletedBookings = async () => {
  await DeletedBooking.deleteMany()
}