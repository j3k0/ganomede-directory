'use strict';

const bcrypt = require('bcrypt');
const pbkdf = require('password-hash-and-salt');

const verifiers = {
  bcrypt: (plain, hash, cb) => bcrypt.compare(plain, hash, cb),
  pbkdf2: (plain, hash, cb) => pbkdf(plain).verifyAgainst(hash, cb)
};

const detectVerifier = (hash) => {
  if (hash.startsWith('pbkdf2$'))
    return verifiers.pbkdf2;

  if (hash.startsWith('$2'))
    return verifiers.bcrypt;

  return null;
};

const wrapVerifierCallback = (cb) => (err, matches) => {
  return err
    ? cb(err)
    : cb(null, !!matches);
};

// callback(err, matches: Boolean)
module.exports = (plainText, hash, cb) => {
  const verifier = detectVerifier(hash);
  const callback = wrapVerifierCallback(cb);

  if (!verifier)
    return setImmediate(callback, new Error('Uknown Hash Format'));

  verifier(plainText, hash, callback);
};
