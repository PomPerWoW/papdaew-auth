const { logger } = require('@papdaew/shared');
const { StatusCodes } = require('http-status-codes');

class HealthController {
  #logger = new logger({
    name: 'Health Controller',
    level: process.env.LOG_LEVEL || 'info',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
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
