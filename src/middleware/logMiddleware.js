import morgan from 'morgan';
import logger from './../config/logConfig.js'

const stream = {
  write: (message) => logger.info(message.trim()),
};

const morganMiddleware = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export default morganMiddleware;