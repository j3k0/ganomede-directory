'use strict';

describe('CreatesUsers', () => {
  let CreatesUsers;
  let LoginsUsers;
  let DB;

  beforeEach(() => {
    DB = td.replace('../../src/db/db');
    LoginsUsers = td.replace('../../src/users/LoginsUsers');
    CreatesUsers = require('../../src/users/CreatesUsers');
  });

  it('does work or something', (done) => {
    const id = 'jdoe';
    const password = 'qwerty';
    const aliases = [
      {type: 'email', value: 'jdoe@example.com'},
      {type: 'name', value: 'jdoe', public: true}
    ];

    const now = new Date();

    const expectedUserDoc = {
      id,
      hash: 'password-hash'
    };

    const expectedAliasDocs = [
      {
        id,
        date: now,
        public: false
      },

      {
        id,
        date: now,
        public: true
      }
    ];

    // hash password
    // save user doc
    // save aliases docs
    // created access token

    td.when(LoginsUsers.hashPassword(password, td.callback))
      .thenCallback(null, 'password-hash');

    td.when(DB.save(`id:${id}`, td.matchers.anything(), td.callback))
      .thenCallback(null, expectedUserDoc);

    td.when(DB.saveMulti({
      'alias:email:jdoe@example.com': expectedAliasDocs[0],
      'alias:name:jdoe': expectedAliasDocs[1]
    }, td.callback))
      .thenCallback(null);

    td.when(LoginsUsers.createToken(id, td.callback))
      .thenCallback(null, 'auth-token');

    new CreatesUsers().create(id, password, aliases, now, (err, {id, token} = {}) => {
      expect(err).to.be.null;
      expect(id).to.equal('jdoe');
      expect(token).to.equal('auth-token');
      done();
    });
  });
});
