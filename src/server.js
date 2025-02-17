import express from 'express';

import { config } from '@auth/config.js';
import routes from '@auth/routes/routes.js';
import Logger from '@auth/utils/logger/logger.utils.js';

const app = express();
const logger = new Logger('Auth Server');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.listen(config.PORT, () => {
  logger.info(`Auth service is running on port ${config.PORT}`);
});
