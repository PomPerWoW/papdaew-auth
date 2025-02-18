const { Router } = require('express');

const HealthController = require('#auth/controllers/health.controller.js');

const router = Router();
const healthController = new HealthController();

router.get('/', healthController.getHealth);
router.get('/error', healthController.error);

module.exports = { healthRoutes: router };
