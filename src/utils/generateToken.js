const jwt = require('jsonwebtoken');

const Config = require('#auth/configs/config.js');

const generateToken = user => {
  const config = new Config();

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;
