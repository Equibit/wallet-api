const assert = require('assert');
const app = require('../../src/app');

describe('\'bitcoin-average\' service', () => {
  it('registered the service', () => {
    const service = app.service('bitcoin-average');

    assert.ok(service, 'Registered the service');
  });
});
