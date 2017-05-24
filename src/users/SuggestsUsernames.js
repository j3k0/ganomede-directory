'use strict';

const assert = require('assert');
const lodash = require('lodash');

const DIGITS = '0123456789'.split('');

const randomDigit = () => DIGITS[lodash.random(0, DIGITS.length - 1)];
const randomDigits = (n) => {
  const arr = new Array(n);

  for (let i = 0; i < n; ++i)
    arr[i] = randomDigit();

  return arr.join('');
};

class SuggestsUsernames {
  constructor (username, {
    dropLastSymbols,
    digitsToAppend,
    maxLength = SuggestsUsernames.MAX_USERNAME_LENGTH
  } = {}) {
    this.username = username;
    this.dropLastSymbols = dropLastSymbols;
    this.digitsToAppend = digitsToAppend;
    this.maxLength = maxLength;

    if (typeof dropLastSymbols !== 'number')
      throw new TypeError('`dropLastSymbols` option must be an integer');

    if (typeof digitsToAppend !== 'number')
      throw new TypeError('`digitsToAppend` option must be number');

    if (this.username.length - dropLastSymbols + digitsToAppend > maxLength)
      throw new Error('Invalid options: string is too long, drop some symbols or append less symbols');
  }

  suggest () {
    const {username} = this;
    const trimmed = username.slice(0, username.length - this.dropLastSymbols);
    return trimmed + randomDigits(this.digitsToAppend);
  }

  suggestMany (n) {
    const maxUniqueSuggestions = Math.pow(DIGITS.length, this.digitsToAppend);

    if (maxUniqueSuggestions < n)
      throw new Error(`Can not generate that many: asked ${n}, possible ${maxUniqueSuggestions}`);

    const set = new Set();

    while (set.size !== n)
      set.add(this.suggest());

    return set;
  }

  nextSuggester () {
    // first we try to append more digits on the right
    if (this.suggest().length + 1 <= this.maxLength) {
      return new SuggestsUsernames(this.username, {
        dropLastSymbols: this.dropLastSymbols,
        digitsToAppend: this.digitsToAppend + 1,
        maxLength: this.maxLength
      });
    }

    // then we remove more and more symbols from username
    if (this.dropLastSymbols + 1 <= this.username.length) {
      return new SuggestsUsernames(this.username, {
        dropLastSymbols: this.dropLastSymbols + 1,
        digitsToAppend: 1,
        maxLength: this.maxLength
      });
    }

    // at this point we can only keep at it
    // with usernames consited fully of random digits
    assert(this.digitsToAppend === this.maxLength);
    return this;
  }
}

SuggestsUsernames.MAX_USERNAME_LENGTH = 10;

module.exports = SuggestsUsernames;
