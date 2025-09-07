import DatabaseError from "../exception/DatabaseError.js"
import Booking from "../model/mongodb/bookingModel.js"
import Field from "../model/mongodb/fieldModel.js"
import Review from "../model/mongodb/reviewsModel.js"
import User from "../model/mongodb/userModel.js"
import bookedScheduleRepository from "../model/redis/bookedScheduleRepository.js"
import fieldRepository from "../model/redis/fieldRepository.js"
import reviewRepository from "../model/redis/reviewRepository.js"
import responseApi from "../utils/responseApi.js"
import utcDateTime from "../utils/utcDateTime.js"
import fieldValidation from "../validation/fieldValidation.js"
import validate from "../validation/validate.js"
import mongoose from "mongoose"

const fieldController = {
  getFields: async (req, res, next) => {
    try {
      // get fields from db
      let fields = await Field.find()
        .select('name rating images location price')
      fields = fields.map(e => {
        return {
          id: e._id.toString(),
          name: e.name,
          rating: e.rating,
          img: e.images[0],
          location: e.location,
          cost: e.price,
        }
      })

      // reponse
      return responseApi.success(res, fields)
    } catch(err) {
      next(err)
    }
  },

  getFieldDetail: async (req, res, next) => {
    try {
      // get field from db based on provided id
      const id = req.params.id;
      const field = await Field.findById(id)

      // if not found -> throw error with status code 404
      if(!field) {
        throw new DatabaseError('Field not found', 404)
      }

      // reponse
      return responseApi.success(res, {
        id: field._id.toString(),
        name: field.name,
        cost: field.price,
        rating: field.rating,
        images: field.images,
        location: field.location,
        floor_type: field.floor_type,
        facilities: field.facilities
      })
    } catch(err) {
      next(err)
    }
  },

  getSchedules: async (req, res, next) => {
    try {
      // validate query date
      validate(fieldValidation.getBookedSchedule(), req.query.date)
      
      // get schedules from redis
      let date = parseInt(req.query.date);
      const schedules = await bookedScheduleRepository.search()
        .where('schedule').between(date, date + 86400000)
        .and('field_id').equals(req.params.id)
        .return.all()

      if(schedules.length === 0) {
        throw new DatabaseError('No schedules found', 404)
      }

      // response
      const response = {
        date: date,
        schedules: schedules.map(e => {
          return utcDateTime(e.schedule).hour()
        })
      }

      return responseApi.success(res, response)
    } catch(err) {
      next(err)
    }
  },

  createReview: async (req, res, next) => {
    try {
      // validate param and req body
      const {field_id, booking_id, rating, description} = validate(fieldValidation.createReview, {
        field_id: req.params.id,
        ...req.body
      })

      // check if field exists
      try {
        const field = await Field.findById(field_id)
        if(!field) {
          throw new Error()
        }
      } catch(err) {
        throw new DatabaseError('Field not found', 404)
      }

      // check if this booking is exists and already reviewed
      const booking = await Booking.findOne({
        _id: booking_id,
        field_id: field_id
      })
      if(!booking) {
        throw new DatabaseError('Booking not found', 404)
      }
      if(booking.isReviewed) {
        throw new DatabaseError('Review already exists', 409)
      }

      // update booking isReviewed
      await Booking.findByIdAndUpdate(booking_id, {isReviewed: true})

      // insert to review (mongodb)
      const review = await Review.create({
        field_id: field_id,
        booking_id: booking_id,
        user_id: req.user_id,
        rating: rating,
        description: description
      })

      // insert to review (redis)
      await reviewRepository.save({
        id: review._id.toString(),
        field_id: review.field_id.toString(),
        user_id: review.user_id.toString(),
        rating: review.rating,
        description: review.description,
        created_at: (utcDateTime(review.createdAt)).valueOf()
      })

      // re calculate overall review
      const retingInfo = await Review.aggregate([
        {
          $match: {
            field_id: new mongoose.Types.ObjectId(field_id)
          }
        },
        {
          $group: {
            _id: null,
            totalRating: { $sum: "$rating" },
            totalDocuments: { $sum: 1 },
            averageRating: { $avg: "$rating" }
          }
        }
      ]);
      const newRating = retingInfo[0].averageRating

      // update field both in mongodb and redis
      await Field.findByIdAndUpdate(field_id, {rating: newRating})
      let targetField = await fieldRepository.search()
        .where('id').equals(field_id)
        .return.all()
      targetField = targetField[0]
      targetField.rating = newRating
      await fieldRepository.save(targetField)

      // response
      return responseApi.success(res, {})
    } catch(err) {
      next(err)
    }
  },

  getReview: async (req, res, next) => {
    try {
      // validate query and param
      const data = validate(fieldValidation.getReview, {
        field_id: req.params.id,
        ...req.query
      })

      // check if field exists
      let field
      try {
        field = await Field.findById(data.field_id)
        if(!field) {
          throw new Error()
        }
      } catch(err) {
        throw new DatabaseError('Field not found', 404)
      }

      // get review from redis
      async function getFilteredReviews(star) {
        const reviews = await reviewRepository.search()
          .where('field_id').equals(data.field_id)
        return async () => {
          if(star) {
            return await reviews.and('rating').eq(star)
              .return.page(((data.page - 1) * data.limit), data.limit)
          }
          return await reviews
            .return.page(((data.page - 1) * data.limit), data.limit)
        }
      }

      const totalPage = await (async (star) => {
        let total
        const reviews = await reviewRepository.search()
          .where('field_id').equals(data.field_id)
        if(star) {
          total = await reviews.and('rating').eq(star)
            .return.count()
        } else {
          total = await reviews
            .return.count()
        }
        total = Math.ceil(total / data.limit)
        return total
      })(data.star)

      const cachedReviews = await (await getFilteredReviews(data.star))() // from redis

      const count = await reviewRepository.search() // sum of reviews in redis
        .where('field_id').equals(data.field_id)  
        .return.count()

      const allReviews = await reviewRepository.search()
        .where('field_id').equals(data.field_id)  
        .return.all()
      
      const averageRating = field.rating // get from field in redis / mongodb

      const parsedCacheReviews = []
      for(const review of cachedReviews) {
        const tempUser = await User.findById(review.user_id).select('name img_url')
        parsedCacheReviews.push({
          id: review.id,
          user: {
            name: tempUser.name,
            img_url: tempUser.img_url
          },
          rating: review.rating,
          description: review.description,
          date_created: review.created_at
        })
      }

      // response
      const response = {
        page: data.page,
        total_page: totalPage,
        limit: data.limit,
        average_rating: averageRating,
        total_reviews: count,
      }
      if(data.star) response.star = data.star
      response.reviews = parsedCacheReviews
      return responseApi.success(res, response)
    } catch(err) {
      next(err)
    }
  }
}

export default fieldController