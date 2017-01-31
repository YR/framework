'use strict';

var idMiddleware = require('./idMiddleware-client');
var timingMiddleware = require('./timingMiddleware-client');

module.exports = {
  /**
   * Register middleware for 'app'
   * @param {Express} app
   */
  register: function register(app) {
    app.use(timingMiddleware());
    app.use(idMiddleware(app.get('uid')));
  }
};