const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const passport = require('passport');
const { PinoLogger } = require('@papdaew/shared');

const AuthService = require('#auth/services/auth.service.js');
const Database = require('#auth/configs/database.config.js');
const Config = require('#auth/configs/config.js');

class Passport {
  #logger;
  #authService;
  #database;
  #config;

  constructor() {
    this.#authService = new AuthService();
    this.#config = new Config();
    this.#database = new Database();
    this.#logger = new PinoLogger().child({
      service: 'Passport Config',
    });
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
            // Extract user data from profile
            const email = profile.emails[0].value;
            const firstName = profile.name.givenName;
            const lastName = profile.name.familyName;
            const profileImage = profile.photos[0].value;

            // Try to find existing user
            const user = await this.#authService.findUserByEmail(email);

            if (user) {
              // User exists - check provider
              if (user.provider === 'google') {
                // Existing Google user - just return the user (login)
                this.#logger.info('Existing Google user - login');
                return done(null, user);
              }
              // Existing local user - you can either:
              // Option 1: Link accounts automatically
              // user = await this.#authService.linkGoogleAccount(user.id, profile.id);
              // return done(null, user);

              // Option 2: Reject with message to link accounts manually
              this.#logger.info('Existing local user - link accounts manually');
              return done(null, false, {
                message:
                  'An account with this email already exists. Please log in with your password and then link your Google account.',
              });
            }

            // New user - create account
            const userData = {
              email,
              firstName,
              lastName,
              profileImage,
              providerId: profile.id,
            };

            const newUser = await this.#authService.createUser(
              userData,
              'google'
            );

            return done(null, newUser);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
}

module.exports = Passport;
