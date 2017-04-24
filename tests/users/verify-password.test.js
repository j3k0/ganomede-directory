'use strict';

const verifyPassword = require('../../src/users/verify-password');

describe('verifyPassword()', () => {
  const passwords = {
    correct: 'pwd',
    wrong: 'banana'
  };

  const hashes = {
    pbkdf2: 'pbkdf2$10000$5786bea278988484b2ef02fffa2cbc759e4f20bfe3464f43e3b9e56356a09957ce2d77e78c743d7caad381a8818994d55c72e6543ab8a133958494436e997b79$8e8234c0675ec1af532f83acf9db08dec2e07ed425acbba3a53dff1f78921ccc021169312fc144109de1890c8f58b17745a8df250ab7f86cc13515e550dd79aa',
    bcrypt: '$2a$04$tjJzUHkOoR.xzyMTCDxfSu6Vq4NL1u3/9m2NT9bu7.ECODNEWi41K',
    malformed: 'he he i am bad hash; in fact i am no hash at all!'
  };

  it('pbkdf2 correct password', (done) => {
    verifyPassword(passwords.correct, hashes.pbkdf2, (err, matches) => {
      expect(err).to.be.null;
      expect(matches).to.be.true;
      done();
    });
  });

  it('pbkdf2 wrong password', (done) => {
    verifyPassword(passwords.wrong, hashes.pbkdf2, (err, matches) => {
      expect(err).to.be.null;
      expect(matches).to.be.false;
      done();
    });
  });

  it('bcrypt correct password', (done) => {
    verifyPassword(passwords.correct, hashes.bcrypt, (err, matches) => {
      expect(err).to.be.null;
      expect(matches).to.be.true;
      done();
    });
  });

  it('bcrypt wrong password', (done) => {
    verifyPassword(passwords.wrong, hashes.bcrypt, (err, matches) => {
      expect(err).to.be.null;
      expect(matches).to.be.false;
      done();
    });
  });

  it('errors on wierd looking hashes', (done) => {
    verifyPassword(passwords.correct, hashes.malformed, (err, matches) => {
      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('message', 'Uknown Hash Format');
      expect(matches).to.be.undefined;
      done();
    });
  });
});
