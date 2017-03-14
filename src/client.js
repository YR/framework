'use strict';

const application = require('./lib/application');
const cacheControl = require('./lib/cacheControl-client');
const express = require('@yr/express-client');
const middleware = require('./lib/middleware-client');
const Page = require('./lib/Page');
const pageHandlerFactory = require('./lib/pageHandlerFactory-client');
const timing = require('./lib/timing');
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
 *  - {Object} params
 *  - {Object} renderer
 *  - {DataStore} settings
 * @returns {Express}
 */
module.exports = function server (id, options) {
  if (!options.pageHandlerFactory) options.pageHandlerFactory = pageHandlerFactory;
  // Combine default with passed middleware
  if (options.middleware && options.middleware.register) {
    const register = options.middleware.register;

    options.middleware.register = function (app) {
      middleware.register(app);
      register(app);
    };
  } else {
    options.middleware = middleware;
  }
  options.uid = `client:${uuid.v4()}`;

  return application(id, null, express, options);
};

module.exports.Page = Page;