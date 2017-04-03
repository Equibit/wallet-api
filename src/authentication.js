'use strict';

const authentication = require('feathers-authentication');
const jwt = require('feathers-authentication-jwt');
const signed = require('feathers-authentication-signed');
// const makeCryptoUtils = require('feathers-authentication-signed/');

module.exports = function () {
  const app = this;
  const config = app.get('authentication');

  // Set up authentication with the secret
  app.configure(authentication(config));
  app.configure(jwt());
  app.configure(signed({
    idField: '_id'
  }));

  // The `authentication` service is used to create a JWT.
  // The before `create` hook registers strategies that can be used
  // to create a new valid JWT (e.g. local or oauth2)
  app.service('authentication').hooks({
    before: {
      create: [
        hook => {
          if (hook.data.strategy === 'challenge') {
            // console.log(hook.data);
          }
        },
        authentication.hooks.authenticate(config.strategies)
      ],
      remove: [
        authentication.hooks.authenticate('jwt')
      ]
    },
    error: {
      create: [
        function (hook) {
          console.log(hook);
        }
      ]
    }
  });
};
