const { asyncHandler, BadRequestError } = require('@papdaew/shared');
const { PinoLogger } = require('@papdaew/shared/src/logger');
const { StatusCodes } = require('http-status-codes');

const config = require('#auth/configs/config.js');
const userSchema = require('#auth/schemas/user.schema.js');
const AuthService = require('#auth/services/auth.service.js');

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

  signup = asyncHandler(async (req, res) => {
    this.#logger.info('POST: /signup');
    const { error } = userSchema.validate(req.body);

    if (error) {
      this.#logger.error(error.message);
      throw new BadRequestError(error.message);
    }

    const result = await this.#authService.createUser(req.body);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'User registered successfully',
      data: result,
    });
  });
}

module.exports = AuthController;
