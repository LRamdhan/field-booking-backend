import { ACCESS_TOKEN_EXPIRE_MINUTE, REFRESH_TOKEN_EXPIRE_DAY } from "../config/env"
import { getDeviceInfo } from "./userAgentHelper";
import { DateTime } from "luxon";
import tokenRepository from "../model/redis/tokenRepository";
import refreshTokenRepository from "../model/redis/refreshTokenRepository";
import { generateRefreshToken, generateToken } from "./jwtHelper";
import { EntityId } from "redis-om";
import generateRandomString from "./generateRandomString";

export const createSession = async (user, req) => {
  const accessToken = generateToken(user.email, ACCESS_TOKEN_EXPIRE_MINUTE)
  const refreshToken = generateRefreshToken(user.email, REFRESH_TOKEN_EXPIRE_DAY)
  const info = getDeviceInfo(req)
  const tokenId = generateRandomString()
  const refreshTokenId = generateRandomString()
  const currentTime = new Date((DateTime.now().setZone('Asia/Jakarta')).toMillis())

  let tokenEntity = {
    id: tokenId,
    user_id: user._id.toString(),
    role: user.role,
    token: accessToken,
    created_at: currentTime,
    updated_at: currentTime
  }
  tokenEntity = await tokenRepository.save(tokenEntity)
  const ttlInSeconds = 60 * ACCESS_TOKEN_EXPIRE_MINUTE
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
  const ttlRefreshTokenInSeconds = 60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAY
  await refreshTokenRepository.expire(refreshTokenEntity[EntityId], ttlRefreshTokenInSeconds)

  return {accessToken, refreshToken}
}