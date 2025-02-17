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

  info(message, ...args) {
    this.logger.info(message, ...args);
  }

  error(message, error) {
    this.logger.error({ err: error }, message);
  }

  warn(message, ...args) {
    this.logger.warn(message, ...args);
  }

  debug(message, ...args) {
    this.logger.debug(message, ...args);
  }
}

export default Logger;
