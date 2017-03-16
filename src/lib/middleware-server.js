'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const idMiddleware = require('./idMiddleware-server');
const timingMiddleware = require('./timingMiddleware-server');

module.exports = {
  /**
   * Register middleware for 'app'
   * @param {Express} app
   */
  register(app) {
    app.use(timingMiddleware());
    app.use(idMiddleware());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());
    app.use(helmet.ieNoOpen());
    app.use(helmet.noSniff());
    app.use(helmet.xssFilter({ setOnOldIE: true }));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(
      bodyParser.urlencoded({
        // Don't parse complex objects
        extended: false
      })
    );
  }
};
