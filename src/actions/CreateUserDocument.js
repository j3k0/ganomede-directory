'use strict';

const async = require('async');
const LoginsUsers = require('../users/LoginsUsers');

class CreateUserDocument {
  constructor (db, userId, password) {
    this.db = db;
    this.userId = userId;
    this.password = password;
    this.result = null; // Couch reply to document craetion (ok, id, rev).
  }

  execute (callback) {
    async.waterfall([
      (cb) => new LoginsUsers().hashPassword(this.password, cb),
      (hash, cb) => {
        const docId = `id:${this.userId}`;
        const docBody = {
          id: this.userId,
          hash
        };

        this.db.save(docId, docBody, (err, response) => {
          if (err)
            return cb(err);

          this.result = response;
          cb();
        });
      }
    ], callback);
  }

  rollback (callback) {
    this.db.delete(this.result.id, this.result.rev, callback);
  }
}

module.exports = CreateUserDocument;
