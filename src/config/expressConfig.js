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




export { app, wsServer }