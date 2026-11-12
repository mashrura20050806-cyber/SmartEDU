const Logger = require('../core/singletons/Logger');

function errorHandler(error, _req, res, _next) {
  if (
    error.name === 'PrismaClientInitializationError'
    || ['P1001', 'P1002', 'P1017', 'P2021', 'P2024'].includes(error.code)
  ) {
    Logger.getInstance().error('Database unavailable for request', { code: error.code });
    return res.status(503).json({
      data: null,
      error: { message: 'The database is unavailable or not initialized. Start PostgreSQL and apply the database schema, then try again.' },
    });
  }

  const status = Number.isInteger(error.statusCode)
    ? error.statusCode
    : error.name === 'MulterError'
      ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      : 500;
  const message = error.name === 'MulterError'
    ? (status === 413 ? 'The uploaded file exceeds the 10 MB limit.' : 'The uploaded file could not be accepted.')
    : status >= 500
      ? 'An unexpected server error occurred.'
      : error.message;
  if (status >= 500) {
    Logger.getInstance().error('Request failed', { error: error.message, stack: error.stack });
  }
  res.status(status).json({
    data: null,
    error: { message },
  });
}

module.exports = errorHandler;