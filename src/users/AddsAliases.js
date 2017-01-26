'use strict';

const ActionsExecutor = require('../ActionsExecutor');
const CreateAliasDocument = require('../actions/CreateAliasDocument');

class AddsAliases {
  constructor (db) {
    this.db = db;
  }

  add (userId, aliases, callback) {
    const now = new Date();

    return new ActionsExecutor([
      ...aliases.map(alias => new CreateAliasDocument(this.db, userId, {
        type: alias.type,
        value: alias.value,
        date: now,
        public: alias.public === true
      }))
    ]).run(callback);
  }
}

module.exports = AddsAliases;
