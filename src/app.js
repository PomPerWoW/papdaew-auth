const AuthServer = require('#auth/server.js');

class Application {
  constructor() {
    this.server = new AuthServer();
  }

  initialize() {
    this.server.start();
  }
}

const application = new Application();
application.initialize();
