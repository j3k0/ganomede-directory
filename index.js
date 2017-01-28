'use strict';

const cluster = require('cluster');
const master = require('./src/master');
const worker = require('./src/worker');

if (!module.parent)
  cluster.isMaster ? master() : worker();
