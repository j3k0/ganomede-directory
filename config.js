'use strict';

const util = require('util');
const bunyan = require('bunyan');
const pkg = require('./package.json');

const parseLogLevel = (envValue) => {
  const defaultLevel = 'INFO';
  const desiredLevel = envValue ? String(envValue) : defaultLevel;
  const levels = [
    'FATAL',
    'ERROR',
    'WARN',
    'INFO',
    'DEBUG',
    'TRACE'
  ];

  const hasMatch = levels.includes(desiredLevel);
  const level = hasMatch ? desiredLevel : defaultLevel;

  if (!hasMatch) {
    const available = `Please specify one of ${util.inspect(levels)}.`;
    const message = `Uknown log level "${desiredLevel}". ${available}`;
    throw new Error(message);
  }

  return bunyan[level];
};

module.exports = {
  name: pkg.name,
  logLevel: parseLogLevel(process.env.BUNYAN_LEVEL),

  http: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.hasOwnProperty('PORT')
      ? parseInt(process.env.PORT, 10)
      : 8000,
    prefix: `/${pkg.api}`
  },

  couch: {
    url: (function () {
      const host = process.env.COUCH_DIRECTORY_PORT_5984_TCP_ADDR || 'localhost';
      const port = parseInt(process.env.COUCH_DIRECTORY_PORT_5984_TCP_PORT, 10) || 5984;
      return `http://${host}:${port}/`;
    }()),
    name: process.env.COUCH_NAME || 'ganomede_directory_test'
  }
};

if (!module.parent)
  require('./src/utils').debugPrint(module.exports);
