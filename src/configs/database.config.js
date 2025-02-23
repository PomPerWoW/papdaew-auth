const { PrismaClient } = require('@prisma/client');
const { PinoLogger } = require('@papdaew/shared');

const Config = require('#auth/configs/config.js');

class Database {
  #prisma;
  #logger;
  #config;

  constructor() {
    this.#config = new Config();
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
      level: this.#config.LOG_LEVEL,
      serviceVersion: this.#config.SERVICE_VERSION,
      environment: this.#config.NODE_ENV,
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

  #disconnect = () => {
    process.once('SIGINT', async () => {
      await this.#prisma.$disconnect();
    });
  };

  connect = async () => {
    try {
      await this.#prisma.$connect();
      this.#logger.info('Successfully connected to database');
      this.#disconnect();
    } catch (error) {
      this.#logger.error('Failed to connect to database', error);
      throw error;
    }
  };

  get prisma() {
    return this.#prisma;
  }
}

module.exports = Database;
