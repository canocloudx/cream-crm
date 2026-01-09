/**
 * C.R.E.A.M. CRM - Enhanced Logger
 * Winston logger with Loki transport for centralized logging
 */

const winston = require('winston');

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: { 
    service: 'cream-crm',
    version: process.env.npm_package_version || '2.0.0'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat
    }),
    // Error log file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined log file
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Add Loki transport in production if configured
if (process.env.NODE_ENV === 'production' && process.env.LOKI_HOST) {
  try {
    const LokiTransport = require('winston-loki');
    logger.add(new LokiTransport({
      host: process.env.LOKI_HOST,
      labels: { 
        app: 'cream-crm',
        env: process.env.NODE_ENV || 'development'
      },
      json: true,
      batching: true,
      interval: 5,
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err.message);
      }
    }));
    logger.info('Loki transport initialized', { host: process.env.LOKI_HOST });
  } catch (err) {
    console.warn('winston-loki not available, skipping Loki transport');
  }
}

// Request logging middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};

// Stream for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
