const { ConflictError, BadRequestError } = require('@papdaew/shared');
const { PinoLogger } = require('@papdaew/shared');
const bcrypt = require('bcrypt');

const Config = require('#auth/config.js');
const Database = require('#auth/database.js');

class AuthService {
  #database;
  #logger;
  #config;

  constructor() {
    this.#database = new Database();
    this.#config = new Config();
    this.#logger = new PinoLogger({
      name: 'Auth Service',
      level: this.#config.LOG_LEVEL,
      serviceVersion: this.#config.SERVICE_VERSION,
      environment: this.#config.NODE_ENV,
    });
  }

  createUser = async (userData, provider = 'local') => {
    const existingUser = await this.#database.prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username || userData.email.split('@')[0] },
        ],
      },
    });

    if (existingUser) {
      if (provider === 'google' && existingUser.provider === 'google') {
        return existingUser;
      }
      this.#logger.error('User already exists');
      throw new ConflictError('User already exists');
    }

    const userCreateData = {
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      role: userData.role || 'CUSTOMER',
      provider,
      providerId: userData.providerId,
    };

    if (provider === 'local') {
      userCreateData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await this.#database.prisma.user.create({
      data: userCreateData,
    });

    return user;
  };

  findUser = async userData => {
    const existingUser = await this.#database.prisma.user.findFirst({
      where: {
        OR: [{ email: userData.identifier }, { username: userData.identifier }],
      },
      select: {
        id: true,
        password: true,
        provider: true,
      },
    });

    if (!existingUser) {
      this.#logger.error('Invalid credentials');
      throw new BadRequestError('Invalid credentials');
    }

    if (existingUser.provider === 'local') {
      const isPasswordValid = bcrypt.compare(
        userData.password,
        existingUser.password
      );

      if (!isPasswordValid) {
        this.#logger.error('Invalid credentials');
        throw new BadRequestError('Invalid credentials');
      }
    }

    if (existingUser.provider === 'google') {
      this.#logger.error(
        'This account is linked to Google, please login with Google'
      );
      throw new BadRequestError(
        'This account is linked to Google, please login with Google'
      );
    }

    const user = await this.#database.prisma.user.findUnique({
      where: { id: existingUser.id },
    });

    return user;
  };
}

module.exports = AuthService;
