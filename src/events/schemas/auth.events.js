const USER_CREATED = {
  type: 'object',
  required: ['id', 'email', 'username', 'role', 'timestamp', 'version'],
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    username: { type: 'string' },
    role: { type: 'string', enum: ['CUSTOMER', 'VENDOR', 'ADMIN'] },
    timestamp: { type: 'string', format: 'date-time' },
    version: { type: 'integer', minimum: 1 },
  },
};

const EMAIL_NOTIFICATION = {
  type: 'object',
  required: ['type', 'recipient', 'data'],
  properties: {
    type: {
      type: 'string',
      enum: ['WELCOME', 'VERIFICATION', 'RESET_PASSWORD'],
    },
    recipient: { type: 'string', format: 'email' },
    data: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        verificationUrl: { type: 'string', format: 'uri' },
        resetUrl: { type: 'string' },
        orderDetails: { type: 'object' },
      },
    },
    timestamp: { type: 'string', format: 'date-time' },
  },
};

module.exports = {
  USER_CREATED,
  EMAIL_NOTIFICATION,
};
