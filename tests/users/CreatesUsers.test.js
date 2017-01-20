'use strict';

describe('CreatesUsers', () => {
  let CreatesUsers;
  let LoginsUsers;
  let ActionsExecutor;

  beforeEach(() => {
    ActionsExecutor = td.replace('../../src/ActionsExecutor');
    LoginsUsers = td.replace('../../src/users/LoginsUsers');
    CreatesUsers = require('../../src/users/CreatesUsers');
  });

  it('Creates Couch documents and Authdb token', (done) => {
    const userId = 'jdoe';
    const password = 'qwerty';
    const aliases = [
      {type: 'email', value: 'jdoe@example.com'},
      {type: 'name', value: 'jdoe', public: true}
    ];

    // TODO
    // Meh… we probably want to check actions
    // that are about to be ran, not the call to #run() itself.
    // Maybe move out creation of steps for ActionExecutor
    // into separate function and test its results.
    td.when(ActionsExecutor.run(td.callback))
      .thenCallback(null);

    td.when(LoginsUsers.createToken('jdoe', td.callback))
      .thenCallback(null, 'auth-token');

    new CreatesUsers().create(userId, password, aliases, (err, {id, token} = {}) => {
      expect(err).to.be.null;
      expect(id).to.equal('jdoe');
      expect(token).to.equal('auth-token');
      done();
    });
  });
});
