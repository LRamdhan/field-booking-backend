import express from 'express'
import userRoutes from './../routes/userRoutes.js'
import errorHandler from './../middleware/errorHandler.js'

// create instance
const app = express()

// add functionality (middleware)
app.use(express.json())


// add route
app.use('/api/users', userRoutes)

// error middlware
app.use(errorHandler)


export default app