import ROLES from "./../constant/roles.js";
import connectMongoDb from "./../config/mongodb.js";
import User from "./../model/mongodb/userModel.js";
import process from 'process'
import refreshTokenRepository from "./../model/redis/refreshTokenRepository.js";
import tokenRepository from "./../model/redis/tokenRepository.js";
import { connectRedis } from "./../config/redisConfig.js";

const createUsers = async () => {
  await User.create([
    {
      name: 'Luzi Ramdan',
      city: 'Sumedang',
      district: 'Cisitu',
      sub_district: 'Situmekar',
      role: ROLES.CUSTOMER,
      email: 'luji@gmail.com',
      password: 'satudua12',
    },
    {
      name: 'Ujang Kurniawan',
      city: 'Bandung',
      district: 'Cisaraten',
      sub_district: 'Gunung Kidul',
      role: ROLES.CUSTOMER,
      email: 'kurniawan@gmail.com',
      password: 'empatlima45',
    },
  ])
}

const createRedisIndex = async () => {
  await refreshTokenRepository.createIndex();
  await tokenRepository.createIndex();
}

(async () => {
  try {
    await connectMongoDb()
    await User.deleteMany();
    console.log('Database is clear');
    await createUsers()
    console.log('New entries is inserted');
    await connectRedis()
    await createRedisIndex()
    console.log('Redis index is created');
    console.log('Seed success');
  } catch(err) {
    console.log('Seed fail');
    console.log(err.message);
  }
  process.exit(1)
})()