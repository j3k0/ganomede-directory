'use strict';

const hashes = {
  bcrypt: 'detect-hash::hash-bcrypt',
  pbkdf2: 'detect-hash::hash-pbkdf2',
  plainText: 'detect-hash::plain-text'
};

const regexes = {
  // https://en.wikipedia.org/wiki/Bcrypt
  // https://www.npmjs.com/package/bcrypt#hash-info
  // I added `=` since it is base64 (though it probably won't have padding)
  bcrypt: /^\$2[aby]\$\d\d\$[A-Za-z0-9./=]{53}$/,
  // https://www.npmjs.com/package/password-hash-and-salt#created-hash
  // Looks like hex to me.
  pbkdf2: /^pbkdf2\$10000\$[0-9a-f]{128}\$[0-9a-f]{128}$/,
};

const detectHash = (str) => {
  if (typeof str !== 'string')
    throw new TypeError(`\`str\` must be a string, got \`${typeof str}\` instead`);

  const kind = Object.keys(regexes).find(hashKind => regexes[hashKind].test(str));

  return kind
    ? hashes[kind]
    : hashes.plainText;
};

module.exports = {detectHash, hashes};
