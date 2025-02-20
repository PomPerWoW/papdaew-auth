const { ConflictError, BadRequestError } = require('@papdaew/shared');
const { PinoLogger } = require('@papdaew/shared');
const bcrypt = require('bcrypt');

const { config } = require('#auth/configs/config.js');
const Database = require('#auth/configs/database.js');

class AuthService {
  #database;
  #logger;

  constructor() {
    this.#database = new Database();
    this.#logger = new PinoLogger({
      name: 'Auth Service',
      level: config.LOG_LEVEL,
      serviceVersion: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
    });
  }

  createUser = async (userData, provider = 'local') => {
    try {
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

      await this.#assignDefaultPermissions(user.id, user.role);

      return user;
    } catch (error) {
      this.#logger.error('Error creating user:', error);
      throw error;
    }
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
      throw new BadRequestError('Invalid credentials');
    }

    const isPasswordValid = bcrypt.compare(
      userData.password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new BadRequestError('Invalid credentials');
    }

    const user = await this.#database.prisma.user.findUnique({
      where: { id: existingUser.id },
    });

    return user;
  };

  #assignDefaultPermissions = async (userId, userRole) => {
    const defaultPermissions = {
      CUSTOMER: ['view_profile', 'edit_profile'],
      VENDOR: ['view_profile', 'edit_profile', 'manage_queues', 'view_queues'],
      ADMIN: [
        'view_profile',
        'edit_profile',
        'manage_users',
        'manage_permissions',
      ],
    };

    const permissions = defaultPermissions[userRole] || [];

    for (const permissionName of permissions) {
      await this.#database.prisma.userPermission.create({
        data: {
          user: { connect: { id: userId } },
          permission: {
            connectOrCreate: {
              where: { name: permissionName },
              create: { name: permissionName },
            },
          },
        },
      });
    }
  };
}

module.exports = AuthService;
