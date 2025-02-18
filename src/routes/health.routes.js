import { Router } from 'express';

import HealthController from '@auth/controllers/health.controller.js';

const router = Router();
const healthController = new HealthController();

router.get('/', healthController.getHealth);
router.get('/error', healthController.error);

export { router as healthRoutes };
