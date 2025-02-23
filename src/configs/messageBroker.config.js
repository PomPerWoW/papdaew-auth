const amqp = require('amqplib');

const LoggerFactory = require('#auth/utils/logger.js');
const Config = require('#auth/configs/config.js');

class MessageBroker {
  #logger;
  #config;
  #connection;
  #channel;

  constructor() {
    this.#config = new Config();
    this.#logger = LoggerFactory.getLogger('Message Broker');
  }

  connect = async () => {
    try {
      this.#connection = await amqp.connect(this.#config.RABBITMQ_URL);
      this.#channel = await this.#connection.createChannel();
      this.#logger.info('Successfully connected to RabbitMQ');
    } catch (error) {
      this.#logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  };

  disconnect = async () => {
    await this.#channel?.close();
    await this.#connection?.close();
  };

  publishDirect = async (queue, message, logMessage) => {
    try {
      await this.#channel.assertQueue(queue, { durable: true });
      await this.#channel.sendToQueue(queue, Buffer.from(message), {
        persistent: true,
      });

      this.#logger.info(logMessage);
    } catch (error) {
      this.#logger.error(
        `Failed to publish direct message to queue: ${queue}`,
        error
      );
      throw error;
    }
  };

  publishFanout = async (exchange, message, logMessage) => {
    try {
      await this.#channel.assertExchange(exchange, 'fanout', { durable: true });

      await this.#channel.publish(
        exchange,
        '',
        Buffer.from(JSON.stringify(message))
      );

      this.#logger.info(logMessage);
    } catch (error) {
      this.#logger.error(
        `Failed to publish fanout message to exchange: ${exchange}`,
        error
      );
      throw error;
    }
  };
}

module.exports = MessageBroker;
