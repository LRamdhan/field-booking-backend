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
  }


  
}

export default userController