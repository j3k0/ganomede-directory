'use strict';

const restify = require('restify');
const logger = require('./logger');

module.exports = () => {
  const server = restify.createServer({
    handleUncaughtExceptions: true,
    log: logger
  });

  const requestLogger = (req, res, next) => {
    req.log.info({req_id: req.id()}, `${req.method} ${req.url}`);
    next();
  };
  server.use(requestLogger);

  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  // Audit requests
  server.on('after', restify.auditLogger({log: logger}));

  // Automatically add a request-id to the response
  function setRequestId (req, res, next) {
    res.setHeader('x-request-id', req.id());
    return next();
  }
  server.use(setRequestId);

  return server;
};
