const { createLogger, format, transports } = require('winston');

class Logger {
  static instance;

  constructor() {
    if (Logger.instance) throw new Error('Use Logger.getInstance().');
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
      transports: [new transports.Console()],
    });
  }

  static getInstance() {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  info(message, meta) {
    this.logger.info(message, meta);
  }

  warn(message, meta) {
    this.logger.warn(message, meta);
  }

  error(message, meta) {
    this.logger.error(message, meta);
  }
}

module.exports = Logger;