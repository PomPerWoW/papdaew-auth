const { PinoLogger } = require('@papdaew/shared');
const { StatusCodes } = require('http-status-codes');

const HealthController = require('#auth/controllers/health.controller');

jest.mock('@papdaew/shared', () => ({
  PinoLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
  asyncHandler: jest.fn(fn => fn),
}));

describe('HealthController', () => {
  let healthController;
  let mockReq;
  let mockRes;
  let mockNext;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    PinoLogger.mockImplementation(() => mockLogger);

    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockNext = jest.fn();

    healthController = new HealthController();
  });

  afterAll(() => {
    jest.resetModules();
  });

  describe('getHealth', () => {
    it('should return healthy status', async () => {
      await healthController.getHealth(mockReq, mockRes, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith('GET: /health');
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.send).toHaveBeenCalledWith(
        'Auth service is healthy and OK'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should return unhealthy status', async () => {
      await healthController.error(mockReq, mockRes, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith('GET: /error');
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.send).toHaveBeenCalledWith('Auth service is unhealthy');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
