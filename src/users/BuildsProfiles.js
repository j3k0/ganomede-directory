'use strict';

const Profile = require('./Profile');
const {UserNotFoundError} = require('../errors');
const restify = require('restify');

class BuildsProfiles {
  constructor (db) {
    this.db = db;
  }

  // Give userId, receive user profile object that can be sent back.
  // callback(err, profile)
  build (userId, callback) {
    if (!userId || typeof userId !== 'string')
      return callback(new restify.BadRequestError('userId is missing or invalid'));
    this.db.list('rawProfiles', 'profiles', {key: userId}, (err, json) => {
      if (err)
        return callback(err);

      if (json.id === null)
        return callback(new UserNotFoundError(userId));

      callback(null, new Profile(json));
    });
  }
}

module.exports = BuildsProfiles;
