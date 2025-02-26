const amqp = require('amqplib');
const addFormats = require('ajv-formats');
const Ajv = require('ajv');
const { PinoLogger } = require('@papdaew/shared');

const authEventSchemas = require('#auth/events/schemas/auth.events.js');
const Config = require('#auth/configs/config.js');

class MessageBroker {
  #logger;
  #config;
  #connection;
  #channel;
  #validator;
  static #instance;

  constructor() {
    if (MessageBroker.#instance) {
      return MessageBroker.#instance;
    }
    this.#config = new Config();
    this.#logger = new PinoLogger().child({
      service: 'Message Broker',
    });

    // Initialize JSON schema validator
    this.#validator = new Ajv();
    addFormats(this.#validator);

    // Register event schemas
    this.#registerEventSchemas();

    MessageBroker.#instance = this;
  }

  #registerEventSchemas = () => {
    Object.entries(authEventSchemas).forEach(([eventName, schema]) => {
      this.#validator.addSchema(schema, eventName);
    });
  };

  #validateEventPayload = (eventType, payload) => {
    const isValid = this.#validator.validate(eventType, payload);

    if (!isValid) {
      const { errors } = this.#validator;
      this.#logger.error(`Invalid event payload for ${eventType}`, { errors });
      throw new Error(
        `Invalid event payload for ${eventType}: ${JSON.stringify(errors)}`
      );
    }
  };

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

  publishDirect = async (queue, eventType, payload, logMessage) => {
    try {
      this.#validateEventPayload(eventType, payload);

      const event = {
        type: eventType,
        data: payload,
        metadata: {
          timestamp: new Date().toISOString(),
          service: 'auth-service',
        },
      };

      const content = JSON.stringify(event);

      await this.#channel.assertQueue(queue, { durable: true });
      await this.#channel.sendToQueue(queue, Buffer.from(content), {
        persistent: true,
      });

      this.#logger.info(logMessage || `Published message to queue ${queue}`);
      return true;
    } catch (error) {
      this.#logger.error(`Failed to publish message to queue ${queue}`, error);
      throw error;
    }
  };

  publishFanout = async (exchange, eventType, payload, logMessage) => {
    try {
      this.#validateEventPayload(eventType, payload);

      const event = {
        type: eventType,
        data: payload,
        metadata: {
          timestamp: new Date().toISOString(),
          service: 'auth-service',
        },
      };

      const content = JSON.stringify(event);

      await this.#channel.assertExchange(exchange, 'fanout', { durable: true });
      await this.#channel.publish(exchange, '', Buffer.from(content));

      this.#logger.info(
        logMessage || `Published event to exchange ${exchange}`
      );
      return true;
    } catch (error) {
      this.#logger.error(
        `Failed to publish event to exchange ${exchange}`,
        error
      );
      throw error;
    }
  };

  subscribeDirect = async (queue, handler) => {
    try {
      await this.#channel.assertQueue(queue, { durable: true });

      await this.#channel.consume(queue, async message => {
        try {
          const content = message.content.toString();

          const parsedContent = JSON.parse(content);

          await handler(parsedContent);
          this.#channel.ack(message);
        } catch (error) {
          this.#logger.error(
            `Error processing message from queue ${queue}`,
            error
          );
          // Reject the message without requeuing for now
          this.#channel.nack(message, false, false);
        }
      });

      this.#logger.info(`Subscribed to direct queue ${queue}`);
    } catch (error) {
      this.#logger.error(`Failed to subscribe to queue ${queue}`, error);
      throw error;
    }
  };

  subscribeFanout = async (exchange, queue, handler) => {
    try {
      await this.#channel.assertExchange(exchange, 'fanout', { durable: true });
      const queueResult = await this.#channel.assertQueue(queue, {
        durable: true,
      });
      await this.#channel.bindQueue(queueResult.queue, exchange, '');

      await this.#channel.consume(queueResult.queue, async message => {
        try {
          const event = JSON.parse(message.content.toString());
          await handler(event);
          this.#channel.ack(message);
        } catch (error) {
          this.#logger.error(
            `Error processing message from ${exchange}`,
            error
          );
          // Reject the message without requeuing for now
          this.#channel.nack(message, false, false);
        }
      });

      this.#logger.info(`Subscribed to ${exchange} events on queue ${queue}`);
    } catch (error) {
      this.#logger.error(`Failed to subscribe to ${exchange}`, error);
      throw error;
    }
  };
}

module.exports = MessageBroker;
