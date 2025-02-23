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
    this.setupExceptionHandler();
    this.server.start();
    this.database.connect();
    this.messageBroker.connect();
    this.setupShutdown();
  }

  setupExceptionHandler() {
    process.once('uncaughtException', error => {
      console.error('Uncaught Exception:', error);
      this.server.close(() => {
        process.exit(1);
      });
    });

    process.once('unhandledRejection', error => {
      console.error('Unhandled Rejection:', `${error.name}: ${error.message}`);
      this.server.close(() => {
        process.exit(1);
      });
    });
  }

  setupShutdown() {
    const shutdown = async () => {
      try {
        await this.messageBroker.disconnect();
        await this.database.disconnect();
        this.server.close();

        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  }
}

const application = new Application();
application.initialize();
