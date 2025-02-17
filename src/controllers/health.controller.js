import HttpStatus from 'http-status-codes';

import Logger from '@auth/utils/logger/logger.utils.js';

class HealthController {
  #logger = new Logger('Health Controller');

  getHealth = async (req, res) => {
    this.#logger.info('GET: /health');
    res.status(HttpStatus.OK).send('Auth service is healthy and OK');
  };

  error = async (req, res) => {
    this.#logger.error('GET: /error', new Error('Test error'));
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send('Auth service is unhealthy');
  };
}

export default HealthController;
