import { FRONTEND_ERROR_URL } from "../config/env.js"
import OauthError from "./../exception/OauthError.js"
import DatabaseError from "./../exception/DatabaseError.js"
import ValidationError from "./../exception/ValidationError.js"
import responseApi from "./../utils/responseApi.js"

const errorHandler = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    if(err.responseType === 'html') {
      return responseApi.html(res, err.html)
    }
    return responseApi.badRequest(res, err.message)
  }

  if(err instanceof DatabaseError) {
    if(err.responseType === 'html') {
      return responseApi.html(res, err.html, err.responseCode)
    }
    if(err.body) {
      return responseApi.error(res, err.message, err.responseCode, {
        ...err.body
      })
    }
    return responseApi.error(res, err.message, err.responseCode)
  }

  if(err instanceof OauthError) {
    console.log(err.message);
    return res.redirect(FRONTEND_ERROR_URL)
  }

  console.log(err.message);
  return responseApi.serverError(res, err)
}

export default errorHandler