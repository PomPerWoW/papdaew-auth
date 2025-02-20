const { Router } = require('express');
const passport = require('passport');

const AuthController = require('#auth/controllers/auth.controller.js');

const router = Router();
const authController = new AuthController();

router.post('/signup', authController.signup);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

module.exports = { authRoutes: router };
