import { v4 as uuidv4 } from 'uuid';

const generateRandomString = () => {
  let str = uuidv4()
  str = str.replaceAll('-', '')
  return str
}

export default generateRandomString