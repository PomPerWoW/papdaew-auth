const { PinoLogger } = require('@papdaew/shared');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const { config } = require('#auth/configs/config.js');
const Database = require('#auth/configs/database.js');
const AuthService = require('#auth/services/auth.service.js');

class PassportConfig {
  #logger;
  #authService;
  #database;

  constructor() {
    this.#database = new Database();
    this.#authService = new AuthService();
    this.#logger = new PinoLogger({
      name: 'Passport Config',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
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
          clientID: config.GOOGLE_CLIENT_ID,
          clientSecret: config.GOOGLE_CLIENT_SECRET,
          callbackURL: `${config.API_URL}/auth/google/callback`,
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

module.exports = new PassportConfig();
