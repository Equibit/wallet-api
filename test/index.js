const makeClient = require('./make-client');

const socketClient = makeClient('socketio');
const restClient = makeClient('rest');

require('./app.test');

// Auth tests
const runAuthTests = require('./auth.test');
runAuthTests(socketClient);
runAuthTests(restClient);
