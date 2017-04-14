'use strict';

const assert = require('assert');
const rp = require('request-promise');
const app = require('../src/app');
const makeClient = require('./make-client');

runTests('socketio');
runTests('rest');

function runTests (transport) {
  const feathersClient = makeClient(transport);

  describe('Authentication tests', () => {
    before(function (done) {
      this.server = app.listen(3030);
      this.server.once('listening', () => done());
    });

    after(function (done) {
      this.server.close(done);
    });

    it('allows user signup', () => {
     feathersClient.service('/users')
      .create({ email: 'test@equibit.org' })
      .then(body =>
        assert.ok(body.indexOf('<html>') !== -1)
      );
    });

    it('handles challenge-request auth', () => {
      let requestData = {
        method: 'POST',
        uri: 'http://localhost:3030/authentication',
        body: {
          strategy: 'challenge-request',
          email: 'test@equibit.org',
          signature: 'test'
        },
        json: true // Automatically stringifies the body to JSON
      };
      return rp(requestData).then(body =>
        assert.ok(body.indexOf('<html>') !== -1)
      );
    });

    describe('404', function () {
      it('shows a 404 HTML page', () => {
        return rp({
          url: 'http://localhost:3030/path/to/nowhere',
          headers: {
            'Accept': 'text/html'
          }
        }).catch(res => {
          assert.equal(res.statusCode, 404);
          assert.ok(res.error.indexOf('<html>') !== -1);
        });
      });

      it('shows a 404 JSON error without stack trace', () => {
        return rp({
          url: 'http://localhost:3030/path/to/nowhere',
          json: true
        }).catch(res => {
          assert.equal(res.statusCode, 404);
          assert.equal(res.error.code, 404);
          assert.equal(res.error.message, 'Page not found');
          assert.equal(res.error.name, 'NotFound');
        });
      });
    });
  });
};
