const logger = require('./../logger');
const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Email ${value} already exists. Please use another value.`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((item) => {
    return item.message;
  });
  const message = `Invalid Input Data.  ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJsonWebTokenError = (err) => {
  return new AppError('Invalid Token. Please login again.', 401);
};
const handleTokenExpiredError = (err) => {
  return new AppError('Expired Token. PLease login again', 401);
};

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
    logger.error(`Error found. ||| ${err.message}`);
  }
  //RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  // A> API
  if (req.originalUrl.startsWith('/api')) {
    //Operational , Trusted Error
    console.log(err);

    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //Unknown Error . Don't Leak Details to the client
    logger.error(`Error found. ||| ${err.message}`);
    return res.status(500).json({
      status: err,
      message: `${err._message}`,
    });
  }
  // B> RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message,
    });
  }
  //Unknown Error . Don't Leak Details to the client

  logger.error(`Error found. ||| ${err.message}`);
  return res.status(500).json({
    status: err,
    message: 'Something went very wrong.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    //Cast Error (Invalid ID)
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    //Duplicate Error (Duplicate Fields)
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    // Validation Error
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    // Invalid JWT key.
    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError(error);
    }
    //Expired JWT key
    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError(error);
    }

    sendErrorProd(error, req, res);
  }
};
