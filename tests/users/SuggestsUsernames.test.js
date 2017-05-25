'use strict';

const SuggestsUsernames = require('../../src/users/SuggestsUsernames');

describe('UsernamesGenerator', () => {
  const re = (startsWith, endsWithDigits) => new RegExp(
    `^${startsWith}[0-9]{${endsWithDigits}}$`
  );

  describe('new SuggestsUsernames()', () => {
    it('throws if it is not possible to generate suggestions with config', () => {
      const subject = (str, opts) => () => new SuggestsUsernames(str, opts);
      expect(subject('alice', {
        dropLastSymbols: 0,
        digitsToAppend: 0,
        maxLength: 1
      })).to.throw(Error, /^Invalid options/);
    });

    it('throws on invalid `dropLastSymbols`', () => {
      const subject = (dropLastSymbols) => () => new SuggestsUsernames('alice', {
        dropLastSymbols,
        digitsToAppend: 0
      });

      const test = (val) => expect(subject(val)).to.throw(TypeError, /dropLastSymbols/);

      test();
      test(null);
      test('10');
    });

    it('throws on invalid `digitsToAppend`', () => {
      const subject = (digitsToAppend) => () => new SuggestsUsernames('alice', {
        digitsToAppend,
        dropLastSymbols: 0
      });

      const test = (val) => expect(subject(val)).to.throw(TypeError, /digitsToAppend/);

      test();
      test(null);
      test('10');
    });
  });

  describe('#suggest()', () => {
    it('on short usernames pads to right with random digits', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 0,
        digitsToAppend: 1
      });

      expect(subject.suggest()).to.match(re('alice', 1));
    });

    it('trims username according to `dropLastSymbols` option', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 3,
        digitsToAppend: 1
      });

      expect(subject.suggest()).to.match(re('al', 1));
    });

    it('appends number of digits according to `digitsToAppend` option', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 0,
        digitsToAppend: 5
      });

      expect(subject.suggest()).to.match(re('alice', 5));
    });
  });

  describe('#suggestMany()', () => {
    it('returns set of suggestions with specified length', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 4,
        digitsToAppend: 5,
        maxLength: 6
      });

      const actual = subject.suggestMany(100);
      expect(actual).to.be.instanceof(Set);
      expect(actual.size).to.equal(100);
    });

    it('throws if too many items were asked', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 0,
        digitsToAppend: 0,
        maxLength: 6
      });

      expect(() => subject.suggestMany(10)).to.throw(Error, /Can not generate that many/);
    });
  });

  describe('#nextSuggester()', () => {
    it('immutably returns new isntance of SuggestsUsernames()', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 0,
        digitsToAppend: 1
      });

      const actual = subject.nextSuggester();

      expect(actual).to.be.instanceof(SuggestsUsernames);
      expect(actual).to.not.equal(subject);
    });

    it('increments `digitsToAppend` when more can be added without username trimming', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 0,
        digitsToAppend: 1
      });

      const next = subject.nextSuggester();
      expect(next.dropLastSymbols).to.equal(0);
      expect(next.digitsToAppend).to.equal(2);
    });

    it('increments `dropLastSymbols` and resets `digitsToAppend` to 1 when trimming is required', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 0,
        digitsToAppend: 5,
        maxLength: 10
      });

      const next = subject.nextSuggester();
      expect(next.dropLastSymbols).to.equal(1);
      expect(next.digitsToAppend).to.equal(1);
    });

    it('when all symbols were dropped, and digits are at max, returns itself', () => {
      const subject = new SuggestsUsernames('alice', {
        dropLastSymbols: 5,
        digitsToAppend: 10,
        maxLength: 10
      });

      expect(subject.nextSuggester()).to.equal(subject);
    });
  });
});
