import DatabaseError from "../exception/DatabaseError.js"
import Field from "../model/mongodb/fieldModel.js"
import Review from "../model/mongodb/reviewsModel.js"
import User from "../model/mongodb/userModel.js"
import bookedScheduleRepository from "../model/redis/bookedScheduleRepository.js"
import reviewRepository from "../model/redis/reviewRepository.js"
import responseApi from "../utils/responseApi.js"
import fieldValidation from "../validation/fieldValidation.js"
import validate from "../validation/validate.js"

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
      let date = validate(fieldValidation.getBookedSchedule(), req.query.date)
      date = (new Date(date))
      date.setHours(1, 0, 0, 0)
      date = date.getTime()

      // get schedules from redis
      const schedules = await bookedScheduleRepository.search()
        .where('schedule').between(date, date + 86400000)
        .and('field_id').equals(req.params.id)
        .return.all()

      if(schedules.length === 0) {
        throw new DatabaseError('No schedules found', 404)
      }

      const response = {
        date: date,
        schedules: schedules.map(e => (new Date(e.schedule)).getHours())
      }

      // response
      return responseApi.success(res, response)
    } catch(err) {
      next(err)
    }
  },

  createReview: async (req, res, next) => {
    try {
      // validate param and req body
      const {field_id, rating, description} = validate(fieldValidation.createReview, {
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

      // insert to review (mongodb)
      const review = await Review.create({
        field_id: field_id,
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
        description:review.description,
        created_at: (new Date(review.createdAt)).getTime()
      })

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
      try {
        const field = await Field.findById(data.field_id)
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
      const cachedReviews = await (await getFilteredReviews(data.star))()
      const count = await reviewRepository.search()
        .where('field_id').equals(data.field_id)  
        .return.count()
      const allReviews = await reviewRepository.search()
        .where('field_id').equals(data.field_id)  
        .return.all()
      const averageRating = (allReviews.reduce((acc, review) => acc + review.rating, 0)) / allReviews.length
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