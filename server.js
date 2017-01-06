'use strict';

var application = require('./lib/application');
var cacheControl = require('./lib/cacheControl-server');
var express = require('@yr/express');
var http = {};
var https = {};
var idMiddleware = require('./lib/idMiddleware-server');
var Page = require('./lib/Page');
var pageHandlerFactory = require('./lib/pageHandlerFactory-server');
var timing = require('./lib/timing');
var timingMiddleware = require('./lib/timingMiddleware-server');

// Set max socket limit
http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

// Patch express.response
cacheControl(express.response);
timing(express.response);

/**
 * Retrieve and initialise server instance
 * @param {String} id
 * @param {Number} port
 * @param {Object} options
 *  - {Object} locales
 *  - {String} localesDir
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Object} renderer
 *  - {DataStore} settings
 *  - {Object} templates
 *  - {String} templatesDir
 * @returns {Express}
 */
module.exports = function server(id, port, options) {
  if (!options.pageHandlerFactory) options.pageHandlerFactory = pageHandlerFactory;
  options.coreMiddleware = [timingMiddleware, idMiddleware];

  var app = application(id, port, express, options);

  app.disable('x-powered-by');
  return app;
};

module.exports.Page = Page;