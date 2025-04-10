import mongoose from "mongoose";

const deleteBookingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  field_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: [true, 'Field ID is required'],
  },
  schedule: {
    type: Date,
    required: [true, 'Schedule is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'aktif', 'selesai'],
    default: 'pending',
    required: [true, 'Status is required'],
  },
  payment_id: {
    type: String,
  },
  merchant_id: {
    type: String,
  },
  payment_type: {
    type: String,
  },
  payment_token: {
    type: String,
  },
  payment_status: {
    type: String,
    default: 'pending'
  },
  transaction_time: {
    type: String,
  },
  expiry_time: {
    type: String,
  },
  currency: {
    type: String,
  },
},  {
  timestamps: true
})

const DeletedBooking = mongoose.model('DeletedBooking', deleteBookingSchema)

export default DeletedBooking
