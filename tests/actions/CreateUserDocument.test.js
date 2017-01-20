'use strict';

describe('CreateUserDocument', () => {
  let LoginsUsers;
  let CreateUserDocument;

  beforeEach(() => {
    LoginsUsers = td.replace('../../src/users/LoginsUsers');
    CreateUserDocument = require('../../src/actions/CreateUserDocument');
  });

  it('#execute() creates user doc', (done) => {
    const db = td.object(['save']);

    td.when(LoginsUsers.hashPassword('pwd', td.callback))
      .thenCallback(null, 'hashed-pwd');

    td.when(db.save('id:jdoe', {id: 'jdoe', hash: 'hashed-pwd'}, td.callback))
      .thenCallback(null);

    new CreateUserDocument(db, 'jdoe', 'pwd').execute((err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('#rollback() deletes user doc', (done) => {
    const db = td.object(['delete']);

    td.when(db.delete('id:jdoe', 'revision', td.callback))
      .thenCallback(null);

    // Fake out Couch response to document creation.
    const action = new CreateUserDocument(db, 'jdoe', 'pwd');
    action.result = {
      ok: true,
      id: 'id:jdoe',
      rev: 'revision'
    };

    action.rollback((err) => {
      expect(err).to.be.null;
      done();
    });
  });
});
