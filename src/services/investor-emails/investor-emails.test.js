const assert = require('assert');
const app = require('../../src/app');

describe('\'investor-emails\' service', () => {
  it('registered the service', () => {
    const service = app.service('src/investor-emails');

    assert.ok(service, 'Registered the service');
  });
});
