import express from 'express';
import pino from 'pino';

const app = express();

const logger = pino({
  level: 'info',
});

app.listen(3000, () => {
  logger.info('Server is running on port 3000');
});
