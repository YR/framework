'use strict';

const application = require('./lib/application');
const cacheControl = require('./lib/cacheControl-client');
const express = require('@yr/express-client');
const idMiddleware = require('./lib/idMiddleware-client');
const Page = require('./lib/Page');
const pageHandlerFactory = require('./lib/pageHandlerFactory-client');
const timing = require('./lib/timing');
const timingMiddleware = require('./lib/timingMiddleware-client');
const uuid = require('uuid');

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
module.exports = function server (id, options) {
  if (!options.pageHandlerFactory) options.pageHandlerFactory = pageHandlerFactory;
  options.uid = `client:${uuid.v4()}`;
  options.coreMiddleware = [timingMiddleware, idMiddleware];

  return application(id, null, express, options);
};

module.exports.Page = Page;