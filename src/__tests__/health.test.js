const request = require('supertest');

const AuthServer = require('#auth/server.js');

describe('Health Check Endpoints', () => {
  let app;

  beforeAll(() => {
    const authServer = new AuthServer();
    app = authServer.setup();
  });

  describe('GET /health', () => {
    it('should return 200 OK with healthy message', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /text/)
        .expect(200);

      expect(response.text).toBe('Auth service is healthy and OK');
    });
  });

  describe('GET /error', () => {
    it('should return 500 Internal Server Error with unhealthy message', async () => {
      const response = await request(app)
        .get('/error')
        .expect('Content-Type', /text/)
        .expect(500);

      expect(response.text).toBe('Auth service is unhealthy');
    });
  });
});
