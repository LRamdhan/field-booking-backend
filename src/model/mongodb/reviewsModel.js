import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  field_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: [true, 'Field ID is required'],
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  }
},  {
  timestamps: true
})

const Review = mongoose.model('Review', reviewSchema)

export default Review
