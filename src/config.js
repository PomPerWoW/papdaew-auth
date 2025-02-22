const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

class Config {
  constructor() {
    this.PORT = process.env.PORT || 3000;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
    this.SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    this.DATABASE_URL = process.env.DATABASE_URL;
    this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    this.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    this.API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
    this.SESSION_SECRET = process.env.SESSION_SECRET;
  }
}

module.exports = Config;
