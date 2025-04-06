const Joi = require('joi');

const signupSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('CUSTOMER', 'VENDOR', 'ADMIN', 'STAFF'),
  vendorId: Joi.string().allow(''),
  isRoot: Joi.boolean(),
  position: Joi.string(),
  branchId: Joi.string().allow(''),
}).unknown(true);

const loginSchema = Joi.object({
  identifier: Joi.alternatives().conditional(Joi.string().email(), {
    then: Joi.string().email().required(),
    otherwise: Joi.string().required(),
  }),
  password: Joi.string().required(),
});

module.exports = { signupSchema, loginSchema };
