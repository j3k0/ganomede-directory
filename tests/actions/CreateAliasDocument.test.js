'use strict';

const CreateAliasDocument = require('../../src/actions/CreateAliasDocument');

describe('CreateAliasDocument', () => {
  it('#execute() creates alias document', (done) => {
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

  it('#rollback() removes created document', (done) => {
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
});
