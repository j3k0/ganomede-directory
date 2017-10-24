// A restify server.on('after', ...) handler
//
// Will send requests statistics to a statsd server

'use strict';

const stats = require('./statsd-wrapper').createClient();

const cleanupStatsKey = (key) => key.replace(/[-.]/g, '_').toLowerCase();

const sendAuditStats = (req, res, next) => {

  // send number of calls to this route (with response status code) with 10% sampling
  const routeName = req.route ? 'route.' + req.route.name : 'invalid_route';
  stats.increment(routeName + '.status.' + res.statusCode, 1, 0.1);

  // send error statuses (with response status code) with 10% sampling
  if (res._body && res._body.restCode) {
    stats.increment(routeName + '.code.' + cleanupStatsKey(res._body.restCode), 1, 0.1);
  }

  // send timings with 1% sampling
  (req.timers || []).forEach((timer) => {
    const t = timer.time;
    const n = cleanupStatsKey(timer.name);
    stats.timing(routeName + '.timers.' + n, 1000000000 * t[0] + t[1], 0.01);
  });

  if (typeof next == 'function') {
    next();
  }
};

module.exports = sendAuditStats;
