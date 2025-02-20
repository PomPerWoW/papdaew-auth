const { asyncHandler, BadRequestError } = require('@papdaew/shared');
const { PinoLogger } = require('@papdaew/shared/src/logger');
const { StatusCodes } = require('http-status-codes');

const config = require('#auth/configs/config.js');
const { signupSchema, loginSchema } = require('#auth/schemas/auth.schema.js');
const AuthService = require('#auth/services/auth.service.js');
const generateToken = require('#auth/utils/generateToken.js');

class AuthController {
  #authService;
  #logger;

  constructor() {
    this.#authService = new AuthService();
    this.#logger = new PinoLogger({
      name: 'Auth Controller',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });
  }

  #setTokenCookie = (user, req, res) => {
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  };

  signup = asyncHandler(async (req, res) => {
    this.#logger.info('POST: /signup');

    const { error } = signupSchema.validate(req.body);

    if (error) {
      this.#logger.error(error.message);
      throw new BadRequestError(error.message);
    }

    const user = await this.#authService.createUser(req.body);

    this.#setTokenCookie(user, req, res);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'User registered successfully',
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

    this.#setTokenCookie(user, req, res);

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User logged in successfully',
      data: user,
    });
  });

  googleCallback = asyncHandler(async (req, res) => {
    this.#logger.info('Google OAuth callback');

    const token = generateToken(req.user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect('/');
  });
}

module.exports = AuthController;
