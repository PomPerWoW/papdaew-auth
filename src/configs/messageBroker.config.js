const amqp = require('amqplib');
const { PinoLogger } = require('@papdaew/shared');

const Config = require('#auth/config.js');

class MessageBroker {
  #logger;
  #config;
  #connection;
  #channel;

  constructor() {
    this.#config = new Config();
    this.#logger = new PinoLogger({
      name: 'Message Broker',
      level: this.#config.LOG_LEVEL,
      serviceVersion: this.#config.SERVICE_VERSION,
      environment: this.#config.NODE_ENV,
    });
  }

  #disconnect = () => {
    process.once('SIGINT', async () => {
      await this.#channel?.close();
      await this.#connection?.close();
    });
  };

  connect = async () => {
    try {
      this.#connection = await amqp.connect(this.#config.RABBITMQ_URL);
      this.#channel = await this.#connection.createChannel();
      this.#logger.info('Successfully connected to RabbitMQ');
      this.#disconnect();
    } catch (error) {
      this.#logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  };
}

module.exports = MessageBroker;
