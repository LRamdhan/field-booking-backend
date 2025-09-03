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
import swaggerUi from 'swagger-ui-express';
import fs from 'fs'
import morgan from 'morgan'
import { FRONTEND_BASE_URL } from './env.js'

// create express instance
const server = express()

// configuration
server.set("trust proxy", true);
server.use(cors({
  // origin: FRONTEND_BASE_URL,
  credentials: true,
  // optionsSuccessStatus: 200
}))

// add functionality
server.use(express.json())
server.use(cookieParser())
server.use(useragent.express());
server.use(morgan('dev'))

// add route
server.use('/api/users', userRoutes)
server.use('/api/fields', fieldRoutes)
server.use('/api/bookings', bookingRoutes)

// error middlware
server.use(errorHandler)

// api docs
let apiDocs = JSON.parse(fs.readFileSync('./api-docs.json'))
server.use('/docs', swaggerUi.serve, (req, res, next) => {
  const fullUrl = `${req.protocol}://${req.get('host')}/api`;
  apiDocs.servers = [
    {
      url: fullUrl,
      description: "Development Server"
    }
  ]
  swaggerUi.setup(apiDocs, {
    customCss: '.swagger-ui .topbar { display: none }'
  })(req, res, next)
});


// express
const app = http.createServer(server);

// web socket instance
const wsServer = new Server(app, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
    credentials: true
  },
  connectionStateRecovery: {}
});

// ws on connection
wsServer.on('connection', wsSocket);

// ws middlwware
wsServer.use(checkEmail);

export { app, wsServer }