import midtransClient from 'midtrans-client'
import { MIDTRANS_SERVER_KEY } from './env.js';

let snap = new midtransClient.Snap({
  isProduction : false,
  serverKey : MIDTRANS_SERVER_KEY
});

const startTransaction = async param => {
  return await snap.createTransaction(param)
    .then((transaction)=>{
      let transactionToken = transaction.token;
      return transactionToken
    })
}

export default startTransaction