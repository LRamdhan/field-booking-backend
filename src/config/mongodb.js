import mongoose from "mongoose"
import { MONGODB_URL } from "./env.js";

const connectMongoDb = async () => {
  try {
    await mongoose.connect(MONGODB_URL)
    console.log('Mongodb is connected');
  } catch(err) {
    console.log('Fail conected to mongodb');
    console.log(err.message);
  }
}

export default connectMongoDb