import winston from 'winston';
import 'winston-daily-rotate-file';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let parseDir = __dirname.split('\\')
parseDir.pop()
parseDir.pop()
parseDir = parseDir.join('\\')

const logDirectory = join(parseDir, 'logs');

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: join(logDirectory, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',      // ukuran maksimal per file
  maxFiles: '14d',     // simpan log 14 hari terakhir
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    fileRotateTransport,
    new winston.transports.Console(), 
  ],
});

export default logger;