import mongoose from "mongoose";
import ROLES from "../../constant/roles.js";
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'First name is required'],
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
    minlength: [6, 'Password must be at least 6 characters']
  },
}, {
  timestamps: true
})

userSchema.pre('save', async function(next) {
  if (this.isNew) return next();
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema)

export default User