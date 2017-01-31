'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var idMiddleware = require('./idMiddleware-server');
var timingMiddleware = require('./timingMiddleware-server');

module.exports = {
  /**
   * Register middleware for 'app'
   * @param {Express} app
   */
  register: function register(app) {
    app.use(timingMiddleware());
    app.use(idMiddleware());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());
    app.use(helmet.ieNoOpen());
    app.use(helmet.noSniff());
    app.use(helmet.xssFilter({ setOnOldIE: true }));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      // Don't parse complex objects
      extended: false
    }));
  }
};