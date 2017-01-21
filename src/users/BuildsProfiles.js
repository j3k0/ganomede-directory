'use strict';

const Profile = require('./Profile');

class BuildsProfiles {
  constructor (db) {
    this.db = db;
  }

  // Give userId, receive user profile object that can be sent back.
  // callback(err, profile)
  //
  // TODO
  // Need options for something like which aliases to include (public / all), etc.
  build (userId, callback) {
    this.db.list('rawProfiles', 'profiles', {key: userId}, (err, json) => {
      return err
        ? callback(err)
        : callback(null, new Profile(json.id, json.hash, json.aliases));
    });
  }
}

module.exports = BuildsProfiles;
