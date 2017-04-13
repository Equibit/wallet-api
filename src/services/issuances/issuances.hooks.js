const { authenticate } = require('feathers-authentication').hooks;
const { iff, disallow } = require('feathers-hooks-common');

module.exports = function (app) {
  return {
    before: {
      all: [
        // call the authenticate hook before every method except 'create'
        iff(
          (hook) => hook.method !== 'create' || !hook.params.internal,
          authenticate('jwt')
        )
      ],
      find: [],
      get: [],
      create: [
        // hook => {
        //   function cast (item) {
        //     const fields = ['marketCap', 'change', 'changePercentage'];
        //     fields.forEach(field => {
        //       if (typeof item[field] === 'string') {
        //         item[field] = parseFloat(item[field]);
        //       }
        //     });
        //   }

        //   if (Array.isArray(hook.data)) {
        //     hook.data.forEach(item => {
        //       cast(item);
        //     });
        //   } else {
        //     cast(hook.data);
        //   }
        // }
      ],
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
