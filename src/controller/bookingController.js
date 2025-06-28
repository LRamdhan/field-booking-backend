import startTransaction from "../config/midtransSnap.js"
import PAYMENT from "../constant/payment.js"
import DatabaseError from "../exception/DatabaseError.js"
import Booking from "../model/mongodb/bookingModel.js"
import DeletedBooking from "../model/mongodb/deletedBookingModel.js"
import Field from "../model/mongodb/fieldModel.js"
import bookedScheduleRepository from "../model/redis/bookedScheduleRepository.js"
import responseApi from "../utils/responseApi.js"
import bookingValidation from "../validation/bookingValidation.js"
import validate from "../validation/validate.js"
import { EntityId } from 'redis-om'
import generateRandomString from "./../utils/generateRandomString.js"
import addFinishBookingJob from "./../utils/bookingUtils.js"

const bookingController = {
  createBooking : async (req, res, next) => {
    try {
      // validate body
      const body = validate(bookingValidation.create, req.body)

      // check if fields exist, if not exist -> throw error
      let field
      try {
        field = await Field.findById(body.field_id)
        if(!field) {
          throw new Error()
        }
      } catch(err) {
        throw new DatabaseError('Field not found', 404)
      }

      // check if schedule in redis already exists, if it does -> throw error (current)
      const schduleMilis = (new Date(body.schedule)).getTime()
      const booked = await bookedScheduleRepository.search()
        .where('schedule').eq(schduleMilis)
        .and('field_id').eq(body.field_id)
        .return.all()
      if(booked.length > 0) {
        throw new DatabaseError('Schedule already exists', 409)
      }

      const bookingData = {
        user_id: req.user_id,
        field_id: field._id,
        schedule: schduleMilis,
        status: 'pending',
        payment_type: body.payment_type
      }

      // if payment_type is ONLINE, register payment to midtrans
      if(body.payment_type === PAYMENT.ONLINE) {
        const paymentId = generateRandomString()
        const grossAmount = parseInt(field.price)
        let parameter = {
          "transaction_details": {
            "order_id": paymentId,
            "gross_amount": grossAmount
          },
          "credit_card":{
            "secure" : true
          },
          "customer_details": {
            "email": req.user_email,
          }
        };
        const transactionToken = await startTransaction(parameter)
        bookingData.payment_id = paymentId
        bookingData.payment_token = transactionToken
      }

      // insert new booking to mongodb
      const booking = await Booking.create(bookingData)

       // insert new booking cache to redis
      await bookedScheduleRepository.save({
        id: booking._id.toString(),
        user_id: req.user_id.toString(),
        field_id: field._id.toString(),
        schedule: schduleMilis,
      })

      // response, attach payment_token if payment_type is ONLINE
      const response = {
        booking_id: booking._id.toString(),
      }
      if(booking.payment_token) response.payment_token = booking.payment_token
      return responseApi.success(res, response)
    } catch(err) {
      next(err)
    }
  },

  updateTransaction: async (req, res, next) => {
    try {
      // accept midtrans notification
      const paymentInfo = {
        payment_id: req.body.order_id,
        merchant_id: req.body.merchant_id,
        payment_type: req.body.payment_type,
        payment_status: req.body.transaction_status,
        transaction_time: req.body.transaction_time,
        expiry_time: req.body.expiry_time,
        currency: req.body.currency,
      }

      if(paymentInfo.payment_status === 'deny' || paymentInfo.payment_status === 'cancel' || paymentInfo.payment_status === 'expire' || paymentInfo.payment_status === 'failure') {
        // delete booking in mongodb and redis
        const deletedBooking = await Booking.findOneAndDelete({
          payment_id: paymentInfo.payment_id
        })
        const cachedSchdule = await bookedScheduleRepository.search()
          .where('id').match(deletedBooking._id)
          .return.all()
        await bookedScheduleRepository.remove(cachedSchdule[0][EntityId])
      } else {
        // update fields in mongodb
        const updatedBooking = {
          merchant_id: paymentInfo.merchant_id,
          payment_type: paymentInfo.payment_type,
          payment_status: paymentInfo.payment_status,
          transaction_time: paymentInfo.transaction_time,
          expiry_time: paymentInfo.expiry_time,
          currency: paymentInfo.currency,
        }  
        if(paymentInfo.payment_status === 'settlement' || paymentInfo.payment_status === 'capture') {
          updatedBooking.status = 'aktif'
          const currentBooking = await Booking.findOne({
            payment_id: paymentInfo.payment_id
          })
          addFinishBookingJob(currentBooking)
        }
        const booking = await Booking.findOneAndUpdate({
          payment_id: paymentInfo.payment_id
        }, updatedBooking)
      }
      
      // response
      return responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  },

  getBookings: async (req, res, next) => {
    try {
      // validate queries
      const queries = {
        page: req.query.page,
        limit: req.query.limit,
      }
      if(req.query.status) queries.status = req.query.status
      if(req.query.create_order) queries.create_order = req.query.create_order
      if(req.query.field_id) queries.field_id = req.query.field_id
      validate(bookingValidation.getBookings, queries)

      // query to mongodb
      const filter = {
        user_id: req.user_id,
      }
      if(queries.status) filter.status = queries.status
      if(queries.field_id) filter.field_id = queries.field_id
      let bookings = await Booking.find(filter)
        .sort({createdAt: queries.create_order === 'desc' ? -1 : 1})
        .limit(queries.limit)
        .skip(queries.limit * (queries.page -1))
        .populate('field_id', 'name images')
        .select("_id schedule status payment_token field_id isReviewed")
      bookings = bookings.map(e => ({
        id: e._id.toString(),
        field: {
          id: e.field_id._id.toString(),
          name: e.field_id.name,
          img: e.field_id.images[0]
        },
        schedule: e.schedule,
        status: e.status,
        isReviewed: e.isReviewed,
        payment_token: e.payment_token
      }))
      const totalDocuments = await Booking.countDocuments(filter)
      const totalPage = Math.ceil(totalDocuments / queries.limit)

      // response
      const response = {
        page: queries.page,
        limit: queries.limit,
        total_page: totalPage
      }
      if(queries.status) response.status = queries.status
      if(queries.create_order) response.create_order = queries.create_order
      if(queries.field_id) response.field_id = queries.field_id
      response.bookings = bookings
      return responseApi.success(res, response)
    } catch(err) {
      next(err)
    }
  },

  getDetailBooking: async (req, res, next) => {
    try {
      // validate booking id
      const bookingId = validate(bookingValidation.detailBooking, req.params.id)

      // query booking based on user's id
      const booking = await Booking.findById(bookingId)
        .select("_id payment_token status payment_type schedule isReviewed createdAt")
        .populate("field_id", '_id name location images price')

      // if not found
      if(!booking) {
        throw new DatabaseError('Booking not found', 404)
      }

      // response
      const response = {
        id: booking._id.toString(),
        payment_token: booking.payment_token,
        status: booking.status,
        created_date: booking.createdAt,
        schedule: booking.schedule,
        is_reviewed: booking.isReviewed,
        payment_type: booking.payment_type,
        total: booking.field_id.price,
        field: {
          id: booking.field_id._id.toString(),
          name: booking.field_id.name,
          location: booking.field_id.location,
          img: booking.field_id.images[0],
          cost: booking.field_id.price,
        }
      }
      return responseApi.success(res, response)
    } catch(err) {
      next(err)
    }
  },

  deleteBooking: async (req, res, next) => {
    try {
      // validate booking id
      const bookingId = validate(bookingValidation.deleteBooking, req.params.id)

      // delete on booking, status must be 'pending'
      const deletedBooking = await Booking.findOne({
        _id: bookingId,
        status: 'pending',
        user_id: req.user_id
      })
      if(!deletedBooking) {
        throw new DatabaseError('Booking not found', 404)
      }
      await Booking.findByIdAndDelete(deletedBooking._id)

      // insert to deleted booking
      const deleted = {}
      const availableFields = [
        'user_id',
        'field_id',
        'schedule',
        'status',
        'payment_id',
        'merchant_id',
        'payment_type',
        'payment_token',
        'payment_status',
        'transaction_time',
        'expiry_time',
        'currency',
      ]
      for(const prop in deletedBooking) {
        if(availableFields.includes(prop) && deletedBooking[prop]) deleted[prop] = deletedBooking[prop]
      }
      await DeletedBooking.create(deleted)

      // delete in redis
      let cachedBooking = await bookedScheduleRepository.search()
        .where('id').match(deletedBooking._id.toString()).return.all()
      cachedBooking = cachedBooking[0]
      if(cachedBooking) {
        const cachedBookingId = cachedBooking[EntityId]
        await bookedScheduleRepository.remove(cachedBookingId)
      }

      // response
      return responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  },

  activateBooking: async (req, res, next) => {
    try {
      // validate id, if not valid -> response 400
      const bookingId = validate(bookingValidation.activateBooking, req.params.id)

      // check if booking exists, if doesn't - response 404
      const booking = await Booking.findById(bookingId)
      if(!booking) {
        throw new DatabaseError('Booking not found', 404)
      }

      // check if booking status is 'pending', if not - response 400
      if(booking.status !== 'pending') {
        throw new DatabaseError('Booking status is not pending', 400)
      }

      // update booking's status to 'aktif'
      await Booking.updateOne({
        _id: bookingId
      }, {
        $set: {
          status: 'aktif'
        }
      })

      // update status to selesai once schedule is outdated
      addFinishBookingJob(booking)

      // response 200
      return responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  }  
}

export default bookingController