import express from 'express';

import { config } from '@auth/config.js';
import Logger from '@auth/utils/logger/logger.utils.js';

const app = express();
const logger = new Logger('Auth Server');

app.listen(config.PORT, () => {
  logger.info(`Auth service is running on port ${config.PORT}`);
});
