'use strict';

const LoginsUsers = require('./LoginsUsers');
const actions = require('../actions');
const ActionsExecutor = require('../ActionsExecutor');

class CreatesUsers {
  constructor (db, authdb) {
    this.db = db;
    this.authdb = authdb;
  }

  create (userId, password, aliases, callback) {
    // TODO
    // validate stuff here?
    // const valid = validateUserId() && validatePassword() && validateAliases();
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
        return callback(err); // TODO: detect what an error is: hashing, doc creation, 409

      new LoginsUsers(this.db, this.authdb).createToken(userId, (err, token) => {
        if (err)
          return callback(err); // TODO: account created, but failed to login
                                // should be distinct from failed to create account.

        callback(null, {
          id: userId,
          token
        });
      });
    });
  }
}

module.exports = CreatesUsers;
