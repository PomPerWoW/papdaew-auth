const AuthServer = require('#auth/server.js');

class Application {
  database;

  constructor() {
    this.server = new AuthServer();
  }

  initialize() {
    this.server.start();
  }
}

const application = new Application();
application.initialize();
