const Database = require('#auth/database.js');
const AuthServer = require('#auth/server.js');

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
