const { ConflictError } = require('@papdaew/shared');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const databaseService = require('#auth/services/database.service.js');

class AuthService {
  #generateToken = user =>
    jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

  #sanitizeUser = user => {
    const { _password, ...sanitizedUser } = user;
    return sanitizedUser;
  };

  createUser = async userData => {
    const existingUser = await databaseService.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await databaseService.prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      },
    });

    const token = this.#generateToken(user);

    return {
      user: this.#sanitizeUser(user),
      token,
    };
  };
}

module.exports = AuthService;
