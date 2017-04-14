// const { authenticate } = require('feathers-authentication').hooks;
const { disallow } = require('feathers-hooks-common');

module.exports = function (app) {
  return {
    before: {
      all: [
        // call the authenticate hook before every method except 'create'
        // iff(
        //   (hook) => hook.method !== 'create',
        //   authenticate('jwt')
        // )
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: [
        disallow('external')
      ]
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },

    error: {
      all: [
        error => {
          console.log(error);
        }
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  };
};
