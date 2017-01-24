'use strict';

const BaseAction = require('./BaseAction');
const {AliasAlreadyExistsError} = require('../errors');

class CreateAliasDocument extends BaseAction {
  constructor (db, userId, alias) {
    super();
    this.db = db;
    this.userId = userId;
    this.alias = alias;
    this.result = null; // Couch reply to document craetion (ok, id, rev).
  }

  check (callback) {
    const docId = `alias:${this.alias.type}:${this.alias.value}`;

    this.db.exists(docId, (err, exists) => {
      if (err)
        return callback(err);

      if (exists)
        return callback(new AliasAlreadyExistsError(this.alias.type, this.alias.value));

      callback(null);
    });
  }

  execute (callback) {
    const docId = `alias:${this.alias.type}:${this.alias.value}`;
    const docBody = {
      id: this.userId,
      date: this.alias.date,
      public: this.alias.public
    };

    this.db.save(docId, docBody, (err, response) => {
      if (err)
        return callback(err);

      this.result = response;
      callback(null);
    });
  }

  rollback (callback) {
    this.db.delete(this.result.id, this.result.rev, callback);
  }
}

module.exports = CreateAliasDocument;
