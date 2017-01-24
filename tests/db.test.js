'use strict';

const nano = require('nano');
const async = require('async');
const {expect} = require('chai');
const config = require('../config');
const Db = require('../src/db/db');

// For nano API investigation

// TODO
//
// this isn't part of autotesting becasuse we have no automation
// for couch reset/populate. Do it later.

describe.skip('Db', () => {
  const db = new Db({
    url: config.couch.url,
    name: 'contrasstest'
  });

  const couch = nano(config.couch.url).use('contrasstest');

  const MISSING_DOC_ID = 'i-am-not-in-database-missing';
  const TEST_DOC_ID = 'delete-me';
  const TEST_DOC_BODY = {
    body: 'some stuff',
    createdAt: new Date()
  };

  const dropTestDoc = (done) => {
    async.waterfall([
      (cb) => couch.get('delete-me', (err, doc) => {
        if (err && (err.error === 'not_found'))
          cb(null, null);
        else if (err)
          cb(err);
        else
          cb(null, doc._rev);
      }),
      (_rev, cb) => {_rev ? couch.destroy(TEST_DOC_ID, _rev, cb) : cb();}
    ], done);
  };

  describe('#save()', () => {
    before(dropTestDoc);
    after(dropTestDoc);

    it('inserts new docs', (done) => {
      db.save(TEST_DOC_ID, TEST_DOC_BODY, (err, reply) => {
        expect(err).to.be.null;
        expect(reply).to.have.keys('ok', 'id', 'rev');
        done();
      });
    });

    it('409 on existing docs', (done) => {
      db.save(TEST_DOC_ID, TEST_DOC_BODY, (err, reply) => {
        expect(err).to.be.instanceof(Db.RevisionMismatchError);
        done();
      });
    });
  });

  describe('#delete()', () => {
    let testDocCurrentRevision;

    before(done => {
      couch.insert(TEST_DOC_BODY, TEST_DOC_ID, (err, reply) => {
        if (err)
          return done(err);

        testDocCurrentRevision = reply.rev;
        done();
      });
    });

    it('removes existing documents', (done) => {
      db.delete(TEST_DOC_ID, testDocCurrentRevision, (err, reply) => {
        expect(err).to.be.null;
        expect(reply).to.have.keys('ok', 'id', 'rev');
        done();
      });
    });

    it('missing documents are fine, but null reply', (done) => {
      db.delete(TEST_DOC_ID, testDocCurrentRevision, (err, reply) => {
        expect(err).to.be.null;
        expect(reply).to.be.null;
        done();
      });
    });
  });

  describe('#replace()', () => {
    let testDocCurrentRevision;
    let testDocUpdatedRevision;

    before(done => {
      couch.insert(TEST_DOC_BODY, TEST_DOC_ID, (err, reply) => {
        if (err)
          return done(err);

        testDocCurrentRevision = reply.rev;
        done();
      });
    });

    after(done => {
      couch.destroy(TEST_DOC_ID, testDocUpdatedRevision, done);
    });

    it('replaces existing documents', (done) => {
      const updatedDoc = Object.assign({
        _id: TEST_DOC_ID,
        _rev: testDocCurrentRevision,
        replacedAt: new Date(),
        replaced: true
      }, TEST_DOC_BODY);

      db.replace(updatedDoc, (err, reply) => {
        expect(err).to.be.null;
        expect(reply).to.have.keys('ok', 'id', 'rev');
        testDocUpdatedRevision = reply.rev;
        done();
      });
    });

    it('missing documents are an error', (done) => {
      const body = {
        _id: MISSING_DOC_ID,
        _rev: '111-159cfb88f48a994e96dcebd44cd8b0de'
      };

      db.replace(body, (err) => {
        expect(err).to.be.instanceof(Db.DocumentNotFoundError);
        done();
      });
    });

    it('returns RevisionMismatchError on 409', (done) => {
      const body = {
        _id: TEST_DOC_ID,
        _rev: testDocCurrentRevision, // previous revision
        shallNotWork: true
      };

      db.replace(body, (err) => {
        expect(err).to.be.instanceof(Db.RevisionMismatchError);
        done();
      });
    });

    it('requires _id and _rev', (done) => {
      db.replace(TEST_DOC_BODY, (err, reply) => {
        expect(err).to.be.an('error');
        expect(err.message).to.match(/use save\(\)/i);
        done();
      });
    });
  });

  describe.skip('#list()', () => {
    it('lists view with listFunc', (done) => {
      db.list('rawProfiles', 'profiles', {key: 'alice'}, (err, body) => {
        expect(err).to.be.null;
        expect(body).to.be.an('object');
        done();
      });
    });
  });

  describe('#exists()', () => {
    it('true for existing docs', (done) => {
      db.exists('_design/users', (err, exists) => {
        expect(err).to.be.null;
        expect(exists).to.be.true;
        done();
      });
    });

    it('false for missing docs', (done) => {
      db.exists(MISSING_DOC_ID, (err, exists) => {
        expect(err).to.be.null;
        expect(exists).to.be.false;
        done();
      });
    });
  });
});
