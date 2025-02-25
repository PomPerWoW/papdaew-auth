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

  /**
   * Creates a new user account
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email address
   * @param {string} userData.username - User's username (optional)
   * @param {string} userData.password - User's password (required for local provider)
   * @param {string} userData.role - User's role (defaults to CUSTOMER)
   * @param {string} userData.providerId - Provider-specific ID (for OAuth)
   * @param {string} [provider='local'] - Authentication provider (local/google)
   * @returns {Promise<Object>} Created user object
   * @throws {ConflictError} If user already exists
   */
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

    // If user already exists, check if provider is google to avoid conflict
    if (existingUser) {
      if (provider === 'google' && existingUser.provider === 'google') {
        return existingUser;
      }
      this.#logger.error('User already exists');
      throw new ConflictError('User already exists');
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Create user data
    const userCreateData = {
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      role: userData.role || 'CUSTOMER',
      provider,
      providerId: userData.providerId,
      verificationToken: hashedToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    // Hash password if using local provider
    if (provider === 'local') {
      userCreateData.password = await bcrypt.hash(userData.password, 10);
    }

    // Create user in database
    const user = await this.#database.prisma.user.create({
      data: userCreateData,
    });

    // Publish verification email event
    await this.#messageBroker.publishDirect(
      'email_notifications',
      JSON.stringify({
        type: 'VERIFICATION',
        recipient: user.email,
        data: {
          username: user.username,
          verificationUrl: `${this.#config.API_URL}/auth/verify-email/${verificationToken}`,
        },
      }),
      'Verification email queued successfully'
    );

    // Publish user creation event
    await this.#messageBroker.publishDirect(
      'user_creation',
      JSON.stringify({
        type: 'USER_CREATED',
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified,
        },
      }),
      'User creation event published successfully'
    );

    return user;
  };

  /**
   * Finds and authenticates a user
   * @param {Object} userData - User login credentials
   * @param {string} userData.identifier - Email or username
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} User object if authentication successful
   * @throws {BadRequestError} If credentials are invalid or wrong auth provider
   */
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

  /**
   * Verifies a user's email address using verification token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Updated user object
   * @throws {BadRequestError} If token expired
   * @throws {NotFoundError} If token invalid
   */
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

  /**
   * Resends verification email to user
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Success message
   * @throws {NotFoundError} If user not found
   * @throws {BadRequestError} If email already verified
   */
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
          verificationUrl: `${this.#config.API_URL}/auth/verify-email/${verificationToken}`,
        },
      }),
      'Verification email resent successfully'
    );

    return { message: 'Verification email resent successfully' };
  };
}

module.exports = AuthService;
