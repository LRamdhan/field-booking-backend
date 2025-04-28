import DatabaseError from "../exception/DatabaseError.js";
import { verifyToken } from "../utils/jwtHelper.js";
import tokenRepository from "./../model/redis/tokenRepository.js";

const checkToken = (...roles) => async (req, res, next) => {
  try {
    // check token
    if(!req.headers.authorization) {
      throw new DatabaseError('Token is required', 401)
    }

    // check token in redis, if not exist -> throw error
    const token = req.headers.authorization.split(' ')[1];
    let existingToken = await tokenRepository.search()
      .where('token').equals(token)
      .return.all()
    if(existingToken.length === 0) {
      throw new DatabaseError('Token is expired', 401)
    }

    // verify token using it's secret, if not match -> throw error
    existingToken = existingToken[0]
    let verfiedToken
    try {
      verfiedToken = verifyToken(existingToken.token);
    } catch(err) {
      throw new DatabaseError('Token is invalid', 401)
    }

    // check role, if not match -> throw error
    if(!roles.includes(existingToken.role)) {
      throw new DatabaseError('You are not allowed to access this resource', 403)
    }

    // get it's user_id and pass it to req
    req.user_id = existingToken.user_id
    req.user_email = verfiedToken.email

    next()
  } catch(err) {
    next(err)
  }
}

export default checkToken