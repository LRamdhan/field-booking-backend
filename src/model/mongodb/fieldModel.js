import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  images: {
    type: [String],
    required: [true, 'Images is required'],
  },
  price: {
    type: String,
    required: [true, 'Price is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
  },
  location: {
    type: String,
    enum: ['INDOOR', 'OUTDOOR'],
    required: [true, 'Location is required'],
  },
  floor_type: {
    type: String,
    enum: ['SINTETIS', 'VINYL', 'INTERLOCK'],
    required: [true, 'Floor type is required'],
  },
  facilities: {
    type: [String],
    required: [true, 'Facilities is required'],
  }
},  {
  timestamps: true
})

const Field = mongoose.model('Field', fieldSchema)

export default Field
