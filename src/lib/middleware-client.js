'use strict';

const idMiddleware = require('./idMiddleware-client');
const timingMiddleware = require('./timingMiddleware-client');

module.exports = {
  /**
   * Register middleware for 'app'
   * @param {Express} app
   */
  register(app) {
    app.use(idMiddleware(app.get('uid')));
    app.use(timingMiddleware());
  }
};
