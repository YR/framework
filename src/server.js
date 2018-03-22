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

const DEFAULT_PORT = 3000;

// Set max socket limit
http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

// Patch express.response
cacheControl(express.response);
timing(express.response);

/**
 * Retrieve and initialise server instance
 * @param {String} id
 * @param {Number} [port]
 * @param {String} [dir]
 * @param {Object} [options]
 *  - {Object} locales
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Object} params
 *  - {Object} render
 *  - {DataStore} settings
 *  - {Object} templates
 * @returns {Express}
 */
module.exports = function server(id, port = DEFAULT_PORT, dir = process.cwd(), options = {}) {
  if (options.pageHandlerFactory === undefined) {
    options.pageHandlerFactory = pageHandlerFactory;
  }
  // Combine default with passed middleware
  if (options.middleware != null && options.middleware.register != null) {
    const register = options.middleware.register;

    options.middleware.register = function(app) {
      middleware.register(app);
      register(app);
    };
  } else {
    options.middleware = middleware;
  }

  load(dir, options);

  return application(id, port, express, options);
};

module.exports.Page = Page;
module.exports.request = express.request;
module.exports.response = express.response;
module.exports.static = express.static;
module.exports.query = express.query;

/**
 * Load locales/templates for app and pages
 * @param {String} dir
 * @param {Object} options
 */
function load(dir, options) {
  const { locales, pages = {}, settings, templates } = options;

  [dir, ...Object.keys(pages).map(id => pages[id].dir)].forEach(dirpath => {
    const id = path.basename(dirpath);
    const settingspath = path.join(dirpath, 'settings.js');
    const localespath = path.join(dirpath, 'locales');
    const templatespath = path.join(dirpath, 'templates');

    if (fs.existsSync(localespath)) {
      locales.load(localespath);
    }
    if (fs.existsSync(templatespath)) {
      templates.load(templatespath);
    }
    // App config is already included in 'settings', so ignore
    if (dirpath !== dir && fs.existsSync(settingspath)) {
      let settingsModule = require(settingspath);

      if (settingsModule.default) {
        settingsModule = settingsModule.default;
      }

      settings.set(id, settingsModule);
    }
  });
}
