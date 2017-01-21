'use strict';

class Profile {
  constructor (id, hash, aliases) {
    this.id = id;
    this.hash = hash;
    this.aliases = aliases;
  }
}

module.exports = Profile;
