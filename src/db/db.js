'use strict';

const async = require('async');
const nano = require('nano');
const {BaseError} = require('../errors');
const log = require('../logger');

class DocumentNotFoundError extends BaseError {
  constructor (_id, _rev) {
    super('Document not found %j', {_id, _rev});
    this.statusCode = 404;
  }

  static matches (nanoError) {
    return nanoError && nanoError.request && (nanoError.statusCode === 404) &&
      ((nanoError.request.method === 'HEAD') // HEAD request have no body,
        ? true                               // so nano doesn't fill error fields.
        : (nanoError.error === 'not_found'));
  }
}

class RevisionMismatchError extends BaseError {
  constructor (_id, _rev) {
    super('Revision mismatch %j', {_id, _rev});
    this.statusCode = 409;
  }

  static matches (nanoError) {
    return nanoError && (nanoError.statusCode === 409) && (nanoError.error === 'conflict');
  }
}

const debugDb = (db) => ({
  head: (docId, cb) => {
    log.debug({docId}, 'db.debug');
    db.head(docId, cb);
  },
  get: (docId, cb) => {
    log.debug({docId}, 'db.get');
    db.get(docId, cb);
  },
  insert: (body, docId, cb) => {
    log.debug({docId, body}, 'db.insert');
    db.insert(body, docId, cb);
  },
  viewWithList: (designName, viewname, listname, qs, cb) => {
    log.debug({designName, viewname, listname, qs}, 'db.viewWithList');
    db.viewWithList(designName, viewname, listname, qs, cb);
  }
});

class Db {
  // new DB(config.couch)
  constructor ({url, name, designName}) {
    this.db = debugDb(nano(url).use(name));
    this.designName = designName;
  }

  // callback(err, Boolean)
  exists (docId, callback) {
    this.db.head(docId, (err, _, headers) => {
      if (DocumentNotFoundError.matches(err))
        return callback(null, false);

      if (err)
        return callback(err);

      callback(null, true);
    });
  }

  // Get doc by its id. Special errors:
  //  - DocumentNotFoundError when doc is missing.
  //
  // callback(err, doc)
  get (docId, callback) {
    this.db.get(docId, (err, body, headers) => {
      if (DocumentNotFoundError.matches(err))
        return callback(new DocumentNotFoundError(docId));

      if (err)
        return callback(err);

      callback(null, body);
    });
  }

  // Same as #get(), but missing docs are callback(null, null) instead.
  //
  // callback(err, doc|null)
  nullableGet (docId, callback) {
    this.get(docId, (err, doc) => {
      if (err && err instanceof DocumentNotFoundError)
        return callback(null, null);

      if (err)
        return callback(err);

      callback(null, doc);
    });
  }

  // Insert new document to couch, special errors:
  //  - RevisionMismatchError when doc already exists.
  //
  // callback(err, couchReply) // couch reply is {ok, id, rev}
  save (docId, body, callback) {
    if (body.hasOwnProperty('_id') || body.hasOwnProperty('_rev')) {
      const error = new Error('You are trying to insert document that contains `_id` and/or `_rev` fields; use replace() to update documents');
      return setImmediate(callback, error);
    }

    this.db.insert(body, docId, (err, reply) => {
      if (RevisionMismatchError.matches(err))
        return callback(new RevisionMismatchError(docId), reply);

      if (err)
        return callback(err);

      callback(null, reply);
    });
  }

  // Hard delete document revision (removes body leaving only _id, _rev, _deleted).
  // Missing documents are treated as deleted, but `couchReply` will be null.
  //
  // callback(null, couchReply|null) // couch reply is {ok, id, rev}
  delete (docId, docRevision, callback) {
    this.db.destroy(docId, docRevision, (err, reply) => {
      if (DocumentNotFoundError.matches(err))
        return callback(null, null);

      if (err)
        return callback(err);

      callback(null, reply);
    });
  }

  // Updated existing document as per docBody (must have _id, _rev).
  // callback(err, couchReply) // reply is {ok, id, rev}
  replace (docBody, callback) {
    const hasIdRev = docBody.hasOwnProperty('_id') && docBody.hasOwnProperty('_rev');
    if (!hasIdRev)
      return setImmediate(callback, new Error('Missing `_id` and/or `_rev` fields; use save() for new documents.'));

    async.waterfall([
      (cb) => this.exists(docBody._id, (err, exists) => {
        if (err)
          return cb(err);

        return exists
          ? cb(null)
          : cb(new DocumentNotFoundError(docBody._id));
      }),

      (cb) => this.db.insert(docBody, cb)
    ], (err, reply, headers) => {
      if (RevisionMismatchError.matches(err))
        return callback(new RevisionMismatchError(docBody._id, docBody._rev));

      return err
        ? callback(err)
        : callback(null, reply);
    });
  }

  // fetch _lists/<listname>/<viewname> with qs
  // callback(err, reply)
  list (viewname, listname, qs, callback) {
    this.db.viewWithList(this.designName, viewname, listname, qs, (err, body, headers) => {
      return err
        ? callback(err)
        : callback(null, body);
    });
  }
}

Db.DocumentNotFoundError = DocumentNotFoundError;
Db.RevisionMismatchError = RevisionMismatchError;

module.exports = Db;
