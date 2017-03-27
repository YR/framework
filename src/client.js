'use strict';

const application = require('./lib/application');
const cacheControl = require('./lib/cacheControl-client');
const clock = require('@yr/clock');
const express = require('@yr/express-client');
const middleware = require('./lib/middleware-client');
const Page = require('./lib/Page');
const pageHandlerFactory = require('./lib/pageHandlerFactory-client');
const rerender = require('./lib/rerender');
const timing = require('./lib/timing');
const uuid = require('uuid');

// Patch response with additional behaviour
cacheControl(express.response);
timing(express.response);

/**
 * Retrieve and initialise client instance
 * @param {String} id
 * @param {Object} options
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Object} params
 *  - {Object} render
 *  - {DataStore} settings
 * @returns {Express}
 */
module.exports = function server(id, options) {
  if (!options.pageHandlerFactory) {
    options.pageHandlerFactory = pageHandlerFactory;
  }
  // Combine default with passed middleware
  if (options.middleware && options.middleware.register) {
    const register = options.middleware.register;

    options.middleware.register = function(app) {
      middleware.register(app);
      register(app);
    };
  } else {
    options.middleware = middleware;
  }
  options.uid = `client:${uuid.v4()}`;

  // Patch with rerender() behaviour
  const app = rerender(application(id, express, options));

  // Delay to allow time to complete init
  clock.frame(() => {
    app.set('server', app.listen());
    app.get('debug')('listening');
  });

  return app;
};

module.exports.Page = Page;
