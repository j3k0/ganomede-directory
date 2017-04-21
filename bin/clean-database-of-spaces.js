#!/usr/bin/env node

const restify = require('restify');
const assert = require('assert');
const bunyan = require('bunyan');
const async = require('async');

const log = bunyan.createLogger({
  name: 'clean-database-of-spaces',
  level: 'DEBUG'
});

// config
const db = {
  host: process.env.DB_HOST || 'localhost:5984',
  name: process.env.DB_NAME || 'test'
};
db.url = `http://${db.host}`;
db.uri = `/${db.name}`;

log.info({db}, 'config');

const client = restify.createJsonClient({
  url: db.url,
  version: '*'
});

const limit = 1;
const offset = 0;

const getTotalRows = (callback) => {
  client.get(`${db.uri}/_all_docs?limit=0`, function(err, req, res, obj) {
    assert.ifError(err);
    callback(obj.total_rows);
  });
};

const getRows = (limit, offset, callback) => {
  client.get(`${db.uri}/_all_docs?skip=${offset}&limit=${limit}&include_docs=true`, function(err, req, res, obj) {
    assert.ifError(err);
    callback(obj.rows);
  });
};

const readRows = (totalRows, offset, limit, process, done) => {
  if (offset >= totalRows) {
    done();
  }
  else {
    getRows(limit, offset, (rows) => {
      log.info({limit, offset, totalRows}, 'progress');
      process(rows, () => {
        readRows(totalRows, offset + limit, limit, process, done);
      });
    });
  }
};

const insertDoc = (id, doc, callback) => {
  log.debug({id, doc}, 'inserting doc');
  client.put(`${db.uri}/${id}`, doc, function(err, req, res, obj) {
    // assert.ifError(err);
    if (err) {
      if (err.statusCode == 409) {
        // doc already exists, no big deal
        log.debug({id}, 'doc already exists');
      }
      else {
        log.error({id, doc, err}, 'doc insertion failed');
      }
      return callback();
    }
    log.debug({
      statusCode: res.statusCode,
      headers: res.headers,
      obj: obj
    }, 'doc inserted');
    callback();
  });
};

const processRow = (row, callback) => {
  log.debug({row}, 'processing row');
  if (row.id && row.id.indexOf(' ') >= 0) {
    var doc = row.doc;
    var id = doc._id.replace(/ /g, '');
    log.info({id}, 'fixing');
    log.debug({id, doc}, 'fixing doc');
    delete doc._id;
    var date = new Date(doc.date);
    doc.date = new Date(date.getTime() + 1).toISOString();
    delete doc._rev;
    insertDoc(id, doc, callback);
  }
  else {
    callback();
  }
};

const processRows = (rows, callback) => {
  log.debug({length: rows.length}, 'processing rows');
  async.eachLimit(rows, 10, processRow, (err) => {
    assert.ifError(err);
    callback();
  });
};

getTotalRows((totalRows) => {
  readRows(totalRows, 0, 1000, processRows, () => {
    log.info("done");
  });
});
