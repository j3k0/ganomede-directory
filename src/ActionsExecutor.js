'use strict';

const async = require('async');
const logger = require('./logger');

// Pass in array of actions, #run() to execute them in series,
// If one fails, calls action.rollback() on previous ones in reverse order.
class ActionsExecutor {
  constructor (actions) {
    this.actions = actions;
  }

  rollback (reason, rollbackQueue, callback) {
    async.eachSeries(
      rollbackQueue,
      (action, cb) => action.rollback(err => {
        if (err)
          logger.error('action rollback() failed', action, err);

        cb();
      }),
      (err) => callback(reason)
    );
  }

  // Runs in parallel, so be careful.
  //
  // TODO
  // probably worth accumulating all the errors,
  // instead of returning first one (sounds a bit "race condition"-y).
  runChecks (callback) {
    async.each(
      this.actions,
      (action, cb) => action.check(cb),
      callback
    );
  }

  runExecutes (callback) {
    const rollbackQueue = [];

    async.eachSeries(
      this.actions,
      (action, cb) => {
        action.execute(err => {
          if (err)
            return cb(err);

          rollbackQueue.unshift(action);
          cb();
        });
      },
      (err) => {
        return err
          ? this.rollback(err, rollbackQueue, callback)
          : callback(null);
      }
    );
  }

  run (callback) {
    async.series([
      (cb) => this.runChecks(cb),
      (cb) => this.runExecutes(cb)
    ], callback);
  }
}

module.exports = ActionsExecutor;
