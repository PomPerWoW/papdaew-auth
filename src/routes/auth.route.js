const { Router } = require('express');
const passport = require('passport');

const AuthController = require('#auth/controllers/auth.controller.js');

class AuthRoutes {
  #router;
  #authController;

  constructor() {
    this.#router = Router();
    this.#authController = new AuthController();
  }

  setup() {
    this.#router.post('/signup', this.#authController.signup);
    this.#router.post('/login', this.#authController.login);
    this.#router.post('/logout', this.#authController.logout);
    this.#router.get(
      '/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );
    this.#router.get(
      '/google/callback',
      passport.authenticate('google', { session: false }),
      this.#authController.googleCallback
    );
    return this.#router;
  }
}

module.exports = AuthRoutes;
