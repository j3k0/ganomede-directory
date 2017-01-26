'use strict';

const async = require('async');
const about = require('./about.router');
const ping = require('./ping.router');
const directory = require('./directory.router');
const logger = require('./logger');
const config = require('../config');
const Db = require('./db/db');
const {createClient: createAuthDb} = require('authdb');

module.exports = (server, callback) => {
  // Create deps.
  const db = new Db(config.couch);
  const authdb = createAuthDb(config.authdb);

  // Mount stuff.
  about(config.http.prefix, server);
  ping(config.http.prefix, server);
  directory({
    prefix: config.http.prefix,
    db,
    authdb,
    server
  });

  // Init things.
  const initDb = (callback) => {
    // TODO
    // Implement this.
    setImmediate(callback, null);
  };

  const startServer = (callback) => {
    server.on('error', callback);
    server.listen(config.http.port, config.http.host, () => {
      const {port, family, address} = server.address();
      logger.info('ready at %s:%d (%s)', address, port, family);
      server.removeListener('error', callback);
      callback(null);
    });
  };

  async.series([initDb, startServer], callback);
};
