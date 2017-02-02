'use strict';

const util = require('util');

module.exports = {
  debugPrint: (what, {json = false} = {}) => {
    const message = json
      ? JSON.stringify(what, null, 2)
      : util.inspect(what, {depth: null, maxArrayLength: null});

    console.log('%s', message); // eslint-disable-line no-console
  }
};
