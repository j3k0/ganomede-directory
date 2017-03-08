'use strict';

const cluster = require('cluster');
const async = require('async');
const curtain = require('curtain-down');
const restify = require('restify');
const about = require('./about.router');
const ping = require('./ping.router');
const directory = require('./directory.router');
const logger = require('./logger');
const config = require('../config');
const Db = require('./db/db');
const createServer = require('./server');
const {createClient: createAuthDb} = require('authdb');

const go = (server, callback) => {
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

  // Start server and let's go.
  server.on('error', callback);
  server.listen(config.http.port, config.http.host, () => {
    const {port, family, address} = server.address();
    logger.info('ready at %s:%d (%s)', address, port, family);
    server.removeListener('error', callback);
    callback(null);
  });
};

const worker = () => {
  const server = createServer();

  go(server, (err) => {
    if (err) {
      logger.error(err);
      process.exitCode = 1;
      return;
    }

    curtain.on(() => {
      logger.info('worker stopping…');

      async.parallel([
        (cb) => server.close(cb),
      ], () => cluster.worker.disconnect());
    });

    // Handle uncaughtException, kill the worker.
    server.on('uncaughtException', (req, res, route, err) => {
      logger.fatal(err);

      // Note: we're in dangerous territory!
      // By definition, something unexpected occurred,
      // which we probably didn't want.
      // Anything can happen now! Be very careful!
      try {
        // make sure we close down within 30 seconds
        setTimeout(() => process.exit(1), 30e3);

        // stop taking new requests
        server.close();

        // Let the master know we're dead.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        cluster.worker.disconnect();

        const message = err.message || 'unexpected error';
        res.send(new restify.InternalError(message));
      }
      catch (err2) {
        logger.fatal(err2, 'error sending 500!');
      }
    });
  });
};

module.exports = worker;
