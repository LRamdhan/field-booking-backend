import ROLES from "./../constant/roles.js";
import connectMongoDb from "./../config/mongodb.js";
import User from "./../model/mongodb/userModel.js";
import process from 'process'
import refreshTokenRepository from "./../model/redis/refreshTokenRepository.js";
import tokenRepository from "./../model/redis/tokenRepository.js";
import { connectRedis } from "./../config/redisConfig.js";
import bcrypt from 'bcrypt'
import ConnectedWsUserRepository from "../model/redis/ConnectedWsUserRepository.js";
import { EntityId } from "redis-om";
import Field from "../model/mongodb/fieldModel.js";
import Booking from "../model/mongodb/bookingModel.js";
import Review from "../model/mongodb/reviewsModel.js";
import bookedScheduleRepository from "../model/redis/bookedScheduleRepository.js";
import fieldRepository from "../model/redis/fieldRepository.js";
import reviewRepository from "../model/redis/reviewRepository.js";
import DeletedBooking from "../model/mongodb/deletedBookingModel.js";
import redisConnection from "../config/redisConnection.js";
import otpRepository from "../model/redis/otpRepository.js";

const createUsers = async () => {
  const users = await User.create([
    {
      name: 'Udin Samshudin',
      city: 'Sumedang',
      district: 'Cisitu',
      sub_district: 'Situmekar',
      img_url: "https://avatar.iran.liara.run/public/29",
      role: ROLES.CUSTOMER,
      email: 'udin@gmail.com',
      password: await bcrypt.hash('satudua12', 12),
    },
    {
      name: 'Ujang Kurniawan',
      city: 'Bandung',
      district: 'Cisaraten',
      sub_district: 'Gunung Kidul',
      img_url: "https://avatar.iran.liara.run/public/32",
      role: ROLES.CUSTOMER,
      email: 'kurniawan@gmail.com',
      password: await bcrypt.hash('empatlima45', 12),
    },
    {
      name: 'Samsul Samsudin',
      city: 'Sumedang',
      district: 'Cisitu',
      sub_district: 'Ujung Jaya',
      img_url: "https://avatar.iran.liara.run/public/32",
      role: ROLES.ADMIN,
      email: 'samsul@gmail.com',
      password: await bcrypt.hash('lahkok3456', 12),
    },
  ])
  return users.map(e => e._id)
}

const createFields = async () => {
  return await Field.create([
    {
      name: 'Lapang A',
      images: [
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734402124/wzus5d6y7qk6ydrh8gep.jpg',
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734402192/qbqiervmu81ymesftoiq.jpg',
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734402230/g6ktakbijvbtput1bagj.jpg'
      ],
      price: '100000',
      rating: 0,
      location: 'OUTDOOR',
      floor_type: 'SINTETIS',
      facilities: [
        'P3K',
        'Scoring Board',
        'Seats',
        'Backup Balls'
      ]
    },
    {
      name: 'Lapang B',
      images: [
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734402795/pab9m4q7wljnrctkqjdn.jpg',
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734402838/smc9bs1ppt70vqlyqttw.jpg',
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734402869/jhlnvrqhfrqyimmp3i9t.jpg'
      ],
      price: '120000',
      rating: 0,
      location: 'INDOOR',
      floor_type: 'INTERLOCK',
      facilities: [
        'Scoring Board',
        'Backup Balls',
        'Net'
      ]
    },
    {
      name: 'Lapang C',
      images: [
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734403791/gwaxlvheco4qaguj9cbt.jpg',
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734403820/cwkaepcsfcxtmyudqi6e.jpg',
        'https://res.cloudinary.com/dfemddtv2/image/upload/v1734403847/ktgf695pt6hc9oqrbzih.jpg'
      ],
      price: '90000',
      rating: 0,
      location: 'INDOOR',
      floor_type: 'VINYL',
      facilities: [
        'Scoring Board',
        'Backup Balls',
        'Net',
        'P3K',
      ]
    },
  ])
}

const createFieldCache = async (fields) => {
  const records = fields.map(e => ({
    id: e._id.toString(),
    name: e.name,
    images: e.images,
    price: e.price,
    rating: e.rating,
    location: e.location,
    floor_type: e.floor_type,
    facilities: e.facilities,
  }))

  for(const record of records) {
    await fieldRepository.save(record)
  }
  // await fieldRepository.save(records[0])
  // await fieldRepository.save(records[1])
  // await fieldRepository.save(records[2])
}

const resetRedis = async () => {
  const refreshTokens = await refreshTokenRepository.search().return.all()
  for(const refreshToken of refreshTokens) {
    await refreshTokenRepository.remove(refreshToken[EntityId])
  }
  const accessTokens = await tokenRepository.search().return.all()
  for(const accessToken of accessTokens) {
    await tokenRepository.remove(accessToken[EntityId])
  }
  const connectedWsUsers = await ConnectedWsUserRepository.search().return.all()
  for(const connectedWsUser of connectedWsUsers) {
    await ConnectedWsUserRepository.remove(connectedWsUser[EntityId])
  }
  const bookedSchedules = await bookedScheduleRepository.search().return.all()
  for(const bookedSchedule of bookedSchedules) {
    await bookedScheduleRepository.remove(bookedSchedule[EntityId])
  }
  const fields = await fieldRepository.search().return.all()
  for(const field of fields) {
    await fieldRepository.remove(field[EntityId])
  }
  const reviews = await reviewRepository.search().return.all()
  for(const review of reviews) {
    await reviewRepository.remove(review[EntityId])
  }
  const otps = await otpRepository.search().return.all()
  for(const otp of otps) {
    await otpRepository.remove(otp[EntityId])
  }
}

const createRedisIndex = async () => {
  await refreshTokenRepository.createIndex();
  await tokenRepository.createIndex();
  await ConnectedWsUserRepository.createIndex();
  await bookedScheduleRepository.createIndex();
  await fieldRepository.createIndex();
  await reviewRepository.createIndex();
  await otpRepository.createIndex();
}

const resetJobInRedis = () => {
  const stream = redisConnection.scanStream('bull*');
  stream.on('data', (keys) => {
    redisConnection.del(keys);
  });
}

(async () => {
  try {
    // connect mongodb
    await connectMongoDb()

    // delete all mongodb
    await User.deleteMany();
    await Field.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await DeletedBooking.deleteMany();
    console.log('MongoDB is clear');

    // mongodb operation
    const users = await createUsers()
    console.log('New entries is inserted');
    const fields = await createFields()
    console.log('New fields is inserted');

    // connect redis
    await connectRedis()

    // create redis index 1
    await createRedisIndex()
    console.log('Redis index is created (1)');

    // delete all redis
    await resetRedis()
    resetJobInRedis()
    console.log('Redis is clear');

    // create redis index 2
    await createRedisIndex()
    console.log('Redis index is created (2)');

    // redis operation
    await createFieldCache(fields)
    console.log('Field Cache is inserted');

    console.log('Seed success');
  } catch(err) {
    console.log('Seed fail');
    console.log(err);
    process.exit(1)
  }
  process.exit(1)
})()