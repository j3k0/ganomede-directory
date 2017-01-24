'use strict';

const LoginsUsers = require('./LoginsUsers');
const actions = require('../actions');
const ActionsExecutor = require('../ActionsExecutor');

class CreatesUsers {
  constructor (db, authdb) {
    this.db = db;
    this.authdb = authdb;
  }

  // callback(err, {id, token})
  create (userId, password, aliases, callback) {
    const now = new Date();
    const steps = [
      new actions.CreateUserDocument(this.db, userId, password),
      ...aliases.map(alias => new actions.CreateAliasDocument(this.db, userId, {
        type: alias.type,
        value: alias.value,
        date: now,
        public: alias.public === true
      }))
    ];

    new ActionsExecutor(steps).run((err) => {
      if (err)
        return callback(err);

      new LoginsUsers(this.db, this.authdb).createToken(userId, (err, token) => {
        if (err)
          return callback(err);

        callback(null, {
          id: userId,
          token
        });
      });
    });
  }
}

module.exports = CreatesUsers;
