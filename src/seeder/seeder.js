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

const createUsers = async () => {
  await User.create([
    {
      name: 'Luzi Ramdan',
      city: 'Sumedang',
      district: 'Cisitu',
      sub_district: 'Situmekar',
      img_url: "https://avatar.iran.liara.run/public/29",
      role: ROLES.CUSTOMER,
      email: 'luji@gmail.com',
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
  ])
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
}

const createRedisIndex = async () => {
  await refreshTokenRepository.createIndex();
  await tokenRepository.createIndex();
  await ConnectedWsUserRepository.createIndex();
}

(async () => {
  try {
    await connectMongoDb()
    await User.deleteMany();
    console.log('Database is clear');
    await createUsers()
    console.log('New entries is inserted');
    await connectRedis()
    await resetRedis()
    console.log('Redis is reseted');
    await createRedisIndex()
    console.log('Redis index is created');
    console.log('Seed success');
  } catch(err) {
    console.log('Seed fail');
    console.log(err.message);
  }
  process.exit(1)
})()