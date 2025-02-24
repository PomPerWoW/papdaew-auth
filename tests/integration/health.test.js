const request = require('supertest');
const { StatusCodes } = require('http-status-codes');

const AuthServer = require('#auth/server.js');

jest.mock('@papdaew/shared', () => ({
  ...jest.requireActual('@papdaew/shared'),
  PinoLogger: jest.fn().mockImplementation(() => ({
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }),
  })),
}));

describe('Health Check Integration Tests', () => {
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
        .expect(StatusCodes.OK);

      expect(response.text).toBe('Auth service is healthy and OK');
    });
  });

  describe('GET /error', () => {
    it('should return 500 Internal Server Error with unhealthy message', async () => {
      const response = await request(app)
        .get('/error')
        .expect('Content-Type', /text/)
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.text).toBe('Auth service is unhealthy');
    });
  });
});
