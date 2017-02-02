'use strict';

const util = require('util');

const debugInspect = (what, {json = false} = {}) => {
  return json
    ? JSON.stringify(what, null, 2)
    : util.inspect(what, {depth: null, maxArrayLength: null});
};

const debugPrint = (what, {json = false} = {}) => {
  const message = debugInspect(what, {json});
  console.log('%s', message); // eslint-disable-line no-console
};

module.exports = {
  debugInspect,
  debugPrint
};
