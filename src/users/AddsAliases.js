'use strict';

// This is different from when creating user.
// (We might want to replace() in certain situations.)

const {AliasAlreadyExistsError} = require('../errors');

class AddsAliases {
  constructor (db) {
    this.db = db;
  }

  add (userId, alias, callback) {
    // happy path is to add document
    // not so happy is to 409, but same user id, so replace it
    // bad path is 409, different userid owns it

    const docId = `alias:${alias.type}:${alias.value}`;
    const docBody = {
      id: userId,
      date: alias.date,
      public: alias.public === true
    };

    this.db.nullableGet(docId, (err, doc) => {
      if (err)
        return callback(err);

      // new alias
      if (doc === null)
        return this.db.save(docId, docBody, callback);

      // existing alias, check owner and replace if matches
      return (doc.id === userId)
        ? this.db.replace(Object.assign(doc, docBody), callback)
        : callback(new AliasAlreadyExistsError(alias.type, alias.value));
    });
  }
}

module.exports = AddsAliases;
