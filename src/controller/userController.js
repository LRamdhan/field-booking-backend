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
      await User.create({
        name,
        city,
        district,
        sub_district,
        img_url,
        role,
        email,
        password
      })

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
      const accessToken = generateToken(user.email)
      const refreshToken = generateRefreshToken(user.email)

      const info = {
        browser: req.useragent.browser,
        os: req.useragent.os,
        platform: req.useragent.platform,
      }

      switch(true) {
        case req.useragent.isTablet :
          info.device = 'Tablet'
          break
        case req.useragent.isiPad :
          info.device = 'IPad'
          break
        case req.useragent.isiPod :
          info.device = 'IPod'
          break
        case req.useragent.isiPhone :
          info.device = 'Phone'
          break
        case req.useragent.isiPhoneNative :
          info.device = 'PhoneNative'
          break
        case req.useragent.isAndroid :
          info.device = 'Android'
          break
        case req.useragent.isAndroidNative :
          info.device = 'AndroidNative'
          break
        case req.useragent.isBlackberry :
          info.device = 'Blackberry'
          break
        case req.useragent.isDesktop :
          info.device = 'Desktop'
          break
      }

      let tokenEntity = {
        user_id: user._id.toString(),
        browser: info.browser,
        os: info.os,
        platform: info.platform,
        device: info.device,
        token: accessToken,
        created_at: new Date(),
        updated_at: new Date()
      }
      tokenEntity = await tokenRepository.save(tokenEntity)
      const ttlInSeconds = 60 * 60 * 15
      await tokenRepository.expire(tokenEntity[EntityId], ttlInSeconds)

      let refreshTokenEntity = {
        user_id: user._id.toString(),
        refresh_token: refreshToken
      }
      await refreshTokenRepository.save(refreshTokenEntity)

      // set cookies using cookie-parser
      res.cookie('access_token', accessToken, {
        httpOnly: false,
        secure: false,
        maxAge: 15 * 60 * 1000
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: false,
        secure: false,
      });

      // redirect
      res.redirect(FRONTEND_BASE_URL)
    } catch(err) {
      next(new OauthError(err.message))
    }
  },


  
}

export default userController