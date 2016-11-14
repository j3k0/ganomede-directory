'use strict';

const supertest = require('supertest');
const createServer = require('../src/server');
const ping = require('../src/ping.router');
const config = require('../config');

describe('ping-router', () => {
  const server = createServer();
  const go = () => supertest(server);
  const url = `${config.http.prefix}/ping/something`;

  before(done => {
    ping(config.http.prefix, server);
    server.listen(done);
  });

  after(done => server.close(done));

  it('GET /ping/:token', (done) => {
    go()
      .get(url)
      .expect(200, '"pong/something"', done);
  });

  it('HEAD /ping/:token', (done) => {
    go()
      .head(url)
      .expect(200, done);
  });
});
