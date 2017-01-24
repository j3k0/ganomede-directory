'use strict';

const {UserAlreadyExistsError} = require('../../src/errors');

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
      .thenCallback(null, {ok: true, id: 'id:jdoe', rev: 'revision'});

    const action = new CreateUserDocument(db, 'jdoe', 'pwd');

    action.execute((err) => {
      expect(err).to.be.null;
      expect(action.result).to.eql({
        ok: true,
        id: 'id:jdoe',
        rev: 'revision'
      });
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

  it('#check() succeeds if document is not in database', (done) => {
    const db = td.object(['exists']);
    const action = new CreateUserDocument(db, 'jdoe', 'pwd');

    td.when(db.exists('id:jdoe', td.callback))
      .thenCallback(null, false);

    action.check((err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('#check() fails if document is in database', (done) => {
    const db = td.object(['exists']);
    const action = new CreateUserDocument(db, 'jdoe', 'pwd');

    td.when(db.exists('id:jdoe', td.callback))
      .thenCallback(null, true);

    action.check((err) => {
      expect(err).to.be.instanceof(UserAlreadyExistsError);
      done();
    });
  });
});
