'use strict';

const application = require('./lib/application');
const cacheControl = require('./lib/cacheControl-server');
const express = require('@yr/express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const middleware = require('./lib/middleware-server');
const Page = require('./lib/Page');
const path = require('path');
const pageHandlerFactory = require('./lib/pageHandlerFactory-server');
const timing = require('./lib/timing');

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
 *  - {String} apppath
 *  - {Object} locales
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Object} renderer
 *  - {DataStore} settings
 *  - {String} sourcepath
 *  - {Object} templates
 * @returns {Express}
 */
module.exports = function server (id, port, options) {
  if (!options.pageHandlerFactory) options.pageHandlerFactory = pageHandlerFactory;
  if (options.middleware && options.middleware.register) {
    options.middleware.register = function (app) {
      middleware.register(app);
      options.middleware.register(app);
    };
  } else {
    options.middleware = middleware;
  }

  load(options);

  const app = application(id, port, express, options);

  return app;
};

module.exports.Page = Page;
module.exports.static = express.static;
module.exports.query = express.query;

/**
 * Load locales/templates for app and pages
 * @param {Object} options
 */
function load (options) {
  const { apppath, locales, pages, settings, sourcepath, templates } = options;

  [apppath, ...Object.keys(pages).map((page) => page.pagepath)]
    .forEach((p) => {
      const id = path.basename(p);
      const configpath = path.join(p, 'config.js');
      const localespath = path.join(p, 'locales');
      const templatespath = path.join(p, 'templates');

      if (fs.existsSync(localespath)) locales.load(localespath);
      if (fs.existsSync(templatespath)) templates.load(templatespath, { rootpath: sourcepath });
      // App config is 'settings', so ignore
      if (p != apppath && fs.existsSync(configpath)) settings.set(id, require(configpath));
    });
}