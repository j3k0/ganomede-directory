'use strict';

const os = require('os');
const pk = require('../package.json');

const about = JSON.stringify({
  hostname: os.hostname(),
  type: pk.name,
  version: pk.version,
  description: pk.description,
  startDate: new Date().toISOString()
});

const sendAbout = (req, res, next) => {
  res.header('Content-Type', 'application/json; charset=UTF-8');
  res.end(about);
  next();
};

module.exports = (prefix, server) => {
  server.get('/about', sendAbout);
  server.get(`${prefix}/about`, sendAbout);
};
