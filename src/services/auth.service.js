const { ConflictError } = require('@papdaew/shared');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { config } = require('#auth/configs/config.js');
const Database = require('#auth/configs/database.js');

class AuthService {
  #database;

  constructor() {
    this.#database = new Database();
  }

  #generateToken = user =>
    jwt.sign({ email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

  createUser = async userData => {
    const existingUser = await this.#database.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.#database.prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      },
    });

    const token = this.#generateToken(user);

    return {
      user,
      token,
    };
  };
}

module.exports = AuthService;
