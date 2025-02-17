import express from 'express';
import pino from 'pino';

import { config } from '@auth/config';

const app = express();

const logger = pino({
  level: 'info',
});

app.listen(config.PORT, () => {
  logger.info(`Server is running on port ${config.PORT}`);
});
