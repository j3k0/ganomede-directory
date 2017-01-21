'use strict';

describe('ChangesPasswords', () => {
  let ChangesPasswords;
  let LoginsUsers;

  beforeEach(() => {
    LoginsUsers = td.replace('../../src/users/LoginsUsers');
    ChangesPasswords = require('../../src/users/ChangesPasswords');
  });

  it('changes passwords', (done) => {
    // fetch user
    // hash password
    // update & replace doc

    const db = td.object(['get', 'replace']);

    td.when(db.get('id:joe', td.callback))
      .thenCallback(null, {_id: 'id:joe', _rev: 'revision', id: 'joe', hash: 'old-hash'});

    td.when(LoginsUsers.hashPassword('pwd', td.callback))
      .thenCallback(null, 'new-hash');

    td.when(db.replace({_id: 'id:joe', _rev: 'revision', id: 'joe', hash: 'new-hash'}, td.callback))
      .thenCallback(null);

    new ChangesPasswords(db).change('joe', 'pwd', (err) => {
      expect(err).to.be.null;
      done();
    });
  });
});
