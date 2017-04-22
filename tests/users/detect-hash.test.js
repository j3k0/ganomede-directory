'use strict';

const {detectHash, hashes} = require('../../src/users/detect-hash');

describe('detectHash()', () => {
  it('exports `hash` that contains valid stuff', () => {
    const keys = Object.keys(hashes);
    expect(hashes).to.be.an('object');
    expect(hashes).to.be.ok;
    expect(keys.length).to.be.greaterThan(0);
    keys.forEach(key => {
      const val = hashes[key];
      expect(val).to.be.a('string');
      expect(val.length).to.be.greaterThan(0);
    });
  });

  it('detects pbkdf2', () => {
    [
      'pbkdf2$10000$5786bea278988484b2ef02fffa2cbc759e4f20bfe3464f43e3b9e56356a09957ce2d77e78c743d7caad381a8818994d55c72e6543ab8a133958494436e997b79$8e8234c0675ec1af532f83acf9db08dec2e07ed425acbba3a53dff1f78921ccc021169312fc144109de1890c8f58b17745a8df250ab7f86cc13515e550dd79aa',
      'pbkdf2$10000$1ac47a036e2db28617a9973b87e5cb8b64bca4f9d2d07896773c29ac162a070a3f537f2074c29d39cda3891fe74d3153d834e2e410d9be9c13ef01c650ab38a8$73ba4660abc46cd0550df78e494991c1b3f9ff09b54afb66b9ebfe7528fc30a97437699b1531119e72964cb0a44864f4223be628b16e6e76578d982b30275c74'
    ].forEach(hash => expect(detectHash(hash)).to.equal(hashes.pbkdf2));
  });

  it('detects bcrypt', () => {
    [
      '$2a$12$HHKaaYswPqVJFROlS/4ZbuN5I2XWb3NE9ChTZ5m174ZRVDSqbGd16',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      '$2a$04$tjJzUHkOoR.xzyMTCDxfSu6Vq4NL1u3/9m2NT9bu7.ECODNEWi41K'
    ].forEach(hash => expect(detectHash(hash)).to.equal(hashes.bcrypt));
  });

  it('detects plainText', () => {
    [
      'pbkdf2$10000$_NOT_QUITE_5786bea278988484b2ef02fffa2cbc759e4f20bfe3464f43e3b9e56356a09957ce2d77e78c743d7caad381a8818994d55c72e6543ab8a133958494436e997b79$8e8234c0675ec1af532f83acf9db08dec2e07ed425acbba3a53dff1f78921ccc021169312fc144109de1890c8f58b17745a8df250ab7f86cc13515e550dd79aa',
      '$2a$10$_SOMETHING_FISHY_N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      '',
      'plain text'
    ].forEach(hash => expect(detectHash(hash)).to.equal(hashes.plainText));
  });
});
