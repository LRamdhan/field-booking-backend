import DatabaseError from "../exception/DatabaseError.js"
import Field from "../model/mongodb/fieldModel.js"
import bookedScheduleRepository from "../model/redis/bookedScheduleRepository.js"
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
      let date = validate(fieldValidation.getBookedSchedule, req.query.date)
      date = (new Date(date)).getTime()

      // get schedules from redis
      const schedules = await bookedScheduleRepository.search()
        .where('schedule').is.between(date, date + 86400000)
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
  }
}

export default fieldController