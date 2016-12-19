'use strict';

const bunyan = require('bunyan');
const config = require('../config');

module.exports = bunyan.createLogger({
  level: config.logLevel,
  name: config.name
});
