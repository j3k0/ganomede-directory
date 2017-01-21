'use strict';

const async = require('async');
const lodash = require('lodash');
const nano = require('nano');

const DESIGN = 'users';

class DB {
  // new DB(config.couch)
  constructor ({url, name}) {
    this.db = nano(url).use(name);
  }

  // TODO:
  // missing doc should probably be an error, code in other places depends on it
  get (id, callback) {
    throw new Error('NotImplemented');
  }

  save (id, body, callback) {
    throw new Error('NotImplemented');
  }

  delete (docId, docRevision, callback) {
    throw new Error('NotImplemented');
  }

  // TODO
  // document must have _id, _rev
  replace (document, callback) {
    throw new Error('NotImplemented');
  }

  // fetch _lists/<listname>/<viewname> with qs
  list (viewname, listname, qs, callback) {
    throw new Error('NotImplemented');

    // db.viewWithList(DESIGN, viewname, listname, qs, (err, body) => {

    // });
  }

  // listItem () {
  //   // http://localhost:5984/contrasstest/_design/users/_list/profiles/rawProfiles?key="alice"
  // }

  // TODO
  // following stuff isn't used anymore, don't forget to delete it.

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
