'use strict';

const restify = require('restify');

module.exports = () => {
  const server = restify.createServer({
    handleUncaughtExceptions: true
  });

  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  return server;
};
