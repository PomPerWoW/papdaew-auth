const crypto = require('crypto');

const bcrypt = require('bcrypt');
const {
  ConflictError,
  BadRequestError,
  NotFoundError,
  PinoLogger,
} = require('@papdaew/shared');

const MessageBroker = require('#auth/configs/messageBroker.config.js');
const Database = require('#auth/configs/database.config.js');
const Config = require('#auth/configs/config.js');

/**
 * Service class handling authentication related operations
 */
class AuthService {
  #logger;
  #config;
  #database;
  #messageBroker;

  constructor() {
    this.#config = new Config();
    this.#database = new Database();
    this.#messageBroker = new MessageBroker();
    this.#logger = new PinoLogger().child({
      service: 'Auth Service',
    });
  }

  createUser = async (userData, provider = 'local') => {
    // Check if user already exists
    const existingUser = await this.#database.prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username || userData.email.split('@')[0] },
        ],
      },
    });

    // If user already exists, handle based on provider
    if (existingUser) {
      this.#logger.info(
        `User with username ${userData.username} or email ${userData.email} already exists with provider: ${existingUser.provider}`
      );

      // Case 1: OAuth sign-up with existing OAuth account - allow login
      if (provider === 'google' && existingUser.provider === 'google') {
        this.#logger.info('Existing Google user - login');
        return existingUser; // Return existing user (login)
      }

      // Case 2: OAuth sign-up with existing local account - link accounts
      if (provider === 'google' && existingUser.provider === 'local') {
        this.#logger.error('Existing local user - link accounts manually');
        throw new ConflictError(
          'An account with this email already exists. Please log in with your password and then link your Google account.'
        );
      }

      this.#logger.error('Existing account - reject');
      // Case 3: Local sign-up with existing account - reject
      throw new ConflictError(
        'An account with this username or email already exists. Please log in or use the forgot password feature.'
      );
    }

    // Create user data with different handling based on provider
    const userCreateData = {
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      role: userData.role || 'CUSTOMER',
      provider,
      providerId: userData.providerId,
    };

    if (provider !== 'local') {
      // For OAuth providers, mark email as already verified
      userCreateData.isVerified = true;
      // No verification token needed for OAuth users
    } else {
      // For local provider, generate verification token and set email as unverified
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      userCreateData.verificationToken = hashedToken;
      userCreateData.verificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      // Send the unhashed token to the user
      await this.#messageBroker.publishDirect(
        'email_notifications',
        'EMAIL_NOTIFICATION',
        {
          type: 'VERIFICATION',
          recipient: userCreateData.email,
          data: {
            username: userCreateData.username,
            verificationUrl: `${this.#config.API_URL}/auth/verify-email/${verificationToken}`,
          },
        },
        'Email notification event published successfully'
      );

      // Hash password if using local provider
      userCreateData.password = await bcrypt.hash(userData.password, 10);
    }

    // Create user in database
    const user = await this.#database.prisma.user.create({
      data: userCreateData,
    });

    // Publish user creation event
    await this.#messageBroker.publishDirect(
      'user_creation',
      'USER_CREATED',
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        ...userData,
      },
      'User creation event published successfully'
    );

    // Only send verification email for local provider
    if (provider === 'local') {
      this.#logger.info(
        `User created with local provider - verification email sent`
      );
    } else {
      this.#logger.info(
        `User created with ${provider} OAuth - email already verified`
      );
    }

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
      const isPasswordValid = await bcrypt.compare(
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

  findUserByEmail = async email => {
    const user = await this.#database.prisma.user.findUnique({
      where: { email },
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
      'EMAIL_NOTIFICATION',
      {
        type: 'VERIFICATION',
        recipient: user.email,
        data: {
          username: user.username,
          verificationUrl: `${this.#config.API_URL}/auth/verify-email/${verificationToken}`,
        },
      },
      'Verification email resent successfully'
    );

    return { message: 'Verification email resent successfully' };
  };
}

module.exports = AuthService;
