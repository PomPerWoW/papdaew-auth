const { PinoLogger } = require('@papdaew/shared');
const { PrismaClient } = require('@prisma/client');

const config = require('#auth/configs/config.js');
const Metrics = require('#auth/monitoring/metrics.js');

class Database {
  static #instance;
  #prisma;
  #logger;
  #metrics;

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

    this.#metrics = new Metrics();

    this.#logger = new PinoLogger({
      name: 'Database',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });

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
      this.#metrics.setDatabaseStatus(1);
    } catch (error) {
      this.#logger.error('Failed to connect to database', error);
      this.#metrics.setDatabaseStatus(0);
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
