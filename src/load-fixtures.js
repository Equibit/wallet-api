const path = require('path');

module.exports = function (app) {
  const config = app.get('fixtures');

  if (config.enabled) {
    config.services.forEach(serviceObj => {
      const service = app.service(serviceObj.path);
      let { data } = serviceObj;

      // If the data is a string, assume it's a file location.
      if (typeof data === 'string') {
        data = require(path.join(__dirname, data));
      }

      if (config.delete) {
        // Remove all records.
        service.remove(null).then(() => service.create(data, config.params));
      } else {
        service.create(data, config.params);
      }
    });
  }
};
