const http = require('http');

const {
  globalErrorHandler,
  NotFoundError,
  PinoLogger,
} = require('@papdaew/shared');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp');

const { config } = require('#auth/config.js');
const database = require('#auth/database.js');
const { authRoutes } = require('#auth/routes/auth.routes.js');
const { healthRoutes } = require('#auth/routes/health.routes.js');

class AuthServer {
  #app;
  #logger;
  #database;

  constructor() {
    this.#app = express();
    this.#database = database;
    this.#logger = new PinoLogger({
      name: 'Auth Server',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });
  }

  setup() {
    this.#setupSecurityMiddleware(this.#app);
    this.#setupMiddleware(this.#app);
    this.#setupRoutes(this.#app);
    this.#setupErrorHandlers(this.#app);
    return this.#app;
  }

  start() {
    this.setup();
    this.#startServer(this.#app);
  }

  #setupSecurityMiddleware(app) {
    app.set('trust proxy', true);
    app.use(cors());
    app.use(helmet());
    app.use(hpp());
  }

  #setupMiddleware(app) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }

  #setupRoutes(app) {
    app.use('', healthRoutes);
    app.use('/api/v1/auth', authRoutes);
  }

  #setupErrorHandlers(app) {
    app.all('*', (req, _res, next) => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      this.#logger.error(`${fullUrl} endpoint does not exist.`);
      next(
        new NotFoundError(
          `Can't find ${req.method}:${req.originalUrl} on this server!`
        )
      );
    });

    app.use(globalErrorHandler);
  }

  async #startServer(app) {
    try {
      await this.#database.connect();
      this.#startHttpServer(app);
    } catch (error) {
      this.#logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  #startHttpServer(app) {
    const server = http.createServer(app);

    server.listen(config.PORT, () => {
      this.#logger.info(`Auth service is running on port ${config.PORT}`);
    });

    process.on('uncaughtException', error => {
      this.#logger.error('Uncaught Exception:', error);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise, error) => {
      this.#logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.#logger.error(`Error (${error.name}): - ${error.message}`);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', async () => {
      this.#logger.info('SIGTERM signal received: closing HTTP server');
      this.#database.disconnect();
      server.close(() => {
        this.#logger.info('HTTP server closed');
      });
    });
  }
}

module.exports = AuthServer;
