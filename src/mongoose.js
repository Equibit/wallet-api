const mongoose = require('mongoose');

module.exports = function () {
  const app = this;
  const mongodbUri = app.get('mongodb');

  // Connect to DB 
  mongoose.connect(mongodbUri);
  const db = mongoose.connection;

  db.on('error', (error) => {
    if (error){
      console.log(`*** ERROR! Cannot connect to database! Mongo DB URI: "${mongodbUri || 'UNDEFINED!'}"`);
      console.log('Error: ', error);
    }
  });

  // mongoose.connect(mongodbUri, function (error) {
  //   if (error){
  //     console.log(`*** ERROR! Cannot connect to database! Mongo DB URI: "${mongodbUri || 'UNDEFINED!'}"`);
  //     console.log('Error: ', error);
  //   }
  // });

  mongoose.Promise = global.Promise;

  app.set('mongooseClient', mongoose);
};
