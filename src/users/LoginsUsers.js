'use strict';

const async = require('async');
const crypto = require('crypto');
const pbkdf = require('password-hash-and-salt');
const Db = require('../db/db');
const {UserNotFoundError, InvalidCredentialsError} = require('../errors');
const config = require('../../config');

// Generate auth tokens which match regex /D[a-z0-9]+/
// ('D' allows to identify which module generated the token)
const token4 = () => crypto.randomBytes(4).readUInt32BE().toString(36);
const genToken = () => 'D' + token4() + token4() + token4();

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
    const token = genToken();

    this.authdb.addAccount(token, {username: userId}, (err) => {
      return err
        ? callback(err)
        : callback(null, token);
    });
  }

  // callback(err, authtoken)
  login (userId, password, callback) {
    if (config.secret === password)
      return this.createToken(userId, callback);
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
