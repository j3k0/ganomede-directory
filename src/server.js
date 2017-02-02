'use strict';

const restify = require('restify');
const logger = require('./logger');
const config = require('../config');

const matchSecret = (obj, prop) => {
  const has = obj && obj[prop] && Object.hasOwnProperty.call(obj[prop], 'secret');
  const match = has && (typeof obj[prop].secret === 'string')
    && (obj[prop].secret.length > 0) && (obj[prop].secret === config.secret);

  if (has)
    delete obj[prop].secret;

  return match;
};

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

  // Init object to dump our stuff into.
  server.use((req, res, next) => {
    req.ganomede = {
      secretMatches: matchSecret(req, 'body') || matchSecret(req, 'query')
    };

    next();
  });

  return server;
};
