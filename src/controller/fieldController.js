import DatabaseError from "../exception/DatabaseError.js"
import Field from "../model/mongodb/fieldModel.js"
import responseApi from "../utils/responseApi.js"

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
  }
}

export default fieldController