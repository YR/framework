'use strict';

var application = require('./lib/application');
var cacheControl = require('./lib/cacheControl-client');
var express = require('@yr/express-client');
var middleware = require('./lib/middleware-client');
var Page = require('./lib/Page');
var pageHandlerFactory = require('./lib/pageHandlerFactory-client');
var timing = require('./lib/timing');
var uuid = require('uuid');

// Patch express.response
cacheControl(express.response);
timing(express.response);

/**
 * Retrieve and initialise client instance
 * @param {String} id
 * @param {Object} options
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Object} renderer
 *  - {DataStore} settings
 * @returns {Express}
 */
module.exports = function server(id, options) {
  if (!options.pageHandlerFactory) options.pageHandlerFactory = pageHandlerFactory;
  if (options.middleware && options.middleware.register) {
    (function () {
      var register = options.middleware.register;

      options.middleware.register = function (app) {
        middleware.register(app);
        register(app);
      };
    })();
  } else {
    options.middleware = middleware;
  }
  options.uid = 'client:' + uuid.v4();

  return application(id, null, express, options);
};

module.exports.Page = Page;