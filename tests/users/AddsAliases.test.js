'use strict';

describe('AddsAliases', () => {
  let ActionsExecutor;
  let AddsAliases;

  beforeEach(() => {
    ActionsExecutor = td.replace('../../src/ActionsExecutor');
    AddsAliases = require('../../src/users/AddsAliases');
  });

  it('calls ActionsExecutor with stuff', (done) => {
    const now = new Date();
    const sampleAliases = [{
      type: 'name',
      value: 'joe',
      public: true,
      date: now
    }];

    // TODO
    // Kind of should check actions created.
    td.when(ActionsExecutor.run(td.callback))
      .thenCallback(null);

    new AddsAliases().add('joe', sampleAliases, (err) => {
      expect(err).to.be.null;
      done();
    });
  });
});
