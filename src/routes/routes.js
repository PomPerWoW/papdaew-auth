import { Router } from 'express';

import HealthController from '@auth/controllers/health.controller.js';

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.getHealth);
router.get('/error', healthController.error);

export default router;
