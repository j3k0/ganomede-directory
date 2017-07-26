'use strict';

const logMod = require('./logger');
const StatsD = require('node-statsd');
const dummyClient = () => {
  return {
    increment: function() {},
    timing: function() {},
    decrement: function() {},
    histogram: function() {},
    gauge: function() {},
    set: function() {},
    unique: function() {}
  };
};

const requiredEnv = ['STATSD_HOST', 'STATSD_PORT', 'STATSD_PREFIX'];
const missingEnv = () => {
  var e, i, len;
  for (i = 0, len = requiredEnv.length; i < len; i++) {
    e = requiredEnv[i];
    if (!process.env[e]) {
      return e;
    }
  }
};

const createClient = function(arg) {
  var client, log, ref;
  log = (ref = (arg != null ? arg : {}).log) != null ? ref : logMod.child({
    module: "statsd"
  });
  if (missingEnv()) {
    log.warn("Can't initialize statsd, missing env: " + missingEnv());
    return dummyClient();
  }
  client = new StatsD({
    host: process.env.STATSD_HOST,
    port: process.env.STATSD_PORT,
    prefix: process.env.STATSD_PREFIX
  });
  client.socket.on('error', function(error) {
    return log.error("error in socket", error);
  });
  return client;
};

module.exports = {
  createClient: createClient,
  dummyClient: dummyClient
};
