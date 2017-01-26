'use strict';

const ActionsExecutor = require('../ActionsExecutor');
const CreateAliasDocument = require('../actions/CreateAliasDocument');

class AddsAliases {
  constructor (db) {
    this.db = db;
  }

  add (userId, aliases, callback) {
    return new ActionsExecutor([
      ...aliases.map(alias => new CreateAliasDocument(this.db, userId, alias))
    ]).run(callback);
  }
}

module.exports = AddsAliases;
