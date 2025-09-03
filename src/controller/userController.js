import validate from "./../validation/validate.js"
import responseApi from "./../utils/responseApi.js"
import userValidation from "./../validation/userValidation.js"
import User from "./../model/mongodb/userModel.js"
import DatabaseError from "./../exception/DatabaseError.js"
import UserTemp from "./../model/mongodb/userTempModel.js"
import ROLES from "./../constant/roles.js"
import { sendChangePasswordOTPEmail, sendConfirmEmail, sendResetPasswordLinkEmail } from "./../utils/email.js"
import ValidationError from "./../exception/ValidationError.js"
import fs from 'fs/promises'
import { authorizationUrl } from "./../config/googleAuth.js"
import getUserGoogleInfo from "./../utils/googleApi.js"
import { ACCESS_TOKEN_EXPIRE_MINUTE, FRONTEND_BASE_URL, FRONTEND_RESET_PASSWORD_URL } from "./../config/env.js"
import OauthError from "./../exception/OauthError.js"
import { generateToken } from "../utils/jwtHelper.js"
import tokenRepository from "../model/redis/tokenRepository.js"
import { EntityId } from 'redis-om'
import refreshTokenRepository from "../model/redis/refreshTokenRepository.js"
import ConnectedWsUserRepository from "../model/redis/ConnectedWsUserRepository.js"
import { wsServer } from "../config/expressConfig.js"
import jwt from 'jsonwebtoken'
import { createSession } from "../utils/session.js"
import generateRandomString from "../utils/generateRandomString.js"
import dayjs from "dayjs"
import "dayjs/locale/id.js"
import otpRepository from "../model/redis/otpRepository.js"
import relativeTime from 'dayjs/plugin/relativeTime.js'
import bcrypt from 'bcrypt'
import { checkExistingOtp, checkNotFoundOtp, generateOtp, saveOtp } from "../utils/otp.js"

dayjs.locale('id');
dayjs.extend(relativeTime)

const userController = {
  register: async (req, res, next) => {
    try {
      // validate
      const body = validate(userValidation.register, req.body)

      // check email in db
      const result = await User.findOne({ email: body.email })
      if(result) {
        throw new DatabaseError('Email already exist', 409)
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
        key: generateRandomString()
      })

      // send email confirmation
      await sendConfirmEmail(newUser.email, newUser.key)

      // response
      return responseApi.success(res, {
        message: "Silahkan lakukan konfirmasi melalui email yang telah kami kirim"
      }, 201)
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
        throw new DatabaseError('Key not found', 404, 'html', html)
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
      res.redirect(`${authorizationUrl()}${req.query?.from ? `&state=${encodeURIComponent(req.query.from)}` : ''}`)
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
        maxAge: 15 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
        domain: FRONTEND_BASE_URL
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: false,
        secure: false,
        maxAge: 60 * 60 * 24 * 30 * 1000,
        sameSite: 'lax',
        path: '/',
        domain: FRONTEND_BASE_URL
      });

      // redirect
      res.redirect(req.query?.state ? FRONTEND_BASE_URL + req.query.state : FRONTEND_BASE_URL + '/')
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
        throw new DatabaseError('User not found', 404)
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
        access_token: accessToken,
        refresh_token: refreshToken
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
      const accessToken = generateToken(user.email, ACCESS_TOKEN_EXPIRE_MINUTE)
      const accessTokenId = generateRandomString()
      let tokenEntity = {
        id: accessTokenId,
        user_id: user._id.toString(),
        role: user.role,
        token: accessToken,
        created_at: new Date(),
        updated_at: new Date()
      }
      tokenEntity = await tokenRepository.save(tokenEntity)
      const ttlInSeconds = 60 * ACCESS_TOKEN_EXPIRE_MINUTE
      await tokenRepository.expire(tokenEntity[EntityId], ttlInSeconds)

      // update refresh token's access_token_id with new access token's id in redis
      existingRefreshToken.access_token_id = accessTokenId
      await refreshTokenRepository.save(existingRefreshToken)

      // response new access token
      responseApi.success(res, { access_token: accessToken })
    } catch(err) {
      next(err)
    }
  },

  getProfile: async (req, res, next) => {
    try {
      // get user profile
      const user = await User.findById(req.user_id)
        .select('name email img_url city district sub_district')

      const responseContent = {
        name: user.name,
        email: user.email,
        img_url: user.img_url,
        city: user.city,
        district: user.district,
        sub_district: user.sub_district
      }

      // response
      responseApi.success(res, responseContent)
    } catch(err) {
      next(err)
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      // validate
      const payload = validate(userValidation.updateProfile, req.body)
      
      // update user in mongodb
      const newField = {}
      if(payload.name) {
        newField.name = payload.name
      }
      if(payload.city) {
        newField.city = payload.city
      }
      if(payload.district) {
        newField.district = payload.district
      }
      if(payload.sub_district) {
        newField.sub_district = payload.sub_district
      }
      if(req.file) {
        newField.img_url = req.file.path;
      }
      const updatedUser = await User.findByIdAndUpdate(req.user_id, newField, { new: true })
      
      // response
      return responseApi.success(res, {
        name: updatedUser.name,
        img_url: updatedUser.img_url,
        city: updatedUser.city,
        district: updatedUser.district,
        sub_district: updatedUser.sub_district
      })
    } catch(err) {
      next(err)
    }
  },

  getDevices: async (req, res, next) => {
    try {
      // get devices(refresh token) from redis
      let devices = await refreshTokenRepository.search()
        .where('user_id').equals(req.user_id)
        .return.all()

      // get current session
      const token = req.headers.authorization.split(' ')[1];
      const currentAccessToken = await tokenRepository.search()
        .where('token').equals(token)
        .return.all()
      const currentAccessTokenId = currentAccessToken[0].id
      let currentSession = devices.find(e => e.access_token_id === currentAccessTokenId)
      if(!currentSession) {
        throw new DatabaseError('Current session not found', 401)
      }
      currentSession = {
        id: currentSession.id,
        last_login: dayjs(currentSession.created_at).format('DD MMMM YYYY, HH:mm:ss'),
        os: currentSession.os,
        device: currentSession.device,
        platform: currentSession.platform,
        browser: currentSession.browser
      } 

      // get other session
      devices = devices.filter(e => e.access_token_id !== currentAccessTokenId)
      devices = devices.map(e => {
        const last_login = dayjs(e.created_at).format('DD MMMM YYYY, HH:mm:ss');
        return {
          id: e.id,
          last_login,
          os: e.os,
          device: e.device,
          platform: e.platform,
          browser: e.browser
        }
      })

      // response
      return responseApi.success(res, {
        current: currentSession,
        others: devices
      })
    } catch(err) {
      next(err)
    }
  },

  deleteDevice: async (req, res, next) => {
    try {
      // validate id
      const refreshTokenId = validate(userValidation.deleteDevice, req.params.id)

      // if id is current token -> throw error
      const token = req.headers.authorization.split(' ')[1];
      const currentAccessToken = await tokenRepository.search()
        .where('token').equals(token)
        .return.all()
      const currentAccessTokenId = currentAccessToken[0].id
      let desiredRefreshToken = await refreshTokenRepository.search()
        .where('id').match(refreshTokenId)
        .return.all()
      desiredRefreshToken = desiredRefreshToken[0]
      if(desiredRefreshToken.access_token_id === currentAccessTokenId) {
        throw new DatabaseError('You can not delete your current device', 409)
      }

      // delete refresh token and all related access token in redis
      const matchedAccessToken = await tokenRepository.search()
        .where('id').match(desiredRefreshToken.access_token_id)
        .return.all()
      for(const token of matchedAccessToken) { // even though it uses iteration, buat number of expected access token is one
        await tokenRepository.remove(token[EntityId])
      }
      await refreshTokenRepository.remove(desiredRefreshToken[EntityId])

      // response
      return responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  },

  requestChangePassword: async (req, res, next) => {
    try {
      // check if code/request already exists
      await checkExistingOtp(req.user_email)

      // generate 6 digit unix code
      const code = generateOtp()

      // store to redis with ttl 10 minutes
      await saveOtp(code, req.user_email)

      // sent to user's email
      sendChangePasswordOTPEmail({
        otp: code,
        userEmail: req.user_email
      })

      // response
      return responseApi.success(res, {}, 201, 'Change password OTP has been sent to your email')
    } catch(err) {
      next(err)
    }
  },

  requestResetPassword: async (req, res, next) => {
    try {
      // validate
      const payload = validate(userValidation.requestResetPassword, req.body)

      // check if email exists (in mongodb), if it doesn't exist -> throw error 404
      const user = await User.findOne({ email: payload.email })
      if(!user) {
        throw new DatabaseError('Email is not registered', 404)
      }

      // check if code/request already exists
      await checkExistingOtp(payload.email)

      // generate 6 digit unix code
      const code = generateOtp()

      // store to redis with ttl 10 minutes
      await saveOtp(code, user.email)

      // send link of change password form page to user's email (otp included)
      await sendResetPasswordLinkEmail({
        userEmail: user.email,
        resetPasswordUrl: FRONTEND_RESET_PASSWORD_URL,
        otp: code
      })

      // response
      return responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  },

  changePassword: async (req, res, next) => {
    try {
      // validate
      const payload = validate(userValidation.changePassword, req.body)

      // check otp in redis, if it doesn't exist -> throw error
      const existingOtp = await otpRepository.search()
        .where('otp').equals(payload.otp)
        .return.all()
      if(existingOtp.length === 0) {
        throw new DatabaseError('OTP is invalid', 404)
      }

      // get otp data in redis (email)
      const userEmail = existingOtp[0].email

      // change password in mongodb, including encription
      await User.findOneAndUpdate({ 
        email: userEmail 
      }, { 
        password: await bcrypt.hash(payload.new_password, 12)
      })

      // delete otp in redis
      await otpRepository.remove(existingOtp[0][EntityId])

      // response
      return responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  },

  resendChangePasswordOTP: async (req, res, next) => {
    try {
      // search for desired request (refresh token), if not found -> response 404
      const existingOtp = await checkNotFoundOtp(req.user_email, 'Change Request not found')

      // calculate remaining timeut, if still exists -> response 409
      const lastSentAt = dayjs(existingOtp.last_sent_at) // already in Asia/Jakarta
      const now = dayjs().tz("Asia/Jakarta")
      const gap = now.diff(lastSentAt, 'second')
      if(gap < 60) {
        throw new DatabaseError("Your request can't be done now, try again within given timeout", 409, 'json', null, {
          timeout: 60 - gap
        })
      };

      // sent to user's email
      const otp = generateOtp()
      sendChangePasswordOTPEmail({
        otp,
        userEmail: req.user_email
      })

      // delete and create new otp in redis
      await otpRepository.remove(existingOtp[EntityId])
      await saveOtp(otp, req.user_email)

      // response
      return responseApi.success(res, {timeout: 60}, 200, 'Change password OTP has been sent to your email')
    } catch(err) {
      next(err)
    }
  },

  cancelChangeRequest: async (req, res, next) => {
    try {
      // check if otp exists in redis, if not response 404
      const otp = await checkNotFoundOtp(req.user_email, 'There is no change request found')

      // delete otp in redis based on email
      await otpRepository.remove(otp[EntityId])

      // response
      return responseApi.success(res, {}, 200, 'Successfully delete change request')
    } catch(err) {
      next(err)
    }
  }
}

export default userController