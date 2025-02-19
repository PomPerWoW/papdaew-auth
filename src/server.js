const http = require('http');

const {
  globalErrorHandler,
  NotFoundError,
  PinoLogger,
} = require('@papdaew/shared');
const express = require('express');

const { config } = require('#auth/config.js');
const { healthRoutes } = require('#auth/routes/health.routes.js');

class AuthServer {
  #app;
  #logger;

  constructor() {
    this.#app = express();
    this.#logger = new PinoLogger({
      name: 'Auth Server',
      level: process.env.LOG_LEVEL || 'info',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  setup() {
    this.#setupMiddleware(this.#app);
    this.#setupRoutes(this.#app);
    this.#setupErrorHandlers();
    return this.#app;
  }

  start() {
    this.setup();
    this.#startServer(this.#app);
  }

  #setupMiddleware(app) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }

  #setupRoutes(app) {
    app.use('', healthRoutes);
  }

  #setupErrorHandlers() {
    this.#app.all('*', (req, _res, next) => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      this.#logger.error(`${fullUrl} endpoint does not exist.`);
      next(
        new NotFoundError(
          `Can't find ${req.method}:${req.originalUrl} on this server!`
        )
      );
    });

    this.#app.use(globalErrorHandler);
  }

  async #startServer(app) {
    try {
      await this.#startHttpServer(app);
    } catch (error) {
      this.#logger.error(error);
      process.exit(1);
    }
  }

  async #startHttpServer(app) {
    const server = http.createServer(app);

    server.listen(config.PORT, () => {
      this.#logger.info(`Auth service is running on port ${config.PORT}`);
    });
  }
}

module.exports = AuthServer;
