const { PinoLogger } = require('@papdaew/shared');
const { StatusCodes } = require('http-status-codes');

const config = require('#auth/configs/config.js');

class HealthController {
  #logger = new PinoLogger({
    name: 'Health Controller',
    level: config.LOG_LEVEL || 'info',
    serviceVersion: config.SERVICE_VERSION || '1.0.0',
    environment: config.NODE_ENV || 'development',
  });

  getHealth = async (req, res) => {
    this.#logger.info('GET: /health');
    res.status(StatusCodes.OK).send('Auth service is healthy and OK');
  };

  error = async (req, res) => {
    this.#logger.error('GET: /error');
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send('Auth service is unhealthy');
  };
}

module.exports = HealthController;
