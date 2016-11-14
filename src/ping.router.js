'use strict';

const get = (req, res, next) => {
  res.send(`pong/${req.params.token}`);
  next();
};

const head = (req, res, next) => {
  res.end();
  next();
};

module.exports = (prefix, server) => {
  const url = `${prefix}/ping/:token`;

  server.get(url, get);
  server.head(url, head);
};
