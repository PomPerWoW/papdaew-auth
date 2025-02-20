const jwt = require('jsonwebtoken');

const { config } = require('#auth/configs/config.js');

const generateToken = user => {
  jwt.sign(
    {
      id: user.id,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;
