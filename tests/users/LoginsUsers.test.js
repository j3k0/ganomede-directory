'use strict';

const LoginsUsers = require('../../src/users/LoginsUsers');
const {InvalidCredentialsError} = require('../../src/errors');

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

    it('passes pbkdf2 hashes through as is', (done) => {
      const inputHash = 'pbkdf2$10000$5786bea278988484b2ef02fffa2cbc759e4f20bfe3464f43e3b9e56356a09957ce2d77e78c743d7caad381a8818994d55c72e6543ab8a133958494436e997b79$8e8234c0675ec1af532f83acf9db08dec2e07ed425acbba3a53dff1f78921ccc021169312fc144109de1890c8f58b17745a8df250ab7f86cc13515e550dd79aa';

      new LoginsUsers().hashPassword(inputHash, (err, hash) => {
        expect(err).to.be.null;
        expect(hash).to.equal(inputHash);
        done();
      });
    });

    it('passes bcrypt hashes through as is', (done) => {
      const inputHash = '$2a$04$tjJzUHkOoR.xzyMTCDxfSu6Vq4NL1u3/9m2NT9bu7.ECODNEWi41K';

      new LoginsUsers().hashPassword(inputHash, (err, hash) => {
        expect(err).to.be.null;
        expect(hash).to.equal(inputHash);
        done();
      });
    });
  });

  describe('#createToken()', () => {

    const tokenTest = () => {
      const authdb = td.object(['addAccount']);

      td.when(authdb.addAccount(
        td.matchers.isA(String),
        td.matchers.contains({username: 'userid'}),
        td.callback))
          .thenCallback(null, 'OK'); // Matches redis reply from authdb sources,
                                     // but `OK` part is w/ever, only err matters.
      const loginsUsers = new LoginsUsers({}, authdb);
      return {loginsUsers, authdb};
    };

    it('creates authdb token for userid', (done) => {
      const {loginsUsers, authdb} = tokenTest();
      loginsUsers.createToken('userid', null, (err, token) => {
        expect(err).to.be.null;
        expect(token).to.equal(td.explain(authdb.addAccount).calls[0].args[0]);
        done();
      });
    });
    it('allows to force the value for the token', (done) => {
      const {loginsUsers} = tokenTest();
      loginsUsers.createToken('userid', 'bob', (err, token) => {
        expect(token).to.equal('bob');
        done();
      });
    });
  });

  describe('#login()', () => {
    const loginTest = () => {
      const verifyPassword = td.replace('../../src/users/verify-password', td.function('verifyPassword'));
      const LoginsUsers = require('../../src/users/LoginsUsers');
      const db = td.object(['get']);
      const authdb = td.object(['addAccount']);
      const hash = 'pbkdf2$10000$5786bea278988484b2ef02fffa2cbc759e4f20bfe3464f43e3b9e56356a09957ce2d77e78c743d7caad381a8818994d55c72e6543ab8a133958494436e997b79$8e8234c0675ec1af532f83acf9db08dec2e07ed425acbba3a53dff1f78921ccc021169312fc144109de1890c8f58b17745a8df250ab7f86cc13515e550dd79aa';

      td.when(db.get('id:jdoe', td.callback))
        .thenCallback(null, {id: 'jdoe', hash});

      td.when(authdb.addAccount(
        td.matchers.isA(String),
        td.matchers.contains({username: 'jdoe'}),
        td.callback))
          .thenCallback(null, 'OK');

      return {LoginsUsers, verifyPassword, db, authdb, hash};
    };

    it('allows to use API_SECRET as a password', (done) => {
      const {LoginsUsers, db, authdb} = loginTest();
      new LoginsUsers(db, authdb).login('jdoe', process.env.API_SECRET, null, (err, token) => {
        expect(err).to.be.null;
        expect(token).to.equal(td.explain(authdb.addAccount).calls[0].args[0]);
        done();
      });
    });

    it('allows to change token when password is API_SECRET', (done) => {
      const {LoginsUsers, db, authdb} = loginTest();
      new LoginsUsers(db, authdb).login('jdoe', process.env.API_SECRET, 'my-token', (err, token) => {
        expect(err).to.be.null;
        expect(token).to.equal('my-token');
        done();
      });
    });

    it('disregards the requested token when password is not API_SECRET', (done) => {
      const {LoginsUsers, verifyPassword, db, authdb, hash} = loginTest();

      td.when(verifyPassword('pwd', hash, td.callback))
        .thenCallback(null, true);

      new LoginsUsers(db, authdb).login('jdoe', 'pwd', 'my-token', (err, token) => {
        expect(err).to.be.null;
        expect(token).not.to.equal('my-token');
        done();
      });
    });

    it('verifies provided password against Couch hash and creates token', (done) => {
      const {LoginsUsers, verifyPassword, db, authdb, hash} = loginTest();

      td.when(verifyPassword('pwd', hash, td.callback))
        .thenCallback(null, true);

      new LoginsUsers(db, authdb).login('jdoe', 'pwd', null, (err, token) => {
        expect(err).to.be.null;
        expect(token).to.equal(td.explain(authdb.addAccount).calls[0].args[0]);
        done();
      });
    });

    it('fails if verifyPassword() returns false', (done) => {
      const {LoginsUsers, verifyPassword, db, authdb, hash} = loginTest();

      td.when(verifyPassword('pwd', hash, td.callback))
        .thenCallback(null, false);

      new LoginsUsers(db, authdb).login('jdoe', 'pwd', null, (err, token) => {
        expect(err).to.be.instanceof(InvalidCredentialsError);
        done();
      });
    });

    it('fails if verifyPassword() errors', (done) => {
      const {LoginsUsers, verifyPassword, db, authdb, hash} = loginTest();

      td.when(verifyPassword('pwd', hash, td.callback))
        .thenCallback(new Error('Oops'));

      new LoginsUsers(db, authdb).login('jdoe', 'pwd', null, (err, token) => {
        expect(err).to.be.instanceof(Error);
        expect(err).to.have.property('message', 'Oops');
        done();
      });
    });
  });
});
