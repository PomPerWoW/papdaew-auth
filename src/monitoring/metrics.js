const promClient = require('prom-client');

class Metrics {
  static #instance;
  #register;

  #httpRequestsTotal;
  #httpRequestDuration;
  #databaseConnectionStatus;

  constructor() {
    if (Metrics.#instance) {
      return Metrics.#instance;
    }

    this.#register = new promClient.Registry();

    promClient.collectDefaultMetrics({
      register: this.#register,
      prefix: 'auth_',
    });

    this.#initializeMetrics();
    Metrics.#instance = this;
  }

  #initializeMetrics() {
    this.#httpRequestsTotal = new promClient.Counter({
      name: 'auth_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'status'],
      registers: [this.#register],
    });

    this.#httpRequestDuration = new promClient.Histogram({
      name: 'auth_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      registers: [this.#register],
    });

    this.#databaseConnectionStatus = new promClient.Gauge({
      name: 'auth_database_connection_status',
      help: 'Database connection status (1 = connected, 0 = disconnected)',
      registers: [this.#register],
    });
  }

  incrementHttpRequests(method, status) {
    this.#httpRequestsTotal.labels(method, status).inc();
  }

  observeHttpRequestDuration(method, path, duration) {
    this.#httpRequestDuration.labels(method, path).observe(duration);
  }

  setDatabaseStatus(isConnected) {
    this.#databaseConnectionStatus.set(isConnected ? 1 : 0);
  }

  get metrics() {
    return this.#register;
  }
}

module.exports = Metrics;
