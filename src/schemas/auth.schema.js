const Joi = require('joi');

const signupSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const loginSchema = Joi.object({
  identifier: Joi.alternatives().conditional(Joi.string().email(), {
    then: Joi.string().email().required(),
    otherwise: Joi.string().required(),
  }),
  password: Joi.string().required(),
});

module.exports = { signupSchema, loginSchema };
