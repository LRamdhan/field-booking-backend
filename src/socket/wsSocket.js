import ConnectedWsUserRepository from "./../model/redis/ConnectedWsUserRepository.js";
import { EntityId } from 'redis-om'

const wsSocket = socket => {
  console.log(socket.id + ' connected');

  socket.on('disconnect', async () => {
    const existingUser = await ConnectedWsUserRepository.search()
      .where('ws_id').equals(socket.id)
      .return.all()
      if(existingUser.length > 0) {
        existingUser.forEach(async user => {
          await ConnectedWsUserRepository.remove(user[EntityId])
        })
      }
  });
}

export default wsSocket