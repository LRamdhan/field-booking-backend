import mongoose from "mongoose";
import ROLES from "../../constant/roles.js";
import bcrypt from 'bcrypt'

const userTempSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  city: {
    type: String,
    trim: true,
    default: ""
  },
  district: {
    type: String,
    trim: true,
    default: ""
  },
  sub_district: {
    type: String,
    trim: true,
    default: ""
  },
  img_url: {
    type: String,
    trim: true,
    default: ""
  },
  role: {
    type: String,
    required: [true, 'Role must be specified'],
    enum : [ROLES.CUSTOMER, ROLES.ADMIN],
    default: ROLES.CUSTOMER
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  key: {
    type: String,
    required: [true, 'Key is required'],
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: {
      expires: '30min'
    }
  },
})

userTempSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const UserTemp = mongoose.model('User_Temp', userTempSchema)

export default UserTemp