const { PinoLogger } = require('@papdaew/shared');

const Config = require('#auth/configs/config.js');

class LoggerFactory {
  static #instances = new Map();
  static #config = new Config();

  static getLogger(name) {
    if (!this.#instances.has(name)) {
      this.#instances.set(
        name,
        new PinoLogger({
          name,
          level: this.#config.LOG_LEVEL,
          serviceVersion: this.#config.SERVICE_VERSION,
          environment: this.#config.NODE_ENV,
        })
      );
    }
    return this.#instances.get(name);
  }
}

module.exports = LoggerFactory;
