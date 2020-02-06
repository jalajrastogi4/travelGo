const AppError = require('./../utils/appError');

// Cast Error : when a string cant be converted to  valid _id  by mongodb ObjectID method
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Duplicate Error
const handleDuplicateFieldsDB = err => {
  // In mongo error object error.message is like
  // E11000 duplicate key error collection : travel_go.tours index: name_1 dup key { : \"<Value for name field>"\}
  // to get : "<Value for name field>" use regex
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Validation Error :  when user entry does not match the Schema definition
const handleValidationErrorDB = err => {
  // errors has the objects of each fields that has validation error
  // Object.values will give the array of error object corresponding to each field
  // errors is the array of error messages extracted from error object
  const errors = Object.values(err.errors).map(el => el.message);

  // join all the error messages in errors array
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// handle(set error message) JsonWebTokenError
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// handle(set error message) TokenExpiredError
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // this is for travel-go API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // WEB Version - render error template
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // this is for travel-go API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error || errors we create ourselves: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or other unknown error from 3rd part package: don't leak error details
    // Log error
    console.error('ERROR 💥', err);
    // Sending a generic message with 500 status code
    return res.status(500).json({
      status: 'error',
      message: 'OOPS! Something looks wrong!'
    });
  }

  // WEB Version
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'OOPS! Something looks wrong!',
      msg: err.message
    });
  }
  // Programming or other unknown error from 3rd part package: don't leak error details
  // Log error
  console.error('ERROR 💥', err);
  // Sending generic message
  return res.status(err.statusCode).render('error', {
    title: 'OOPS! Something looks wrong!',
    msg: 'Please try again later.'
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // add any errors that are operational here
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // 11000 is MongoError for duplicate key error
    // could take any other property from error object but code is easy
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
