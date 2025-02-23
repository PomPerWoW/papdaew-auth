const { Router } = require('express');

const HealthController = require('#auth/controllers/health.controller.js');

class HealthRoutes {
  #router;
  #healthController;

  constructor() {
    this.#router = Router();
    this.#healthController = new HealthController();
  }

  setup() {
    this.#router.get('/', this.#healthController.getHealth);
    this.#router.get('/error', this.#healthController.error);
    return this.#router;
  }
}

module.exports = HealthRoutes;
