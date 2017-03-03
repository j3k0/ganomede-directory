'use strict';

describe('FindsProfiles', () => {
  let BuildsProfiles;
  let FindsProfiles;

  beforeEach(() => {
    BuildsProfiles = td.replace('../../src/users/BuildsProfiles');
    FindsProfiles = require('../../src/users/FindsProfiles');
  });

  describe('#byUserId()', () => {
    it('calls BuildsProfiles with userId', (done) => {
      const profileRef = {};

      td.when(BuildsProfiles.build('joe', td.callback))
        .thenCallback(null, profileRef);

      new FindsProfiles().byUserId('joe', (err, profile) => {
        expect(err).to.be.null;
        expect(profile).to.equal(profileRef);
        done();
      });
    });
  });

  describe('#byAuthToken()', () => {
    it('retrieves user id from authdb and calls BuildsProfiles with it', (done) => {
      const profileRef = {};
      const authdb = td.object(['getAccount']);

      td.when(authdb.getAccount('auth-token', td.callback))
        .thenCallback(null, {username: 'joe'});

      td.when(BuildsProfiles.build('joe', td.callback))
        .thenCallback(null, profileRef);

      new FindsProfiles({}, authdb).byAuthToken('auth-token', (err, profile) => {
        expect(err).to.be.null;
        expect(profile).to.equal(profileRef);
        done();
      });
    });
  });

  describe('#byAlias()', () => {
    it('retrieves userId from couch alias doc and calls BuildsProfiles with it', (done) => {
      const profileRef = {};
      const db = td.object(['get']);

      td.when(db.get('alias:email:joe@example.com'), td.callback)
        .thenCallback(null, {id: 'joe'});

      td.when(BuildsProfiles.build('joe', td.callback))
        .thenCallback(null, profileRef);

      new FindsProfiles(db).byAlias('email', 'joe@example.com', (err, profile) => {
        expect(err).to.be.null;
        expect(profile).to.equal(profileRef);
        done();
      });
    });
  });
});
