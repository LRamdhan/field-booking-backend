import express from 'express'
import userRoutes from './../routes/userRoutes.js'
import errorHandler from './../middleware/errorHandler.js'
import cookieParser from 'cookie-parser'
import useragent from "express-useragent"

// create instance
const app = express()

// configuration
app.set("trust proxy", true);

// add functionality
app.use(express.json())
app.use(cookieParser())
app.use(useragent.express());

// add route
app.use('/api/users', userRoutes)

// error middlware
app.use(errorHandler)

export default app