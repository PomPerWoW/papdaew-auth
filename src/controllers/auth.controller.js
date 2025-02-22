const { asyncHandler, BadRequestError } = require('@papdaew/shared');
const { PinoLogger } = require('@papdaew/shared/src/logger');
const { StatusCodes } = require('http-status-codes');

const Config = require('#auth/config.js');
const { signupSchema, loginSchema } = require('#auth/schemas/auth.schema.js');
const AuthService = require('#auth/services/auth.service.js');
const generateToken = require('#auth/utils/generateToken.util.js');

class AuthController {
  #authService;
  #logger;
  #config;

  constructor() {
    this.#authService = new AuthService();
    this.#config = new Config();
    this.#logger = new PinoLogger({
      name: 'Auth Controller',
      level: this.#config.LOG_LEVEL,
      serviceVersion: this.#config.SERVICE_VERSION,
      environment: this.#config.NODE_ENV,
    });
  }

  #setTokenCookie = (user, _req, res) => {
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: this.#config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return token;
  };

  signup = asyncHandler(async (req, res) => {
    this.#logger.info('POST: /signup');

    const { error } = signupSchema.validate(req.body);

    if (error) {
      this.#logger.error(error.message);
      throw new BadRequestError(error.message);
    }

    const user = await this.#authService.createUser(req.body);

    const token = this.#setTokenCookie(user, req, res);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      data: user,
    });
  });

  login = asyncHandler(async (req, res) => {
    this.#logger.info('POST: /login');

    const { error } = loginSchema.validate(req.body);

    if (error) {
      this.#logger.error(error.message);
      throw new BadRequestError(error.message);
    }

    const user = await this.#authService.findUser(req.body);

    const token = this.#setTokenCookie(user, req, res);

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User logged in successfully',
      token,
      data: user,
    });
  });

  googleCallback = asyncHandler(async (req, res) => {
    this.#logger.info('Google OAuth callback');

    this.#setTokenCookie(req.user, req, res);

    res.redirect('/');
  });
}

module.exports = AuthController;
