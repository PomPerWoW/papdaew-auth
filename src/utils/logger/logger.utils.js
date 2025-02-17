import pino from 'pino';

class Logger {
  constructor(name) {
    this.logger = pino({
      name,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
    });
  }

  info(message) {
    this.logger.info(message);
  }

  error(message, error) {
    this.logger.error({ err: error }, message);
  }

  warn(message) {
    this.logger.warn(message);
  }

  debug(message) {
    this.logger.debug(message);
  }
}

export default Logger;
