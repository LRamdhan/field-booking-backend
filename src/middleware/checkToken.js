import DatabaseError from "../exception/DatabaseError.js";
import { verifyToken } from "../utils/jwtHelper.js";
import tokenRepository from "./../model/redis/tokenRepository.js";

const checkToken = async (req, res, next) => {
  try {
    // check token in redis, if not exist -> throw error
    const token = req.headers.authorization.split(' ')[1];
    let existingToken = await tokenRepository.search()
      .where('token').equals(token)
      .return.all()
    if(existingToken.length === 0) {
      throw new DatabaseError('Token not found', 401)
    }

    // verify token using it's secret, if not match -> throw error
    existingToken = existingToken[0]
    try {
      verifyToken(existingToken.token);
    } catch(err) {
      throw new DatabaseError('Token is invalid', 401)
    }

    // get it's user_id and pass it to req
    req.user_id = existingToken.user_id

    next()
  } catch(err) {
    next(err)
  }
}

export default checkToken