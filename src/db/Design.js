'use strict';

const fs = require('fs');

class Design {
  constructor (name, filepath) {
    this.name = name;
    this.source = fs.readFileSync(filepath, 'utf8');
    this.exports = require(filepath);
  }

  differentFrom (dbDoc) {
    const same = !!dbDoc.source && (dbDoc.source === this.source);
    return !same;
  }

  couchDocument () {
    return Object.assign({
      _id: `_design/${this.name}`,
      language: 'javascript',
      source: this.source
    }, this.exports);
  }
}

module.exports = Design;
