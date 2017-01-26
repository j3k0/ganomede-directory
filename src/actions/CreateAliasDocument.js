'use strict';

const BaseAction = require('./BaseAction');
const {AliasAlreadyExistsError} = require('../errors');

class CreateAliasDocument extends BaseAction {
  constructor (db, userId, alias) {
    super();
    this.db = db;
    this.userId = userId;
    this.alias = alias;
    this.docId = `alias:${this.alias.type}:${this.alias.value}`;
    this.checkResult = null; // null if we don't have alias `docId`, doc itself if we do.
    this.result = null; // Couch reply to document craetion (ok, id, rev).
  }

  check (callback) {
    this.db.nullableGet(this.docId, (err, doc) => {
      if (err)
        return callback(err);

      // existing alias, but owner is not userId
      if (doc && (doc.id !== this.userId))
        return callback(new AliasAlreadyExistsError(this.alias.type, this.alias.value));

      this.checkResult = doc;
      callback(null);
    });
  }

  execute (callback) {
    const docBody = Object.assign({}, this.checkResult || {}, {
      id: this.userId,
      date: this.alias.date,
      public: this.alias.public === true
    });

    const cb = (err, response) => {
      if (err)
        return callback(err);

      this.result = response;
      callback(null);
    };

    return this.checkResult
      ? this.db.replace(docBody, cb)
      : this.db.save(this.docId, docBody, cb);
  }

  rollback (callback) {
    // no previous alias
    if (!this.checkResult)
      return this.db.delete(this.result.id, this.result.rev, callback);

    // restore original
    const original = Object.assign({}, this.checkResult, {_rev: this.result.rev});
    this.db.replace(original, callback);
  }
}

module.exports = CreateAliasDocument;
