'use strict';

const application = require('./lib/application');
const express = require('@yr/express');
const http = require('http');
const https = require('https');
const templateCache = require('./lib/templateCache');

// Set max socket limit
http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

/**
 * Retrieve and initialise server instance
 * @param {String} id
 * @param {Object} config
 *  - {Function} handler
 *  - {Function} renderer
 *  - {String} locales
 *  - {Object} middleware
 *  - {Function} routes
 *  - {Array<String>} templates
 * @param {Object} options
 *  - {Function} localeLoader
 *  - {DataStore} settings
 * @returns {Express}
 */
module.exports = function server (id, config, options = {}) {
  options.templateCache = templateCache.create();

  const app = application(express, id, config, options);

  app.disable('x-powered-by');
  return app;
};