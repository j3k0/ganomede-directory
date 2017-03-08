'use strict';

if (!module.parent) {
  const cluster = require('cluster');
  const master = require('./src/master');
  const worker = require('./src/worker');
  cluster.isMaster ? master() : worker();
}
else {
  module.exports = require('./client.js');
}
