const { asyncHandler } = require('@papdaew/shared');
const { PinoLogger } = require('@papdaew/shared/src/logger');
const { StatusCodes } = require('http-status-codes');

const config = require('#auth/configs/config.js');
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
    const result = await this.#authService.createUser(req.body);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'User created successfully',
      data: result,
    });
  });
}

module.exports = AuthController;
