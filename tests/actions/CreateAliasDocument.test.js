'use strict';

const {AliasAlreadyExistsError} = require('../../src/errors');
const CreateAliasDocument = require('../../src/actions/CreateAliasDocument');

describe('CreateAliasDocument', () => {
  describe('#execute()', () => {
    it('creates new alias documents', (done) => {
      const db = td.object(['save']);
      const now = new Date();

      td.when(db.save('alias:name:jdoe', {id: 'jdoe', date: now, public: true}))
        .thenCallback(null, {ok: true, id: 'alias:name:jdoe', rev: 'revision'});

      const action = new CreateAliasDocument(db, 'jdoe', {
        type: 'name',
        value: 'jdoe',
        date: now,
        public: true
      });

      action.execute((err) => {
        expect(err).to.be.null;
        expect(action.result).to.eql({
          ok: true,
          id: 'alias:name:jdoe',
          rev: 'revision'
        });

        done();
      });
    });

    it('replaces existing documents if owner matches userId', (done) => {
      const db = td.object(['replace']);
      const now = new Date();

      td.when(db.replace({
        _id: 'alias:name:jdoe',
        _rev: 'revision',
        id: 'jdoe', date: now, public: true
      }, td.callback))
        .thenCallback(null, {ok: true, id: 'alias:name:jdoe', rev: 'revision-2'});

      const action = new CreateAliasDocument(db, 'jdoe', {
        type: 'name',
        value: 'jdoe',
        date: now,
        public: true
      });

      action.checkResult = {
        _id: 'alias:name:jdoe',
        _rev: 'revision',
        id: 'jdoe',
        date: new Date(0), // some time before @now
        public: false
      };

      action.execute((err) => {
        expect(err).to.be.null;
        expect(action.result).to.eql({ok: true, id: 'alias:name:jdoe', rev: 'revision-2'});
        done();
      });

    });
  });

  describe('#rollback()', () => {
    it('removes newly created document', (done) => {
      const db = td.object(['delete']);

      td.when(db.delete('alias:name:jdoe', 'revision', td.callback))
        .thenCallback(null);

      // Fake out Couch response to document creation.
      const action = new CreateAliasDocument(db, 'jdoe', {});
      action.result = {
        ok: true,
        id: 'alias:name:jdoe',
        rev: 'revision'
      };

      action.rollback((err) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('restores original version', (done) => {
      const db = td.object(['replace']);

      const originalDoc = {_id: 'id', _rev: 'old-revision', original: true};
      const originalDocWithNewRevision = Object.assign(
        originalDoc, {_rev: 'new-revision'}
      );

      td.when(db.replace(originalDocWithNewRevision), td.callback)
        .thenCallback(null, {});

      const action = new CreateAliasDocument(db, 'jdoe', {});
      action.checkResult = originalDoc;
      action.result = {rev: 'new-revision'};

      action.rollback((err) => {
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('#check()', () => {
    const db = td.object(['nullableGet']);
    const action = new CreateAliasDocument(db, 'jdoe', {
      type: 'email',
      value: 'jdoe@example.com',
      date: new Date(),
      public: true
    });

    it('succeeds if document is not in database', (done) => {
      td.when(db.nullableGet('alias:email:jdoe@example.com', td.callback))
        .thenCallback(null, null);

      action.check((err) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('succeeds if document is in database, but owned by user requesting change', (done) => {
      td.when(db.nullableGet('alias:email:jdoe@example.com', td.callback))
        .thenCallback(null, {id: 'jdoe'});

      action.check((err) => {
        expect(err).to.be.null;
        done();
      });
    });

    it('fails if document is in database and owned by someone else', (done) => {
      td.when(db.nullableGet('alias:email:jdoe@example.com', td.callback))
        .thenCallback(null, {id: 'not-jdoe'});

      action.check((err) => {
        expect(err).to.be.instanceof(AliasAlreadyExistsError);
        done();
      });
    });
  });
});
