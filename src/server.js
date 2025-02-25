const path = require('path');
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
const Passport = require('#auth/configs/passport.config.js');
const Config = require('#auth/configs/config.js');

class AuthServer {
  #app;
  #server;
  #logger;
  #config;
  #authRoutes;
  #healthRoutes;
  #passport;

  constructor() {
    this.#app = express();
    this.#config = new Config();
    this.#passport = new Passport();
    this.#authRoutes = new AuthRoutes();
    this.#healthRoutes = new HealthRoutes();
    this.#logger = new PinoLogger().child({
      service: 'Auth Server',
    });
  }

  setup = () => {
    this.#setupSecurityMiddleware(this.#app);
    this.#setupMiddleware(this.#app);
    this.#setupRoutes(this.#app);
    this.#setupErrorHandlers(this.#app);
    return this.#app;
  };

  start = () => {
    this.setup();
    this.#startServer(this.#app);
  };

  #setupSecurityMiddleware = app => {
    app.set('trust proxy', true);
    app.use(cors());
    app.use(helmet());
    app.use(hpp());

    this.#passport.initialize();

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
  };

  #setupMiddleware = app => {
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(express.static(path.join(__dirname, 'public')));
  };

  #setupRoutes = app => {
    app.use('/', this.#healthRoutes.setup());
    app.use('/api/v1/auth', this.#authRoutes.setup());
  };

  #setupErrorHandlers = app => {
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
  };

  #startServer = app => {
    try {
      this.#startHttpServer(app);
    } catch (error) {
      this.#logger.error('Failed to start server', error);
      process.exit(1);
    }
  };

  #startHttpServer = app => {
    this.#server = http.createServer(app);

    this.#server.listen(this.#config.PORT, () => {
      this.#logger.info(`Auth service is running on port ${this.#config.PORT}`);
    });
  };

  close = () =>
    new Promise((resolve, reject) => {
      this.#server.close(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
}

module.exports = AuthServer;
