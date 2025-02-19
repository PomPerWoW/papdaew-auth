const { PinoLogger } = require('@papdaew/shared');
const { PrismaClient } = require('@prisma/client');

const config = require('#auth/config.js');

class Database {
  static #instance;
  #prisma;
  #logger;

  constructor() {
    if (Database.#instance) {
      return Database.#instance;
    }

    this.#prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    this.#logger = new PinoLogger({
      name: 'Database',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });

    this.#setupLogging();
    Database.#instance = this;
  }

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
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

module.exports = Database.getInstance();
