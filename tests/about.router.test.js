'use strict';

const {expect} = require('chai');
const supertest = require('supertest');
const createServer = require('../src/server');
const about = require('../src/about.router');
const config = require('../config');
const pkg = require('../package.json');

describe('about-router', () => {
  const server = createServer();

  before(done => {
    about(config.http.prefix, server);
    server.listen(done);
  });

  after(done => server.close(done));

  const test = (url) => {
    it(`GET ${url}`, (done) => {
      supertest(server)
        .get(url)
        .expect(200)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.body).to.have.property('type', pkg.name);
          done();
        });
    });
  };

  test('/about');
  test(`${config.http.prefix}/about`);
});
