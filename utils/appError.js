class AppError extends Error {
  constructor(message, statusCode) {
    // this will set the messge property
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // errors that we can predict like user creation w/o req fields - isOperational
    this.isOperational = true;

    // create a .stack property on objects of AppError
    // same as when we do : const err = new Error('some message')
    // now do : console.log(err.stack)
    // err.stack will give the stack trace
    // we are creating a similar poperty for AppError objects.
    // we pass this.constructor so that when an object of AppError is created
    // and the constructor function is called then it wont appear in the stacktrace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
