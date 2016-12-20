'use strict';

var application = require('./lib/application');
var express = require('@yr/express-client');
var Page = require('./lib/Page');
var pageHandlerFactory = require('./lib/pageHandlerFactory-client');

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

  return application(id, null, express, options);
};

module.exports.Page = Page;