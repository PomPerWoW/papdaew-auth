const { PinoLogger } = require('@papdaew/shared');
const { PrismaClient } = require('@prisma/client');

const config = require('#auth/configs/config.js');

class Database {
  #prisma;
  #logger;

  constructor() {
    this.#prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
      omit: {
        user: {
          password: true,
        },
      },
    });

    this.#logger = new PinoLogger({
      name: 'Database',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });

    this.#setupLogging();
  }

  #setupLogging = () => {
    this.#prisma.$on('warn', e => {
      this.#logger.warn('Prisma Client warning', e);
    });

    this.#prisma.$on('error', e => {
      this.#logger.error('Prisma Client error', e);
    });
  };

  connect = async () => {
    try {
      await this.#prisma.$connect();
      this.#logger.info('Successfully connected to database');
    } catch (error) {
      this.#logger.error('Failed to connect to database', error);
      throw error;
    }
  };

  disconnect = async () => {
    await this.#prisma.$disconnect();
    this.#logger.info('Disconnected from database');
  };

  get prisma() {
    return this.#prisma;
  }
}

module.exports = Database;
