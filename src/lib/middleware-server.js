'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const idMiddleware = require('./lib/idMiddleware-server');
const timingMiddleware = require('./lib/timingMiddleware-server');

module.exports = {
  /**
   * Register middleware for 'app'
   * @param {Express} app
   */
  register (app) {
    timingMiddleware()(app);
    idMiddleware()(app);
    helmet.frameguard()(app);
    helmet.hidePoweredBy()(app);
    helmet.ieNoOpen()(app);
    helmet.noSniff()(app);
    helmet.xssFilter({ setOnOldIE: true })(app);
    cookieParser()(app);
    bodyParser.json()(app);
    bodyParser.urlencoded({
      // Don't parse complex objects
      extended: false
    })(app);
  }
};