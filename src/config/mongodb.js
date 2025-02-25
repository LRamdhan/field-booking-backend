import mongoose from "mongoose"
import { MONGODB_URL } from "./env.js";

const connectMongoDb = async () => {
  while(true) {
    try {
      await mongoose.connect(MONGODB_URL) 
      console.log('Conected to mongodb');
      break
    } catch(err) {
      console.log('Fail conected to mongodb');
      console.log(err.message);
      let dot = ""
      for(let i = 1; i <= 3; i++) {
        dot+= "."
        await new Promise(resolve => setTimeout(() => resolve(), 1000))
          .then(() => console.log('Conecting' + dot)) 
      }
    }
  }
}

export default connectMongoDb