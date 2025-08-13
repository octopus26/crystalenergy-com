// Global error handling middleware
function errorHandler(err, req, res, next) {
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    status: 500,
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.message;
  }

  // Database errors
  if (err.code === 'SQLITE_ERROR' || err.code === 'SQLITE_CONSTRAINT') {
    error.status = 500;
    error.message = 'Database Error';
    error.details = process.env.NODE_ENV === 'development' ? err.message : 'Database operation failed';
  }

  // Stripe errors
  if (err.type === 'StripeError') {
    error.status = 400;
    error.message = 'Payment Error';
    error.details = err.message;
  }

  // PayPal errors
  if (err.name === 'PayPalHttpError') {
    error.status = 400;
    error.message = 'PayPal Error';
    error.details = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Invalid Token';
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.status = 429;
    error.message = 'Too Many Requests';
    error.details = 'Please try again later';
  }

  // Network/timeout errors
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    error.status = 503;
    error.message = 'Service Temporarily Unavailable';
    error.details = 'Please try again in a few moments';
  }

  res.status(error.status).json({
    error: error.message,
    message: error.details,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};