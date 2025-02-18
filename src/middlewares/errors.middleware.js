const { StatusCodes } = require('http-status-codes');

class CustomError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.timestamp = new Date().toISOString();
  }
}

class NotFoundError extends CustomError {
  constructor(message = 'Not Found') {
    super(message, StatusCodes.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

class BadRequestError extends CustomError {
  constructor(message = 'Bad Request') {
    super(message, StatusCodes.BAD_REQUEST);
    this.name = 'BadRequestError';
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = 'Unauthorized Access') {
    super(message, StatusCodes.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends CustomError {
  constructor(message = 'Forbidden Access') {
    super(message, StatusCodes.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

class ValidationError extends CustomError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class ConflictError extends CustomError {
  constructor(message = 'Resource Conflict') {
    super(message, StatusCodes.CONFLICT);
    this.name = 'ConflictError';
  }
}

class TooManyRequestsError extends CustomError {
  constructor(message = 'Too Many Requests') {
    super(message, StatusCodes.TOO_MANY_REQUESTS);
    this.name = 'TooManyRequestsError';
  }
}

const globalErrorHandler = (err, req, res, _next) => {
  const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  const errorResponse = {
    status: 'error',
    statusCode: status,
    message,
    timestamp: err.timestamp || new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  if (req.id) {
    errorResponse.requestId = req.id;
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(status).json(errorResponse);
};

module.exports = {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  TooManyRequestsError,
  globalErrorHandler,
};
