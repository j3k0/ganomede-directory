'use strict';

// Turn some kind of identifier into user profile.
// callback(err, profile)

const async = require('async');
const BuildsProfiles = require('./BuildsProfiles');
const {InvalidAuthTokenError} = require('../errors');
const logger = require('../logger');

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
      (cb) => {
        logger.debug({token},"authdb.getAccount");
        this.authdb.getAccount(token, (err, account) => {
          if (err)
            cb(new InvalidAuthTokenError(err));
          else
            cb(null, account);
        });
      },
      (account, cb) => {
        logger.debug({account},"authdb.getAccount.response");
        return (account && account.username)
          ? this.byUserId(account.username, cb)
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
