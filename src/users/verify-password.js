'use strict';

const bcrypt = require('bcrypt');
const pbkdf = require('password-hash-and-salt');
const {detectHash, hashes} = require('./detect-hash');

const verifiers = {
  [hashes.bcrypt]: (plain, hash, cb) => bcrypt.compare(plain, hash, cb),
  [hashes.pbkdf2]: (plain, hash, cb) => pbkdf(plain).verifyAgainst(hash, cb)
};

const wrapVerifierCallback = (cb) => (err, matches) => {
  return err
    ? cb(err)
    : cb(null, !!matches);
};

// callback(err, matches: Boolean)
module.exports = (plainText, hash, cb) => {
  const verifier = verifiers[detectHash(hash)];
  const callback = wrapVerifierCallback(cb);

  if (!verifier)
    return setImmediate(callback, new Error('Uknown Hash Format'));

  verifier(plainText, hash, callback);
};
