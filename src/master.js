'use strict';

const path = require('path');
const async = require('async');
const cluster = require('cluster');
const curtain = require('curtain-down');
const nano = require('nano');
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

const initDb = (sync, callback) => {
  const designs = [new Design(config.couch.designName, path.resolve(__dirname, 'db/users.design.js'))];
  const initalizer = new DbInitializer(config.couch, designs, {sync});
  initalizer.init(callback);
};

const triggerDesignUpdate = (callback) => {
  const server = nano(config.couch.url);
  const db = server.use(config.couch.name);

  async.series([
    (cb) => db.view(config.couch.designName, 'rawProfiles', {key: 'w/ever', stale: 'update_after'}, cb),
    (cb) => server.db.get('_active_tasks', cb)
  ], (err, results) => {
    if (err)
      return callback(err);

    const [trigger, tasks] = results;
    callback(null, {trigger, tasks});
  });
};

const die = (...args) => {
  logger.error(...args);
  process.exitCode = 1;
};

const master = () => {
  const runningAsSyncScript = config.couch.syncDesignAndExit;

  initDb(runningAsSyncScript, (err) => {
    if (err) {
      setTimeout(() => {}, 3600 * 1000);
      return die('Db sync failed', err);
    }

    if (!runningAsSyncScript)
      return work();

    triggerDesignUpdate((err, couchTasks) => {
      setTimeout(() => {}, 3600 * 1000);
      if (err)
        return die('Db was synced, but failed to trigger design doc update', err);
      logger.info(couchTasks, 'Db synced, view recalc triggered; here are current couch tasks');
    });
  });
};

module.exports = master;
