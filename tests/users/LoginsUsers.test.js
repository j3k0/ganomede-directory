'use strict';

const LoginsUsers = require('../../src/users/LoginsUsers');

describe('LoginsUsers', () => {
  describe('#hashPassword()', () => {
    it('hashes passwords', (done) => {
      new LoginsUsers().hashPassword('pwd', (err, hash) => {
        expect(err).to.be.null;
        expect(hash).to.be.a('string');
        expect(hash).to.have.length(270); // remove if fails (# of iterations?)
        done();
      });
    });
  });

  describe('#createToken()', () => {
    it('creates authdb token for userid', (done) => {
      const authdb = td.object(['addAccount']);

      td.when(authdb.addAccount(
        td.matchers.isA(String),
        td.matchers.contains({username: 'userid'}),
        td.callback))
          .thenCallback(null, 'OK'); // Matches redis reply from authdb sources,
                                    // but `OK` part is w/ever, only err matters.

      new LoginsUsers({}, authdb).createToken('userid', (err, token) => {
        expect(err).to.be.null;
        expect(token).to.equal(td.explain(authdb.addAccount).calls[0].args[0]);
        done();
      });
    });
  });

  describe('#login()', () => {
    const loginTest = () => {
      const db = td.object(['get']);
      const authdb = td.object(['addAccount']);

      td.when(db.get('id:jdoe', td.callback))
        .thenCallback(null, {id: 'jdoe', hash: 'pbkdf2$10000$5786bea278988484b2ef02fffa2cbc759e4f20bfe3464f43e3b9e56356a09957ce2d77e78c743d7caad381a8818994d55c72e6543ab8a133958494436e997b79$8e8234c0675ec1af532f83acf9db08dec2e07ed425acbba3a53dff1f78921ccc021169312fc144109de1890c8f58b17745a8df250ab7f86cc13515e550dd79aa'});

      td.when(authdb.addAccount(
        td.matchers.isA(String),
        td.matchers.contains({username: 'jdoe'}),
        td.callback))
          .thenCallback(null, 'OK');
      return {db, authdb};
    };

    it('allows to use API_SECRET as a password', (done) => {
      const {db, authdb} = loginTest();
      new LoginsUsers(db, authdb).login('jdoe', process.env.API_SECRET, (err, token) => {
        expect(err).to.be.null;
        expect(token).to.equal(td.explain(authdb.addAccount).calls[0].args[0]);
        done();
      });
    });

    it('verifies provided password against Couch hash and creates token', (done) => {
      const {db, authdb} = loginTest();
      new LoginsUsers(db, authdb).login('jdoe', 'pwd', (err, token) => {
        expect(err).to.be.null;
        expect(token).to.equal(td.explain(authdb.addAccount).calls[0].args[0]);
        done();
      });
    });
  });
});
