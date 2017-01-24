'use strict';

class BaseAction {
  check (cb) {
    setImmediate(cb, null);
  }
}

module.exports = BaseAction;
