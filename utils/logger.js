// utils/logger.js — winston with daily-rotate files
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const fs = require('fs');
const logsDir = path.join(__dirname, '..', 'logs');
try { fs.mkdirSync(logsDir, { recursive: true }); } catch (_) {}

const fileRotate = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: 'phishguard-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    fileRotate,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

module.exports = logger;
