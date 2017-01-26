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
}

class UserAlreadyExistsError extends BaseError {
  constructor (userId) {
    super('User already exists %j', {userId});
  }
}

class AliasAlreadyExistsError extends BaseError {
  constructor (type, value) {
    super('Alias already exists %j', {type, value});
  }
}

class UserNotFoundError extends BaseError {
  constructor (userId) {
    super('User not found %j', {userId});
  }
}

class InvalidAuthTokenError extends BaseError {
  constructor () {
    super('Invalid auth token');
  }
}

class InvalidCredentialsError extends BaseError {
  constructor () {
    super('Invalid credentials');
  }
}

// Kept forgetting `next` part, so let's change this to (next, err).
const sendHttpError = (next, err) => {
  switch (err.constructor) {
    case AliasAlreadyExistsError:
    case UserAlreadyExistsError:
      return next(new restify.ConflictError(err.message));

    case UserNotFoundError:
      return next(new restify.NotFoundError(err.message));

    case InvalidCredentialsError:
    case InvalidAuthTokenError:
      return next(new restify.ForbiddenError(err.message));

    // TODO
    // check instanceof restify.HttpError
    // (not worth logging all of stuff like BadRequest(invalid body))
    // Convert to interal error otherwise, maybe?
    default:
      logger.error(err);
      return next(err);
  }
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
