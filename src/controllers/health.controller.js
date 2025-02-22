const { PinoLogger, asyncHandler } = require('@papdaew/shared');
const { StatusCodes } = require('http-status-codes');

const Config = require('#auth/config.js');

class HealthController {
  #logger;
  #config;

  constructor() {
    this.#config = new Config();
    this.#logger = new PinoLogger({
      name: 'Health Controller',
      level: this.#config.LOG_LEVEL,
      serviceVersion: this.#config.SERVICE_VERSION,
      environment: this.#config.NODE_ENV,
    });
  }

  getHealth = asyncHandler(async (req, res) => {
    this.#logger.info('GET: /health');
    res.status(StatusCodes.OK).send('Auth service is healthy and OK');
  });

  error = asyncHandler(async (req, res) => {
    this.#logger.error('GET: /error');
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send('Auth service is unhealthy');
  });
}

module.exports = HealthController;
