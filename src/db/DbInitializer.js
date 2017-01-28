'use strict';

const nano = require('nano');
const async = require('async');
const Db = require('./db');
const {BaseError} = require('../errors');

class OutOfSyncError extends BaseError {
  constructor ({databaseExists, designs}) {
    const designsStatus = Object.entries(designs).map(([name, status]) => {
      return `  - _design/${name}: ${(status === null) ? 'ok' : 'missing/changed'}`;
    }).join('\n');

    super(`Database is out of sync:
  - database exists: ${databaseExists}\n${designsStatus}`);
  }
}

class DbInitializer {
  constructor ({url, name}, designs, {
    sync = false  // true — replace changed or missing design documents; or fail with error;
                  // false — fail with error if some are not equal.
  } = {}) {
    this.server = nano(url);
    this.db = new Db({url, name});
    this.databaseName = name;
    this.designs = designs;
    this.options = {sync};
  }

  checkDatabase (callback) {
    this.server.db.get(this.databaseName, (err, info) => {
      if (Db.DocumentNotFoundError.matches(err))
        return callback(null, false);

      if (err)
        return callback(err);

      callback(null, true);
    });
  }

  // callback(err, replacementDoc|null)
  checkDesign (_, designName, callback) {
    const design = this.designs.find(d => d.name === designName);

    this.db.nullableGet(`_design/${design.name}`, (err, dbDoc) => {
      if (err)
        return callback(err);

      // design doc is currently not in couch db
      if (!dbDoc)
        return callback(null, design.couchDocument());

      return design.differentFrom(dbDoc)
        ? callback(null, Object.assign(design.couchDocument(), {_rev: dbDoc._rev}))
        : callback(null, null);
    });
  }

  checkDesigns (databaseExists, callback) {
    const designs = this.designs.reduce((self, design) => {
      self[design.name] = design.couchDocument();
      return self;
    }, {});

    if (!databaseExists)
      return setImmediate(callback, null, Object.assign({databaseExists, designs}));

    async.mapValues(
      designs,
      this.checkDesign.bind(this),
      (err, designs) => {
        return err
          ? callback(err)
          : callback(null, Object.assign({databaseExists, designs}));
      }
    );
  }

  check (callback) {
    async.waterfall([
      this.checkDatabase.bind(this),
      this.checkDesigns.bind(this)
    ], callback);
  }

  insertDesigns (designs, callback) {
    const db = this.server.use(this.databaseName);
    async.each(
      designs,
      (design, cb) => db.insert(design, cb),
      callback
    );
  }

  sync ({databaseExists, designs}, callback) {
    async.series([
      (cb) => {
        databaseExists
          ? setImmediate(cb, null)
          : this.server.db.create(this.databaseName, cb);
      },

      (cb) => {
        const missing = Object.values(designs).filter(d => d);
        this.insertDesigns(missing, cb);
      }
    ], callback);
  }

  // callback(err)
  init (callback) {
    this.check((err, checkResult) => {
      if (err)
        return callback(err);

      const same = checkResult.databaseExists
        && Object.values(checkResult.designs).every(d => d === null);

      // Nothing to do, everything is up to date.
      if (same)
        return callback(null);

      // We have things to replace or create, but we weren't asked to.
      if (!this.options.sync)
        return callback(new OutOfSyncError(checkResult));

      this.sync(checkResult, callback);
    });
  }
}

DbInitializer.OutOfSyncError = OutOfSyncError;

module.exports = DbInitializer;
