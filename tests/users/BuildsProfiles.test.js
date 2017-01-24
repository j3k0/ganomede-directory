'use strict';

const Profile = require('../../src/users/Profile');
const BuildsProfiles = require('../../src/users/BuildsProfiles');

describe('BuildsProfiles', () => {
  it('#build() calls db list with correct args and returns Profile', (done) => {
    const db = td.object(['list']);

    td.when(db.list('rawProfiles', 'profiles', {key: 'joe'}, td.callback))
      .thenCallback(null, {id: 'joe', hash: 'hash', aliases: []});

    new BuildsProfiles(db).build('joe', (err, profile) => {
      expect(err).to.be.null;
      expect(profile).to.eql(new Profile({id: 'joe', hash: 'hash', aliases: []}));
      done();
    });
  });
});
