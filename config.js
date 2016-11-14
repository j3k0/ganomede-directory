'use strict';

const util = require('util');
const pkg = require('./package.json');

module.exports = {
  name: 'wordsaxe',

  http: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.hasOwnProperty('PORT')
      ? parseInt(process.env.PORT, 10)
      : 8000,
    prefix: `/${pkg.api}`
  },

  data: {
    host: process.env.DATA_PORT_8080_TCP_ADDR || '127.0.0.1',
    port: parseInt(process.env.DATA_PORT_8080_TCP_PORT, 10) || 8080
  }
};
