const crypto = require('crypto');

const bcrypt = require('bcrypt');
const {
  ConflictError,
  BadRequestError,
  NotFoundError,
} = require('@papdaew/shared');

const LoggerFactory = require('#auth/utils/logger.js');
const MessageBroker = require('#auth/configs/messageBroker.config.js');
const Database = require('#auth/configs/database.config.js');
const Config = require('#auth/configs/config.js');

class AuthService {
  #logger;
  #config;
  #database;
  #messageBroker;

  constructor() {
    this.#config = new Config();
    this.#database = new Database();
    this.#messageBroker = new MessageBroker();
    this.#logger = LoggerFactory.getLogger('Auth Service');
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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const userCreateData = {
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      role: userData.role || 'CUSTOMER',
      provider,
      providerId: userData.providerId,
      verificationToken: hashedToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    if (provider === 'local') {
      userCreateData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await this.#database.prisma.user.create({
      data: userCreateData,
    });

    await this.#messageBroker.publishDirect(
      'email_notifications',
      JSON.stringify({
        type: 'VERIFICATION',
        recipient: user.email,
        data: {
          username: user.username,
          verificationUrl: `${this.#config.API_URL}/auth/verify/${verificationToken}`,
        },
      }),
      'Verification email queued successfully'
    );

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

  verifyEmail = async token => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.#database.prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        verificationTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      const expiredUser = await this.#database.prisma.user.findFirst({
        where: {
          verificationToken: hashedToken,
        },
      });

      if (expiredUser) {
        this.#logger.error('Verification token has expired');
        throw new BadRequestError(
          'Verification token has expired. Please request a new one.'
        );
      }

      this.#logger.error('Invalid verification token');
      throw new NotFoundError('Invalid verification token');
    }

    await this.#database.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return user;
  };

  resendVerificationEmail = async email => {
    const user = await this.#database.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.#logger.error('User not found');
      throw new NotFoundError('User not found');
    }

    if (user.isVerified) {
      this.#logger.error('Email is already verified');
      throw new BadRequestError('Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    await this.#database.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedToken,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.#messageBroker.publishDirect(
      'email_notifications',
      JSON.stringify({
        type: 'VERIFICATION',
        recipient: user.email,
        data: {
          username: user.username,
          verificationUrl: `${this.#config.API_URL}/auth/verify/${verificationToken}`,
        },
      }),
      'Verification email resent successfully'
    );

    return { message: 'Verification email resent successfully' };
  };
}

module.exports = AuthService;
