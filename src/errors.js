'use strict';

const util = require('util');

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

module.exports = {
  BaseError
};
