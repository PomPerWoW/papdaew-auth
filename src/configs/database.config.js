const { PrismaClient } = require('@prisma/client');

const LoggerFactory = require('#auth/utils/logger.js');

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
    this.#logger = LoggerFactory.getLogger('Database');
    this.#setupLogging();
    Database.#instance = this;
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
  };

  get prisma() {
    return this.#prisma;
  }
}

module.exports = Database;
