import jwt from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } from './../config/env.js';

function generateToken(email, expireSeconds) {
  return jwt.sign({email}, JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: expireSeconds +'m',
    algorithm: 'HS384'
  });
}

function generateRefreshToken(email, expireDays) {
  return jwt.sign({email}, JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: expireDays + 'days',
    algorithm: 'HS384'
  });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, {
    algorithms: ['HS384']
  });
}

export { generateToken, generateRefreshToken, verifyToken }