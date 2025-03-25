import ConnectedWsUserRepository from "../model/redis/ConnectedWsUserRepository.js";
import { EntityId } from 'redis-om'

const checkEmail = async (socket, next) => {
  const email = socket.handshake.auth.email
  if(email) {
    // check email in redis
    const existingUser = await ConnectedWsUserRepository.search()
      .where('email').equals(email)
      .return.all()

    // if exist, delete it
    if(existingUser.length > 0) {
      existingUser.forEach(async user => {
        await ConnectedWsUserRepository.remove(user[EntityId])
      })
    }

    // insert the new one
    const newUser = await ConnectedWsUserRepository.save({
      email,
      ws_id: socket.id
    })
    const ttlInSeconds = 60 * 60 * 30
    await ConnectedWsUserRepository.expire(newUser[EntityId], ttlInSeconds)

    next()
  } else {
    next(new Error('message'));
  }
}

export default checkEmail