'use strict';

var application = require('./lib/application');
var cacheControl = require('./lib/cacheControl-client');
var express = require('@yr/express-client');
var idMiddleware = require('./lib/idMiddleware-client');
var Page = require('./lib/Page');
var pageHandlerFactory = require('./lib/pageHandlerFactory-client');
var timing = require('./lib/timing');
var timingMiddleware = require('./lib/timingMiddleware-client');
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
  options.uid = 'client:' + uuid.v4();
  options.coreMiddleware = [timingMiddleware, idMiddleware];

  return application(id, null, express, options);
};

module.exports.Page = Page;