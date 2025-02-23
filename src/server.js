const http = require('http');

const passport = require('passport');
const hpp = require('hpp');
const helmet = require('helmet');
const session = require('express-session');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const {
  globalErrorHandler,
  NotFoundError,
  PinoLogger,
} = require('@papdaew/shared');

const HealthRoutes = require('#auth/routes/health.route.js');
const AuthRoutes = require('#auth/routes/auth.route.js');
const Config = require('#auth/config.js');

require('#auth/configs/passport.config.js');

class AuthServer {
  #app;
  #logger;
  #config;
  #authRoutes;
  #healthRoutes;

  constructor() {
    this.#app = express();
    this.#config = new Config();
    this.#authRoutes = new AuthRoutes();
    this.#healthRoutes = new HealthRoutes();
    this.#logger = new PinoLogger({
      name: 'Auth Server',
      level: this.#config.LOG_LEVEL,
      serviceVersion: this.#config.SERVICE_VERSION,
      environment: this.#config.NODE_ENV,
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
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(
      session({
        secret: this.#config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: this.#config.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());
  }

  #setupRoutes(app) {
    app.use('/', this.#healthRoutes.setup());
    app.use('/api/v1/auth', this.#authRoutes.setup());
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

    server.listen(this.#config.PORT, () => {
      this.#logger.info(`Auth service is running on port ${this.#config.PORT}`);
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

    process.on('SIGINT', async () => {
      server.close();
    });
  }
}

module.exports = AuthServer;
