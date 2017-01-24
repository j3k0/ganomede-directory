'use strict';

// TODO
// Maybe redo this to not iterate billion times…
const normalizeAliases = (aliases) => {
  const result = new Map();

  aliases
    .map(alias => ({
      date: new Date(alias.date),
      public: alias.public === true,
      type: alias.type,
      value: alias.value
    }))
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .forEach(alias => result.set(alias.type, alias));

  return Array.from(result.values());
};

class Profile {
  // TODO
  // Probably not need hash here…
  constructor (dbDoc) {
    this.id = dbDoc.id;
    this.aliases = normalizeAliases(dbDoc.aliases);
  }

  _toApiObject (includePrivateData) {
    return {
      user_id: this.id,
      aliases: this.aliases.reduce((self, alias) => {
        if (includePrivateData || alias.public)
          self[alias.type] = alias.value;

        return self;
      }, {})
    };
  }

  public () {
    return this._toApiObject(false);
  }

  private () {
    return this._toApiObject(true);
  }

  toJSON () {
    throw new Error('Can not convert Profile to JSON directly; use #public() or #private()');
  }
}

module.exports = Profile;
