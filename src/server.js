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

const { config } = require('#auth/configs/config.js');
const Metrics = require('#auth/monitoring/metrics.js');
const { authRoutes } = require('#auth/routes/auth.routes.js');
const { healthRoutes } = require('#auth/routes/health.routes.js');

class AuthServer {
  #app;
  #logger;
  #metrics;

  constructor() {
    this.#app = express();
    this.#logger = new PinoLogger({
      name: 'Auth Server',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });
    this.#metrics = new Metrics();
  }

  setup() {
    this.#setupSecurityMiddleware(this.#app);
    this.#setupMiddleware(this.#app);
    this.#setupRoutes(this.#app);
    this.#setupMetricsMiddleware(this.#app);
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

  #setupMetricsMiddleware(app) {
    app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        this.#metrics.incrementHttpRequests(req.method, res.statusCode);
        this.#metrics.observeHttpRequestDuration(
          req.method,
          req.path,
          duration
        );
      });

      next();
    });

    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', this.#metrics.metrics.contentType);
      res.end(await this.#metrics.metrics.metrics());
    });
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

    process.on('unhandledRejection', error => {
      this.#logger.error(
        'Unhandled Rejection:',
        `${error.name}: ${error.message}`
      );
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', async () => {
      this.#logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        this.#logger.info('HTTP server closed');
      });
    });
  }
}

module.exports = AuthServer;
