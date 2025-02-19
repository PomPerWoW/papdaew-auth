const { PinoLogger } = require('@papdaew/shared');
const { StatusCodes } = require('http-status-codes');

const HealthController = require('#auth/controllers/health.controller');

// Mock dependencies
jest.mock('@papdaew/shared');

describe('HealthController', () => {
  let healthController;
  let mockReq;
  let mockRes;
  let mockLogger;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    PinoLogger.mockImplementation(() => mockLogger);

    // Mock request and response
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    healthController = new HealthController();
  });

  describe('getHealth', () => {
    it('should return healthy status', async () => {
      await healthController.getHealth(mockReq, mockRes);

      expect(mockLogger.info).toHaveBeenCalledWith('GET: /health');
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.send).toHaveBeenCalledWith(
        'Auth service is healthy and OK'
      );
    });
  });

  describe('error', () => {
    it('should return unhealthy status', async () => {
      await healthController.error(mockReq, mockRes);

      expect(mockLogger.error).toHaveBeenCalledWith('GET: /error');
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.send).toHaveBeenCalledWith('Auth service is unhealthy');
    });
  });
});
