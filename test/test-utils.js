import { v4 as uuidv4 } from 'uuid';
import ROLES from "./../src/constant/roles.js"
import UserTemp from './../src/model/mongodb/userTempModel.js';
import Field from '../src/model/mongodb/fieldModel.js';
import supertest from 'supertest';
import refreshTokenRepository from '../src/model/redis/refreshTokenRepository.js';
import tokenRepository from '../src/model/redis/tokenRepository.js';
import { app } from '../src/config/expressConfig.js';
import { EntityId } from 'redis-om';
import EXISTING_USER from '../src/constant/user.js';
import Review from '../src/model/mongodb/reviewsModel.js';
import reviewRepository from '../src/model/redis/reviewRepository.js';

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
    key: uuidv4()
  })
}

export const getField = async () => {
  return await Field.find()
}

export const login = async () => {
  return await supertest(app)
    .post('/api/users/login')
    .set('content-type', 'application/json')
    .send({
      email: EXISTING_USER.email,
      password: EXISTING_USER.password
    })
}

export const deleteSessionInRedis = async () => {
  // remove all refresh tokens
  const refreshTokens = await refreshTokenRepository.search().return.all()
  for(const refreshToken of refreshTokens) {
    await refreshTokenRepository.remove(refreshToken[EntityId])
  }
  // remove all access tokens
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