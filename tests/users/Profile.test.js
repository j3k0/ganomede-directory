'use strict';

const deepFreeze = require('deep-freeze');
const Profile = require('../../src/users/Profile');

describe('Profile', () => {
  // Actual format couch returns stuff in.
  // (Freeze it so we don't accidentaly modify things.)
  const dbAnswer = deepFreeze({
    id: 'alice',
    hash: 'hash',
    aliases: [
      {
        // We have email overwriting previous one
        // (both value and public status)
        public: false,
        date: 'Tue Jan 24 2017 21:56:57 GMT+0500 (+05)',
        type: 'email',
        value: 'alice@rewrite.com'
      },
      {
        // We have old email that is public (for some reason).
        public: true,
        date: 'Tue Dec 20 2016 18:06:51 GMT+0500 (+05)',
        type: 'email',
        value: 'alice@wonderland.com'
      },
      {
        // We have public name.
        public: true,
        date: 'Tue Dec 20 2016 18:06:51 GMT+0500 (+05)',
        type: 'name',
        value: 'Alice In Wonderland'
      }
    ]
  });

  const profile = new Profile(dbAnswer);

  describe('new Profile()', () => {
    it('only has `id` and `aliases` props', () => {
      expect(profile).to.have.all.keys('id', 'aliases');
      expect(profile.id).to.equal('alice');
      expect(profile.aliases).to.be.an('array');
      expect(profile.aliases).to.have.length(2); // check overwrites "deduped".
    });
  });

  it('#public() returns public aliases', () => {
    expect(profile.public()).to.eql({
      id: 'alice',
      aliases: {
        name: 'Alice In Wonderland'
      }
    });
  });

  it('#private() returns all aliases', () => {
    expect(profile.private()).to.eql({
      id: 'alice',
      aliases: {
        name: 'Alice In Wonderland',
        email: 'alice@rewrite.com'
      }
    });
  });

  it('JSON.stringify(new Profile()) throws', () => {
    const stringify = () => JSON.stringify(profile);
    expect(stringify).to.throw('Can not convert Profile to JSON directly; use #public() or #private()');
  });
});
