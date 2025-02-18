import http from 'http';

import express from 'express';
import { Server } from 'socket.io';

import { config } from '@auth/config.js';
import { healthRoutes } from '@auth/routes/health.routes.js';
import Logger from '@auth/utils/logger/logger.utils.js';

class AuthServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);
    this.logger = new Logger('Auth Server');

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketEvents();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    this.app.use('', healthRoutes);
  }

  setupSocketEvents() {
    this.io.on('connection', socket => {
      this.logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  start() {
    this.server.listen(config.PORT, () => {
      this.logger.info(`Auth service is running on port ${config.PORT}`);
    });
  }
}

// Create and start the server
const authServer = new AuthServer();
authServer.start();
