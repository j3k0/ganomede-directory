'use strict';

const fs = require('fs');
const path = require('path');

class Design {
  constructor (filepath) {
    this.name = path.basename(filepath).slice(0, -'.design.js'.length);
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
