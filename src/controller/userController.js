import validate from "./../validation/validate.js"
import responseApi from "./../utils/responseApi.js"
import userValidation from "./../validation/userValidation.js"
import User from "./../model/mongodb/userModel.js"
import DatabaseError from "./../exception/DatabaseError.js"
import UserTemp from "./../model/mongodb/userTempModel.js"
import ROLES from "./../constant/roles.js"
import { v4 as uuidv4 } from 'uuid';
import sendConfirmEmail from "./../utils/email.js"
import ValidationError from "./../exception/ValidationError.js"
import fs from 'fs/promises'
import { authorizationUrl } from "./../config/googleAuth.js"
import getUserGoogleInfo from "./../utils/googleApi.js"
import { FRONTEND_BASE_URL } from "./../config/env.js"
import OauthError from "./../exception/OauthError.js"
import { generateRefreshToken, generateToken } from "../utils/jwtHelper.js"
import tokenRepository from "../model/redis/tokenRepository.js"
import { EntityId } from 'redis-om'
import refreshTokenRepository from "../model/redis/refreshTokenRepository.js"
import ConnectedWsUserRepository from "../model/redis/ConnectedWsUserRepository.js"
import { wsServer } from "../config/expressConfig.js"
import { getDeviceInfo } from "./../utils/userAgentHelper.js"
import jwt from 'jsonwebtoken'

const createSession = async (user, req) => {
  const accessToken = generateToken(user.email)
  const refreshToken = generateRefreshToken(user.email)
  const info = getDeviceInfo(req)
  const tokenId = uuidv4()
  const refreshTokenId = uuidv4()
  const currentTime = new Date()

  let tokenEntity = {
    id: tokenId,
    user_id: user._id.toString(),
    role: user.role,
    token: accessToken,
    created_at: currentTime,
    updated_at: currentTime
  }
  tokenEntity = await tokenRepository.save(tokenEntity)
  const ttlInSeconds = 60 * 15
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
  const ttlRefreshTokenInSeconds = 60 * 60 * 24 * 30
  await refreshTokenRepository.expire(refreshTokenEntity[EntityId], ttlRefreshTokenInSeconds)

  return {accessToken, refreshToken}
}

const userController = {
  register: async (req, res, next) => {
    try {
      // validate
      const body = validate(userValidation.register, req.body)

      // check email in db
      const result = await User.findOne({ email: body.email })
      if(result) {
        throw new DatabaseError('Email already exist')
      }

      // check user in temp colletion and insert
      const user = await UserTemp.findOne({ email: body.email })
      if(user) {
        await UserTemp.findByIdAndDelete(user._id)
      }
      const newUser = await UserTemp.create({
        ...body,
        img_url: "",
        role: ROLES.CUSTOMER,
        key: uuidv4()
      })

      // send email confirmation
      await sendConfirmEmail(newUser.email, newUser.key)

      // response
      return responseApi.success(res, {
        message: "Silahkan lakukan konfirmasi melalui email yang telah kami kirim"
      }, 200)
    } catch(err) {
      next(err)
    }
  },

  confirmEmail: async (req, res, next) => {
    try {
      // validate
      if(!req.query.key || req.query.key.trim().length === 0) {
        const html = (await fs.readFile('./src/view/invalid-key.html')).toString()
        throw new ValidationError('Key is required', 'html', html)
      }

      // check user in UserTemp colletion
      const user = await UserTemp.findOne({ key: req.query.key })
      if(!user) {
        const html = (await fs.readFile('./src/view/expired-key.html')).toString()
        throw new DatabaseError('Key not found', 400, 'html', html)
      }
      await UserTemp.findByIdAndDelete(user._id)

      // insert to user
      const {name, city, district, sub_district, img_url, role, email, password} = user
      const newUser = await User.create({
        name,
        city,
        district,
        sub_district,
        img_url,
        role,
        email,
        password
      })

      // web socket
      let connectedUser = await ConnectedWsUserRepository.search()
        .where('email').equals(email)
        .return.all()

      if(connectedUser.length > 0) {
        connectedUser = connectedUser[0]

        // generate token and access token, store to redis
        const {accessToken, refreshToken} = await createSession(newUser, req)

        // send access token and refresh token via web socket
        wsServer.to(connectedUser.ws_id).emit('register', JSON.stringify({
          accessToken,
          refreshToken
        }));
      }

      // response
      const html = (await fs.readFile('./src/view/confirm-success.html')).toString()
      return responseApi.html(res, html, 201)
    } catch(err) {
      next(err)
    }
  },

  loginGoogle: (req, res, next) => {
    try {
      res.redirect(authorizationUrl)
    } catch(err) {
      next(new OauthError(err.message))
    }
  },

  processGoogleLogin: async (req, res, next) => {
    try {
      // get user's data
      const data = await getUserGoogleInfo(req)

      // check user, if not exist -> insert
      let user = await User.findOne({ email: data.email })
      if(!user) {
        user = new User({
          name: data.name,
          email: data.email,
          img_url: data.picture,
          role: ROLES.CUSTOMER
        })
        await user.save()
      }      
      
      // generate token and access token, store to redis
      const {accessToken, refreshToken} = await createSession(user, req)
      
      // set cookies using cookie-parser
      res.cookie('access_token', accessToken, {
        httpOnly: false,
        secure: false,
        maxAge: 15 * 60 * 1000
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: false,
        secure: false,
        maxAge: 60 * 60 * 24 * 30 * 1000
      });

      // redirect
      res.redirect(FRONTEND_BASE_URL)
    } catch(err) {
      next(new OauthError(err.message))
    }
  },

  login: async (req, res, next) => {
    try {
      // validasi email & password (joi)
      const result = validate(userValidation.login, req.body)

      // check user di db, jika tidak ada throw error
      const user = await User.findOne({ email: result.email })
      if(!user) {
        throw new DatabaseError('User not found')
      } 

      // verify password
      const isMatch = await user.comparePassword(result.password)
      if(!isMatch) {
        throw new DatabaseError('Password not match')
      }

      // generate token and access token, store to redis
      const {accessToken, refreshToken} = await createSession(user, req)

      // response
      responseApi.success(res, {
        accessToken,
        refreshToken
      })
    } catch(err) {
      next(err)
    }
  },

  logout: async (req, res, next) => { 
    try {
      // delete access token and refresh token in redis
      const token = req.headers.authorization.split(' ')[1];
      const accessToken = await tokenRepository.search()
        .where('token').equals(token)
        .return.all()

      await tokenRepository.remove(accessToken[0][EntityId])

      const accessTokenId = accessToken[0].id

      const refreshToken = await refreshTokenRepository.search()
        .where('access_token_id').equals(accessTokenId)
        .return.all()

      await refreshTokenRepository.remove(refreshToken[0][EntityId])
          
      // response
      responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      // validate
      const { refresh_token } = validate(userValidation.refreshToken, req.body)

      // check refresh token in redis, if not exist -> throw error
      let existingRefreshToken = await refreshTokenRepository.search()
        .where('refresh_token').equals(refresh_token)
        .return.all()
      if(existingRefreshToken.length === 0) {
        throw new DatabaseError('Refresh token not found', 404)
      }
      existingRefreshToken = existingRefreshToken[0]

      // extract email from refresh token
      const userEmail = jwt.decode(existingRefreshToken.refresh_token).email

      // generate access token and store to redis
      const user = await User.findOne({ email: userEmail })
      const accessToken = generateToken(user.email)
      const accessTokenId = uuidv4()
      let tokenEntity = {
        id: accessTokenId,
        user_id: user._id.toString(),
        role: user.role,
        token: accessToken,
        created_at: new Date(),
        updated_at: new Date()
      }
      tokenEntity = await tokenRepository.save(tokenEntity)
      const ttlInSeconds = 60 * 15
      await tokenRepository.expire(tokenEntity[EntityId], ttlInSeconds)

      // update refresh token's access_token_id with new access token's id in redis
      existingRefreshToken.access_token_id = accessTokenId
      await refreshTokenRepository.save(existingRefreshToken)

      // response new access token
      responseApi.success(res, { access_token: accessToken })
    } catch(err) {
      next(err)
    }
  }
}

export default userController