const { StatusCodes } = require('http-status-codes');

const Logger = require('#auth/utils/logger/logger.utils.js');

class HealthController {
  #logger = new Logger('Health Controller');

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
