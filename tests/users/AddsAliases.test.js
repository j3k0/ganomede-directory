'use strict';

const AddsAliases = require('../../src/users/AddsAliases');

describe('AddsAliases', () => {
  const now = new Date();
  const sample = {
    type: 'name',
    value: 'joe',
    public: true,
    date: now
  };

  it('inserts new alias', (done) => {
    const db = td.object(['nullableGet', 'save']);

    td.when(db.nullableGet('alias:name:joe', td.callback))
      .thenCallback(null, null);

    td.when(db.save('alias:name:joe', {id: 'joe', date: now, public: true}, td.callback))
      .thenCallback(null, null);

    new AddsAliases(db).add('joe', sample, (err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('replaces owned aliases', (done) => {
    const db = td.object(['nullableGet', 'replace']);

    // Old doc but same owner.
    td.when(db.nullableGet('alias:name:joe', td.callback))
      .thenCallback(null, {
        _id: 'alias:name:joe',
        _rev: '_rev',
        id: 'joe', date: new Date(0), public: false
      });

    // Should be called with new fields.
    td.when(db.replace({
      _id: 'alias:name:joe',
      _rev: '_rev',
      id: 'joe', date: now, public: true
    }, td.callback))
      .thenCallback(null);

    new AddsAliases(db).add('joe', sample, (err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('errors on trying to replace alias of other user', (done) => {
    const db = td.object(['nullableGet']);

    td.when(db.nullableGet('alias:name:joe', td.callback))
      .thenCallback(null, {id: 'not-joe'});

    new AddsAliases(db).add('joe', sample, (err) => {
      expect(err).to.be.an('error');
      done();
    });
  });
});
