'use strict';

const async = require('async');
const LoginsUsers = require('./LoginsUsers');

class ChangesPasswords {
  constructor (db) {
    this.db = db;
  }

  _prepare (userId, newPassword, callback) {
    async.parallel({
      userDoc: (cb) => this.db.get(`id:${userId}`, cb),
      hash: (cb) => new LoginsUsers().hashPassword(newPassword, cb)
    }, callback);
  }

  change (userId, newPassword, callback) {
    this._prepare(userId, newPassword, (err, result) => {
      if (err)
        return callback(err);

      result.userDoc.hash = result.hash;
      this.db.replace(result.userDoc, callback);
    });
  }
}

module.exports = ChangesPasswords;
