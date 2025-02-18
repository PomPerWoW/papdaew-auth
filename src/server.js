const http = require('http');

const express = require('express');

const { config } = require('#auth/config.js');
const {
  NotFoundError,
  globalErrorHandler,
} = require('#auth/middlewares/errors.middleware.js');
const { healthRoutes } = require('#auth/routes/health.routes.js');
const Logger = require('#auth/utils/logger/logger.utils.js');

class AuthServer {
  #app;
  #logger;

  constructor() {
    this.#app = express();
    this.#logger = new Logger('Auth Server');
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
