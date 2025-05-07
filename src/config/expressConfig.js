import express from 'express'
import userRoutes from './../routes/userRoutes.js'
import errorHandler from './../middleware/errorHandler.js'
import cookieParser from 'cookie-parser'
import useragent from "express-useragent"
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io';
import wsSocket from '../socket/wsSocket.js'
import checkEmail from '../socket/wsMiddleware.js'
import fieldRoutes from '../routes/fieldRoutes.js'
import bookingRoutes from '../routes/bookingRoutes.js'
import connectMongoDb from './mongodb.js'
import { connectRedis } from './redisConfig.js'
import { TESTING_MODE } from './env.js'
import swaggerUi from 'swagger-ui-express';
import fs from 'fs/promises'

// create express instance
const server = express()

// configuration
server.set("trust proxy", true);
server.use(cors())

// add functionality
server.use(express.json())
server.use(cookieParser())
server.use(useragent.express());

// add route
server.use('/api/users', userRoutes)
server.use('/api/fields', fieldRoutes)
server.use('/api/bookings', bookingRoutes)

// api docs
const apiDocs = JSON.parse(await fs.readFile('./api-docs.json'))
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocs, {
  customCss: '.swagger-ui .topbar { display: none }'
}));

// error middlware
server.use(errorHandler)

// express
const app = http.createServer(server);

// web socket instance
const wsServer = new Server(app, {
  cors: {
    origin: ['http://192.168.18.215:5173', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  connectionStateRecovery: {}
});

// ws on connection
wsServer.on('connection', wsSocket);

// ws middlwware
wsServer.use(checkEmail);

// only for testing purpose
if(TESTING_MODE === 'true') {
  (async () => {
    await connectMongoDb(true) // connect mongodb
    await connectRedis(true) // connect redis
  })()
}

export { app, wsServer }