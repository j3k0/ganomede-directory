'use strict';

const path = require('path');
const cluster = require('cluster');
const curtain = require('curtain-down');
const logger = require('./logger');
const config = require('../config');
const DbInitializer = require('./db/DbInitializer');
const Design = require('./db/Design');

const work = () => {
  let running = true;

  curtain.on(() => {
    if (!running) {
      logger.info('aaaaaarghhhhh...');
      return process.exit(1);
    }

    logger.info('master stopping…');
    running = false;

    // Forcefully exit if workers hang for too long
    setTimeout(process.exit.bind(process, 0), 30e3).unref();
  });

  logger.info(config, 'parsed config');

  cluster.fork();

  cluster.on('disconnect', (worker) => {
    logger.info('worker disconnected');

    if (running) {
      logger.error('restarting…');
      cluster.fork();
    }
  });
};

const initDb = (callback) => {
  const sync = process.argv.includes('--sync-db');
  const designs = [new Design(config.couch.designName, path.resolve(__dirname, 'db/users.design.js'))];
  const initalizer = new DbInitializer(config.couch, designs, {sync});
  initalizer.init(callback);
};

const master = () => {
  initDb((err) => {
    if (err) {
      logger.error(err);
      process.exitCode = 1;
      return;
    }

    work();
  });
};

module.exports = master;
