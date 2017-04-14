const ffs = require('feathers-fs');
const seedIssuances = require('./seed.issuances');

module.exports = function (app) {
  app.service('seeder', ffs({
    root: app.get('applicationRoot')
  }));
  seedIssuances(app)
    .then(issuances => {
      console.log('created companies.seed.json');
      console.log('created issuances.seed.json');
    });
};
