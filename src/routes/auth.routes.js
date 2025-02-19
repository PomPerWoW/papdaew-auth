const { Router } = require('express');

const AuthController = require('#auth/controllers/auth.controller.js');

const router = Router();
const authController = new AuthController();

router.post('/signup', authController.signup);

module.exports = { authRoutes: router };
