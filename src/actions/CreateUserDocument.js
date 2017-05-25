'use strict';

const async = require('async');
const LoginsUsers = require('../users/LoginsUsers');
const {UserAlreadyExistsError} = require('../errors');
const BaseAction = require('./BaseAction');
const Db = require('../db/db');

class CreateUserDocument extends BaseAction {
  constructor (db, userId, password) {
    super();
    this.db = db;
    this.userId = userId;
    this.password = password;
    this.result = null; // Couch reply to document craetion (ok, id, rev).
  }

  check (callback) {
    const docId = `id:${this.userId}`;

    this.db.exists(docId, (err, exists) => {
      if (err)
        return callback(err);

      if (exists)
        return callback(new UserAlreadyExistsError(this.userId));

      callback(null);
    });
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
          if (err instanceof Db.RevisionMismatchError)
            return callback(new UserAlreadyExistsError(this.userId));

          if (err)
            return cb(err);

          this.result = response;
          cb(null);
        });
      }
    ], callback);
  }

  rollback (callback) {
    this.db.delete(this.result.id, this.result.rev, callback);
  }
}

module.exports = CreateUserDocument;
