const { PinoLogger } = require('@papdaew/shared');
const { PrismaClient } = require('@prisma/client');

const config = require('#auth/config.js');

class DatabaseService {
  #prisma;
  #logger;

  constructor() {
    this.#prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    this.#logger = new PinoLogger({
      name: 'Database Service',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });

    this.#setupLogging();
  }

  #setupLogging = () => {
    this.#prisma.$on('error', e => {
      this.#logger.error('Prisma Client error', e);
    });

    this.#prisma.$on('warn', e => {
      this.#logger.warn('Prisma Client warning', e);
    });
  };

  get prisma() {
    return this.#prisma;
  }

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
}

module.exports = new DatabaseService();
