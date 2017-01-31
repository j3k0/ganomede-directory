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
  }

  get statusCode () {
    return 409;
  }
}

class AliasAlreadyExistsError extends BaseError {
  constructor (type, value) {
    super('Alias already exists %j', {type, value});
  }

  get statusCode () {
    return 409;
  }
}

class UserNotFoundError extends BaseError {
  constructor (userId) {
    super('User not found %j', {userId});
  }

  get statusCode () {
    return 404;
  }
}

class InvalidAuthTokenError extends BaseError {
  constructor () {
    super('Invalid auth token');
  }

  get statusCode () {
    return 401;
  }
}

class InvalidCredentialsError extends BaseError {
  constructor () {
    super('Invalid credentials');
  }

  get statusCode () {
    return 401;
  }
}

// Kept forgetting `next` part, so let's change this to (next, err).
const sendHttpError = (next, err) => {
  if (err instanceof BaseError)
    return next(err.toRestError());

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
  sendHttpError
};
