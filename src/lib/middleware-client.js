'use strict';

const idMiddleware = require('./lib/idMiddleware-client');
const timingMiddleware = require('./lib/timingMiddleware-client');

module.exports = {
  /**
   * Register middleware for 'app'
   * @param {Express} app
   */
  register (app) {
    timingMiddleware()(app);
    idMiddleware(app.get('uid'))(app);
  }
};