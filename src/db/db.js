'use strict';

const async = require('async');
const lodash = require('lodash');

class DB {
  constructor () {}

  get (id, callback) {
    throw new Error('NotImplemented');
  }

  save (id, body, callback) {
    throw new Error('NotImplemented');
  }

  saveMulti (idToBodyObject, callback) {
    const operations = lodash.map(idToBodyObject, (docBody, docId) => {
      return [docId, docBody];
    });

    async.each(
      operations,
      ([id, body], cb) => this.save(id, body, cb),
      callback
    );
  }

  // he?..
  replace (oldDoc, newDoc, callback) {
    throw new Error('NotImplemented');
  }
}

module.exports = DB;
