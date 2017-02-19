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

const shouldLogRequest = (req) =>
  (req.url !== `${config.http.prefix}/ping/_health_check`);

const filteredLogger = (logger) => (req, res, next) => {
  if (shouldLogRequest(req))
    logger(req, res);
  if (next)
    next();
};

module.exports = () => {
  const server = restify.createServer({
    handleUncaughtExceptions: true,
    log: logger
  });

  const requestLogger = filteredLogger((req) =>
    req.log.info({req_id: req.id()}, `${req.method} ${req.url}`));
  server.use(requestLogger);

  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  // Audit requests
  server.on('after', filteredLogger(restify.auditLogger({log: logger})));

  // Automatically add a request-id to the response
  function setRequestId (req, res, next) {
    res.setHeader('X-Request-Id', req.id());
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
