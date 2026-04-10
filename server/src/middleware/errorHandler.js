export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Zod validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }

  // PostgreSQL error
  if (err.code && err.code.startsWith('2')) {
    return res.status(400).json({
      error: 'Database error',
      message: err.message,
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}
