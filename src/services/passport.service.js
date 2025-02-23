const { PinoLogger } = require('@papdaew/shared');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const Config = require('#auth/config.js');
const AuthService = require('#auth/services/auth.service.js');
const Database = require('#auth/services/database.service.js');

class Passport {
  #logger;
  #authService;
  #database;
  #config;

  constructor() {
    this.#authService = new AuthService();
    this.#config = new Config();
    this.#database = new Database();
    this.#logger = new PinoLogger({
      name: 'Passport Config',
      level: this.#config.LOG_LEVEL,
      serviceVersion: this.#config.SERVICE_VERSION,
      environment: this.#config.NODE_ENV,
    });

    this.initialize();
  }

  initialize() {
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.#database.prisma.user.findUnique({
          where: { id },
        });
        done(null, user);
      } catch (error) {
        done(error);
      }
    });

    passport.use(
      new GoogleStrategy(
        {
          clientID: this.#config.GOOGLE_CLIENT_ID,
          clientSecret: this.#config.GOOGLE_CLIENT_SECRET,
          callbackURL: `${this.#config.API_URL}/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await this.#authService.createUser(
              {
                email: profile.emails[0].value,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                picture: profile.photos[0].value,
                providerId: profile.id,
              },
              'google'
            );

            return done(null, user);
          } catch (error) {
            if (error.name === 'ConflictError') {
              const existingUser = await this.#authService.findUserByEmail(
                profile.emails[0].value
              );

              return done(null, existingUser);
            }

            this.#logger.error('Google authentication error:', error);
            return done(error);
          }
        }
      )
    );
  }
}

module.exports = new Passport();
