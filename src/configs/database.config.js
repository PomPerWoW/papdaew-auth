const { PrismaClient } = require('@prisma/client');
const { PinoLogger } = require('@papdaew/shared');

class Database {
  #prisma;
  #logger;
  static #instance;

  constructor() {
    if (Database.#instance) {
      return Database.#instance;
    }
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
    this.#logger = new PinoLogger().child({
      service: 'Database',
    });
    this.#setupLogging();
    Database.#instance = this;
  }

  #setupLogging = () => {
    this.#prisma.$on('warn', e => {
      this.#logger.warn(e, 'Prisma Client warning');
    });

    this.#prisma.$on('error', e => {
      this.#logger.error(e, 'Prisma Client error');
    });
  };

  connect = async () => {
    try {
      await this.#prisma.$connect();
      this.#logger.info('Successfully connected to database');
    } catch (error) {
      this.#logger.error(error, 'Failed to connect to database');
      throw error;
    }
  };

  disconnect = async () => {
    await this.#prisma.$disconnect();
  };

  get prisma() {
    return this.#prisma;
  }
}

module.exports = Database;
