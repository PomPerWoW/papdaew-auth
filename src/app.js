const AuthServer = require('#auth/server.js');
const MessageBroker = require('#auth/configs/messageBroker.config.js');
const Database = require('#auth/configs/database.config.js');

class Application {
  constructor() {
    this.server = new AuthServer();
    this.database = new Database();
    this.messageBroker = new MessageBroker();
  }

  initialize() {
    this.server.start();
    this.database.connect();
    this.messageBroker.connect();
  }
}

const application = new Application();
application.initialize();
