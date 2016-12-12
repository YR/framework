'use strict';

const application = require('./lib/application');
const cacheControl = require('./lib/cacheControl');
const express = require('@yr/express');
const http = require('http');
const https = require('https');

// Set max socket limit
http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

// Patch express.response with cacheControl method
cacheControl(express.response);

/**
 * Retrieve and initialise server instance
 * @param {String} id
 * @param {Number} port
 * @param {Object} options
 *  - {Function} handler
 *  - {String} localesDir
 *  - {Function} localesLoader
 *  - {Object} middleware
 *  - {Function} renderer
 *  - {Function} routes
 *  - {DataStore} settings
 *  - {String} templatesDir
 *  - {TemplateCache} templatesLoader
 * @returns {Express}
 */
module.exports = function server (id, port, options) {
  const app = application(express, id, port, options);

  app.disable('x-powered-by');
  return app;
};