const { StatusCodes } = require('http-status-codes');
const { asyncHandler, PinoLogger } = require('@papdaew/shared');

class HealthController {
  #logger;

  constructor() {
    this.#logger = new PinoLogger().child({
      service: 'Health Controller',
    });
  }

  getHealth = asyncHandler(async (_req, res) => {
    this.#logger.info('GET: health');
    res.status(StatusCodes.OK).send('Auth service is healthy and OK');
  });

  error = asyncHandler(async (_req, res) => {
    this.#logger.error('GET: error');
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send('Auth service is unhealthy');
  });
}

module.exports = HealthController;
