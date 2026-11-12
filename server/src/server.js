require('dotenv').config();
const app = require('./app');
const { env } = require('./config/env');
const DatabaseConnection = require('./core/singletons/DatabaseConnection');
const Logger = require('./core/singletons/Logger');

const logger = Logger.getInstance();
const server = app.listen(env.PORT, () => {
  logger.info(`SmartEDU API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  logger.info(`${signal} received; closing server`);
  server.close(async (error) => {
    if (error) {
      logger.error('HTTP server shutdown failed', { error });
      process.exitCode = 1;
    }
    await DatabaseConnection.getInstance().getClient().$disconnect();
    process.exit();
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
