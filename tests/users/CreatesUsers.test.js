'use strict';

describe('CreatesUsers', () => {
  let CreatesUsers;
  let ActionsExecutor;

  beforeEach(() => {
    ActionsExecutor = td.replace('../../src/ActionsExecutor');
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

    new CreatesUsers().create(userId, password, aliases, (err, response) => {
      expect(err).to.be.null;
      expect(response).to.eql({
        id: 'jdoe',
        aliases: {
          email: 'jdoe@example.com',
          name: 'jdoe'
        }
      });
      done();
    });
  });
});
