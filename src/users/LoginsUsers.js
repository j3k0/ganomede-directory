'use strict';

const async = require('async');
const uuid4 = require('uuid/v4');
const pbkdf = require('password-hash-and-salt');
const Db = require('../db/db');
const {UserNotFoundError, InvalidCredentialsError} = require('../errors');

class LoginsUsers {
  constructor (db, authdb) {
    this.db = db;
    this.authdb = authdb;
  }

  // callback(err, hashString)
  hashPassword (password, callback) {
    pbkdf(password).hash(callback);
  }

  // callback(err, authTokenString)
  createToken (userId, callback) {
    const token = uuid4();

    this.authdb.addAccount(token, userId, (err) => {
      return err
        ? callback(err)
        : callback(null, token);
    });
  }

  // callback(err, authtoken)
  login (userId, password, callback) {
    async.waterfall([
      (cb) => this.db.get(`id:${userId}`, cb),
      (userDoc, cb) => pbkdf(password).verifyAgainst(userDoc.hash, cb),
      (matches, cb) => {
        return matches
          ? this.createToken(userId, cb)
          : cb(new InvalidCredentialsError());
      }
    ], (err, token) => {
      if (err instanceof Db.DocumentNotFoundError)
        return callback(new UserNotFoundError(userId));

      if (err)
        return callback(err);

      callback(null, token);
    });
  }
}

module.exports = LoginsUsers;
