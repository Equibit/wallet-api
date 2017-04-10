'use strict';

// Application hooks that run for every service
const logger = require('./logger');
const addUserAgent = require('./user-agent');

module.exports = {
  before: {
    all: [ addUserAgent() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [ logger() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [ logger() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
