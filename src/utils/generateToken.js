const jwt = require('jsonwebtoken');

const { config } = require('#auth/configs/config.js');

const generateToken = user =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

module.exports = generateToken;
