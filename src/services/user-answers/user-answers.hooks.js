const { disallow } = require('feathers-hooks-common')	
 module.exports = function (app) {	
  return {	
    before: {	
      all: [disallow('external')],	
      find: [],	
      get: [],	
      create: [],	
      update: [],	
      patch: [],	
      remove: []	
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
      all: [],	
      find: [],	
      get: [],	
      create: [],	
      update: [],	
      patch: [],	
      remove: []	
    }	
  }	
}