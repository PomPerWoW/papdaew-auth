const USER_CREATED = {
  type: 'object',
  required: ['id', 'email', 'username', 'role'],
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    username: { type: 'string' },
    role: { type: 'string', enum: ['CUSTOMER', 'VENDOR', 'ADMIN', 'STAFF'] },
    vendorId: { type: 'string' },
    isRoot: { type: 'boolean' },
    position: { type: 'string' },
    branchId: { type: 'string' },
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
  },
};

module.exports = {
  USER_CREATED,
  EMAIL_NOTIFICATION,
};
