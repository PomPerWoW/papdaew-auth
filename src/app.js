const AuthServer = require('#auth/server.js');
const Database = require('#auth/services/database.service.js');

class Application {
  constructor() {
    this.server = new AuthServer();
    this.database = new Database();
  }

  initialize() {
    this.server.start();
    this.database.connect();
  }
}

const application = new Application();
application.initialize();
