'use strict';

const async = require('async');

// Pass in array of actions, #run() to execute them in series,
// If one fails, calls action.rollback() on previous ones in reverse order.
class ActionsExecutor {
  constructor (actions) {
    this.actions = actions;
  }

  rollback (reason, rollbackQueue, callback) {
    async.eachSeries(
      rollbackQueue,
      // TODO
      // rollback() might error, but it should be okay to ignore it for now.
      // (Also, make sure iterator's cb() is always called with no error.)
      (action, cb) => action.rollback(cb),
      (err) => callback(reason)
    );
  }

  run (callback) {
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
}

module.exports = ActionsExecutor;
