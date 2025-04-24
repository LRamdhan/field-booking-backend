import { v4 as uuidv4 } from 'uuid';
import ROLES from "./../src/constant/roles.js"
import UserTemp from './../src/model/mongodb/userTempModel.js';

export async function createTempUser() {
  return await UserTemp.create({
    name: "Ramdhan",
    city: "Wado",
    district: "Malangbong",
    sub_district: "Cisarua",
    email: "dhan@yahoo.com",
    password: "secre832jf92t",
    img_url: "",
    role: ROLES.CUSTOMER,
    key: uuidv4()
  })
}