const http = require('http');

const express = require('express');

const { config } = require('#auth/config.js');
const { healthRoutes } = require('#auth/routes/health.routes.js');
const Logger = require('#auth/utils/logger/logger.utils.js');

class AuthServer {
  #app;
  #logger;

  constructor() {
    this.#app = express();
    this.#logger = new Logger('Auth Server');
  }

  setupApp() {
    this.#setupMiddleware(this.#app);
    this.#setupRoutes(this.#app);
    return this.#app;
  }

  start() {
    this.setupApp();
    this.#startServer(this.#app);
  }

  #setupMiddleware(app) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }

  #setupRoutes(app) {
    app.use('', healthRoutes);
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

module.exports = { AuthServer };
