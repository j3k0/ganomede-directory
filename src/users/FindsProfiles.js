'use strict';

// Turn some kind of identifier into user profile.
// callback(err, profile)

const async = require('async');
const BuildsProfiles = require('./BuildsProfiles');
const {InvalidAuthTokenError} = require('../errors');

class FindsProfiles {
  constructor (db, authdb) {
    this.db = db;
    this.authdb = authdb;
    this.builder = new BuildsProfiles(this.db);
  }

  byUserId (userId, callback) {
    this.builder.build(userId, callback);
  }

  byAuthToken (token, callback) {
    async.waterfall([
      (cb) => this.authdb.getAccount(token, cb),
      (userId, cb) => {
        return userId
          ? this.byUserId(userId, cb)
          : cb(new InvalidAuthTokenError());
      }
    ], callback);
  }

  byAlias (type, value, callback) {
    async.waterfall([
      (cb) => this.db.get(`alias:${type}:${value}`, cb),
      (doc, cb) => {
        return doc
          ? this.byUserId(doc.id, cb)
          : cb(new Error('NotFound'));
      }
    ], callback);
  }
}

module.exports = FindsProfiles;
