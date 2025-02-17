import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

class Config {
  constructor() {
    this.PORT = process.env.PORT || 3000;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
  }
}

export const config = new Config();
