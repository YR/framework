'use strict';

var application = require('./lib/application');
var cacheControl = require('./lib/cacheControl-server');
var express = require('@yr/express');
var fs = {};
var http = {};
var https = {};
var middleware = require('./lib/middleware-server');
var Page = require('./lib/Page');
var path = {};
var pageHandlerFactory = require('./lib/pageHandlerFactory-server');
var timing = require('./lib/timing');

var DEFAULT_PORT = 3000;

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
module.exports = function server(id) {
  var port = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_PORT;
  var dir = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : process.cwd();
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  if (!options.pageHandlerFactory) {
    options.pageHandlerFactory = pageHandlerFactory;
  }
  // Combine default with passed middleware
  if (options.middleware && options.middleware.register) {
    var register = options.middleware.register;

    options.middleware.register = function (app) {
      middleware.register(app);
      register(app);
    };
  } else {
    options.middleware = middleware;
  }

  load(dir, options);

  var app = application(id, port, express, options);

  return app;
};

module.exports.Page = Page;
module.exports.static = express.static;
module.exports.query = express.query;

/**
 * Load locales/templates for app and pages
 * @param {String} dir
 * @param {Object} options
 */
function load(dir, options) {
  var locales = options.locales,
      _options$pages = options.pages,
      pages = _options$pages === undefined ? {} : _options$pages,
      settings = options.settings,
      templates = options.templates;


  [dir].concat(Object.keys(pages).map(function (id) {
    return pages[id].dir;
  })).forEach(function (dirpath) {
    var id = path.basename(dirpath);
    var settingspath = path.join(dirpath, 'settings.js');
    var localespath = path.join(dirpath, 'locales');
    var templatespath = path.join(dirpath, 'templates');

    if (fs.existsSync(localespath)) {
      locales.load(localespath);
    }
    if (fs.existsSync(templatespath)) {
      templates.load(templatespath);
    }
    // App config is already included in 'settings', so ignore
    if (dirpath !== dir && fs.existsSync(settingspath)) {
      settings.set(id, require(settingspath));
    }
  });
}