'use strict';

const util = require('util');
const restify = require('restify');
const logger = require('./logger');

// The way to distinguish our app's logic-level errors from others.
// (Like `socket hang up` vs `user already exists`.)
//
// TODO
// Update this with more concrete recommendations/practices
// after figuring out what works best. For now it is mostly trying things out.

class BaseError extends Error {
  constructor (...messageArgs) {
    super();
    this.name = this.constructor.name;

    if (messageArgs.length > 0)
      this.message = util.format.apply(util, messageArgs);

    Error.captureStackTrace(this, this.constructor);
  }

  toRestError () {
    if (!this.statusCode)
      throw new Error(`Please define "statusCode" prop for ${this.constructor.name}`);

    // TODO
    // Stack is useless. Probably do `result.stack = this.stack`.

    return new restify.RestError({
      restCode: this.name,
      statusCode: this.statusCode,
      message: this.message
    });
  }
}

class UserAlreadyExistsError extends BaseError {
  constructor (userId) {
    super('User already exists %j', {userId});
    this.statusCode = 409;
  }
}

class AliasAlreadyExistsError extends BaseError {
  constructor (type, value) {
    super('Alias already exists %j', {type, value});
    this.statusCode = 409;
  }
}

class UserNotFoundError extends BaseError {
  constructor (userId) {
    super('User not found %j', {userId});
    this.statusCode = 404;
  }
}

class InvalidAuthTokenError extends BaseError {
  constructor () {
    super('Invalid auth token');
    this.statusCode = 401;
  }
}

class InvalidCredentialsError extends BaseError {
  constructor () {
    super('Invalid credentials');
    this.statusCode = 401;
  }
}

// This is for validation errors (like missing `body` or certain parts of it),
// same as base error except it allows to specify custom restCode
// via changing instance's .name (see BaseError#toRestError()).
//
// Use like this:
//
//   if (!req.body.userId) {
//     const err = new RequestValidationError('BadUserId', 'Invalid or missing User ID');
//     return sendHttpError(next, err);
//   }
//
//   // will result in http 404 with json body:
//   // { "code": "BadUserId",
//   //   "message": "Invalid or missing User ID" }
class RequestValidationError extends BaseError {
  constructor (name, ...messageArgs) {
    super(...messageArgs);
    this.name = name;
    this.statusCode = 400;
  }
}

// Kept forgetting `next` part, so let's change this to (next, err).
const sendHttpError = (next, err) => {
  if (err instanceof BaseError)
    return next(err.toRestError());

  // TODO
  // This is probably not needed, since we are expecting
  // either `BaseError` (and descendants instances) here,
  // or "core" errors like `socket hang up`.
  // (It is probably best to wrap everything else that is of "restify"-y nature
  // into one of `BaseError`-based classes (or even create new one)
  if (err instanceof restify.HttpError)
    return next(err);

  logger.error(err);
  next(err);
};

module.exports = {
  BaseError,
  UserAlreadyExistsError,
  AliasAlreadyExistsError,
  UserNotFoundError,
  InvalidAuthTokenError,
  InvalidCredentialsError,
  RequestValidationError,
  sendHttpError
};
