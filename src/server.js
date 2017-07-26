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
  req.url.indexOf(`${config.http.prefix}/ping/_health_check`) !== 0;

const shouldLogResponse = (res) =>
  (res && res.statusCode >= 500);

const filteredLogger = (errorsOnly, logger) => (req, res, next) => {
  const logError = errorsOnly && shouldLogResponse(res);
  const logInfo = !errorsOnly && (
    shouldLogRequest(req) || shouldLogResponse(res));
  if (logError || logInfo)
    logger(req, res);
  if (next && typeof next === 'function')
    next();
};

module.exports = () => {
  logger.info({env: process.env}, 'environment');
  const server = restify.createServer({
    handleUncaughtExceptions: true,
    log: logger
  });

  const requestLogger = filteredLogger(false, (req) =>
    req.log.info({req_id: req.id()}, `${req.method} ${req.url}`));
  server.use(requestLogger);

  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  // Audit requests
  server.on('after', filteredLogger(process.env.NODE_ENV === 'production',
    restify.auditLogger({log: logger, body: true})));

  // Automatically add a request-id to the response
  function setRequestId (req, res, next) {
    req.log = req.log.child({req_id: req.id()});
    res.setHeader('X-Request-Id', req.id());
    return next();
  }
  server.use(setRequestId);

  // Send audit statistics
  const sendAuditStats = require('./send-audit-stats');
  server.on('after', sendAuditStats);

  // Init object to dump our stuff into.
  server.use((req, res, next) => {
    req.ganomede = {
      secretMatches: matchSecret(req, 'body') || matchSecret(req, 'query')
    };

    next();
  });

  return server;
};
